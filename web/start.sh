#!/bin/sh
set -e
AUTO_LOGIN_TOKEN="$(node /app/railway/token.mjs)"
export AUTO_LOGIN_TOKEN
# Listen on IPv6 and IPv4 so the gateway reaches it over Railway's private network.
export HOSTNAME="${WEB_LISTEN_HOST:-::}"
export PORT="${PORT:-3000}"
exec node server.js
