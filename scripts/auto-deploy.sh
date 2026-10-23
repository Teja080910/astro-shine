#!/usr/bin/env bash
# AstroShine auto-deploy runner (VPS side, usually invoked by systemd timer).
#
# Polls origin/<BRANCH> and runs ./deploy.sh when the remote commit changes.
# Keeps state (last successful commit, failure backoff) outside the repo so a
# failed deploy is retried instead of being skipped because the code was
# already checked out.
#
# Config: /etc/astro-shine-auto-deploy.conf (installed by
# scripts/install-auto-deploy.sh). All values can be overridden there.
set -euo pipefail

CONF="${AUTO_DEPLOY_CONF:-/etc/astro-shine-auto-deploy.conf}"
# shellcheck disable=SC1090
[ -f "$CONF" ] && . "$CONF"

REPO="${REPO:-/var/snap/.../astro-shine}"
BRANCH="${BRANCH:-$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
RETRY_SECONDS="${RETRY_SECONDS:-600}"
STATE_DIR="${STATE_DIR:-/var/lib/astro-shine-auto-deploy}"
LOCK_FILE="${LOCK_FILE:-/var/lock/astro-shine-auto-deploy.lock}"
DEPLOY_SCRIPT="${DEPLOY_SCRIPT:-$REPO/deploy.sh}"

log() { printf '[auto-deploy %s] %s\n' "$(date -u +%FT%TZ)" "$*"; }

[ -d "$REPO/.git" ] || { log "ERROR: git repo not found at $REPO"; exit 1; }
[ -x "$DEPLOY_SCRIPT" ] || { log "ERROR: deploy script not executable: $DEPLOY_SCRIPT"; exit 1; }

mkdir -p "$STATE_DIR"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "another auto-deploy run is in progress; skipping"
  exit 0
fi

LAST_DEPLOYED_FILE="$STATE_DIR/last-deployed"
LAST_FAILURE_FILE="$STATE_DIR/last-failure"

REMOTE_SHA="$(git -C "$REPO" ls-remote origin "refs/heads/$BRANCH" 2>/dev/null | awk 'NR==1{print $1}' || true)"
if [ -z "$REMOTE_SHA" ]; then
  log "could not resolve origin/$BRANCH (network or auth issue); skipping"
  exit 0
fi

LAST_DEPLOYED="$(cat "$LAST_DEPLOYED_FILE" 2>/dev/null || true)"
if [ "$REMOTE_SHA" = "$LAST_DEPLOYED" ]; then
  exit 0
fi

if [ -f "$LAST_FAILURE_FILE" ]; then
  NOW="$(date +%s)"
  FAILED_AT="$(stat -c %Y "$LAST_FAILURE_FILE" 2>/dev/null || echo 0)"
  WAITED=$((NOW - FAILED_AT))
  if [ "$WAITED" -lt "$RETRY_SECONDS" ]; then
    log "previous attempt failed ${WAITED}s ago; retry in $((RETRY_SECONDS - WAITED))s"
    exit 0
  fi
fi

LAST_DISPLAY="${LAST_DEPLOYED:0:7}"
[ -n "$LAST_DEPLOYED" ] || LAST_DISPLAY="none"
log "new commit on origin/$BRANCH: ${REMOTE_SHA:0:7} (deployed: $LAST_DISPLAY) — deploying"
cd "$REPO"
if "$DEPLOY_SCRIPT" "$BRANCH"; then
  printf '%s\n' "$REMOTE_SHA" > "$LAST_DEPLOYED_FILE"
  rm -f "$LAST_FAILURE_FILE"
  log "deploy successful: ${REMOTE_SHA:0:7}"
else
  STATUS=$?
  touch "$LAST_FAILURE_FILE"
  log "deploy FAILED (exit $STATUS); retry after ${RETRY_SECONDS}s"
  exit "$STATUS"
fi
