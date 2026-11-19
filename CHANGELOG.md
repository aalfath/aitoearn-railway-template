# Changelog

## 2026-11-19: first release

- AiToEarn v2.5.0 plus upstream fixes to 2026-11-06: server and AI `20261106-5723de43`, web
  `20260709-e48981e` (latest web image).
- MongoDB 7.0.48 (single-member replica set), Redis 8.2.3, RustFS 1.0.6, nginx 1.30.7 gateway.
- Gateway login in front of the web app; `/api/_shutdown` and `/api/metrics` blocked.
- Upstream init containers replaced by an idempotent start step in the server.
