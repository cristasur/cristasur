'use client'
import { useEffect, useState } from 'react'
import { useCart, effectiveUnitPrice, isWholesaleActive } from './CartProvider'
import Icon from './Icon'

// Codifica los items del carrito a una URL compartible. La URL queda
// /carrito?items=<base64url(JSON)>. Comparte por WhatsApp / copiar.
function encodeItems(items) {
  const minimal = items.map((x) => ({
    productId: x.productId,
    name: x.name,
    image: x.image,
    variantLabel: x.variantLabel,
    variantValue: x.variantValue,
    qty: x.qty,
    price: x.price,
    wholesalePrice: x.wholesalePrice ?? null,
    wholesaleMinQty: x.wholesaleMinQty ?? null,
    categoryIds: x.categoryIds || [],
  }))
  const json = JSON.stringify({ items: minimal })
  if (typeof window === 'undefined') return ''
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function ShareCartButton({ items }) {
  const [copied, setCopied] = useState(false)
  if (!items?.length) return null

  function buildUrl() {
    const enc = encodeItems(items)
    const base =
      typeof window !== 'undefined'
        ? `${window.location.origin}/carrito`
        : '/carrito'
    return `${base}?items=${enc}`
  }

  async function copy() {
    const url = buildUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  function shareWa() {
    const url = buildUrl()
    const text = encodeURIComponent(`Mira este carrito de CRISTASUR: ${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={copy}
        className="flex-1 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold inline-flex items-center justify-center gap-2"
        title="Copiar link del carrito"
      >
        <Icon name="copy" className="w-4 h-4" />
        {copied ? '¡Copiado!' : 'Copiar link'}
      </button>
      <button
        onClick={shareWa}
        className="flex-1 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold inline-flex items-center justify-center gap-2"
        title="Compartir por WhatsApp"
      >
        <Icon name="share" className="w-4 h-4" />
        Compartir
      </button>
    </div>
  )
}

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

export default function CartDrawer() {
  const { items, subtotal, savings, open, setOpen, updateQty, removeItem, clear, checkoutViaWhatsApp } =
    useCart()
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [applying, setApplying] = useState(false)

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  // Reevaluar cupón cuando cambie el subtotal
  useEffect(() => {
    if (coupon?.code) {
      applyCoupon(coupon.code, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal])

  async function applyCoupon(code, silent) {
    if (!code) return
    setApplying(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotal,
          items: items.map((x) => ({
            productId: x.productId,
            categoryIds: x.categoryIds,
            qty: x.qty,
            price: x.price,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCoupon(null)
        if (!silent) setCouponError(data?.error || 'Cupón inválido')
        return
      }
      setCoupon(data)
    } finally {
      setApplying(false)
    }
  }

  const total = coupon ? coupon.total : subtotal

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />
      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[420px] max-w-full bg-white z-50 shadow-2xl transform transition-transform flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            Tu carrito {items.length > 0 && <span className="text-slate-400">({items.length})</span>}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Cerrar carrito"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Icon name="cart" className="w-12 h-12 mx-auto text-slate-300" />
              <p className="mt-3 text-sm">Tu carrito está vacío.</p>
            </div>
          )}
          {items.map((x) => (
            <div
              key={`${x.productId}-${x.variantValue || 'base'}`}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
            >
              <div className="w-16 h-16 rounded-lg bg-white overflow-hidden shrink-0 grid place-items-center text-slate-300">
                {x.image ? (
                  <img src={x.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="box" className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 line-clamp-2">{x.name}</div>
                {x.variantValue && (
                  <div className="text-xs text-slate-500">
                    {x.variantLabel || 'Variante'}: {x.variantValue}
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between">
                  <div className="inline-flex items-center border border-slate-200 rounded-lg">
                    <button
                      onClick={() => updateQty(x.productId, x.variantValue, x.qty - 1)}
                      className="w-7 h-7 grid place-items-center text-slate-600 hover:bg-slate-100"
                      aria-label="Quitar uno"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{x.qty}</span>
                    <button
                      onClick={() => updateQty(x.productId, x.variantValue, x.qty + 1)}
                      className="w-7 h-7 grid place-items-center text-slate-600 hover:bg-slate-100"
                      aria-label="Añadir uno"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {formatMXN(effectiveUnitPrice(x) * x.qty)}
                    </div>
                    {isWholesaleActive(x) && (
                      <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                        Mayoreo
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeItem(x.productId, x.variantValue)}
                className="w-8 h-8 grid place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 shrink-0"
                aria-label="Eliminar del carrito"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-slate-100 p-4 space-y-3">
            {/* Cupón */}
            <div>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Cupón de descuento"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:border-brand-500"
                />
                <button
                  onClick={() => applyCoupon(couponCode, false)}
                  disabled={applying || !couponCode}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-sm font-semibold disabled:opacity-60"
                >
                  {applying ? '…' : 'Aplicar'}
                </button>
              </div>
              {couponError && (
                <p className="text-xs text-rose-600 mt-1">{couponError}</p>
              )}
              {coupon?.code && (
                <div className="mt-2 flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <span>✓ {coupon.code} aplicado · -{formatMXN(coupon.discount)}</span>
                  <button
                    onClick={() => {
                      setCoupon(null)
                      setCouponCode('')
                    }}
                    className="text-emerald-900/70 hover:text-emerald-900"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatMXN(subtotal)}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                <span>Ahorro mayoreo</span>
                <span>−{formatMXN(savings)}</span>
              </div>
            )}
            {coupon && (
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Descuento</span>
                <span>−{formatMXN(coupon.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total</span>
              <span>{formatMXN(total)}</span>
            </div>
            <button
              onClick={() => checkoutViaWhatsApp(coupon)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center justify-center gap-2"
            >
              <Icon name="whatsapp" className="w-5 h-5" />
              Pedir por WhatsApp
            </button>
            <ShareCartButton items={items} />
            <button
              onClick={clear}
              className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold"
            >
              Vaciar carrito
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}
