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
    try {
      await Newsletter.create({ email: email.toLowerCase().trim() })
    } catch (e) {
      // Duplicate key
      if (e.code === 11000) {
        return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 })
      }
      throw e
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
