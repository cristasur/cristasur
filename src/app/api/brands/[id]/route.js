// ============================================================
// PUT    /api/brands/[id]  — editar marca (admin/editor)
// DELETE /api/brands/[id]  — eliminar marca (admin)
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Brand from '@/models/Brand'
import { getCurrentUser } from '@/lib/auth'

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const updates = {}

    if (body.name !== undefined) {
      updates.name = body.name.trim()
      updates.slug = slugify(updates.name)
    }
    if (body.order !== undefined) updates.order = Number(body.order)
    if (body.active !== undefined) updates.active = Boolean(body.active)

    const brand = await Brand.findByIdAndUpdate(params.id, updates, { new: true })
    if (!brand) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    return NextResponse.json({ brand })
  } catch (err) {
    console.error('PUT /api/brands/[id]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    await Brand.findByIdAndDelete(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/brands/[id]', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
