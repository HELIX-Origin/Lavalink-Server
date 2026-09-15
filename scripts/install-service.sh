#!/bin/bash
set -euo pipefail

# Lavalink Server - Systemd Service Installer
# Usage: sudo scripts/install-service.sh [install|uninstall|status]

SERVICE_NAME="lavalink-server"
SERVICE_USER="${SUDO_USER:-$USER}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="$(which node)"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

show_usage() {
    echo "Usage: sudo $0 [install|uninstall|status|logs]"
    echo ""
    echo "Commands:"
    echo "  install   - Install and enable the systemd service"
    echo "  uninstall - Stop, disable, and remove the systemd service"
    echo "  status    - Show service status"
    echo "  logs      - Follow service logs (journalctl)"
}

create_service_file() {
    cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=Lavalink v4 Audio Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${PROJECT_DIR}
ExecStart=${NODE_BIN} ${PROJECT_DIR}/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

# Environment
Environment=NODE_ENV=production
EnvironmentFile=-${PROJECT_DIR}/.env

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${PROJECT_DIR}/data ${PROJECT_DIR}/logs

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
}

cmd_install() {
    echo "Installing ${SERVICE_NAME} service..."
    
    if [[ ! -f "${PROJECT_DIR}/dist/index.js" ]]; then
        echo "Error: Built project not found at ${PROJECT_DIR}/dist/index.js"
        echo "Run 'pnpm build' first."
        exit 1
    fi
    
    create_service_file
    
    systemctl daemon-reload
    systemctl enable "${SERVICE_NAME}"
    systemctl start "${SERVICE_NAME}"
    
    echo "Service installed and started."
    echo "Run 'sudo $0 status' to check status."
    echo "Run 'sudo $0 logs' to follow logs."
}

cmd_uninstall() {
    echo "Uninstalling ${SERVICE_NAME} service..."
    
    systemctl stop "${SERVICE_NAME}" 2>/dev/null || true
    systemctl disable "${SERVICE_NAME}" 2>/dev/null || true
    
    if [[ -f "${SERVICE_FILE}" ]]; then
        rm "${SERVICE_FILE}"
        systemctl daemon-reload
    fi
    
    echo "Service uninstalled."
}

cmd_status() {
    systemctl status "${SERVICE_NAME}" --no-pager
}

cmd_logs() {
    journalctl -u "${SERVICE_NAME}" -f
}

main() {
    case "${1:-}" in
        install)
            cmd_install
            ;;
        uninstall)
            cmd_uninstall
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Must run as root for systemd operations
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root (use sudo)"
    exit 1
fi

main "$@"