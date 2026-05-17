// ============================================================
// POST /api/coupons/apply
// Body: { code, subtotal, items: [{ productId, categoryIds: [], qty, price }] }
// Devuelve: { ok, code, type, value, discount, total }
// Endpoint público (lo usa el carrito en el cliente).
// NO incrementa usageCount — eso lo hace la confirmación de
// pedido (por WhatsApp confirmado o en el futuro un endpoint
// de "orden creada"), para evitar que un simple preview gaste
// el cupón.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Coupon from '@/models/Coupon'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const code = String(body?.code || '').trim().toUpperCase()
    const subtotal = Number(body?.subtotal) || 0
    const items = Array.isArray(body?.items) ? body.items : []

    if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    if (!(subtotal > 0)) return NextResponse.json({ error: 'Subtotal inválido' }, { status: 400 })

    await dbConnect()
    const coupon = await Coupon.findOne({ code })
    if (!coupon) {
      return NextResponse.json({ error: 'Cupón no existe' }, { status: 404 })
    }
    if (!coupon.isUsable()) {
      return NextResponse.json({ error: 'Cupón expirado o inactivo' }, { status: 400 })
    }
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      return NextResponse.json(
        { error: `Subtotal mínimo $${coupon.minSubtotal.toFixed(2)} para aplicar este cupón` },
        { status: 400 }
      )
    }

    // Si el cupón está restringido a productos/categorías, calculamos sólo
    // sobre el subtotal de esos ítems
    let applicableSubtotal = subtotal
    const restricted = coupon.products?.length || coupon.categories?.length
    if (restricted) {
      const prodSet = new Set((coupon.products || []).map(String))
      const catSet = new Set((coupon.categories || []).map(String))
      applicableSubtotal = items.reduce((sum, it) => {
        const pid = String(it?.productId || '')
        const cats = Array.isArray(it?.categoryIds) ? it.categoryIds.map(String) : []
        const matches =
          (prodSet.size && prodSet.has(pid)) ||
          (catSet.size && cats.some((c) => catSet.has(c)))
        if (!matches) return sum
        const line = Number(it?.price || 0) * Number(it?.qty || 0)
        return sum + (Number.isFinite(line) ? line : 0)
      }, 0)
      if (applicableSubtotal <= 0) {
        return NextResponse.json(
          { error: 'Este cupón no aplica a los productos del carrito' },
          { status: 400 }
        )
      }
    }

    const discount = coupon.computeDiscount(applicableSubtotal)
    const total = Math.max(0, subtotal - discount)

    return NextResponse.json({
      ok: true,
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      discount,
      total,
      applicableSubtotal,
    })
  } catch (err) {
    console.error('POST /api/coupons/apply', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
