// ============================================================
// PUT    /api/home-sections/:id  — admin/editor: editar un bloque
//                                  (items se reemplaza completo)
// DELETE /api/home-sections/:id  — solo admin
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import dbConnect from '@/lib/mongodb'
import HomeSection from '@/models/HomeSection'
import Category from '@/models/Category' // registra el modelo para populate
import { getCurrentUser } from '@/lib/auth'
import { limpiarSeccion } from '../limpiar'

export const dynamic = 'force-dynamic'

void Category

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
    const { value, error } = limpiarSeccion(body)
    if (error) return NextResponse.json({ error }, { status: 400 })

    const section = await HomeSection.findByIdAndUpdate(params.id, { $set: value }, { new: true, runValidators: true })
      .populate('category', 'name slug')
      .populate('items.category', 'name slug')
      .lean()
    if (!section) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    try { revalidatePath('/') } catch {}
    return NextResponse.json({ section: JSON.parse(JSON.stringify(section)) })
  } catch (err) {
    console.error('PUT /api/home-sections/[id]', err)
    if (err?.name === 'ValidationError' || err?.name === 'CastError') {
      return NextResponse.json({ error: 'Datos inválidos: ' + err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo un administrador puede eliminar bloques' }, { status: 401 })
    }
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    await HomeSection.findByIdAndDelete(params.id)
    try { revalidatePath('/') } catch {}
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/home-sections/[id]', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
