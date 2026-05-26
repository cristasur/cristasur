import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Newsletter from '@/models/Newsletter'

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    await dbConnect()
    await Newsletter.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase() },
      { upsert: true }
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Silent fail - don't block UX
  }
}
