'use client'
// Banner que aparece en home si el cliente tiene un "último pedido" guardado.
// Click → repone el carrito y abre el drawer.
import { useState } from 'react'
import { useCart } from './CartProvider'
import Icon from './Icon'

function relTime(iso) {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `hace ${days} días`
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
}

export default function RepeatOrder() {
  const { lastOrder, reorderFromSnapshot, dismissLastOrder } = useCart()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !lastOrder?.items?.length) return null

  const count = lastOrder.items.reduce((acc, x) => acc + (x.qty || 1), 0)

  function handleDismiss() {
    setDismissed(true)
    // Si el CartProvider expone una función para limpiar, úsala; si no, solo ocultamos visualmente.
    if (typeof dismissLastOrder === 'function') dismissLastOrder()
  }

  return (
    <section className="max-w-7xl mx-auto px-4">
      <div className="relative rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        {/* Botón cerrar */}
        <button
          onClick={handleDismiss}
          aria-label="Cerrar"
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-200/70 hover:bg-emerald-300 text-emerald-700 grid place-items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0">
            <Icon name="cart" className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-emerald-900">
              ¿Repetir tu último pedido?
            </div>
            <div className="text-sm text-emerald-800/80">
              {count} pieza{count === 1 ? '' : 's'} · {relTime(lastOrder.at)}
            </div>
          </div>
        </div>
        <button
          onClick={() => reorderFromSnapshot(lastOrder)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
        >
          Volver a pedir
          <Icon name="arrow" className="w-4 h-4" />
        </button>
      </div>
    </section>
  )
}
