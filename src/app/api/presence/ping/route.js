// ============================================================
// POST /api/presence/ping
// Heartbeat público: cada cliente (logueado o no) manda un ping
// cada ~30s mientras la pestaña está visible. Upsert por sessionId.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Presence from '@/models/Presence'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const sessionId = String(body?.sessionId || '').slice(0, 60).trim()
    if (!sessionId || sessionId.length < 8) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const path = String(body?.path || '/').slice(0, 200)

    // Si hay sesión logueada, la enlazamos al presence (no es requisito).
    let userId = null
    let email = null
    let name = null
    let role = null
    try {
      const session = await getCurrentUser()
      if (session) {
        userId = session.sub
        email = session.email || null
        name = session.name || null
        role = session.role || null
      }
    } catch {}

    await dbConnect()
    await Presence.updateOne(
      { sessionId },
      {
        $set: {
          path,
          userId,
          email,
          name,
          role,
          userAgent: String(request.headers.get('user-agent') || '').slice(0, 200),
          ip: String(request.headers.get('x-forwarded-for') || '').split(',')[0].slice(0, 60),
          lastSeen: new Date(),
        },
      },
      { upsert: true }
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    // No queremos romper la página por un ping fallido.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
