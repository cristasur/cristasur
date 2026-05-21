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

export default function ProductDetailClient({ product, productUrl, isVip = false }) {
  const variants = Array.isArray(product.variants) ? product.variants : []
  // Pre-selecciona la primera variante con stock, si hay variantes.
  const initialVariant = useMemo(() => {
    if (!variants.length) return null
    return variants.find((v) => (v.stock ?? 0) > 0) || variants[0]
  }, [variants])

  const [selected, setSelected] = useState(initialVariant)
  const step = (Number.isFinite(Number(product.qtyStep)) && Number(product.qtyStep) > 1)
    ? Number(product.qtyStep) : 1
  const [qty, setQty] = useState(step)

  // Precio base (variante > producto)
  const basePrice = useMemo(() => {
    if (selected && Number.isFinite(Number(selected.price))) return Number(selected.price)
    return Number(product.price) || 0
  }, [selected, product.price])

  // Mayoreo aplica sólo cuando NO hay variante seleccionada (variantes tienen
  // sus propios precios y no se mezclan con el mayoreo del producto padre).
  const wholesalePrice =
    !selected && Number.isFinite(Number(product.wholesalePrice)) && Number(product.wholesalePrice) > 0
      ? Number(product.wholesalePrice)
      : null
  const wholesaleMinQty =
    !selected && Number.isFinite(Number(product.wholesaleMinQty)) && Number(product.wholesaleMinQty) >= 2
      ? Number(product.wholesaleMinQty)
      : null
  // VIP: mayoreo activo siempre sin importar la cantidad pedida
  const wholesaleActive =
    wholesalePrice !== null &&
    (isVip || (wholesaleMinQty !== null && qty >= wholesaleMinQty))
  const currentPrice = wholesaleActive ? wholesalePrice : basePrice

  // Stock efectivo: si hay variantes, usamos la seleccionada; si no, el del producto.
  // null = ilimitado → nunca sin stock. 0 = sin stock. >0 = con cantidad.
  const stockUnlimited = !variants.length && product.stock === null
  const effectiveStock = variants.length
    ? selected?.stock ?? 0
    : product.stock ?? 0
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
  const waLines = [
    'Hola CRISTASUR, me interesa este producto:',
    '',
    `*Producto:* ${product.name}`,
  ]
  if (product.sku) waLines.push(`*SKU:* ${product.sku}`)
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
    <div className="mt-6 space-y-5">
      {/* Badge VIP */}
      {isVip && wholesalePrice !== null && (
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 text-sm font-semibold px-3 py-1.5 rounded-full">
          ⭐ Precio VIP activo — mayoreo aplicado automáticamente
        </div>
      )}

      {/* Precio actualizado si hay variante con precio distinto */}
      {selected && Number.isFinite(Number(selected.price)) && (
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
                Ahorro: <b>{formatPrice((basePrice - wholesalePrice) * qty)}</b>.
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
          <VariantPicker
            variants={variants}
            selected={selected}
            onChange={(v) => {
              setSelected(v)
              setQty(1)
            }}
          />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
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
                className="w-16 text-center font-semibold text-slate-900 border-x border-slate-200 py-2 focus:outline-none"
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
                {effectiveStock > 0
                  ? `${effectiveStock} disponibles`
                  : 'Sin stock en esta variante'}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              Subtotal
            </div>
            <div className="mt-1 text-2xl font-black text-slate-900">
              {formatPrice(subtotal)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
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
