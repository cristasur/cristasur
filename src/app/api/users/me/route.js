// ============================================================
// /api/users/me
// GET  — devuelve nombre, email, teléfono del usuario actual
// PATCH — actualiza nombre, teléfono y/o contraseña
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    await dbConnect()
    const user = await User.findById(session.sub).select('email name phone').lean()
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
      },
    })
  } catch (err) {
    console.error('GET /api/users/me error', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PATCH(request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const { name, phone, currentPassword, newPassword } = body

    await dbConnect()
    const user = await User.findById(session.sub)
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    // Update name and phone
    if (typeof name === 'string') user.name = name.trim().slice(0, 120)
    if (typeof phone === 'string') user.phone = phone.trim().slice(0, 30)

    // Password change (optional — only if newPassword provided)
    if (newPassword) {
      if (typeof currentPassword !== 'string' || !currentPassword) {
        return NextResponse.json(
          { error: 'Debes ingresar tu contraseña actual para cambiarla.' },
          { status: 400 }
        )
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'La nueva contraseña debe tener al menos 8 caracteres.' },
          { status: 400 }
        )
      }
      const ok = await user.comparePassword(currentPassword)
      if (!ok) {
        return NextResponse.json(
          { error: 'La contraseña actual es incorrecta.' },
          { status: 400 }
        )
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    await user.save()

    return NextResponse.json({
      ok: true,
      user: {
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
      },
    })
  } catch (err) {
    console.error('PATCH /api/users/me error', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
