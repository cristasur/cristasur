'use client'
// Banner que aparece en home si el cliente tiene un "último pedido" guardado.
// Click → repone el carrito y abre el drawer.
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
  const { lastOrder, reorderFromSnapshot } = useCart()
  if (!lastOrder?.items?.length) return null

  const count = lastOrder.items.reduce((acc, x) => acc + (x.qty || 1), 0)

  return (
    <section className="max-w-7xl mx-auto px-4">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
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
