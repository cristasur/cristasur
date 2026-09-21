// ============================================================
// POST /api/shipping/quote
//
// Recibe el carrito y un código postal, y devuelve las opciones de
// envío reales cotizadas con Envia.com.
//
// Por qué se recalcula todo en el servidor:
// el carrito vive en el navegador del cliente y ahí se puede
// manipular. Precios, pesos y medidas se vuelven a leer de la base
// de datos a partir de los IDs; del carrito solo se acepta la
// cantidad.
//
// Cuerpo esperado:
//   { postalCode: "97000", items: [{ productId, qty }] }
//
// Respuesta:
//   { ok, options[], totals, notice? }
//   { ok:false, reason, missing? }  cuando no se puede cotizar
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { planPackages } from '@/lib/packing'
import { quoteAllCarriers, enviaConfig, originIsComplete } from '@/lib/envia'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_LINES = 40
const MAX_QTY = 5000

// Cotizar cuesta llamadas a un proveedor externo: hay que frenar abuso.
const RL_MAX = 30
const RL_WINDOW_MS = 5 * 60 * 1000

// Caché en memoria: el mismo carrito al mismo CP da el mismo precio.
// Evita castigar la API cuando el cliente juega con el cotizador.
const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map()

function cacheGet(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key, value) {
  // Tope simple para que el proceso no crezca sin control.
  if (cache.size > 500) cache.clear()
  cache.set(key, { at: Date.now(), value })
}

export async function POST(request) {
  try {
    const ip = clientIp(request)
    const rl = rateLimit(`shipquote:${ip}`, RL_MAX, RL_WINDOW_MS)
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, reason: 'rate_limit', error: 'Demasiadas cotizaciones. Espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const cfg = enviaConfig()
    if (!cfg.configured) {
      return NextResponse.json(
        { ok: false, reason: 'not_configured', error: 'El cotizador de envíos aún no está configurado.' },
        { status: 503 }
      )
    }
    if (!originIsComplete()) {
      return NextResponse.json(
        { ok: false, reason: 'origin_incomplete', error: 'Falta configurar la dirección de origen.' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))

    // ── Código postal ──
    const postalCode = String(body?.postalCode || '').replace(/\D/g, '')
    if (postalCode.length !== 5) {
      return NextResponse.json(
        { ok: false, reason: 'bad_postal_code', error: 'Escribe un código postal de 5 dígitos.' },
        { status: 400 }
      )
    }

    // ── Líneas del carrito ──
    const rawItems = Array.isArray(body?.items) ? body.items.slice(0, MAX_LINES) : []
    const wanted = new Map()
    for (const it of rawItems) {
      const id = String(it?.productId || '')
      if (!mongoose.Types.ObjectId.isValid(id)) continue
      const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(it?.qty) || 1)))
      wanted.set(id, (wanted.get(id) || 0) + qty)
    }
    if (!wanted.size) {
      return NextResponse.json(
        { ok: false, reason: 'empty_cart', error: 'El carrito está vacío.' },
        { status: 400 }
      )
    }

    const cacheKey = `${postalCode}|${[...wanted.entries()].sort().map(([k, v]) => `${k}:${v}`).join(',')}`
    const cached = cacheGet(cacheKey)
    if (cached) return NextResponse.json(cached)

    // ── Datos reales desde la BD ──
    await dbConnect()
    const docs = await Product.find({ _id: { $in: [...wanted.keys()] } })
      .select('name sku price qtyStep weight length width height pkgWeight pkgLength pkgWidth pkgHeight')
      .lean()

    if (!docs.length) {
      return NextResponse.json(
        { ok: false, reason: 'not_found', error: 'No encontramos los productos del carrito.' },
        { status: 400 }
      )
    }

    const lines = docs.map((p) => ({ product: p, qty: wanted.get(String(p._id)) || 1 }))
    const declaredValue = lines.reduce(
      (sum, l) => sum + (Number(l.product.price) || 0) * l.qty,
      0
    )

    // ── Armar cajas ──
    const { packages, missing, totals, tooLarge } = planPackages(lines, { declaredValue })

    if (missing.length) {
      // Sin medidas no hay cotización honesta posible. Se dice claro
      // en vez de mostrar un precio inventado.
      return NextResponse.json({
        ok: false,
        reason: 'missing_dimensions',
        error: 'Algunos productos aún no tienen medidas de empaque capturadas.',
        missing,
      })
    }
    if (tooLarge) {
      // A partir de cierto tamaño ya es carga consolidada: la tarifa
      // de paquetería deja de tener sentido y conviene negociarla.
      return NextResponse.json({
        ok: false,
        reason: 'too_large',
        error: 'Tu pedido es grande y se cotiza como carga. Escríbenos y te damos la mejor tarifa.',
      })
    }
    if (!packages.length) {
      return NextResponse.json(
        { ok: false, reason: 'empty_cart', error: 'El carrito está vacío.' },
        { status: 400 }
      )
    }

    // ── Cotizar ──
    const destination = {
      name: 'Cliente',
      // Sin calle exacta algunas paqueterías (DHL) no cotizan. Como
      // en el carrito todavía no la pedimos, se manda un marcador y
      // se aceptan las que sí cotizan solo con CP.
      street: String(body?.street || 'Por confirmar'),
      city: String(body?.city || ''),
      state: String(body?.state || ''),
      country: 'MX',
      postalCode,
      phone: process.env.ENVIA_ORIGIN_PHONE || '',
    }

    const { rates, errors } = await quoteAllCarriers({ destination, packages })

    if (!rates.length) {
      return NextResponse.json({
        ok: false,
        reason: 'no_coverage',
        error: 'No encontramos servicio de paquetería para ese código postal.',
        // Útil para depurar desde los logs, inofensivo para el cliente.
        detail: errors,
      })
    }

    // Una opción por paquetería y servicio; la más barata primero.
    const seen = new Set()
    const options = rates
      .filter((r) => {
        const k = `${r.carrier}|${r.service}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      .slice(0, 8)

    const payload = {
      ok: true,
      postalCode,
      options,
      totals,
      test: !cfg.isProd,
      notice: cfg.isProd
        ? undefined
        : 'Cotización de prueba: los precios no son definitivos.',
    }

    cacheSet(cacheKey, payload)
    return NextResponse.json(payload)
  } catch (err) {
    console.error('POST /api/shipping/quote', err)
    return NextResponse.json(
      { ok: false, reason: 'server_error', error: 'No pudimos cotizar el envío en este momento.' },
      { status: 500 }
    )
  }
}
