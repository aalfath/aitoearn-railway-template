#!/bin/sh
# MongoDB as a single-member replica set (AiToEarn uses transactions), with auth and a keyfile.
# The member host is localhost:27017 so a redeploy never finds itself "not a member" before
# private DNS resolves; clients connect with directConnection=true.
set -e
: "${MONGO_INITDB_ROOT_USERNAME:?set MONGO_INITDB_ROOT_USERNAME}"
: "${MONGO_INITDB_ROOT_PASSWORD:?set MONGO_INITDB_ROOT_PASSWORD}"
: "${MONGO_REPLICA_KEY:?set MONGO_REPLICA_KEY}"
printf '%s' "$MONGO_REPLICA_KEY" > /tmp/rs.key
chmod 400 /tmp/rs.key
chown 999:999 /tmp/rs.key
(
  until mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin \
    --eval 'try { rs.status().ok } catch (e) { rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] }).ok }' 2>/dev/null | grep -qx 1; do
    sleep 3
  done
  echo "replica set rs0 ready"
) &
exec docker-entrypoint.sh mongod --replSet rs0 --keyFile /tmp/rs.key --ipv6 --bind_ip_all
