import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import mongoose from 'mongoose'

// Simple schema for newsletter subscribers
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  source: { type: String, default: 'popup' },
  createdAt: { type: Date, default: Date.now },
})

const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema)

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    await dbConnect()
    await Subscriber.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), source: 'popup' },
      { upsert: true }
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Silent fail - don't block UX
  }
}
