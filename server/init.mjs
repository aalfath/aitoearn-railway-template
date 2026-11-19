// One-time setup for the AiToEarn stack, run in the background by aitoearn-server:
// - creates the single admin user (fixed id, so the web service can sign its auto-login token)
// - creates the RustFS bucket, makes objects publicly readable (social platforms fetch media), sets CORS
// Safe to run on every start.
import crypto from 'node:crypto'
import { CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3'
import { MongoClient, ObjectId } from 'mongodb'

const ADMIN_ID = process.env.ADMIN_USER_ID || '6a17e0ea0000000000000001'
const ADMIN_MAIL = 'admin@aitoearn.local'
const bucket = process.env.S3_BUCKET || 'aitoearn'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function retry(name, fn) {
  for (let i = 1; i <= 60; i++) {
    try {
      await fn()
      return
    }
    catch (e) {
      if (i === 60) {
        console.error(`[railway-init] ${name} failed: ${e.message}`)
        return
      }
      await sleep(5000)
    }
  }
}

await retry('admin user', async () => {
  const client = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  try {
    const users = client.db('aitoearn').collection('user')
    const _id = new ObjectId(ADMIN_ID)
    if (await users.findOne({ _id })) {
      console.log('[railway-init] admin user present')
      return
    }
    const phoneHash = crypto.createHash('sha256').update(ADMIN_MAIL).digest('hex').substring(0, 16)
    const hash = crypto.createHash('sha256').update(ADMIN_ID).update(`aitoearn${phoneHash}`).digest('hex')
    const popularizeCode = parseInt(hash.substring(0, 6), 16).toString(36).slice(-5).toUpperCase().padStart(5, '0')
    const now = new Date()
    await users.insertOne({
      _id,
      name: 'Admin',
      mail: ADMIN_MAIL,
      status: 1,
      userType: 'CREATOR',
      isDelete: false,
      score: 0,
      usedStorage: 0,
      storage: { total: 524288000 },
      locale: 'en-US',
      popularizeCode,
      createdAt: now,
      updatedAt: now,
    })
    console.log('[railway-init] admin user created')
  }
  finally {
    await client.close()
  }
})

await retry('bucket', async () => {
  const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
  })
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }))
  }
  catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }))
    console.log(`[railway-init] bucket ${bucket} created`)
  }
  await s3.send(new PutBucketPolicyCommand({
    Bucket: bucket,
    Policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: '*', Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${bucket}/*`] }] }),
  }))
  await s3.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: { CORSRules: [{ AllowedOrigins: ['*'], AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST'], AllowedHeaders: ['*'], ExposeHeaders: ['ETag'], MaxAgeSeconds: 86400 }] },
  }))
  console.log(`[railway-init] bucket ${bucket} ready (public read, CORS)`)
})
