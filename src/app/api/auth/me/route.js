// ============================================================
// GET /api/auth/me
// Devuelve el usuario actual según la cookie. Hidrata desde la BD
// para tener wholesaleAccess, name, phone, etc., actualizados.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ user: null }, { status: 200 })
  try {
    await dbConnect()
    const u = await User.findById(session.sub)
      .select('email name role phone wholesaleAccess address')
      .lean()
    if (!u) return NextResponse.json({ user: null }, { status: 200 })
    return NextResponse.json({
      user: {
        id: String(u._id),
        email: u.email,
        name: u.name,
        role: u.role,
        phone: u.phone || '',
        wholesaleAccess: Boolean(u.wholesaleAccess),
        address: u.address || {},
      },
    })
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
