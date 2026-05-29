'use client'
// Botón de estrella para destacar/quitar destacado de un producto
// directamente desde la lista sin entrar a editar.
import { useState } from 'react'

export default function FeaturedButton({ id, featured: initialFeatured }) {
  const [featured, setFeatured] = useState(initialFeatured)
  const [loading, setLoading]   = useState(false)

  async function toggle(e) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${id}?action=featured`, { method: 'PATCH' })
      const j = await res.json()
      if (j.ok) setFeatured(j.featured)
    } catch {}
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      title={featured ? 'Quitar destacado' : 'Marcar como destacado'}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
        featured
          ? 'bg-amber-400 text-white hover:bg-amber-500'
          : 'bg-slate-100 text-slate-300 hover:bg-amber-100 hover:text-amber-400'
      } ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24"
        fill={featured ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  )
}
