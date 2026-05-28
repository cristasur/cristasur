import { NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  // Rate limit: máx 3 reenvíos por IP por hora
  const ip = clientIp(request)
  const rl = rateLimit(`resend-verify:${ip}`, 3, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    await dbConnect()
    const user = await User.findById(session.sub).select('email emailVerified verifyToken')
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    if (user.emailVerified) return NextResponse.json({ ok: true }) // ya verificado, no hacer nada
    const token = crypto.randomBytes(32).toString('hex')
    user.verifyToken = token
    user.verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    await user.save()
    await sendVerificationEmail(user.email, token)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }
}
