// ============================================================
// GET /api/products/sku-suggest?prefix=COC
// Devuelve un SKU disponible: <prefix>-<4 dígitos>, asegurando
// unicidad en BD. Si no se pasa prefix, infiere uno de la primera
// categoría asociada del producto en cuestión (?categoryId=...).
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export async function GET(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()
  const url = new URL(request.url)
  let prefix = normalize(url.searchParams.get('prefix') || '').slice(0, 6)

  // Si no hay prefix, intentamos derivarlo de la categoría
  if (!prefix) {
    const categoryId = url.searchParams.get('categoryId')
    if (categoryId) {
      const cat = await Category.findById(categoryId).select('name').lean()
      if (cat?.name) prefix = normalize(cat.name).slice(0, 3)
    }
  }
  if (!prefix) prefix = 'PRD'

  // Buscamos cuántos SKU empiezan con `<prefix>-` para sumar 1.
  // Como SKU es unique pero no incremental, miramos también el más alto.
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{1,6})$`)
  const candidates = await Product.find({ sku: { $regex: re } })
    .select('sku')
    .lean()
  let max = 0
  for (const p of candidates) {
    const m = p.sku?.match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  let next = max + 1
  // Verificamos colisión por si acaso, y si la hubiera vamos al siguiente.
  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = `${prefix}-${String(next).padStart(4, '0')}`
    const exists = await Product.findOne({ sku: candidate }).select('_id').lean()
    if (!exists) {
      return NextResponse.json({ sku: candidate, prefix })
    }
    next++
  }
  return NextResponse.json({ error: 'No se pudo generar SKU único' }, { status: 500 })
}
