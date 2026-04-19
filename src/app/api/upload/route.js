// ============================================================
// POST /api/upload
// Sube archivos al directorio /public/uploads y devuelve la URL.
//
// En Next.js (App Router) no usamos Multer directamente porque
// Multer está pensado para Express, pero implementamos el mismo
// flujo usando la API nativa de `formData()` que es el equivalente
// moderno recomendado por Vercel y la doc oficial de Next.js.
//
// Protegido por middleware (requiere sesión admin).
// ============================================================
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
// Permitimos archivos de hasta ~5MB
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }

export async function POST(request) {
  try {
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
      return NextResponse.json(
        { error: 'Imagen demasiado grande (máx 5MB)' },
        { status: 413 }
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    // Nombre aleatorio para evitar colisiones y path traversal
    const randomName = crypto.randomBytes(16).toString('hex')
    const ext = ALLOWED_EXT[file.type] || '.bin'
    const fileName = `${Date.now()}-${randomName}${ext}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, fileName), bytes)

    const url = `/uploads/${fileName}`
    return NextResponse.json({ url })
  } catch (err) {
    console.error('UPLOAD error', err)
    return NextResponse.json({ error: 'No se pudo subir el archivo' }, { status: 500 })
  }
}
