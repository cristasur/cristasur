'use client'
// ============================================================
// Cotizador de envío dentro del carrito.
//
// El cliente escribe su código postal y ve el costo real antes de
// escribir por WhatsApp. Hoy esa pregunta —"¿cuánto sale el
// envío?"— se contesta a mano una por una.
//
// La opción que elija se le pasa al carrito para que viaje en el
// mensaje de WhatsApp y el pedido llegue ya con el envío incluido.
//
// Si algo falla (sin cobertura, sin medidas capturadas, la API
// caída) NO se inventa un precio: se dice qué pasó y se invita a
// cotizar por WhatsApp. Un número inventado cuesta dinero real.
// ============================================================
import { useState } from 'react'

function money(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
  }).format(Number(n) || 0)
}

export default function ShippingQuote({ items = [], onSelect, selected }) {
  const [cp, setCp] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const canQuote = cp.replace(/\D/g, '').length === 5 && items.length > 0

  async function quote(e) {
    e?.preventDefault?.()
    if (!canQuote || loading) return

    setLoading(true)
    setError('')
    setResult(null)
    onSelect?.(null)

    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: cp.replace(/\D/g, ''),
          items: items.map((x) => ({ productId: x.productId, qty: x.qty })),
        }),
      })
      const data = await res.json()

      if (!data?.ok) {
        setError(data?.error || 'No pudimos cotizar el envío.')
        setResult({ failed: true, reason: data?.reason, missing: data?.missing })
        return
      }
      setResult(data)
    } catch {
      setError('No pudimos conectar con el cotizador.')
      setResult({ failed: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <path d="M16 8h4l3 3v5h-7V8Z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <span className="text-[13px] font-bold text-slate-800">Calcular envío</span>
      </div>

      <form onSubmit={quote} className="flex gap-2">
        <input
          value={cp}
          onChange={(e) => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))}
          inputMode="numeric"
          placeholder="Código postal"
          aria-label="Código postal de entrega"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canQuote || loading}
          className="shrink-0 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-[13px] font-bold transition-colors"
        >
          {loading ? 'Calculando…' : 'Calcular'}
        </button>
      </form>

      {/* ── Error o motivo por el que no se pudo cotizar ── */}
      {error && (
        <div className="mt-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-[12.5px] text-amber-900">{error}</p>
          {result?.missing?.length > 0 && (
            <p className="text-[11.5px] text-amber-800/80 mt-1">
              {result.missing.map((m) => m.name).join(', ')}
            </p>
          )}
          <p className="text-[11.5px] text-amber-800/80 mt-1">
            Mándanos tu pedido por WhatsApp y te cotizamos el envío al momento.
          </p>
        </div>
      )}

      {/* ── Opciones ── */}
      {result?.ok && result.options?.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {result.notice && (
            <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
              {result.notice}
            </p>
          )}

          {result.options.map((opt) => {
            const id = `${opt.carrier}|${opt.service}`
            const isActive = selected && `${selected.carrier}|${selected.service}` === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect?.(isActive ? null : opt)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                  isActive
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold text-slate-800 capitalize truncate">
                    {opt.carrier} · {opt.serviceName || opt.service}
                  </span>
                  {opt.deliveryEstimate && (
                    <span className="block text-[11px] text-slate-500">{opt.deliveryEstimate}</span>
                  )}
                </span>
                <span className={`text-[13.5px] font-black shrink-0 ${isActive ? 'text-brand-700' : 'text-slate-900'}`}>
                  {money(opt.price)}
                </span>
              </button>
            )
          })}

          {result.totals && (
            <p className="text-[11px] text-slate-400 pt-1">
              {result.totals.packages} {result.totals.packages === 1 ? 'caja' : 'cajas'} ·{' '}
              {result.totals.billableWeight} kg a cobrar
              {result.totals.billableWeight > result.totals.realWeight && ' (por volumen)'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
