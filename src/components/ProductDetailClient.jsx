'use client'
// ============================================================
// Wrapper cliente para la ficha de producto.
// Se encarga de:
// - Seleccionar variante (si el producto tiene).
// - Selector de cantidad.
// - Añadir al carrito (respeta stock y variante).
// - Botón WhatsApp (incrementa whatsappClicks vía PATCH).
// - trackView al montar + PATCH ?action=view para viewsCount.
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { priceTiers, unitPriceFor, activeTier, nextTierTarget, snapToStep, formatMXN, formatMXNShort } from '@/lib/pricing'
import Icon from './Icon'
import VariantPicker from './VariantPicker'
import AddToCartButton from './AddToCartButton'
import ShareButtons from './ShareButtons'
import { trackView } from './RecentlyViewed'

const WHATSAPP_PHONE = '529994731919'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

export default function ProductDetailClient({ product, productUrl, isVip = false, initialColor = '' }) {
  const variants = Array.isArray(product.variants) ? product.variants : []

  // Pre-selección de variante (modelo simétrico).
  // Si el producto tiene variantes, SIEMPRE hay una seleccionada — el producto
  // padre ya no representa una opción vendible, así que no existe el estado
  // "ninguna seleccionada".
  //   1) ?color=X en la URL (viene del filtro de catálogo) → esa variante
  //   2) si no, la primera disponible
  //   3) si ninguna está disponible, la primera de la lista
  const initialVariant = useMemo(() => {
    if (!variants.length) return null
    if (initialColor) {
      const safe = initialColor.toLowerCase().trim()
      const fromUrl = variants.find((v) => v.value?.toLowerCase().includes(safe))
      if (fromUrl) return fromUrl
    }
    const firstAvailable = variants.find((v) => {
      if (v?.available === false) return false
      const s = Number(v?.stock)
      // stock null/undefined = sin control de inventario → disponible
      return !Number.isFinite(s) || s > 0
    })
    return firstAvailable || variants[0]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [selected, setSelected] = useState(initialVariant)
  const step = (Number.isFinite(Number(product.qtyStep)) && Number(product.qtyStep) > 1)
    ? Number(product.qtyStep) : 1
  const [qty, setQty] = useState(step)

  function selectVariant(v) {
    if (!v) return // modelo simétrico: nunca se deselecciona
    setSelected(v)
    setQty(step)
    if (!variants.length) return
    // 'jump' para saltar a la foto de la variante sin reemplazar la galería combinada
    const first = (Array.isArray(v.images) && v.images[0]) || v.image || null
    window.dispatchEvent(new CustomEvent('cristasur:variant-image', {
      detail: first
        ? { mode: 'jump', images: [first] }
        : { mode: 'clear', images: null },
    }))
  }

  // Al montar: si hay variantes con imágenes, construir la galería combinada
  // (imágenes base + imágenes de todas las variantes) y enviarla a ProductGallery.
  useEffect(() => {
    if (!variants.length) return
    const baseImages = [
      product.image,
      ...(Array.isArray(product.gallery) ? product.gallery : []),
    ].filter(Boolean)
    const variantImgs = variants.flatMap((v) =>
      Array.isArray(v.images) && v.images.length > 0
        ? v.images
        : v.image ? [v.image] : []
    )
    if (!variantImgs.length) return
    // Deduplicar manteniendo el orden
    const seen = new Set()
    const all = [...baseImages, ...variantImgs].filter((u) => {
      if (seen.has(u)) return false
      seen.add(u)
      return true
    })
    window.dispatchEvent(new CustomEvent('cristasur:variant-image', {
      detail: { mode: 'all', images: all },
    }))

    // Si hay una variante pre-seleccionada (viene de ?color=X en la URL),
    // saltar a su imagen después de que la galería combinada esté lista.
    if (initialVariant) {
      const vImg = (Array.isArray(initialVariant.images) && initialVariant.images[0]) || initialVariant.image || null
      if (vImg) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('cristasur:variant-image', {
            detail: { mode: 'jump', images: [vImg] },
          }))
        }, 100)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Escuchar clics en miniaturas de la galería para seleccionar la variante correspondiente
  useEffect(() => {
    function onGalleryThumbClick(e) {
      const { url } = e.detail ?? {}
      if (!url || !variants.length) return
      // ¿Coincide con alguna variante?
      const matched = variants.find((v) => {
        const imgs = Array.isArray(v.images) && v.images.length > 0
          ? v.images
          : v.image ? [v.image] : []
        return imgs.includes(url)
      })
      // Sólo cambiamos de variante si la miniatura pertenece a una.
      // Las imágenes generales del producto no deseleccionan nada.
      if (matched) {
        setSelected(matched)
        setQty(step)
      }
    }
    window.addEventListener('cristasur:gallery-thumb-click', onGalleryThumbClick)
    return () => window.removeEventListener('cristasur:gallery-thumb-click', onGalleryThumbClick)
  }, [variants, product.image, product.gallery, step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Precio base, precio mayoreo y cantidad mínima de mayoreo: SIEMPRE del producto padre.
  // Las variantes (color/talla) solo cambian su valor identificador, no su precio.
  // Esto evita que el cliente vea "a partir de 6 piezas" en Azul y "a partir de 2"
  // en Rojo del mismo producto.
  const basePrice = useMemo(
    () => Number(product.price) || 0,
    [product.price]
  )
  const wholesalePrice = useMemo(() => {
    const pp = product.wholesalePrice
    return Number.isFinite(Number(pp)) && Number(pp) > 0 ? Number(pp) : null
  }, [product.wholesalePrice])
  const wholesaleMinQty = useMemo(() => {
    const pq = product.wholesaleMinQty
    return Number.isFinite(Number(pq)) && Number(pq) >= 2 ? Number(pq) : null
  }, [product.wholesaleMinQty])
  // VIP: mayoreo activo siempre sin importar la cantidad pedida
  // Escalera completa de precios (menudeo / mayoreo / por ciento).
  // Viene de @/lib/pricing para que la tarjeta del catálogo, esta ficha
  // y el carrito muestren y cobren exactamente lo mismo.
  const tiers = useMemo(() => priceTiers(product), [product])
  const tier = useMemo(() => activeTier(product, qty), [product, qty])

  // VIP: el mayoreo se le aplica sin importar la cantidad que pida.
  const vipPrice = isVip && wholesalePrice !== null ? wholesalePrice : null
  const tierPrice = unitPriceFor(product, qty)
  const currentPrice = vipPrice !== null ? Math.min(vipPrice, tierPrice) : tierPrice
  const wholesaleActive = currentPrice < basePrice

  // Stock efectivo: null = ilimitado, 0 = sin stock, >0 = cantidad.
  // Para variantes, null stock también significa ilimitado.
  const rawVariantStock = variants.length && selected ? selected.stock : undefined
  const stockUnlimited = variants.length
    ? (rawVariantStock === null || rawVariantStock === undefined)
    : product.stock === null
  const effectiveStock = variants.length
    ? (rawVariantStock ?? 0)
    : (product.stock ?? 0)
  // La variante puede marcarse como no disponible aunque no se lleve conteo.
  const variantUnavailable = variants.length > 0 && selected?.available === false
  const outOfStock = variantUnavailable || (!stockUnlimited && effectiveStock === 0)

  // Tracking: view count + lista "vistos recientemente"
  useEffect(() => {
    if (!product?._id) return
    trackView(product._id)
    // Fire & forget. No bloquea la UI.
    fetch(`/api/products/${product._id}?action=view`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})
  }, [product?._id])

  // Mensaje de WhatsApp con variante + cantidad + subtotal.
  const subtotal = currentPrice * qty
  // SKU normalizado: tolera espacios, valores nulos y números (a veces el CSV
  // los importa como Number en lugar de String).
  const skuStr = String(product.sku ?? '').trim()
  const waLines = [
    'Hola CRISTASUR, me interesa este producto:',
    '',
    `*Producto:* ${product.name}`,
  ]
  if (skuStr) waLines.push(`*SKU:* ${skuStr}`)
  if (selected?.label && selected?.value) {
    waLines.push(`*${selected.label}:* ${selected.value}`)
  }
  waLines.push(
    `*Cantidad:* ${qty}`,
    `*Precio unitario:* ${formatPrice(currentPrice)}${wholesaleActive ? ' (mayoreo)' : ''}`,
    `*Subtotal estimado:* ${formatPrice(subtotal)}`
  )
  if (productUrl) {
    waLines.push('')
    waLines.push(`Ver producto: ${productUrl}`)
  }
  const waHref = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
    waLines.join('\n')
  )}`

  function onWhatsAppClick() {
    // Trackea el click en el producto (contador)
    fetch(`/api/products/${product._id}?action=whatsapp`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})

    // Notifica a los admins por correo (fire & forget)
    fetch('/api/notify/whatsapp-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: product.name,
        productId: product._id,
        sku: product.sku || null,
        price: formatPrice(currentPrice),
        qty,
        variant: selected ? `${selected.label}: ${selected.value}` : null,
        productUrl,
      }),
    }).catch(() => {})
  }

  const dec = () => setQty((q) => Math.max(step, q - step))
  const inc = () =>
    setQty((q) => (effectiveStock > 0 ? Math.min(effectiveStock, q + step) : q + step))
  const onInput = (e) => {
    const v = parseInt(e.target.value, 10)
    if (!Number.isFinite(v) || v < step) return setQty(step)
    // Redondear al múltiplo más cercano
    const rounded = Math.round(v / step) * step
    setQty(effectiveStock > 0 ? Math.min(effectiveStock, rounded) : rounded)
  }

  return (
    <div className="mt-4 md:mt-6 space-y-4 md:space-y-5 w-full min-w-0">
      {/* Badge VIP */}
      {isVip && wholesalePrice !== null && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 text-sm font-semibold px-3 py-1.5 rounded-full w-fit max-w-full flex-wrap">
          <span>⭐</span>
          <span>Precio VIP activo — mayoreo aplicado automáticamente</span>
        </div>
      )}

      {/* Tabla de precios por volumen — la fila activa se resalta según
          la cantidad que el cliente tenga puesta. */}
      {tiers.length > 1 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
              Precio por volumen
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-50 text-brand-900">
                <th className="text-left font-semibold px-4 py-2">Unidades</th>
                <th className="text-left font-semibold px-4 py-2">Precio por pieza</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t, i) => {
                const next = tiers[i + 1]
                const range = next
                  ? `${t.minQty}\u2013${next.minQty - 1}`
                  : `${t.minQty}+`
                const off = tiers[0].price > 0 && t.price < tiers[0].price
                  ? Math.round(((tiers[0].price - t.price) / tiers[0].price) * 100)
                  : 0
                const isActive = t.minQty === tier.minQty
                return (
                  <tr
                    key={t.minQty}
                    className={`border-t border-slate-100 ${isActive ? 'bg-emerald-50' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-slate-700">
                      {range}
                      {isActive && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Tu precio
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 font-semibold ${off ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatMXNShort(t.price)} MXN
                      {off > 0 && <span className="ml-1.5 font-bold">(-{off}%)</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Sugerencia para alcanzar el siguiente nivel. La cantidad que
              se propone respeta el múltiplo de venta: si se vende de 4
              en 4 y el mayoreo empieza en 6, se sube a 8, no a 6. */}
          {(() => {
            const objetivo = nextTierTarget(product, qty)
            if (!objetivo) return null
            return (
              <button
                type="button"
                onClick={() => setQty(objetivo.qty)}
                className="w-full px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-[13px] text-amber-900 text-left hover:bg-amber-100 transition-colors"
              >
                Te {objetivo.faltan === 1 ? 'falta' : 'faltan'}{' '}
                <b>{objetivo.faltan}</b> {objetivo.faltan === 1 ? 'pieza' : 'piezas'} para bajar a{' '}
                <b>{formatMXNShort(objetivo.price)}</b> c/u.{' '}
                <span className="font-bold underline">Subir a {objetivo.qty}</span>
              </button>
            )
          })()}
        </div>
      )}

      {isVip && wholesalePrice !== null && (
        <div className="rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm text-violet-800">
          <b>Precio VIP activo.</b> Pagas {formatMXNShort(wholesalePrice)} por pieza sin mínimo.
        </div>
      )}

      {/* Resumen: total y formato de venta */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Total</div>
          <div className="text-xl font-black text-brand-800 mt-0.5">
            {formatMXN(currentPrice * qty)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {qty} pz × {formatMXNShort(currentPrice)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Formato</div>
          <div className="text-xl font-black text-slate-800 mt-0.5">
            {step > 1 ? `${step} pz` : '1 pz'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {step > 1 ? `Se vende de ${step} en ${step}` : 'Venta por pieza'}
          </div>
        </div>
      </div>

      {variants.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <VariantPicker
            variants={variants}
            selected={selected}
            onChange={selectVariant}
          />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5 w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              Cantidad
            </div>
            {step > 1 && (
              <div className="mt-1 text-xs text-brand-700 font-semibold">
                Se vende en paquetes de {step} piezas
              </div>
            )}
            <div className="mt-2 inline-flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden">
              <button
                type="button"
                onClick={dec}
                aria-label="Disminuir cantidad"
                className="w-10 h-10 grid place-items-center text-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                disabled={qty <= step}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={onInput}
                className="w-16 text-center text-base font-semibold text-slate-900 border-x border-slate-200 py-2 focus:outline-none"
              />
              <button
                type="button"
                onClick={inc}
                aria-label="Aumentar cantidad"
                className="w-10 h-10 grid place-items-center text-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                disabled={effectiveStock > 0 && qty >= effectiveStock}
              >
                +
              </button>
            </div>
            {variants.length > 0 && selected && (
              <div className="mt-2 text-[11px] text-slate-500">
                {stockUnlimited
                  ? 'Disponible'
                  : effectiveStock > 0
                    ? `${effectiveStock} disponibles`
                    : 'Sin stock en esta variante'}
              </div>
            )}
          </div>

          <div className="text-right min-w-0 shrink-0">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              Subtotal
            </div>
            <div className="mt-1 text-xl md:text-2xl font-black text-slate-900">
              {formatPrice(subtotal)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AddToCartButton
            product={product}
            variant={selected}
            qty={qty}
            disabled={outOfStock}
            label={outOfStock ? 'Sin stock' : 'Añadir al carrito'}
            className="w-full"
          />

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsAppClick}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
          >
            <Icon name="whatsapp" className="w-5 h-5" />
            Pedir por WhatsApp
          </a>
        </div>

        <p className="mt-2 text-[11px] text-slate-500 text-center">
          Te responderemos con disponibilidad, envío y forma de pago.
        </p>
      </div>

      <ShareButtons
        title={product.name}
        text={`Mira este producto en CRISTASUR`}
        productImage={product.image || null}
        price={formatPrice(currentPrice)}
      />
    </div>
  )
}
