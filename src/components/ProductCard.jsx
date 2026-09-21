'use client'
// ============================================================
// Tarjeta de producto del catálogo.
//
// Muestra por adelantado lo que antes solo se veía entrando al
// producto: el formato de venta (qtyStep), los precios escalonados
// y el total real de la compra. Ese es el modelo de negocio de
// CRISTASUR, así que debe verse desde la cuadrícula.
//
// ── ALINEACIÓN ──────────────────────────────────────────────
// Todas las tarjetas deben verse parejas aunque un producto no
// tenga mayoreo, ni varias fotos, ni formato de caja. Para eso:
//
//   1. Cada zona tiene ALTURA RESERVADA fija (constantes ROW_*).
//      Si el dato no existe, el hueco se queda vacío pero ocupa
//      lo mismo, así las filas de abajo nunca se desplazan.
//   2. Las miniaturas van SUPERPUESTAS sobre la imagen, no debajo,
//      para que no empujen nada.
//   3. El desplegable de descuentos es un panel flotante, no
//      inline: al abrirlo la tarjeta no cambia de alto.
//
// Es client component por el selector de cantidad, las miniaturas
// y el desplegable de descuentos.
// ============================================================
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Icon from './Icon'
import AddToCartButton from './AddToCartButton'
import FavoriteButton from './FavoriteButton'
import {
  priceTiers, unitPriceFor, activeTier, maxTierDiscount,
  saleStep, snapToStep, formatMXN, formatMXNShort,
} from '@/lib/pricing'

// Alturas reservadas. Tocar aquí si cambian los tamaños de fuente.
const ROW_META  = 18  // estrellas + SKU
const ROW_LABEL = 15  // etiqueta "MAYOREO"
const ROW_TIERS = 34  // botón de descuento por cantidad

