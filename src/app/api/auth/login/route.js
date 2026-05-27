// ============================================================
// POST /api/auth/login
// Verifica credenciales y setea cookie httpOnly con JWT.
// Rate-limited contra fuerza bruta (por IP y por email).
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, buildAuthCookie } from '@/lib/auth'
import { isValidEmail, cleanString } from '@/lib/validation'
import { rateLimit, rateLimitReset, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_PER_IP = 10              // 10 intentos
const MAX_PER_EMAIL = 5            // 5 intentos
const WINDOW_MS = 15 * 60 * 1000   // por 15 min

export async function POST(request) {
  try {
    const ip = clientIp(request)
    const ipCheck = rateLimit(`login:ip:${ip}`, MAX_PER_IP, WINDOW_MS)
    if (!ipCheck.ok) {
      return NextResponse.json(
        {
          error:
            'Demasiados intentos desde esta dirección. Espera unos minutos e inténtalo de nuevo.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipCheck.retryAfter) },
        }
      )
    }

    const body = await request.json().catch(() => ({}))
    const email = cleanString(body.email, { max: 120 }).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''

    if (!isValidEmail(email) || password.length < 6) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 400 }
      )
    }

    const emailCheck = rateLimit(`login:email:${email}`, MAX_PER_EMAIL, WINDOW_MS)
    if (!emailCheck.ok) {
      return NextResponse.json(
        {
          error:
            'Demasiados intentos para esta cuenta. Espera unos minutos e inténtalo de nuevo.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(emailCheck.retryAfter) },
        }
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
    // Admins y editores quedan verificados automáticamente
    if (!user.emailVerified && ['admin', 'editor'].includes(user.role)) {
      user.emailVerified = true
    }
    await user.save()

    // Login exitoso → limpiamos la deuda de la IP/email
    rateLimitReset(`login:ip:${ip}`)
    rateLimitReset(`login:email:${email}`)

    const token = await signToken({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      wholesaleAccess: Boolean(user.wholesaleAccess),
    })
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        wholesaleAccess: Boolean(user.wholesaleAccess),
      },
    })
    const cookie = buildAuthCookie(token)
    res.cookies.set(cookie.name, cookie.value, cookie)
    return res
  } catch (err) {
    console.error('login error', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
