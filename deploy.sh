#!/usr/bin/env bash
# AstroShine deploy — server + admin panel + DB migrations
#
# Usage:   ./deploy.sh [branch]        default branch: main
# Runs on the VPS, from inside the repo. Does:
#   1. backup local changes (git stash), fetch, hard-reset to origin/<branch>
#   2. clean install of all workspaces (npm)
#   3. apply DB migrations (idempotent, psql; bootstraps tracking on existing DBs)
#   4. build server (nest) + admin (next)
#   5. pm2 restart both apps, wait for health checks
set -euo pipefail
trap 'echo "[deploy] FAILED at line $LINENO" >&2' ERR

BRANCH="${1:-main}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIG_DIR="$REPO/server/src/db/migrations"

log()  { printf '[deploy] %s\n' "$*"; }
warn() { printf '[deploy] WARNING: %s\n' "$*" >&2; }
die()  { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

for bin in git node npm psql pm2 curl; do
  command -v "$bin" >/dev/null 2>&1 || die "missing required tool: $bin"
done
cd "$REPO"
[ -f server/.env ] || die "server/.env not found (needed for DATABASE_URL)"

# ---- 1. update code --------------------------------------------------------
if git status --porcelain | grep -v '^?? deploy.sh$' | grep -q .; then
  warn "local changes on VPS — backing up with: git stash (pre-deploy backup)"
  git stash push -u -m "pre-deploy backup $(date +%F_%H%M%S)" -- . ':(exclude)deploy.sh'
fi
log "fetching origin/$BRANCH ..."
git fetch origin "$BRANCH" || die "git fetch failed — check network/GitHub access"
git checkout -f -B "$BRANCH" "origin/$BRANCH"
git clean -fd -e deploy.sh
log "code: $(git rev-parse --short HEAD)  $(git log -1 --format=%s)"

# ---- 2. install dependencies ------------------------------------------------
log "installing dependencies (fresh, npm workspaces) ..."
rm -rf node_modules server/node_modules web/node_modules packages/*/node_modules
npm install --no-audit --no-fund

# ---- 3. database migrations -------------------------------------------------
# Tracker table schema_migrations; on a DB that already has tables but no
# tracker (all existing prod/dev DBs), journal entries are marked as applied
# without executing. On a fresh DB, migrations are applied in journal order.
DB_URL="${DB_URL:-$(sed -nE 's/^DATABASE_URL[[:space:]]*=[[:space:]]*//p' server/.env | head -1 \
  | sed 's/^[[:space:]]*//; s/[[:space:]]*$//; s/^"//; s/"$//; s/^'"'"'//; s/'"'"'$//')}"
[ -n "$DB_URL" ] || die "DATABASE_URL not set in server/.env"
command -v psql >/dev/null 2>&1 || die "psql client not found"

mapfile -t MIG_TAGS < <(node -e 'const j=require("'"$MIG_DIR"'/meta/_journal.json"); for (const e of j.entries) console.log(e.tag)')
[ "${#MIG_TAGS[@]}" -gt 0 ] || die "empty migration journal"

psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"

TRACKED="$(psql "$DB_URL" -X -tAc "SELECT count(*) FROM schema_migrations" | tr -d '[:space:]')"
if [ "$TRACKED" = "0" ] && \
   [ "$(psql "$DB_URL" -X -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users')" | tr -d '[:space:]')" = "t" ]; then
  warn "existing DB without tracker — marking ${#MIG_TAGS[@]} journal migrations as applied (bootstrap)"
  for tag in "${MIG_TAGS[@]}"; do
    psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c \
      "INSERT INTO schema_migrations(name) VALUES ('$tag') ON CONFLICT DO NOTHING"
  done
fi

# idempotent enum guard (bootstrap path marks journal entries without running them)
psql "$DB_URL" -X -q -c \
  "ALTER TYPE transaction_category ADD VALUE IF NOT EXISTS 'pooja_booking';" \
  2>/dev/null || true

APPLIED=0
for tag in "${MIG_TAGS[@]}"; do
  SQL="$MIG_DIR/$tag.sql"
  [ -f "$SQL" ] || die "missing migration file: $SQL"
  DONE="$(psql "$DB_URL" -X -tAc "SELECT 1 FROM schema_migrations WHERE name='$tag'" | tr -d '[:space:]')"
  [ "$DONE" = "1" ] && continue
  log "applying migration: $tag"
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$SQL"
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations(name) VALUES ('$tag')"
  APPLIED=$((APPLIED + 1))
done
if [ "$APPLIED" -eq 0 ]; then log "database up to date"; else log "$APPLIED migration(s) applied"; fi

# ---- 4. build ---------------------------------------------------------------
log "building server (nest build) ..."
(cd server && npm run build)
log "building admin panel (next build) ..."
(cd web && NEXT_TELEMETRY_DISABLED=1 npm run build)

# ---- 5. restart + health checks --------------------------------------------
log "restarting services ..."
pm2 restart astro-shine-server astro-shine-web

wait_http() {
  local url="$1" timeout="$2" elapsed=0 code=000
  until code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$url")" && [ "$code" = "200" ]; do
    sleep 3; elapsed=$((elapsed + 3))
    [ "$elapsed" -ge "$timeout" ] && die "health check failed: $url (last HTTP code: $code)"
  done
  log "healthy: $url"
}
log "waiting for services ..."
wait_http "http://localhost:3067/api/v1" 120
wait_http "http://localhost:5322/login" 90

# ---- 6. summary -------------------------------------------------------------
log "deploy complete ✓"
echo "  branch : $BRANCH @ $(git rev-parse --short HEAD)"
echo "  server : http://31.97.222.250:3067/api/v1  (pm2: astro-shine-server)"
echo "  admin  : http://31.97.222.250:5322/login   (pm2: astro-shine-web)"
pm2 ls 2>/dev/null | grep -E 'astro-shine' || true
