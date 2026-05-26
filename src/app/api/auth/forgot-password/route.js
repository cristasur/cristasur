// POST /api/auth/forgot-password
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = (body.email || '').toLowerCase().trim()

    if (!email) return NextResponse.json({ ok: true })

    await dbConnect()
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })

    if (!user) return NextResponse.json({ ok: true })

    const token = crypto.randomBytes(32).toString('hex')
    user.resetToken = token
    user.resetTokenExpiry = new Date(Date.now() + 3600000)
    await user.save()

    await sendPasswordResetEmail(user.email, token)
  } catch (err) {
    console.error('forgot-password error', err)
  }
  return NextResponse.json({ ok: true })
}
