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
import { soloStaff, soloAdmin } from '@/lib/permisos'
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import crypto from 'crypto'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { unitPriceFor, saleStep, snapToStep, toStock } from '@/lib/pricing'
import Coupon from '@/models/Coupon'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { verifyShippingQuote } from '@/lib/shipping-token'
import { publicProductFilter } from '@/lib/public-products'

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
    // 100 intentos por hora por IP: alcanza aunque varios clientes compartan
    // el internet de la tienda o de una oficina, y aun así corta abuso.
    const rl = rateLimit(`order:ip:${ip}`, 100, 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const items = Array.isArray(body?.items) ? body.items : []
    if (!items.length || items.length > 200) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    // La cantidad puede llegar como texto ("12") o con decimales desde el
    // navegador: se normaliza en vez de rechazar el pedido completo.
    for (const it of items) {
      const n = Math.floor(Number(it?.qty))
      if (it && typeof it === 'object') it.qty = Number.isFinite(n) ? Math.min(5000, Math.max(1, n)) : NaN
    }
    if (items.some((it) => !isValidObjectId(it?.productId) || !Number.isSafeInteger(it?.qty))) {
      return NextResponse.json({ error: 'Productos o cantidades inválidos' }, { status: 400 })
    }
    // Una sola línea por producto y variante: impide saltar el límite de stock.
    const keys = items.map((it) => `${it.productId}|${String(it.variantLabel || '').trim().toLowerCase()}|${String(it.variantValue || '').trim().toLowerCase()}`)
    if (new Set(keys).size !== keys.length) {
      return NextResponse.json({ error: 'Hay productos repetidos en el carrito' }, { status: 400 })
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
      ? await Product.find({ ...publicProductFilter(), _id: { $in: productIds } })
          // Hace falta todo esto para recalcular precio, múltiplo y stock
          // sin confiar en nada de lo que mande el navegador.
          // sku + variants: el SKU y la variante se toman de la base, no del carrito.
          .select('_id name sku price wholesalePrice wholesaleMinQty hundredPrice hundredMinQty qtyStep stock variants categories')
          .lean()
      : []
    const priceMap = {}
    for (const p of dbProducts) priceMap[String(p._id)] = p
    if (!dbProducts.length) {
      return NextResponse.json({ error: 'Estos productos ya no están disponibles. Actualiza tu carrito.' }, { status: 409 })
    }

    // ── Recálculo en el servidor ──────────────────────────────
    // Antes se aplicaba el precio de mayoreo según `wholesaleApplied`,
    // una bandera que manda el NAVEGADOR: bastaba con mandarla en true
    // para llevarse una pieza a precio de mayoreo. Ahora el nivel se
    // deduce de la cantidad, igual que en la ficha y en la tarjeta.
    const ajustes = []
    // Productos que se despublicaron mientras estaban en el carrito: se
    // quitan de ESTE pedido (con aviso) en vez de rechazarlo todo.
    for (const it of rawItems) {
      if (it.product && !priceMap[it.product]) ajustes.push(`${it.name || 'Un producto'}: ya no está disponible`)
    }

    const cleanItems = rawItems
      .map((it) => {
        const dbP = it.product ? priceMap[it.product] : null

        if (!dbP) return null

        // 0. Variante: se busca en la base. El SKU y la variante que manda el
        //    navegador no se guardan tal cual; se usan sólo para localizarla.
        //    Si el producto tiene variantes y no se encuentra la elegida, la
        //    línea se descarta (no se puede surtir "algún color").
        //    Si el producto NO tiene variantes, se ignora cualquier variante enviada.
        const dbVariants = Array.isArray(dbP.variants) ? dbP.variants : []
        let dbV = null
        let varPorConfirmar = false
        if (dbVariants.length) {
          const norm = (x) => String(x || '').trim().toLowerCase()
          const wantValue = norm(it.variantValue)
          const wantLabel = norm(it.variantLabel)
          dbV = wantValue
            ? dbVariants.find(
                (v) => norm(v.value) === wantValue && (!wantLabel || norm(v.label) === wantLabel)
              ) || null
            : null
          if (!dbV) {
            // Antes la línea se tiraba y, si era la única, el pedido fallaba
            // ("Carrito inválido"). Pasa cuando se agregó sin elegir color o
            // cuando la variante cambió de nombre en el panel. Ahora la línea
            // se queda con el precio del producto y la variante se confirma
            // por WhatsApp.
            const etiqueta = String(dbVariants[0]?.label || 'variante').toLowerCase()
            ajustes.push(`${dbP.name}: ${etiqueta} por confirmar`)
            varPorConfirmar = true
          }
        }

        // 1. Múltiplo de venta: si el producto va de 4 en 4, no se
        //    aceptan 5 piezas aunque el carrito las haya dejado pasar.
        const step = saleStep(dbP)
        let qty = snapToStep(it.qty, step)
        if (qty !== it.qty) {
          ajustes.push(`${dbP.name}: ${it.qty} → ${qty} (se vende de ${step} en ${step})`)
        }

        // 2. Stock: nunca se acepta más de lo que hay. Con variantes manda el
        //    stock de ESA variante (null = sin control, available:false = agotada).
        const disponibles = dbV
          ? (dbV.available === false ? 0 : toStock(dbV.stock))
          : varPorConfirmar ? null : toStock(dbP.stock)
        if (disponibles === 0) {
          ajustes.push(`${dbP.name}: sin existencias`)
          return null
        }
        if (disponibles != null && qty > disponibles) {
          // Mayor múltiplo de venta que cabe en las existencias.
          // Con 10 piezas y venta de 4 en 4, el tope real son 8.
          const tope = Math.floor(disponibles / step) * step
          if (tope < step) {
            ajustes.push(`${dbP.name}: quedan ${disponibles}, se vende de ${step} en ${step}`)
            return null
          }
          ajustes.push(`${dbP.name}: ${qty} → ${tope} (solo quedan ${disponibles})`)
          qty = tope
        }

        // 3. Precio del nivel que de verdad corresponde a esa cantidad.
        const unitPrice = unitPriceFor(dbP, qty)

        const { _clientPrice, ...rest } = it
        return {
          ...rest,
          // Identidad de la línea tomada de la base, no del navegador.
          name: String(dbP.name || it.name).slice(0, 200),
          sku: dbV?.sku || dbP.sku || '',
          variantLabel: dbV ? String(dbV.label || '') : varPorConfirmar ? String(it.variantLabel || dbVariants[0]?.label || 'Variante').slice(0, 60) : '',
          variantValue: dbV ? String(dbV.value || '') : varPorConfirmar ? `${String(it.variantValue || '').slice(0, 40) || 'sin elegir'} (por confirmar)` : '',
          qty,
          unitPrice: Math.max(0, unitPrice),
          wholesaleApplied: unitPrice < (Number(dbP.price) || 0),
        }
      })
      .filter(Boolean)
      .filter((x) => x.qty > 0 && x.unitPrice >= 0)

    if (!cleanItems.length) {
      return NextResponse.json({ error: ajustes.length ? `No se pudo armar el pedido: ${ajustes.join('; ')}` : 'Carrito inválido', ajustes }, { status: 400 })
    }
    const resolvedKeys = cleanItems.map((item) => `${item.product}|${item.variantLabel}|${item.variantValue}`)
    if (new Set(resolvedKeys).size !== resolvedKeys.length) {
      return NextResponse.json({ error: 'Hay variantes repetidas en el carrito' }, { status: 400 })
    }

    const subtotal = cleanItems.reduce((acc, x) => acc + x.unitPrice * x.qty, 0)

    // ── Cupón: se recalcula aquí, nunca se acepta el descuento del navegador ──
    let couponCode = String(body?.couponCode || '').trim().toUpperCase().slice(0, 30)
    let discount = 0
    let couponError = ''
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode })
      if (!coupon || !coupon.isUsable()) {
        couponError = 'El cupón ya no es válido'
      } else if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
        couponError = `El cupón pide un mínimo de $${Number(coupon.minSubtotal).toFixed(2)}`
      } else {
        let base = subtotal
        if (coupon.products?.length || coupon.categories?.length) {
          const prodSet = new Set((coupon.products || []).map(String))
          const catSet = new Set((coupon.categories || []).map(String))
          base = cleanItems.reduce((acc, x) => {
            const dbP = x.product ? priceMap[String(x.product)] : null
            const cats = (dbP?.categories || []).map(String)
            const aplica = (x.product && prodSet.has(String(x.product))) || cats.some((c) => catSet.has(c))
            return aplica ? acc + x.unitPrice * x.qty : acc
          }, 0)
        }
        discount = base > 0 ? Math.max(0, Math.min(coupon.computeDiscount(base), subtotal)) : 0
        if (!discount) couponError = 'El cupón no aplica a estos productos'
      }
      if (couponError) couponCode = ''
    }

    // Envío: solo se cobra una tarifa FIRMADA por el cotizador (nunca el
    // precio que mande el navegador). Pero el pedido ya no se bloquea:
    //  · Si la tienda ajustó cantidades (múltiplo de venta o existencias),
    //    la tarifa se valida contra lo que el cliente cotizó y se marca
    //    "por confirmar".
    //  · Si la tarifa venció o no es válida, el pedido sale igual con el
    //    envío "por confirmar" y costo 0; la tienda lo cotiza por WhatsApp.
    let shippingCost = 0
    let shippingLabel = ''
    if (body.shipping) {
      const token = typeof body.shipping.token === 'string' ? body.shipping.token : ''
      const pedidas = rawItems.map((x) => ({ product: x.product, qty: x.qty }))
      let quote = null
      let ajustado = false
      if (token) {
        try {
          quote = await verifyShippingQuote(token, cleanItems)
        } catch {
          try {
            quote = await verifyShippingQuote(token, pedidas)
            ajustado = true
          } catch {
            quote = null
          }
        }
      }
      if (quote) {
        shippingCost = quote.price
        shippingLabel = ajustado ? `${quote.label} (por confirmar: se ajustaron cantidades)` : quote.label
      } else {
        shippingLabel = 'Por confirmar'
        ajustes.push('El costo de envío se confirma por WhatsApp')
      }
    }
    const total = Math.max(0, subtotal - discount) + shippingCost

    const order = await Order.create({
      items: cleanItems,
      subtotal,
      discount,
      total,
      couponCode,
      shippingCost,
      shippingLabel,
      customerName: String(body?.customerName || '').slice(0, 80),
      customerPhone: String(body?.customerPhone || '').slice(0, 30),
      customerEmail: String(body?.customerEmail || '').slice(0, 120),
      notes: String(body?.notes || '').slice(0, 500),
      status: 'intent',
      source: 'whatsapp',
      cookieToken: String(body?.cookieToken || '').slice(0, 64),
      ipHash: hashIp(ip),
    })

    // El uso del cupón NO se cuenta aquí (un clic en WhatsApp no es una
    // venta): se cuenta una sola vez cuando el pedido se confirma.

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
      // Cambios que hizo el servidor al carrito (cantidades, stock, variante faltante).
      ajustes,
      // Lo que quedó guardado: el mensaje de WhatsApp se arma con esto,
      // así lo que ve la tienda y lo que se guardó son lo mismo.
      pedido: {
        items: cleanItems.map((x) => ({
          name: x.name, sku: x.sku, variantLabel: x.variantLabel, variantValue: x.variantValue,
          qty: x.qty, unitPrice: x.unitPrice, wholesaleApplied: x.wholesaleApplied,
        })),
        subtotal, discount, couponCode, couponError, shippingCost, shippingLabel, total,
      },
    })
  } catch (err) {
    console.error('POST /api/orders', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Lista de TODOS los pedidos: solo admin/editor.
    const bloqueo = await soloStaff()
    if (bloqueo) return bloqueo

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