export default function ProductCard({ product, colorFilter }) {
  const step = saleStep(product)
  const tiers = useMemo(() => priceTiers(product), [product])
  const tierDiscount = useMemo(() => maxTierDiscount(product), [product])

  const [qty, setQty] = useState(step)
  const [imgIdx, setImgIdx] = useState(0)
  const [showTiers, setShowTiers] = useState(false)
  const [copied, setCopied] = useState(false)

  // Variante que coincide con el filtro de color activo, si lo hay.
  const matchedVariant = useMemo(() => {
    if (!colorFilter || !Array.isArray(product.variants) || !product.variants.length) return null
    const safe = colorFilter.toLowerCase().trim()
    return product.variants.find((v) => v.value?.toLowerCase().includes(safe)) || null
  }, [colorFilter, product.variants])

  const href = colorFilter && matchedVariant
    ? `/productos/${product._id}?color=${encodeURIComponent(colorFilter)}`
    : `/productos/${product._id}`

  const primaryImage = matchedVariant?.image || product.image
  const images = useMemo(() => [
    primaryImage,
    ...((matchedVariant?.images || []).filter((i) => i && i !== primaryImage)),
    ...((product.gallery || []).filter((g) => g && g !== primaryImage)),
  ].filter(Boolean), [primaryImage, matchedVariant, product.gallery])

  // stock null = sin control de inventario (disponible). Solo 0 es agotado.
  const outOfStock = product.stock === 0
  const hasDiscount = product.comparePrice && product.comparePrice > product.price
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const unit = unitPriceFor(product, qty)
  const tier = activeTier(product, qty)
  const total = unit * qty
  const isWholesale = tier.minQty > 1

  const safeIdx = Math.min(imgIdx, Math.max(0, images.length - 1))

  function bump(dir) {
    setQty((q) => snapToStep(Math.max(step, dir > 0 ? q + step : q - step), step))
  }

  function onQtyInput(e) {
    const raw = Number(e.target.value)
    if (!Number.isFinite(raw) || raw <= 0) return
    setQty(raw)
  }

  async function copySku() {
    try {
      await navigator.clipboard.writeText(product.sku)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Si el navegador bloquea el portapapeles no pasa nada: el SKU se ve.
    }
  }

  return (
    <article className="group relative bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-slate-100 flex flex-col transition-shadow">

      {/* ── Imagen ─────────────────────────────────────────── */}
      <div className="relative rounded-t-2xl overflow-hidden">
        <Link href={href} className="block">
          <div className="relative aspect-square bg-slate-50">
            {images.length > 0 ? (
              <img
                src={images[safeIdx]}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-slate-300">
                <Icon name="box" className="w-16 h-16" strokeWidth={1.5} />
              </div>
            )}

            {outOfStock && (
              <span className="absolute inset-0 bg-black/40 grid place-items-center">
                <span className="bg-white/95 text-slate-900 text-xs font-bold uppercase px-3 py-1 rounded-full">
                  Sin stock
                </span>
              </span>
            )}
          </div>
        </Link>

        {/* Distintivos */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1 pointer-events-none">
          {hasDiscount && (
            <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              -{discountPct}%
            </span>
          )}
          {product.featured && (
            <span className="bg-violet-600 text-white text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-md shadow-sm">
              Destacado
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <FavoriteButton productId={product._id} />
        </div>

        {/* Miniaturas superpuestas: no ocupan alto, así todas las
            tarjetas empiezan la info a la misma altura. */}
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-white via-white/85 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <div className="flex items-center justify-center gap-1.5">
              {images.slice(0, 5).map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`w-8 h-8 rounded-md overflow-hidden border-2 bg-white transition-colors ${
                    i === safeIdx ? 'border-brand-600' : 'border-white/80 hover:border-slate-300'
                  }`}
                >
                  <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Puntitos: señal permanente de que hay más fotos */}
        {images.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 group-hover:opacity-0 transition-opacity pointer-events-none">
            {images.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === safeIdx ? 'bg-brand-600' : 'bg-white ring-1 ring-slate-300'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Información ────────────────────────────────────── */}
      <div className="p-3.5 flex flex-col flex-1">

        {/* Nombre: siempre 2 líneas de alto */}
        <Link href={href} className="block">
          <h3 className="font-semibold text-slate-900 text-[13.5px] leading-snug line-clamp-2 h-[2.6em] hover:text-brand-700 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Estrellas + SKU — altura fija aunque falte alguno */}
        <div
          className="flex items-center justify-between gap-2 mt-1.5"
          style={{ height: ROW_META }}
        >
          {product.avgRating > 0 ? (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className={`w-3 h-3 ${s <= Math.round(product.avgRating) ? 'text-amber-400' : 'text-slate-200'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-[10.5px] text-slate-400 ml-1">({product.reviewCount})</span>
            </div>
          ) : <span />}

          {product.sku ? (
            <button
              type="button"
              onClick={copySku}
              title="Copiar SKU"
              className="flex items-center gap-1 text-[10.5px] text-slate-400 hover:text-brand-700 transition-colors shrink-0"
            >
              <span className="font-mono">{copied ? '¡Copiado!' : product.sku}</span>
              {!copied && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          ) : <span />}
        </div>

        {/* Etiqueta del nivel — reservada siempre */}
        <div
          className="mt-2 text-[11px] font-bold uppercase tracking-wide text-amber-700 leading-none"
          style={{ height: ROW_LABEL }}
        >
          {isWholesale ? tier.label : ''}
        </div>

        {/* Precio */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`text-[21px] font-black leading-none ${isWholesale ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatMXNShort(unit)}
          </span>
          <span className="text-[11px] text-slate-400">/ pieza</span>
          {isWholesale ? (
            <span className="text-[11.5px] text-slate-400 line-through">
              {formatMXNShort(tiers[0].price)}
            </span>
          ) : hasDiscount ? (
            <span className="text-[11.5px] text-slate-400 line-through">
              {formatMXNShort(product.comparePrice)}
            </span>
          ) : null}
        </div>

        {/* Descuento por cantidad — altura reservada aunque el
            producto no tenga niveles. El panel es flotante para
            que abrirlo no estire la tarjeta. */}
        <div className="relative mt-2" style={{ height: ROW_TIERS }}>
          {tiers.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setShowTiers((v) => !v)}
                aria-expanded={showTiers}
                className="w-full h-full flex items-center justify-between gap-2 px-2.5 rounded-lg border border-brand-200 bg-brand-50/60 hover:bg-brand-50 transition-colors"
              >
                <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-800 truncate">
                  <Icon name="tag" className="w-3 h-3 shrink-0" />
                  Descuento por cantidad
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {tierDiscount > 0 && (
                    <span className="text-[10px] font-bold text-white bg-brand-600 px-1.5 py-0.5 rounded">
                      -{tierDiscount}%
                    </span>
                  )}
                  <svg
                    width="11" height="11" viewBox="0 0 20 20" fill="currentColor"
                    className="text-brand-600"
                    style={{ transition: 'transform .2s', transform: showTiers ? 'rotate(180deg)' : 'none' }}
                  >
                    <path fillRule="evenodd" clipRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </span>
              </button>

              {showTiers && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-slate-200 bg-white shadow-card-hover overflow-hidden">
                  {tiers.map((t) => {
                    const isActive = t.minQty === tier.minQty
                    return (
                      <button
                        key={t.minQty}
                        type="button"
                        onClick={() => { setQty(snapToStep(t.minQty, step)); setShowTiers(false) }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11.5px] transition-colors ${
                          isActive ? 'bg-brand-50 text-brand-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{t.minQty === 1 ? 'Desde 1 pieza' : `Desde ${t.minQty} pzs`}</span>
                        <span className="font-bold">{formatMXNShort(t.price)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Tres filas siempre presentes: disponibilidad, formato y total */}
        <div className="mt-2.5 space-y-1 text-[11.5px]">
          <div className="flex items-center gap-1.5 h-[17px]">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${outOfStock ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className={outOfStock ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
              {outOfStock
                ? 'Sin stock'
                : product.stock > 0
                  ? `${product.stock} en stock`
                  : 'Disponible'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 h-[17px]">
            <Icon name="box" className="w-3 h-3 shrink-0" strokeWidth={2} />
            <span className="truncate">
              {step > 1
                ? <>Formato: <strong className="text-slate-700">{step} piezas</strong></>
                : <>Formato: <strong className="text-slate-700">por pieza</strong></>}
            </span>
          </div>

          <div className="text-slate-500 h-[17px] truncate">
            Total ({qty}) pz:{' '}
            <strong className="text-rose-600 text-[13px]">{formatMXN(total)}</strong>
          </div>
        </div>

        {/* Cantidad + carrito — pegado al fondo */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center justify-between sm:justify-start rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => bump(-1)}
              disabled={qty <= step}
              aria-label="Quitar"
              className="w-7 h-8 grid place-items-center text-slate-500 hover:text-slate-900 disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>
            </button>
            <input
              type="number"
              value={qty}
              onChange={onQtyInput}
              onBlur={() => setQty((q) => snapToStep(q, step))}
              aria-label="Cantidad"
              className="w-full sm:w-10 min-w-[2.5rem] text-center text-[12.5px] font-bold text-slate-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => bump(1)}
              aria-label="Agregar"
              className="w-7 h-8 grid place-items-center text-slate-500 hover:text-slate-900"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>

          <AddToCartButton
            product={product}
            qty={qty}
            compact
            disabled={outOfStock}
            className="flex-1 min-w-0"
            label={outOfStock ? 'Sin stock' : 'Agregar'}
          />
        </div>
      </div>
    </article>
  )
}
