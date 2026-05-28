// POST /api/auth/reset-password
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request) {
  // Rate limit: máx 10 intentos por IP por hora
  const ip = clientIp(request)
  const rl = rateLimit(`reset-pw:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { token, password } = body

    if (!token) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    await dbConnect()
    // Buscar por el hash del token (no el token en texto plano)
    const user = await User.findOne({
      resetToken: hashToken(token),
      resetTokenExpiry: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 12)
    user.passwordHash = hash
    user.resetToken = null
    user.resetTokenExpiry = null
    await user.save()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reset-password error', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
