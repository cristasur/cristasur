import { NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    await dbConnect()
    const user = await User.findById(session.sub).select('email emailVerified verifyToken')
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    if (user.emailVerified) return NextResponse.json({ ok: true }) // ya verificado, no hacer nada
    const token = crypto.randomBytes(32).toString('hex')
    user.verifyToken = token
    await user.save()
    await sendVerificationEmail(user.email, token)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }
}
