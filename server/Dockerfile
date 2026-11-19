# AiToEarn backend API (NestJS). Upstream publishes dated commit tags only (no release tags).
# 20261106-5723de43 = v2.5.0 plus upstream fixes through 2026-11-06 (commit 5723de43).
FROM aitoearn/aitoearn-server:20261106-5723de43@sha256:e67b2d37af9e9b65103e5ad5e381a16887d406e8acc27cf27c6c129303891027

# config.base.yaml = project/aitoearn-backend/apps/aitoearn-server/config/config.yaml at 5723de43
COPY config.base.yaml configure.mjs wait-for-deps.mjs init.mjs start.sh /app/railway/
# ioredis defaults to IPv4 lookups; Railway's private network needs IPv6, so resolve both.
RUN chmod 755 /app/railway/start.sh \
 && sed -i 's/maxRetriesPerRequest: null,/maxRetriesPerRequest: null, family: 0,/' /app/libs/redis/src/redis.module.js \
 && grep -q 'family: 0' /app/libs/redis/src/redis.module.js

ENV APP_NAME=aitoearn-server PORT=3002 CONFIG_PATH=/data/config.yaml
EXPOSE 3002
CMD ["/app/railway/start.sh"]
