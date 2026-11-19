// Prints the auto-login token for the single AiToEarn admin user (HS256 JWT signed with JWT_SECRET),
// the same token upstream's aitoearn-init container writes to /data/init/token.txt.
import crypto from 'node:crypto'

const secret = (process.env.JWT_SECRET || '').trim()
if (!/^\S{32,}$/.test(secret)) {
  console.error('[railway] JWT_SECRET must be at least 32 characters with no whitespace')
  process.exit(1)
}
const id = process.env.ADMIN_USER_ID || '6a17e0ea0000000000000001'
const b64 = v => Buffer.from(JSON.stringify(v)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ id, mail: 'admin@aitoearn.local', name: 'Admin', iat: now, exp: now + 100 * 365 * 24 * 3600 })}`
const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url')
process.stdout.write(`${body}.${sig}`)
