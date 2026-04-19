// ============================================================
// GET /api/auth/me
// Devuelve el usuario actual según la cookie
// ============================================================
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null }, { status: 200 })
  return NextResponse.json({
    user: { id: user.sub, email: user.email, role: user.role },
  })
}
