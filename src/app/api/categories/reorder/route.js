// ============================================================
// POST /api/categories/reorder  { ids: [id, id, ...] }
// Guarda el orden de categorías hermanas: la primera queda en 0,
// la segunda en 1, etc. Solo staff.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import { soloStaff } from '@/lib/permisos'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const bloqueo = await soloStaff()
  if (bloqueo) return bloqueo
  try {
    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.map(String) : []
    if (!ids.length || ids.length > 200 || ids.some((id) => !/^[a-f0-9]{24}$/i.test(id)) || new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: 'Lista de categorías inválida' }, { status: 400 })
    }
    await dbConnect()
    await Category.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/categories/reorder', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
