// ============================================================
// POST /api/auth/register
// Crea una cuenta de cliente (role: 'customer'). Endpoint público
// rate-limited contra abuso de registro.
// Setea cookie httpOnly con JWT al éxito para auto-login.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, buildAuthCookie } from '@/lib/auth'
import { isValidEmail, cleanString, cleanSoft } from '@/lib/validation'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const ip = clientIp(request)
    // 5 registros por IP por hora (corta abuso/spam)
    const rl = rateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Demasiados registros desde tu dirección. Espera un rato.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const email = cleanString(body.email, { max: 120 }).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    const name = cleanSoft(body.name, { max: 80 })
    const phone = cleanString(body.phone || '', { max: 30 })

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    const BLOCKED_DOMAINS = ['mailinator.com','guerrillamail.com','temp-mail.org','throwam.com','yopmail.com','sharklasers.com','trashmail.com','example.com','test.com','fake.com','dispostable.com','maildrop.cc','spamgourmet.com']
    const emailDomain = email.split('@')[1] || ''
    if (BLOCKED_DOMAINS.includes(emailDomain)) {
      return NextResponse.json({ error: 'Por favor usa un correo real para registrarte.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Indícanos tu nombre' }, { status: 400 })
    }

    await dbConnect()
    const existing = await User.findOne({ email }).select('_id').lean()
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese correo. Inicia sesión.' },
        { status: 409 }
      )
    }

    const user = await User.createWithPassword({
      email,
      password,
      name,
      phone,
      role: 'customer',
    })
    user.lastLoginAt = new Date()
    await user.save()

    // Send verification email (non-blocking)
    try {
      const verifyToken = crypto.randomBytes(32).toString('hex')
      const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      await User.findByIdAndUpdate(user._id || user.id, { verifyToken, verifyTokenExpiry })
      await sendVerificationEmail(user.email, verifyToken)
    } catch {}

    const token = await signToken({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    })
    const res = NextResponse.json({
      ok: true,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    })
    const cookie = buildAuthCookie(token)
    res.cookies.set(cookie.name, cookie.value, cookie)
    return res
  } catch (err) {
    console.error('register error', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
