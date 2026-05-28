// POST /api/auth/forgot-password
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit, clientIp } from '@/lib/rate-limit'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const dynamic = 'force-dynamic'

export async function POST(request) {
  // Rate limit: máx 5 intentos por IP por hora (evita inundar correos)
  const ip = clientIp(request)
  const rl = rateLimit(`forgot-pw:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    // Respondemos ok: true para no revelar si el email existe, pero no enviamos
    return NextResponse.json({ ok: true })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const email = (body.email || '').toLowerCase().trim()

    if (!email) return NextResponse.json({ ok: true })

    await dbConnect()
    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) return NextResponse.json({ ok: true })

    const token = crypto.randomBytes(32).toString('hex')
    // Guardar HASH del token en la DB — el token real solo viaja por email
    user.resetToken = hashToken(token)
    user.resetTokenExpiry = new Date(Date.now() + 3600000)
    await user.save()

    await sendPasswordResetEmail(user.email, token)
  } catch (err) {
    console.error('forgot-password error', err)
  }
  return NextResponse.json({ ok: true })
}
