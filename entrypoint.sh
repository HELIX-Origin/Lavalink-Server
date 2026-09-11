#!/bin/sh
set -e

# Resolve port from host environment (Render, Heroku, Railway dynamically inject PORT)
PORT="${PORT:-${SERVER_PORT:-2333}}"
export PORT
export SERVER_PORT="$PORT"

# Resolve domain from host environment
if [ -n "$RENDER_EXTERNAL_HOSTNAME" ]; then
  DOMAIN="$RENDER_EXTERNAL_HOSTNAME"
elif [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
  DOMAIN="$RAILWAY_PUBLIC_DOMAIN"
elif [ -n "$HEROKU_APP_DEFAULT_DOMAIN_NAME" ]; then
  DOMAIN="$HEROKU_APP_DEFAULT_DOMAIN_NAME"
elif [ -n "$FLY_APP_NAME" ]; then
  DOMAIN="${FLY_APP_NAME}.fly.dev"
elif [ -n "$DOMAIN" ]; then
  DOMAIN="$DOMAIN"
elif [ -n "$HOST" ] && [ "$HOST" != "0.0.0.0" ]; then
  DOMAIN="$HOST"
else
  DOMAIN="localhost"
fi
export DOMAIN
export HOST_DOMAIN="$DOMAIN"

echo "=================================================="
echo "🔊 Lavalink v4 Cloud Audio Server"
echo "🌐 Host Domain: ${DOMAIN}"
echo "🔌 Host Port:   ${PORT}"
echo "📍 Bind Host:   0.0.0.0"
echo "⚡ Profile:     prod"
echo "=================================================="

# Execute Lavalink with JVM heap allocation, modern TLS protocols, and host-resolved port and address
exec java \
  -Xmx512M \
  -Djdk.tls.client.protocols=TLSv1.2,TLSv1.3 \
  -Dspring.profiles.active=prod \
  -Dserver.port="$PORT" \
  -Dserver.address=0.0.0.0 \
  -jar Lavalink.jar
