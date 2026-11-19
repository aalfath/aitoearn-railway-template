# AiToEarn AI service (NestJS: models, agent, draft generation). Same upstream commit as aitoearn-server.
FROM aitoearn/aitoearn-ai:20261106-5723de43@sha256:b18f6c878f4f9ce6a639e609efac3e958eb08b25a1f54fe823a03ed7675ed5f7

# config.base.yaml = project/aitoearn-backend/apps/aitoearn-ai/config/config.yaml at 5723de43
COPY config.base.yaml configure.mjs wait-for-deps.mjs start.sh /app/railway/
# ioredis defaults to IPv4 lookups; Railway's private network needs IPv6, so resolve both.
RUN chmod 755 /app/railway/start.sh \
 && sed -i 's/maxRetriesPerRequest: null,/maxRetriesPerRequest: null, family: 0,/' /app/libs/redis/src/redis.module.js \
 && grep -q 'family: 0' /app/libs/redis/src/redis.module.js

ENV APP_NAME=aitoearn-ai PORT=3010 CONFIG_PATH=/data/config.yaml
EXPOSE 3010
CMD ["/app/railway/start.sh"]
