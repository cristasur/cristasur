// GET /api/auth/verify-email?token=...
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://cristasur.com'

    if (!token) {
      return NextResponse.redirect(`${SITE}/cuenta/verificar-email?status=invalid`)
    }

    await dbConnect()
    const user = await User.findOne({ verifyToken: token })

    if (!user) {
      return NextResponse.redirect(`${SITE}/cuenta/verificar-email?status=invalid`)
    }

    user.emailVerified = true
    user.verifyToken = null
    await user.save()

    return NextResponse.redirect(`${SITE}/cuenta/verificar-email?status=success`)
  } catch (err) {
    console.error('verify-email error', err)
    const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://cristasur.com'
    return NextResponse.redirect(`${SITE}/cuenta/verificar-email?status=invalid`)
  }
}
