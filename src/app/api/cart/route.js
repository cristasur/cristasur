// ============================================================
// /api/cart
//   GET  → devuelve el carrito guardado del usuario logueado
//   PUT  → reemplaza el carrito con el body { items: [...] }
// Sólo para clientes logueados (role = customer/admin/editor).
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sanitizeItems(arr) {
  if (!Array.isArray(arr)) return []
  return arr
    .slice(0, 200)
    .map((x) => ({
      productId: String(x?.productId || '').slice(0, 30),
      name: String(x?.name || '').slice(0, 200).trim(),
      image: String(x?.image || '').slice(0, 500),
      variantLabel: String(x?.variantLabel || '').slice(0, 60),
      variantValue: String(x?.variantValue || '').slice(0, 60),
      qty: Math.max(1, Math.floor(Number(x?.qty) || 1)),
      price: Math.max(0, Number(x?.price) || 0),
      wholesalePrice:
        x?.wholesalePrice == null ? null : Number(x.wholesalePrice),
      wholesaleMinQty:
        x?.wholesaleMinQty == null ? null : Math.floor(Number(x.wholesaleMinQty)),
      categoryIds: Array.isArray(x?.categoryIds)
        ? x.categoryIds.slice(0, 5).map((c) => String(c).slice(0, 30))
        : [],
    }))
    .filter((x) => x.productId && x.name)
}

export async function GET() {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  await dbConnect()
  const user = await User.findById(session.sub).select('cart cartUpdatedAt').lean()
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  return NextResponse.json({
    items: user.cart || [],
    updatedAt: user.cartUpdatedAt || null,
  })
}

export async function PUT(request) {
  const session = await getCurrentUser()
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const items = sanitizeItems(body?.items)
  await dbConnect()
  await User.updateOne(
    { _id: session.sub },
    { $set: { cart: items, cartUpdatedAt: new Date() } }
  )
  return NextResponse.json({ ok: true, count: items.length })
}
