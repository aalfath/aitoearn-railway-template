#!/bin/sh
set -e
export CONFIG_PATH="${CONFIG_PATH:-/data/config.yaml}"
cd /app
node /app/railway/configure.mjs
node /app/railway/wait-for-deps.mjs
if [ "$APP_NAME" = "aitoearn-server" ]; then
  node /app/railway/init.mjs &
fi
exec pm2-runtime start "apps/${APP_NAME}/src/main.js" --name "${APP_NAME}" -- -c "$CONFIG_PATH"
