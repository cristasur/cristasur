// ============================================================
// POST /api/products/bulk
// Operaciones masivas sobre productos. Body:
//   { ids: [<ObjectId>], op: <opName>, params: {...} }
// Operaciones soportadas:
//   - "price.percent"   → sube/baja el precio en X% (params.percent: número, +/-)
//   - "price.fixed"     → suma/resta cantidad fija al precio (params.delta)
//   - "price.set"       → setea precio exacto (params.value)
//   - "stock.set"       → setea stock exacto (params.value)
//   - "stock.add"       → suma cantidad al stock (params.value)
//   - "active.set"      → publica/oculta (params.active: bool)
//   - "status.set"      → 'draft' o 'published' (params.status)
//   - "featured.set"    → destaca/desmarca (params.featured: bool)
//   - "tags.add"        → añade tags (params.tags: [string])
//   - "tags.remove"     → quita tags
//   - "category.set"    → reemplaza categorías (params.categories: [id])
//   - "wholesale.set"   → setea wholesalePrice + wholesaleMinQty
//   - "wholesale.clear" → quita el mayoreo
// Retorna { ok, matched, modified } y registra una entrada en editHistory.
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_OPS = new Set([
  'price.percent', 'price.fixed', 'price.set',
  'stock.set', 'stock.add',
  'active.set', 'status.set', 'featured.set',
  'tags.add', 'tags.remove',
  'category.set',
  'wholesale.set', 'wholesale.clear',
])

function isObjectId(s) {
  return typeof s === 'string' && /^[a-f0-9]{24}$/i.test(s)
}

function buildUpdate(op, params) {
  switch (op) {
    case 'price.percent': {
      const pct = Number(params?.percent)
      if (!Number.isFinite(pct)) return null
      // mongo no permite multiplicar y luego asignar redondeado en una sola op,
      // pero $mul sirve para multiplicar; el redondeo lo hacemos aproximando.
      const factor = 1 + pct / 100
      if (factor < 0) return null
      return { update: { $mul: { price: factor } }, summary: `+${pct}% al precio` }
    }
    case 'price.fixed': {
      const delta = Number(params?.delta)
      if (!Number.isFinite(delta)) return null
      return { update: { $inc: { price: delta } }, summary: `${delta >= 0 ? '+' : ''}${delta} al precio` }
    }
    case 'price.set': {
      const v = Number(params?.value)
      if (!Number.isFinite(v) || v < 0) return null
      return { update: { $set: { price: v } }, summary: `precio = ${v}` }
    }
    case 'stock.set': {
      const v = Number(params?.value)
      if (!Number.isFinite(v) || v < 0) return null
      return { update: { $set: { stock: Math.floor(v) } }, summary: `stock = ${Math.floor(v)}` }
    }
    case 'stock.add': {
      const v = Number(params?.value)
      if (!Number.isFinite(v)) return null
      return { update: { $inc: { stock: Math.floor(v) } }, summary: `stock ${v >= 0 ? '+' : ''}${Math.floor(v)}` }
    }
    case 'active.set': {
      const v = Boolean(params?.active)
      return { update: { $set: { active: v } }, summary: `active = ${v}` }
    }
    case 'status.set': {
      const v = params?.status === 'draft' ? 'draft' : 'published'
      return { update: { $set: { status: v } }, summary: `status = ${v}` }
    }
    case 'featured.set': {
      const v = Boolean(params?.featured)
      return { update: { $set: { featured: v } }, summary: `featured = ${v}` }
    }
    case 'tags.add': {
      const arr = Array.isArray(params?.tags) ? params.tags : []
      const tags = arr.map((t) => String(t || '').toLowerCase().trim()).filter(Boolean)
      if (!tags.length) return null
      return { update: { $addToSet: { tags: { $each: tags } } }, summary: `+tags ${tags.join(',')}` }
    }
    case 'tags.remove': {
      const arr = Array.isArray(params?.tags) ? params.tags : []
      const tags = arr.map((t) => String(t || '').toLowerCase().trim()).filter(Boolean)
      if (!tags.length) return null
      return { update: { $pull: { tags: { $in: tags } } }, summary: `-tags ${tags.join(',')}` }
    }
    case 'category.set': {
      const cats = Array.isArray(params?.categories) ? params.categories.filter(isObjectId) : []
      if (!cats.length) return null
      return { update: { $set: { categories: cats } }, summary: `categorias = ${cats.length}` }
    }
    case 'wholesale.set': {
      const wp = Number(params?.wholesalePrice)
      const mq = Math.floor(Number(params?.wholesaleMinQty))
      if (!Number.isFinite(wp) || wp < 0 || !Number.isFinite(mq) || mq < 2) return null
      return {
        update: { $set: { wholesalePrice: wp, wholesaleMinQty: mq } },
        summary: `mayoreo ${wp}@${mq}`,
      }
    }
    case 'wholesale.clear': {
      return {
        update: { $set: { wholesalePrice: null, wholesaleMinQty: null } },
        summary: 'mayoreo borrado',
      }
    }
    default:
      return null
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.filter(isObjectId) : []
    const op = body?.op
    if (!ids.length) return NextResponse.json({ error: 'Falta selección de productos' }, { status: 400 })
    if (!VALID_OPS.has(op)) return NextResponse.json({ error: `Operación no soportada: ${op}` }, { status: 400 })

    const built = buildUpdate(op, body?.params || {})
    if (!built) return NextResponse.json({ error: 'Parámetros inválidos para la operación' }, { status: 400 })

    await dbConnect()
    const filter = { _id: { $in: ids }, deleted: { $ne: true } }

    // Combinar el update principal con el $push al historial en una sola operación atómica
    const finalUpdate = { ...built.update }
    finalUpdate.$push = {
      editHistory: {
        $each: [
          {
            userId: user.sub ? new mongoose.Types.ObjectId(String(user.sub)) : undefined,
            userEmail: user.email,
            action: 'bulk-update',
            changes: `bulk: ${op} (${built.summary})`,
          },
        ],
        $slice: -50,
      },
    }
    // Merge $set if it already exists (most ops use $set)
    if (finalUpdate.$set) {
      finalUpdate.$set.updatedBy = user.sub
    } else {
      finalUpdate.$set = { updatedBy: user.sub }
    }

    const result = await Product.updateMany(filter, finalUpdate)

    return NextResponse.json({
      ok: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      summary: built.summary,
    })
  } catch (err) {
    console.error('POST /api/products/bulk', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
