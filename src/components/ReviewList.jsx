'use client'
// Lista y formulario de reseñas para un producto.
// Lee /api/reviews?product=<id> y muestra promedio + historias.
import { useEffect, useState, useCallback } from 'react'
import StarRating from './StarRating'
import ReviewForm from './ReviewForm'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function ReviewList({ productId }) {
  const [data, setData] = useState({
    reviews: [],
    total: 0,
    average: 0,
    approvedCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews?product=${productId}&limit=20`)
      const j = await res.json().catch(() => ({}))
      setData({
        reviews: j.reviews || [],
        total: j.total || 0,
        average: j.average || 0,
        approvedCount: j.approvedCount || 0,
      })
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900">Reseñas</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-sm"
        >
          {showForm ? 'Cancelar' : 'Escribir reseña'}
        </button>
      </div>

      {data.approvedCount > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-4">
          <div className="text-4xl font-black text-slate-900">
            {Number(data.average).toFixed(1)}
          </div>
          <div>
            <StarRating value={data.average} size="md" />
            <div className="text-xs text-slate-500 mt-1">
              {data.approvedCount} reseña(s) publicada(s)
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <ReviewForm
          productId={productId}
          onSubmitted={() => {
            setShowForm(false)
            load()
          }}
        />
      )}

      {loading && <p className="text-sm text-slate-500">Cargando reseñas…</p>}
      {!loading && data.reviews.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-slate-500 text-sm">
          Aún no hay reseñas. ¡Sé el primero en dejar una!
        </div>
      )}

      <div className="space-y-3">
        {data.reviews.map((r) => (
          <div
            key={r._id}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <b className="text-slate-900">{r.name}</b>
              <StarRating value={r.rating} size="sm" />
              <span className="text-xs text-slate-400">· {formatDate(r.createdAt)}</span>
            </div>
            {r.comment && (
              <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">
                {r.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
