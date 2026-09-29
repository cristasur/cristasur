// PATCH /api/contacto/:id  { atendido: true|false }  — admin/editor
// DELETE /api/contacto/:id                            — admin
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function permiso(roles) {
  const u = await getCurrentUser()
  return u && roles.includes(u.role)
}

export async function PATCH(request, { params }) {
  if (!(await permiso(['admin', 'editor']))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!mongoose.Types.ObjectId.isValid(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const { atendido } = await request.json().catch(() => ({}))
  await dbConnect()
  await ContactMessage.updateOne({ _id: params.id }, { $set: { atendido: Boolean(atendido) } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request, { params }) {
  if (!(await permiso(['admin']))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!mongoose.Types.ObjectId.isValid(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  await dbConnect()
  await ContactMessage.deleteOne({ _id: params.id })
  return NextResponse.json({ ok: true })
}
