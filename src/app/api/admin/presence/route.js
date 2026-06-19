// ============================================================
// GET /api/admin/presence
// Devuelve el total y el desglose de sesiones activas en los últimos 60s.
// Solo admin/editor.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Presence from '@/models/Presence'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getCurrentUser()
  if (!session || !['admin', 'editor'].includes(session.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  await dbConnect()
  // Consideramos "activo" si pingeó en los últimos 60 segundos.
  const cutoff = new Date(Date.now() - 60 * 1000)
  const activeRaw = await Presence.find({ lastSeen: { $gte: cutoff } })
    .select('sessionId path email name role lastSeen userId')
    .sort({ lastSeen: -1 })
    .limit(200)
    .lean()

  // Agrupamos por path para mostrar "qué están viendo".
  const byPath = new Map()
  for (const a of activeRaw) {
    const p = a.path || '/'
    byPath.set(p, (byPath.get(p) || 0) + 1)
  }
  const paths = Array.from(byPath.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // Conteo de logueados vs anónimos
  const logged = activeRaw.filter((a) => a.userId).length
  const anonymous = activeRaw.length - logged

  return NextResponse.json({
    total: activeRaw.length,
    logged,
    anonymous,
    paths,
    sessions: activeRaw.map((a) => ({
      sessionId: a.sessionId,
      path: a.path,
      email: a.email || null,
      name: a.name || null,
      role: a.role || null,
      lastSeen: a.lastSeen,
    })),
  })
}
