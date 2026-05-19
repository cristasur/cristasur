// POST /api/auth/reset-password
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

export async function POST(request) {
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
    const user = await User.findOne({
      resetToken: token,
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
