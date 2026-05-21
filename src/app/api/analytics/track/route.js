// POST /api/analytics/track  — registra una visita de página
// Se llama desde el cliente (PageViewTracker) en cada navegación.
// Rate-limit natural: agrupa por (hora + URL + IP) con upsert.
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import dbConnect from '@/lib/mongodb'
import PageView from '@/models/PageView'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { url } = await request.json().catch(() => ({}))
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Obtener IP del visitante (Vercel pone x-forwarded-for)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // Hash de IP para privacidad (no guardamos la IP cruda)
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16)

    const now = new Date()
    const date = now.toISOString().slice(0, 10)          // 'YYYY-MM-DD'
    const hour = now.getUTCHours()

    // Normalizar URL: quitar dominio, dejar solo path + query
    let path = url
    try {
      path = new URL(url).pathname
    } catch {}

    const bucket = `${date}-${hour}-${ipHash}-${path.slice(0, 80)}`

    await dbConnect()
    await PageView.findOneAndUpdate(
      { bucket },
      { $inc: { count: 1 }, $setOnInsert: { date, hour, url: path, ipHash } },
      { upsert: true, new: false }
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/analytics/track', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
