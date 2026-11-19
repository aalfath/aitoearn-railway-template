[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/aitoearn?utm_medium=integration&utm_source=button&utm_campaign=aitoearn)

# AiToEarn on Railway

One-click Railway template for [AiToEarn](https://github.com/yikart/AiToEarn) (MIT): AI content
creation and multi-platform publishing for creators. The template runs the full upstream stack as
separate Railway services on the private network.

## What it deploys

| Service | Folder | Image (pinned by digest in the Dockerfile) | Volume |
|---|---|---|---|
| `AiToEarn` (public gateway) | `gateway/` | `nginx:1.30.7-alpine` | none |
| `AiToEarn Web` | `web/` | `aitoearn/aitoearn-web:20260709-e48981e` | none |
| `AiToEarn Server` | `server/` | `aitoearn/aitoearn-server:20261106-5723de43` (v2.5.0 + fixes to 2026-11-06) | `/data` (config) |
| `AiToEarn AI` | `ai/` | `aitoearn/aitoearn-ai:20261106-5723de43` | `/data` (config) |
| `MongoDB` | `mongodb/` | `mongo:7.0.48`, single-member replica set (AiToEarn uses transactions) | `/data/db` |
| `RustFS` | `rustfs/` | `rustfs/rustfs:1.0.6` (S3-compatible storage for uploads and media) | `/data` |
| `Redis` | (image) | `redis:8.2.3-alpine`, password and AOF on | `/data` |

Upstream publishes only dated commit tags on Docker Hub, so each Dockerfile pins the tag and the
`sha256` digest. Upstream's two init containers are replaced by a start step in `AiToEarn Server`
(`server/init.mjs`: creates the admin user and the `aitoearn` bucket, idempotent).

## Routing (gateway)

- `/` → web app, behind HTTP basic auth (`AUTH_USERNAME` / `AUTH_PASSWORD`). Upstream's web app logs
  every visitor in as the admin, so the gateway login is what keeps your instance private.
- `/api/ai/`, `/api/agent/` → AI service; `/api/` → server (its own JWT guard; OAuth callbacks).
- `/oss/` → public media in the RustFS bucket; `/aitoearn/` → presigned uploads.
- `/api/_shutdown` and `/api/metrics` (unauthenticated upstream) → 404.
- `/_nhealth` → gateway health check.

## Variables

All generated or derived; the deployer is not asked for anything.

- `AiToEarn`: `AUTH_USERNAME` (default `admin`), `AUTH_PASSWORD` (generated, 24 characters) — your login.
- `AiToEarn Server`: `JWT_SECRET`, `INTERNAL_TOKEN` (generated, 64 characters; AI and Web reference them).
- `MongoDB`: root user `mongo`, generated password and replica-set key, `MONGO_URL` for the apps.
- `RustFS`: generated access and secret keys. `Redis`: generated password.
- `PUBLIC_URL` is derived from the gateway's Railway domain. If you add a custom domain, set
  `PUBLIC_URL` on `AiToEarn Server` and `AiToEarn AI` to `https://YOUR-DOMAIN` and redeploy them.

## After deploy

1. Open the `AiToEarn` service's domain and log in with `admin` and the `AUTH_PASSWORD` shown in that
   service's Variables tab.
2. In the app, open Configuration Management. Add a Relay API key from aitoearn.ai (recommended for
   social-platform OAuth) and any AI provider keys you want. Settings are saved on the server and AI
   volumes and survive redeploys and updates.

## Updates

Every service except Redis builds from this repo. When a new upstream image is pinned here and merged
to `main`, Railway shows "update available" on your project and you choose when to apply it. Read
[CHANGELOG.md](CHANGELOG.md) first: breaking changes are listed at the top of each entry.
