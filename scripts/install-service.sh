#!/usr/bin/env bash
set -euo pipefail

## install-service.sh
## Creates and installs a systemd service for the Lavalink v4 server.
##
## Usage:
##   sudo ./scripts/install-service.sh
##   sudo ./scripts/install-service.sh --user lavalink --name lavalink-server
##
## Flags:
##   --user <name>     System user to run the service as (default: root)
##   --name <name>     Systemd unit name (default: lavalink-server)
##   --no-start        Create + enable the unit but do NOT start it

SERVICE_USER="root"
SERVICE_NAME="lavalink-server"
START_SERVICE=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user)
      SERVICE_USER="$2"
      shift 2
      ;;
    --name)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --no-start)
      START_SERVICE=0
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root (sudo)." >&2
  exit 1
fi

if ! command -v systemctl >/dev/null 2>&1; then
  echo "systemd (systemctl) not found. This script requires a systemd-based OS." >&2
  exit 1
fi

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "Node.js binary not found in PATH. Install Node.js 18+ first." >&2
  exit 1
fi

if [[ "$SERVICE_USER" != "root" ]]; then
  if ! id "$SERVICE_USER" >/dev/null 2>&1; then
    echo "User '$SERVICE_USER' does not exist. Create it first:" >&2
    echo "  sudo useradd --system --no-create-home $SERVICE_USER" >&2
    exit 1
  fi
fi

if [[ ! -f "$INSTALL_DIR/dist/index.js" ]]; then
  echo "Build output not found at $INSTALL_DIR/dist/index.js" >&2
  echo "Run 'pnpm build' (and download Lavalink.jar) before installing." >&2
  exit 1
fi

if [[ ! -f "$INSTALL_DIR/Lavalink.jar" ]]; then
  echo "Lavalink.jar not found in $INSTALL_DIR" >&2
  echo "Download it first:" >&2
  echo "  curl -L -o \"$INSTALL_DIR/Lavalink.jar\" https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar" >&2
  exit 1
fi

UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/logs"

cat > "$UNIT_FILE" <<EOF
[Unit]
Description=Lavalink v4 Audio Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}
ExecStart=${NODE_BIN} ${INSTALL_DIR}/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}
Environment=NODE_ENV=production
EnvironmentFile=-${INSTALL_DIR}/.env

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=false
ReadWritePaths=${INSTALL_DIR}/data ${INSTALL_DIR}/logs

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$UNIT_FILE"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

if [[ "$START_SERVICE" -eq 1 ]]; then
  systemctl restart "$SERVICE_NAME"
  echo "Installed and started systemd service: $SERVICE_NAME"
else
  echo "Installed and enabled systemd service: $SERVICE_NAME (not started)"
fi

echo
echo "  unit:      $UNIT_FILE"
echo "  install:   $INSTALL_DIR"
echo "  user:      $SERVICE_USER"
echo "  node:      $NODE_BIN"
echo
echo "Manage it with:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo journalctl -u $SERVICE_NAME -f"