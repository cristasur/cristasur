import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    await dbConnect()
    await User.findByIdAndUpdate(session.sub, { newsletterSubscribed: true })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
