# AiToEarn web front end (Next.js standalone). Upstream publishes dated commit tags only.
# 20260709-e48981e = v2.5.0 plus the web fixes through 2026-07-09 (latest web image; no web changes since).
FROM aitoearn/aitoearn-web:20260709-e48981e@sha256:f75bbd5800e02f152e91f54350c135935100e4e261c3223374bf6d9777452325

USER root
COPY token.mjs start.sh /app/railway/
RUN chmod 755 /app/railway/start.sh
USER nextjs

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
EXPOSE 3000
CMD ["/app/railway/start.sh"]
