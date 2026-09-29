// GET  /api/paginas-imagenes          → fotos actuales (admin/editor)
// PUT  /api/paginas-imagenes {slot, url, pos} → guarda (admin/editor)
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import dbConnect from '@/lib/mongodb'
import PageImage from '@/models/PageImage'
import { getCurrentUser } from '@/lib/auth'
import { SLOT_POR_ID } from '@/lib/imagenesPaginasSlots'
import { normalizarEncuadre } from '@/lib/encuadre'

export const dynamic = 'force-dynamic'

async function puede() {
  const u = await getCurrentUser()
  return u && ['admin', 'editor'].includes(u.role)
}

export async function GET() {
  if (!(await puede())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await dbConnect()
  const imagenes = await PageImage.find({}).lean()
  return NextResponse.json({ imagenes })
}

export async function PUT(request) {
  if (!(await puede())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  if (!SLOT_POR_ID[b.slot]) return NextResponse.json({ error: 'Lugar de imagen inválido' }, { status: 400 })
  const url = String(b.url || '').trim().slice(0, 1000)
  const pos = b.pos ? normalizarEncuadre(b.pos) : null
  await dbConnect()
  await PageImage.updateOne({ slot: b.slot }, { $set: { url, pos } }, { upsert: true })
  try { revalidatePath('/quienes-somos'); revalidatePath('/contacto') } catch {}
  return NextResponse.json({ ok: true })
}
