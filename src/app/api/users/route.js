// ============================================================
// GET  /api/users   lista usuarios (admin only - middleware)
// POST /api/users   crea usuario { email, password, name, role }
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import validator from 'validator'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    await dbConnect()
    const users = await User.find({})
      .select('_id email name role wholesaleAccess lastLoginAt createdAt')
      .sort({ createdAt: -1 })
      .lean()
    return NextResponse.json({ users })
  } catch (err) {
    console.error('GET /api/users', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const name = String(body?.name || '').trim() || 'Administrador'
    const role = ['admin', 'editor'].includes(body?.role) ? body.role : 'editor'

    if (!validator.isEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    await dbConnect()
    const exists = await User.findOne({ email }).lean()
    if (exists) {
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })
    }

    const user = await User.createWithPassword({ email, password, name, role })
    return NextResponse.json(
      {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/users', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
