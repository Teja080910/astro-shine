#!/usr/bin/env bash
# Install the AstroShine auto-deploy systemd timer on the VPS.
#
# Usage (as root, on the VPS, from this repo or a copied checkout):
#   ./scripts/install-auto-deploy.sh [branch] [interval-minutes]
#
# Defaults: branch = current branch of the repo, interval = 2 minutes.
# Override the target directory with REPO=/path/to/repo.
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${REPO:-$(cd "$SRC_DIR/.." && pwd)}"
BRANCH="${1:-$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
INTERVAL_MINUTES="${2:-2}"
RETRY_SECONDS="${RETRY_SECONDS:-600}"

BIN="/usr/local/bin/astro-shine-auto-deploy"
CONF="/etc/astro-shine-auto-deploy.conf"
UNIT="/etc/systemd/system/astro-shine-auto-deploy.service"
TIMER="/etc/systemd/system/astro-shine-auto-deploy.timer"

# systemd services do not inherit the login HOME, which makes pm2 fall back to
# /etc/.pm2 and miss the daemon that actually runs the apps. Pin both vars to
# the same values the interactive root shell uses.
SERVICE_HOME="${HOME:-/root}"
PM2_HOME_DIR="${PM2_HOME:-$SERVICE_HOME/.pm2}"

[ "$(id -u)" -eq 0 ] || { echo "ERROR: run as root" >&2; exit 1; }
[ -d "$REPO/.git" ] || { echo "ERROR: not a git repo: $REPO" >&2; exit 1; }
[ -f "$SRC_DIR/auto-deploy.sh" ] || { echo "ERROR: missing $SRC_DIR/auto-deploy.sh" >&2; exit 1; }

install -m 0755 "$SRC_DIR/auto-deploy.sh" "$BIN"

# systemd services run with a minimal environment (HOME unset), so git's
# per-user safe.directory entries are not read. Register the repo system-wide
# instead of loosening ownership checks.
if ! git config --system --get-all safe.directory 2>/dev/null | grep -qxF "$REPO"; then
  git config --system --add safe.directory "$REPO"
fi

cat > "$CONF" <<EOF
# AstroShine auto-deploy configuration (managed by install-auto-deploy.sh)
REPO="$REPO"
BRANCH="$BRANCH"
RETRY_SECONDS=$RETRY_SECONDS
EOF
chmod 0644 "$CONF"

cat > "$UNIT" <<EOF
[Unit]
Description=AstroShine auto deploy (poll origin and run deploy.sh)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=HOME=$SERVICE_HOME
Environment=PM2_HOME=$PM2_HOME_DIR
ExecStart=$BIN
Nice=10
EOF

cat > "$TIMER" <<EOF
[Unit]
Description=Poll GitHub for AstroShine updates and deploy

[Timer]
OnActiveSec=2min
OnUnitActiveSec=${INTERVAL_MINUTES}min
AccuracySec=15s

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now astro-shine-auto-deploy.timer
systemctl status --no-pager astro-shine-auto-deploy.timer | head -12

echo
echo "Installed: $BIN"
echo "Config:    $CONF (branch: $BRANCH, retry: ${RETRY_SECONDS}s)"
echo "Timer:     every ${INTERVAL_MINUTES}m"
echo "Logs:      journalctl -u astro-shine-auto-deploy -f"
