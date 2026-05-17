'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Icon from '@/components/Icon'

function Stars({ n }) {
  return (
    <div className="inline-flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="star"
          className={'w-4 h-4 ' + (i < n ? 'text-amber-400' : 'text-slate-200')}
        />
      ))}
    </div>
  )
}

function statusBadge(s) {
  const map = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-rose-50 text-rose-700',
  }
  const label = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }[s] || s
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[s] || 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  )
}

export default function ReviewRow({ review }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function moderate(action) {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${review._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Error al moderar')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function onDelete() {
    if (!confirm('¿Eliminar esta reseña definitivamente?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${review._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Error al eliminar')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const p = review.productDoc
  const date = new Date(review.createdAt).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 grid place-items-center text-slate-300">
          {p?.image ? (
            <img src={p.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="box" className="w-6 h-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-slate-900">{review.name}</b>
            <Stars n={review.rating} />
            {statusBadge(review.status)}
            <span className="text-xs text-slate-500">· {date}</span>
          </div>
          {p && (
            <Link
              href={`/productos/${p._id}`}
              target="_blank"
              className="text-xs text-brand-700 hover:underline"
            >
              {p.name}
            </Link>
          )}
          {review.comment && (
            <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">
              {review.comment}
            </p>
          )}
          {review.email && (
            <p className="text-[11px] text-slate-400 mt-1">{review.email}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
        {review.status !== 'approved' && (
          <button
            onClick={() => moderate('approve')}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60"
          >
            Aprobar
          </button>
        )}
        {review.status !== 'rejected' && (
          <button
            onClick={() => moderate('reject')}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold disabled:opacity-60"
          >
            Rechazar
          </button>
        )}
        {review.status !== 'pending' && (
          <button
            onClick={() => moderate('pending')}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-60"
          >
            Marcar como pendiente
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={loading}
          className="ml-auto px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
