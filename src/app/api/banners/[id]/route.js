// PUT    /api/banners/:id  — editar
// DELETE /api/banners/:id  — eliminar
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Banner from '@/models/Banner'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    const body = await request.json().catch(() => ({}))
    const banner = await Banner.findByIdAndUpdate(params.id, body, { new: true }).lean()
    if (!banner) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ banner: JSON.parse(JSON.stringify(banner)) })
  } catch (err) {
    console.error('PUT /api/banners/[id]', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    await Banner.findByIdAndDelete(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/banners/[id]', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
