// Builds /data/config.yaml for aitoearn-server or aitoearn-ai on Railway.
// 1. upstream defaults (config.base.yaml from the pinned release)
// 2. overlaid with the deployer's saved config (/data/config.yaml, edited in the UI)
// 3. overlaid with the infrastructure values that Railway provides (secrets, hosts, URLs)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import YAML from 'yaml'

const role = process.env.APP_NAME
const configPath = process.env.CONFIG_PATH || '/data/config.yaml'
const basePath = '/app/railway/config.base.yaml'

function need(name, { secret = false } = {}) {
  const value = (process.env[name] || '').trim()
  if (!value) {
    console.error(`[railway] ${name} is not set`)
    process.exit(1)
  }
  if (secret && !/^\S{32,}$/.test(value)) {
    console.error(`[railway] ${name} must be at least 32 characters with no whitespace`)
    process.exit(1)
  }
  return value
}

const isObj = v => v && typeof v === 'object' && !Array.isArray(v)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
// Three-way merge: keep what the deployer changed (saved differs from the base it was built on),
// take everything else from the new base, so version bumps still bring new upstream defaults.
function merge3(next, prev, saved) {
  if (saved === undefined)
    return next
  if (same(saved, prev))
    return next
  if (!isObj(next) || !isObj(saved))
    return saved
  const out = { ...next }
  for (const [k, v] of Object.entries(saved))
    out[k] = merge3(next[k], isObj(prev) ? prev[k] : undefined, v)
  return out
}
const readYaml = (path, fallback) => {
  if (!existsSync(path))
    return fallback
  try {
    return YAML.parse(readFileSync(path, 'utf8')) ?? fallback
  }
  catch (e) {
    console.error(`[railway] could not parse ${path} (${e.message}); keeping a copy and ignoring it`)
    writeFileSync(`${path}.broken-${Date.now()}`, readFileSync(path))
    return fallback
  }
}

const baseText = readFileSync(basePath, 'utf8')
const base = YAML.parse(baseText)
const appliedBasePath = `${dirname(configPath)}/.config.base.yaml`
const saved = readYaml(configPath, undefined)
const prevBase = readYaml(appliedBasePath, {})
const cfg = saved === undefined ? structuredClone(base) : merge3(base, prevBase, saved)

const publicUrl = need('PUBLIC_URL').replace(/\/+$/, '')
const publicOrigin = new URL(publicUrl).origin
const redis = {
  host: need('REDIS_HOST'),
  port: Number(need('REDIS_PORT')),
  username: process.env.REDIS_USER || 'default',
  password: need('REDIS_PASSWORD'),
}

cfg.port = Number(process.env.PORT || cfg.port)
cfg.auth = { ...cfg.auth, secret: need('JWT_SECRET', { secret: true }), internalToken: need('INTERNAL_TOKEN', { secret: true }) }
cfg.redis = { ...cfg.redis, ...redis }
cfg.redlock = { ...cfg.redlock, redis: { ...(cfg.redlock?.redis || {}), ...redis } }
cfg.mongodb = { ...cfg.mongodb, uri: need('MONGO_URL'), dbName: cfg.mongodb?.dbName || 'aitoearn' }
cfg.assets = {
  ...cfg.assets,
  provider: 's3',
  region: 'us-east-1',
  forcePathStyle: true,
  bucketName: process.env.S3_BUCKET || 'aitoearn',
  accessKeyId: need('S3_ACCESS_KEY'),
  secretAccessKey: need('S3_SECRET_KEY'),
  endpoint: need('S3_ENDPOINT'),
  // Browsers upload to presigned URLs on the public domain; the gateway proxies /<bucket>/ to RustFS.
  publicEndpoint: publicOrigin,
  // Public media URLs (social platforms fetch these), served by the gateway's /oss/ route.
  cdnEndpoint: `${publicOrigin}/oss`,
}

if (role === 'aitoearn-server') {
  cfg.appDomain = new URL(publicUrl).hostname
  cfg.aiClient = { ...cfg.aiClient, baseUrl: need('AI_URL'), token: need('INTERNAL_TOKEN') }
  cfg.channel = cfg.channel || {}
  cfg.channel.channelDb = { ...cfg.channel.channelDb, uri: need('MONGO_URL') }
  cfg.channel.shortLink = { ...cfg.channel.shortLink, baseUrl: `${publicOrigin}/api/shortLink/` }
  for (const platform of Object.values(cfg.channel)) {
    if (isObj(platform) && typeof platform.redirectUri === 'string' && platform.redirectUri) {
      const u = new URL(platform.redirectUri)
      platform.redirectUri = `${publicOrigin}${u.pathname}${u.search}`
    }
  }
  cfg.relay = { ...cfg.relay, callbackUrl: `${publicOrigin}/api/v2/channels/relay/callback` }
}
else if (role === 'aitoearn-ai') {
  cfg.serverClient = { ...cfg.serverClient, baseUrl: need('SERVER_URL') }
}
else {
  console.error(`[railway] unknown APP_NAME ${role}`)
  process.exit(1)
}

mkdirSync(dirname(configPath), { recursive: true })
writeFileSync(configPath, YAML.stringify(cfg, { lineWidth: 0 }))
writeFileSync(appliedBasePath, baseText)
console.log(`[railway] wrote ${configPath} for ${role} (port ${cfg.port})`)
