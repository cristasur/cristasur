'use client'
import { useState } from 'react'
import StarRating from './StarRating'

export default function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = useState(5)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!name.trim() || !rating) {
      setError('Tu nombre y la calificación son obligatorios.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: productId, name, email, rating, comment }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Error al enviar')
        return
      }
      setMsg(data?.message || '¡Gracias! Tu reseña será revisada antes de publicarse.')
      setName('')
      setEmail('')
      setComment('')
      setRating(5)
      onSubmitted?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-3">
      <h3 className="font-bold text-slate-900">Deja tu reseña</h3>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm">
          {msg}
        </div>
      )}
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Calificación</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input
          required
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
        />
        <input
          type="email"
          placeholder="Email (opcional, no se publica)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={120}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
        />
      </div>
      <textarea
        rows={4}
        maxLength={600}
        placeholder="Cuéntanos qué te pareció el producto…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
      >
        {loading ? 'Enviando…' : 'Publicar reseña'}
      </button>
      <p className="text-[11px] text-slate-400">
        Las reseñas pasan por un proceso de moderación antes de publicarse.
      </p>
    </form>
  )
}
