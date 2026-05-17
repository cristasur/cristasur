// ============================================================
// POST /api/upload
// Sube archivos a Vercel Blob (persistente entre deploys),
// los comprime con sharp y los convierte a WebP (máx 1600px).
// ============================================================
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import crypto from 'crypto'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_SIZE = 8 * 1024 * 1024
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 80
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const UPLOAD_MAX = 60
const UPLOAD_WINDOW_MS = 10 * 60 * 1000

function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
    return 'image/png'
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  )
    return 'image/webp'
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif'
  return null
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const ip = clientIp(request)
    const key = `upload:${user.sub || ip}`
    const rl = rateLimit(key, UPLOAD_MAX, UPLOAD_WINDOW_MS)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Demasiadas subidas. Espera unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: 'Tipo no permitido. Usa JPG, PNG, WebP o GIF.' },
        { status: 415 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagen muy grande (máx 8MB)' }, { status: 413 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())

    const realType = detectImageType(bytes)
    if (!realType || !ALLOWED_MIME.has(realType)) {
      return NextResponse.json(
        { error: 'El archivo no parece una imagen válida.' },
        { status: 415 }
      )
    }

    let processed = bytes
    let ext = '.webp'
    try {
      const sharp = (await import('sharp')).default
      if (realType === 'image/gif') {
        processed = bytes
        ext = '.gif'
      } else {
        processed = await sharp(bytes)
          .rotate()
          .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer()
        ext = '.webp'
      }
    } catch (sharpErr) {
      console.error('[upload] sharp falló:', sharpErr?.message)
      return NextResponse.json(
        { error: 'No se pudo procesar la imagen. Intenta con otro archivo.' },
        { status: 500 }
      )
    }

    const randomName = crypto.randomBytes(16).toString('hex')
    const fileName = `productos/${Date.now()}-${randomName}${ext}`

    // Subir a Vercel Blob (persistente entre deploys)
    const blob = await put(fileName, processed, {
      access: 'public',
      contentType: ext === '.gif' ? 'image/gif' : 'image/webp',
    })

    return NextResponse.json({
      url: blob.url,
      bytes: processed.length,
      originalBytes: bytes.length,
      savedPct: Math.round(((bytes.length - processed.length) / bytes.length) * 100),
    })
  } catch (err) {
    console.error('UPLOAD error', err)
    return NextResponse.json({ error: 'No se pudo subir el archivo' }, { status: 500 })
  }
}
