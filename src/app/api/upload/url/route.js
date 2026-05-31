// ============================================================
// POST /api/upload/url
// Recibe { url } (cliente), descarga la imagen, la procesa con
// sharp y la sube a Vercel Blob. Devuelve la URL pública.
// Mismas validaciones que /api/upload (magic number, MIME).
// Solo URLs http/https, se bloquean hosts privados (SSRF).
// ============================================================
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import crypto from 'crypto'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_SIZE = 8 * 1024 * 1024
const FETCH_TIMEOUT = 12_000

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function detectImageType(b) {
  if (!b || b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return 'image/webp'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif'
  return null
}

// Bloquea direcciones internas / locales como SSRF defense.
function isPrivateHost(host) {
  if (!host) return true
  const h = host.toLowerCase()
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true
  if (h.endsWith('.local') || h.endsWith('.internal')) return true
  if (/^10\./.test(h)) return true
  if (/^192\.168\./.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  if (/^169\.254\./.test(h)) return true
  return false
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const ip = clientIp(request)
    const rl = rateLimit(`upload-url:${user.sub || ip}`, 30, 10 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Demasiadas descargas. Espera unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const urlStr = String(body?.url || '').trim()
    if (!urlStr) return NextResponse.json({ error: 'Falta la URL' }, { status: 400 })

    let parsed
    try {
      parsed = new URL(urlStr)
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'Sólo se permiten URLs http/https' }, { status: 400 })
    }
    if (isPrivateHost(parsed.hostname)) {
      return NextResponse.json({ error: 'Dominio no permitido' }, { status: 400 })
    }

    // Descargar imagen con timeout y sin seguir redirecciones (anti-SSRF)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
    let res
    try {
      res = await fetch(urlStr, { redirect: 'manual', signal: ctrl.signal })
    } catch {
      clearTimeout(timer)
      return NextResponse.json({ error: 'No se pudo descargar la imagen' }, { status: 502 })
    }
    clearTimeout(timer)

    // Bloquear redirecciones para evitar SSRF a través de 3xx
    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json({ error: 'Redirects no permitidos' }, { status: 400 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: `La URL devolvió ${res.status}` }, { status: 502 })
    }

    const lengthHeader = Number(res.headers.get('content-length') || 0)
    if (lengthHeader && lengthHeader > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagen demasiado grande (máx 8MB)' }, { status: 413 })
    }

    const arrayBuf = await res.arrayBuffer()
    const bytes = Buffer.from(arrayBuf)
    if (bytes.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagen demasiado grande (máx 8MB)' }, { status: 413 })
    }

    // Validar tipo real por magic numbers
    const realType = detectImageType(bytes)
    if (!realType || !ALLOWED_MIME.has(realType)) {
      return NextResponse.json({ error: 'El recurso no parece una imagen válida' }, { status: 415 })
    }

    // Comprimir con sharp (igual que /api/upload)
    let processed = bytes
    let ext = realType === 'image/gif' ? '.gif' : '.webp'
    let contentType = realType

    if (realType !== 'image/gif') {
      try {
        const sharp = (await import('sharp')).default
        processed = await sharp(bytes)
          .rotate()
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer()
        ext = '.webp'
        contentType = 'image/webp'
      } catch (e) {
        console.warn('[upload/url] sharp no disponible, subiendo original:', e?.message)
        ext = realType === 'image/png' ? '.png' : realType === 'image/webp' ? '.webp' : '.jpg'
        contentType = realType
      }
    }

    // Subir a Vercel Blob (igual que /api/upload)
    const folder = (body?.folder || 'productos').replace(/[^a-z0-9-_]/gi, '')
    const randomName = crypto.randomBytes(16).toString('hex')
    const fileName = `${folder}/${Date.now()}-${randomName}${ext}`

    const blob = await put(fileName, processed, {
      access: 'public',
      contentType,
    })

    return NextResponse.json({
      url: blob.url,
      bytes: processed.length,
      originalBytes: bytes.length,
      savedPct: Math.round(((bytes.length - processed.length) / bytes.length) * 100),
    })
  } catch (err) {
    console.error('POST /api/upload/url', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
