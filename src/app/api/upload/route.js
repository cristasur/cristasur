// ============================================================
// POST /api/upload
// Sube archivos a /public/uploads, los comprime con sharp y los
// convierte a WebP (máx 1600px). Devuelve la URL generada.
// Endurecido contra:
//   - rate limiting por usuario autenticado (auth la garantiza el middleware)
//   - validación de tipo MIME en headers
//   - validación de "magic number" real (no confiamos sólo en file.type)
//   - tamaño máx
//   - nombres de archivo controlados por el server (timestamp + hash)
// ============================================================
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_SIZE = 8 * 1024 * 1024 // 8MB de entrada (la salida será mucho menor)
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 80
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

// Rate limit: 60 uploads por usuario cada 10 min (suficiente incluso para una
// carga masiva de catálogo, pero corta abuso).
const UPLOAD_MAX = 60
const UPLOAD_WINDOW_MS = 10 * 60 * 1000

// Comprueba el magic number de los primeros bytes del archivo.
// No confiamos en file.type (cliente lo puede falsificar).
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return 'image/png'
  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return 'image/webp'
  // GIF: GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif'
  return null
}

export async function POST(request) {
  try {
    // El middleware ya validó auth. Doble check: getCurrentUser para tener al
    // usuario en el contexto + cualquier futura excepción de auth.
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Rate limit por usuario (preferido) y por IP como fallback.
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

    // Validamos magic number real
    const realType = detectImageType(bytes)
    if (!realType || !ALLOWED_MIME.has(realType)) {
      return NextResponse.json(
        { error: 'El archivo no parece una imagen válida.' },
        { status: 415 }
      )
    }

    // Procesamos con sharp. Si por algún motivo falla, abortamos (no caemos a
    // "guardar tal cual" en producción para evitar guardar un archivo crafted).
    let processed = bytes
    let ext = '.webp'
    try {
      const sharp = (await import('sharp')).default
      if (realType === 'image/gif') {
        processed = bytes
        ext = '.gif'
      } else {
        processed = await sharp(bytes)
          .rotate() // respeta EXIF orientation
          .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
          })
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

    // Nombre del archivo lo decide el server (no se acepta nada del cliente)
    const randomName = crypto.randomBytes(16).toString('hex')
    const fileName = `${Date.now()}-${randomName}${ext}`

    // Path traversal: comprobamos que el resolvedPath siga dentro de uploadDir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const fullPath = path.join(uploadDir, fileName)
    if (!fullPath.startsWith(uploadDir + path.sep)) {
      return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 })
    }

    await mkdir(uploadDir, { recursive: true })
    await writeFile(fullPath, processed)

    return NextResponse.json({
      url: `/uploads/${fileName}`,
      bytes: processed.length,
      originalBytes: bytes.length,
      savedPct: Math.round(((bytes.length - processed.length) / bytes.length) * 100),
    })
  } catch (err) {
    console.error('UPLOAD error', err)
    return NextResponse.json({ error: 'No se pudo subir el archivo' }, { status: 500 })
  }
}
