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
  const optionGroups = Array.isArray(product.optionGroups) ? product.optionGroups : []
  const isMultiDim = optionGroups.length >= 2

  // Pre-selección de variante:
  // 1) si viene ?color=X en la URL → esa variante,
  // 2) si no, la primera con stock (o la primera a secas).
  // Asegurarse de tener SIEMPRE una variante seleccionada evita que se mezclen
  // líneas distintas en el carrito por culpa de variantValue vacío.
  const initialVariant = useMemo(() => {
    if (!variants.length) return null
    if (initialColor) {
      const safe = initialColor.toLowerCase().trim()
      const fromUrl = variants.find((v) =>
        v.value?.toLowerCase().includes(safe) ||
        (v.optionValues?.Color || '').toLowerCase().includes(safe)
      )
      if (fromUrl) return fromUrl
    }
    // En modo multi-dimensional dejamos que el cliente elija (no preseleccionamos).
    if (isMultiDim) return null
    const firstWithStock = variants.find((v) => {
      const s = Number(v?.stock)
      return Number.isFinite(s) && s > 0
    })
    return firstWithStock || variants[0]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [selected, setSelected] = useState(initialVariant)
  const step = (Number.isFinite(Number(product.qtyStep)) && Number(product.qtyStep) > 1)
    ? Number(product.qtyStep) : 1
  const [qty, setQty] = useState(step)

  function selectVariant(v) {
    setSelected(v)
    setQty(step)
    if (!variants.length) return
    // Siempre usamos 'jump' para no reemplazar la galería combinada
    let detail
    if (!v) {
      // Seleccionar base: saltar a la primera imagen del producto
      const firstBase = product.image ||
        (Array.isArray(product.gallery) && product.gallery[0]) || null
      detail = firstBase
        ? { mode: 'jump', images: [firstBase] }
        : { mode: 'clear', images: null }
    } else {
      const first = (Array.isArray(v.images) && v.images[0]) || v.image || null
      detail = first
        ? { mode: 'jump', images: [first] }
        : { mode: 'clear', images: null }
    }
    window.dispatchEvent(new CustomEvent('cristasur:variant-image', { detail }))
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
      if (matched) {
        setSelected(matched)
        setQty(step)
      } else {
        // Imagen base → deseleccionar variante
        const baseImgs = [
          product.image,
          ...(Array.isArray(product.gallery) ? product.gallery : []),
        ].filter(Boolean)
        if (baseImgs.includes(url)) {
          setSelected(null)
          setQty(step)
        }
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
  const wholesaleActive =
    wholesalePrice !== null &&
    (isVip || (wholesaleMinQty !== null && qty >= wholesaleMinQty))
  const currentPrice = wholesaleActive ? wholesalePrice : basePrice

  // Stock efectivo: null = ilimitado, 0 = sin stock, >0 = cantidad.
  // Para variantes, null stock también significa ilimitado.
  const rawVariantStock = variants.length && selected ? selected.stock : undefined
  const stockUnlimited = variants.length
    ? (rawVariantStock === null || rawVariantStock === undefined)
    : product.stock === null
  const effectiveStock = variants.length
    ? (rawVariantStock ?? 0)
    : (product.stock ?? 0)
  const outOfStock = !stockUnlimited && effectiveStock === 0

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

      {/* Precio actualizado solo si la variante tiene precio distinto al base */}
      {selected && Number.isFinite(Number(selected.price)) && Number(selected.price) > 0 && Number(selected.price) !== Number(product.price) && (
        <div className="text-sm text-slate-500">
          Precio de la variante seleccionada:{' '}
          <b className="text-slate-900">{formatPrice(currentPrice)}</b>
        </div>
      )}

      {/* Banner de mayoreo */}
      {wholesalePrice !== null && wholesaleMinQty !== null && (
        <div
          className={
            'rounded-xl border p-3 text-sm flex items-start gap-3 ' +
            (wholesaleActive
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-amber-300 bg-amber-50 text-amber-800')
          }
        >
          <div className="text-xl leading-none">{wholesaleActive ? '🎉' : '💡'}</div>
          <div className="flex-1">
            {wholesaleActive ? (
              <>
                <b>¡Precio mayoreo activado!</b> Pagas{' '}
                <b>{formatPrice(wholesalePrice)}</b> por pieza ({qty} unidades).
                <span className="ml-1 font-semibold text-emerald-700">¡Ahorro incluido!</span>
              </>
            ) : (
              <>
                <b>Precio mayoreo disponible:</b> a partir de{' '}
                <b>{wholesaleMinQty} piezas</b> bajan a{' '}
                <b>{formatPrice(wholesalePrice)}</b> c/u.
                Te faltan <b>{wholesaleMinQty - qty}</b> para activarlo.
              </>
            )}
          </div>
        </div>
      )}

      {variants.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          {isMultiDim && (
            <p className="text-xs text-slate-500 mb-3">
              Elige todas las opciones para ver precio y disponibilidad exactos.
            </p>
          )}
          <VariantPicker
            variants={variants}
            selected={selected}
            onChange={selectVariant}
            optionGroups={optionGroups}
            baseColor={product.color || ''}
            onSelectBase={() => selectVariant(null)}
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
