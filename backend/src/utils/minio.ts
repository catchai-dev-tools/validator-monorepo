import { Client } from 'minio'

export function getMinioClient() {
  const host = process.env.MINIO_HOST
  const port = parseInt(process.env.MINIO_PORT || '9000')
  const accessKey = process.env.MINIO_ROOT_USER
  const secretKey = process.env.MINIO_ROOT_PASSWORD
  if (!host || !accessKey || !secretKey) return null
  return new Client({
    endPoint: host,
    port,
    useSSL: false,
    accessKey,
    secretKey,
  })
}

export async function ensureBucket(minio: Client, bucket: string) {
  const exists = await minio.bucketExists(bucket).catch(() => false)
  if (!exists) {
    await minio.makeBucket(bucket)
  }
}

export async function uploadBuffer(
  minio: Client,
  bucket: string,
  objectName: string,
  data: Buffer,
  contentType: string
) {
  await ensureBucket(minio, bucket)
  await minio.putObject(bucket, objectName, data, { 'Content-Type': contentType })
  // Public URL if MinIO is served via path-style
  const host = process.env.MINIO_HOST || 'localhost'
  const port = process.env.MINIO_PORT || '9000'
  return `http://${host}:${port}/${bucket}/${encodeURIComponent(objectName)}`
}
