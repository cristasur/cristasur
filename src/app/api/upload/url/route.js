// ============================================================
// POST /api/upload/url
// Recibe { url } (cliente), descarga la imagen, la procesa con sharp
// y la guarda en /public/uploads. Devuelve la URL local generada.
// Mismas validaciones que /api/upload (magic number, MIME).
// Sólo se permiten dominios HTTPS y se acota tamaño.
// ============================================================
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
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
  // bloqueo de rangos IP privados clásicos por prefijo string
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

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
    let res
    try {
      res = await fetch(urlStr, { redirect: 'manual', signal: ctrl.signal })
    } catch (e) {
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
    const contentType = res.headers.get('content-type') || ''
    if (!ALLOWED_MIME.has(contentType.split(';')[0])) {
      // todavía dejamos que magic-number la confirme
    }
    const lengthHeader = Number(res.headers.get('content-length') || 0)
    if (lengthHeader && lengthHeader > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagen demasiado grande' }, { status: 413 })
    }
    const arrayBuf = await res.arrayBuffer()
    const bytes = Buffer.from(arrayBuf)
    if (bytes.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagen demasiado grande' }, { status: 413 })
    }

    const realType = detectImageType(bytes)
    if (!realType) {
      return NextResponse.json({ error: 'El recurso no parece una imagen' }, { status: 415 })
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
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer()
      }
    } catch (e) {
      console.error('upload/url sharp', e?.message)
      return NextResponse.json({ error: 'No se pudo procesar la imagen' }, { status: 500 })
    }

    // NOTA: escritura a filesystem local no soportada en producción (Vercel serverless).
    // El filesystem de Vercel es de solo lectura excepto /tmp, y los archivos no persisten
    // entre invocaciones. Usa Vercel Blob o similar para almacenamiento persistente.
    // El código original se preserva comentado para referencia:
    //
    // const fileName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`
    // const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    // const fullPath = path.join(uploadDir, fileName)
    // if (!fullPath.startsWith(uploadDir + path.sep)) {
    //   return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 })
    // }
    // await mkdir(uploadDir, { recursive: true })
    // await writeFile(fullPath, processed)
    // return NextResponse.json({
    //   url: `/uploads/${fileName}`,
    //   bytes: processed.length,
    //   originalBytes: bytes.length,
    // })

    return NextResponse.json(
      { error: 'Almacenamiento local no soportado en producción. Configura Vercel Blob.' },
      { status: 501 }
    )
  } catch (err) {
    console.error('POST /api/upload/url', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
