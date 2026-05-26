import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Material from '@/models/Material'
import { getCurrentUser } from '@/lib/auth'

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role))
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await dbConnect()
    const body = await request.json()
    const updates = {}
    if (body.name !== undefined) { updates.name = body.name.trim(); updates.slug = slugify(updates.name) }
    if (body.order !== undefined) updates.order = Number(body.order)
    if (body.active !== undefined) updates.active = Boolean(body.active)
    const material = await Material.findByIdAndUpdate(params.id, updates, { new: true })
    if (!material) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ material })
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await dbConnect()
    await Material.findByIdAndDelete(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
