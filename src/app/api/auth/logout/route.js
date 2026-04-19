// ============================================================
// POST /api/auth/logout
// Borra la cookie de sesión
// ============================================================
import { NextResponse } from 'next/server'
import { buildLogoutCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  const c = buildLogoutCookie()
  res.cookies.set(c.name, c.value, c)
  return res
}
