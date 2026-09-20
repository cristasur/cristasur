// ============================================================
// src/lib/r2.js
// Thin wrapper sobre AWS SDK S3 para trabajar con Cloudflare R2.
// R2 es 100% S3-compatible, solo cambia el endpoint.
// Se usa para subir backups automáticos (ver /api/cron/backup).
// ============================================================
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Falta variable de entorno ${name}`)
  return v
}

// El cliente se crea perezoso porque estos env vars solo existen en producción,
// no queremos que rompa el build local si no están configuradas.
let _client = null
function getClient() {
  if (_client) return _client
  const accountId = requireEnv('R2_ACCOUNT_ID')
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  })
  return _client
}

/**
 * Sube un archivo (Buffer o string) a R2.
 * @param {string} key - ruta dentro del bucket, ej. "backups/2026-09-20T03-00/products.json"
 * @param {Buffer|string} body - contenido
 * @param {string} contentType - MIME type ("application/json", "text/csv", etc.)
 */
export async function r2Upload(key, body, contentType = 'application/octet-stream') {
  const bucket = requireEnv('R2_BUCKET')
  const client = getClient()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

/**
 * Lista objetos con un prefijo dado. Útil para borrar backups viejos.
 * @param {string} prefix - ej. "backups/"
 * @returns {Promise<Array<{Key: string, LastModified: Date, Size: number}>>}
 */
export async function r2List(prefix = '') {
  const bucket = requireEnv('R2_BUCKET')
  const client = getClient()
  const items = []
  let continuationToken = undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )
    if (Array.isArray(res.Contents)) items.push(...res.Contents)
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)
  return items
}

/**
 * Borra un objeto de R2.
 */
export async function r2Delete(key) {
  const bucket = requireEnv('R2_BUCKET')
  const client = getClient()
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
