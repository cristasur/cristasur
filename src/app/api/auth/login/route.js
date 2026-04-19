// ============================================================
// POST /api/auth/login
// Verifica credenciales y setea cookie httpOnly con JWT
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, buildAuthCookie } from '@/lib/auth'
import { isValidEmail, cleanString } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = cleanString(body.email, { max: 120 }).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''

    if (!isValidEmail(email) || password.length < 6) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 400 }
      )
    }

    await dbConnect()
    const user = await User.findOne({ email })
    if (!user) {
      // Mensaje genérico para no filtrar si el email existe
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const ok = await user.comparePassword(password)
    if (!ok) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    user.lastLoginAt = new Date()
    await user.save()

    const token = await signToken({ sub: user._id.toString(), role: user.role, email: user.email })
    const res = NextResponse.json({
      ok: true,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    })
    const cookie = buildAuthCookie(token)
    res.cookies.set(cookie.name, cookie.value, cookie)
    return res
  } catch (err) {
    console.error('login error', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
