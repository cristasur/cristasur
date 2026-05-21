'use client'
// Tabla de pedidos con dropdown de estado y filtros.
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['intent', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n || 0)
}

const STATUS_COLORS = {
  intent: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-emerald-200 text-emerald-900',
  cancelled: 'bg-rose-100 text-rose-700',
}

export default function OrdersClient({ initialOrders, initialStatus, isAdmin = false }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [status, setStatus] = useState(initialStatus)
  const [deleting, setDeleting] = useState(null)

  function setFilter(s) {
    setStatus(s)
    const url = s ? `/admin/pedidos?status=${s}` : '/admin/pedidos'
    router.push(url)
  }

  async function deleteOrder(id) {
    if (!confirm('¿Eliminar este pedido permanentemente? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setOrders((xs) => xs.filter((o) => o._id !== id))
    } else {
      const e = await res.json().catch(() => ({}))
      alert(e?.error || 'No se pudo eliminar el pedido')
    }
    setDeleting(null)
  }

  async function changeStatus(id, newStatus) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      alert(e?.error || 'No se pudo cambiar el estado')
      return
    }
    setOrders((xs) => xs.map((o) => (o._id === id ? { ...o, status: newStatus } : o)))
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Pedidos</h1>
      <p className="text-slate-500 text-sm mb-4">
        Cada vez que un cliente da clic en "Pedir por WhatsApp" en el carrito,
        registramos aquí lo que iba a pedir. Confirmá manualmente el estado
        cuando hables con él.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('')}
          className={
            'px-3 py-1.5 rounded-full text-sm font-semibold ' +
            (!status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
          }
        >
          Todos
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={
              'px-3 py-1.5 rounded-full text-sm font-semibold capitalize ' +
              (status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Estado</th>
              {isAdmin && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o._id} className="hover:bg-slate-50">
                <td className="p-3 text-xs text-slate-500">
                  {new Date(o.createdAt).toLocaleString('es-MX', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="p-3">
                  <div className="text-slate-700 line-clamp-2">
                    {(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')}
                  </div>
                  {o.couponCode && (
                    <div className="text-xs text-emerald-700 font-semibold mt-1">
                      Cupón: {o.couponCode}
                    </div>
                  )}
                </td>
                <td className="p-3 font-bold text-slate-900">{formatMXN(o.total)}</td>
                <td className="p-3 text-xs text-slate-600">
                  {o.customerName || '—'}<br />
                  {o.customerPhone && <span className="text-slate-400">{o.customerPhone}</span>}
                </td>
                <td className="p-3">
                  <select
                    value={o.status}
                    onChange={(e) => changeStatus(o._id, e.target.value)}
                    className={
                      'px-2 py-1 rounded-lg text-xs font-bold uppercase border ' +
                      (STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-700')
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                {isAdmin && (
                  <td className="p-3">
                    <button
                      onClick={() => deleteOrder(o._id)}
                      disabled={deleting === o._id}
                      className="text-rose-400 hover:text-rose-600 text-xs font-semibold disabled:opacity-40"
                      title="Eliminar pedido"
                    >
                      {deleting === o._id ? '…' : '🗑 Eliminar'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!orders.length && (
              <tr><td colSpan={5} className="p-10 text-center text-slate-500">
                Sin pedidos.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
