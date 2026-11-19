// Waits (up to WAIT_TIMEOUT seconds) until MongoDB's replica set has a writable primary,
// so the app doesn't crash-loop while MongoDB is still starting on a fresh deploy.
import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URL
const deadline = Date.now() + Number(process.env.WAIT_TIMEOUT || 240) * 1000
let attempt = 0
while (Date.now() < deadline) {
  attempt++
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 })
  try {
    await client.connect()
    const hello = await client.db('admin').command({ hello: 1 })
    if (hello.isWritablePrimary) {
      console.log(`[railway] MongoDB primary ready after ${attempt} attempt(s)`)
      await client.close()
      process.exit(0)
    }
  }
  catch {}
  await client.close().catch(() => {})
  await new Promise(r => setTimeout(r, 3000))
}
console.error('[railway] MongoDB not ready yet; starting anyway (the app retries)')
