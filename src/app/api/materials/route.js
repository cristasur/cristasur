import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Material from '@/models/Material'
import { getCurrentUser } from '@/lib/auth'

function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function GET(request) {
  await dbConnect()
  const all = new URL(request.url).searchParams.get('all') === '1'
  const materials = await Material.find(all ? {} : { active: true }).sort({ order: 1, name: 1 }).lean()
  return NextResponse.json({ materials })
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role))
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await dbConnect()
    const { name, order = 0, active = true } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    const slug = slugify(name.trim())
    if (await Material.findOne({ slug }))
      return NextResponse.json({ error: 'Ya existe un material con ese nombre' }, { status: 409 })
    const material = await Material.create({ name: name.trim(), slug, order, active })
    return NextResponse.json({ material }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear material' }, { status: 500 })
  }
}
