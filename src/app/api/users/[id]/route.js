// ============================================================
// PATCH  /api/users/:id   cambia rol o password
// DELETE /api/users/:id   elimina usuario (no puedes borrarte a ti mismo)
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    await dbConnect()

    const update = {}
    if (body?.role && ['admin', 'editor', 'customer'].includes(body.role)) {
      update.role = body.role
    }
    if (body?.name) update.name = String(body.name).trim()
    if (typeof body?.wholesaleAccess === 'boolean') {
      update.wholesaleAccess = body.wholesaleAccess
    }
    if (body?.password) {
      if (String(body.password).length < 8) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 8 caracteres' },
          { status: 400 }
        )
      }
      update.passwordHash = await bcrypt.hash(String(body.password), 12)
    }
    if (!Object.keys(update).length) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    // Evitar que el único admin se degrade a editor y nos quedemos sin admin
    if (update.role === 'editor') {
      const target = await User.findById(params.id).lean()
      if (target?.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' })
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'No puedes quitar el último administrador' },
            { status: 400 }
          )
        }
      }
    }

    const user = await User.findByIdAndUpdate(params.id, update, {
      new: true,
      runValidators: true,
    })
      .select('_id email name role wholesaleAccess lastLoginAt createdAt')
      .lean()
    if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ user })
  } catch (err) {
    console.error('PATCH /api/users/:id', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    const me = await getCurrentUser()
    if (me?.sub && String(me.sub) === String(params.id)) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }
    const target = await User.findById(params.id).lean()
    if (!target) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    if (target.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'No puedes eliminar el último administrador' },
          { status: 400 }
        )
      }
    }
    await User.findByIdAndDelete(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/users/:id', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
