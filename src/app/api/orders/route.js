// ============================================================
// /api/orders
//   POST  → crea un Order en estado 'intent' cuando el cliente da
//           clic en "Pedir por WhatsApp". También incrementa el
//           contador coOrders de cada producto co-pedido (datos
//           para "también compraron").
//   GET   → lista pedidos (admin). Filtros: status, q, dateFrom, dateTo
// El POST es público (no require auth), igual que /api/reviews.
// El middleware /api/orders se whitelista en src/middleware.js.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import crypto from 'crypto'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || '')).digest('hex').slice(0, 16)
}

function isValidObjectId(s) {
  return typeof s === 'string' && /^[a-f0-9]{24}$/i.test(s)
}

export async function POST(request) {
  try {
    const ip = clientIp(request)
    // 30 intents por hora por IP, suficiente para uso normal y corta abuso.
    const rl = rateLimit(`order:ip:${ip}`, 30, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const items = Array.isArray(body?.items) ? body.items : []
    if (!items.length) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    // Validar items básico
    const rawItems = items
      .map((it) => ({
        product: isValidObjectId(it?.productId) ? it.productId : undefined,
        name: String(it?.name || '').slice(0, 200).trim(),
        sku: String(it?.sku || '').slice(0, 60).trim(),
        image: String(it?.image || '').slice(0, 500),
        variantLabel: String(it?.variantLabel || '').slice(0, 60),
        variantValue: String(it?.variantValue || '').slice(0, 60),
        qty: Math.max(1, Math.floor(Number(it?.qty) || 1)),
        wholesaleApplied: Boolean(it?.wholesaleApplied),
        // Precio del cliente solo como fallback para productos sin ID (ítems customizados)
        _clientPrice: Math.max(0, Number(it?.unitPrice ?? it?.price) || 0),
      }))
      .filter((x) => x.name)
      .slice(0, 200)

    if (!rawItems.length) {
      return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 })
    }

    await dbConnect()

    // Obtener precios reales de la DB para todos los productos con ID
    const productIds = [...new Set(rawItems.map((x) => x.product).filter(Boolean))]
    const dbProducts = productIds.length
      ? await Product.find({ _id: { $in: productIds } })
          .select('_id price wholesalePrice')
          .lean()
      : []
    const priceMap = {}
    for (const p of dbProducts) priceMap[String(p._id)] = p

    // Asignar precios desde DB (si hay ID) o del cliente (ítems sin producto)
    const cleanItems = rawItems
      .map((it) => {
        let unitPrice = it._clientPrice
        if (it.product && priceMap[it.product]) {
          const dbP = priceMap[it.product]
          // Usar precio mayoreo si aplica y es menor (más barato), sino precio normal
          unitPrice = it.wholesaleApplied && dbP.wholesalePrice > 0
            ? dbP.wholesalePrice
            : dbP.price
        }
        const { _clientPrice, ...rest } = it
        return { ...rest, unitPrice: Math.max(0, unitPrice) }
      })
      .filter((x) => x.unitPrice >= 0)

    if (!cleanItems.length) {
      return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 })
    }

    const subtotal = cleanItems.reduce((acc, x) => acc + x.unitPrice * x.qty, 0)
    const discount = Math.max(0, Number(body?.discount) || 0)
    const total = Math.max(0, subtotal - discount)

    const order = await Order.create({
      items: cleanItems,
      subtotal,
      discount,
      total,
      couponCode: String(body?.couponCode || '').toUpperCase().slice(0, 30),
      customerName: String(body?.customerName || '').slice(0, 80),
      customerPhone: String(body?.customerPhone || '').slice(0, 30),
      customerEmail: String(body?.customerEmail || '').slice(0, 120),
      notes: String(body?.notes || '').slice(0, 500),
      status: 'intent',
      source: 'whatsapp',
      cookieToken: String(body?.cookieToken || '').slice(0, 64),
      ipHash: hashIp(ip),
    })

    // Incrementar coOrders entre cada par de productos (para "también compraron").
    // Sólo cuando hay 2+ productos distintos en el carrito.
    try {
      const productIds = Array.from(
        new Set(cleanItems.map((x) => x.product).filter(Boolean))
      )
      if (productIds.length >= 2) {
        const ops = []
        for (let i = 0; i < productIds.length; i++) {
          for (let j = 0; j < productIds.length; j++) {
            if (i === j) continue
            const a = productIds[i]
            const b = productIds[j]
            ops.push({
              updateOne: {
                filter: { _id: a },
                update: { $inc: { [`coOrders.${b}`]: 1 } },
              },
            })
          }
        }
        if (ops.length) await Product.bulkWrite(ops, { ordered: false })
      }
    } catch (e) {
      console.warn('coOrders update failed', e?.message)
    }

    return NextResponse.json({
      ok: true,
      orderId: order._id,
      cookieToken: order.cookieToken,
    })
  } catch (err) {
    console.error('POST /api/orders', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    await dbConnect()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || ''
    const q = url.searchParams.get('q') || ''
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50))

    const filter = {}
    if (status) filter.status = status
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { customerName: { $regex: safe, $options: 'i' } },
        { customerPhone: { $regex: safe, $options: 'i' } },
        { 'items.name': { $regex: safe, $options: 'i' } },
      ]
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Order.countDocuments(filter),
    ])
    return NextResponse.json({ orders, total })
  } catch (err) {
    console.error('GET /api/orders', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
