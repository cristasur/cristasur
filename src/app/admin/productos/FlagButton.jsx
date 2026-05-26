'use client'
// Botoncito de bandera para marcar un producto como "pendiente de revisar".
// Toglea flagged sin recargar la página.
import { useState } from 'react'

export default function FlagButton({ id, flagged: initialFlagged }) {
  const [flagged, setFlagged] = useState(initialFlagged)
  const [loading, setLoading] = useState(false)

  async function toggle(e) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${id}?action=flag`, { method: 'PATCH' })
      const j = await res.json()
      if (j.ok) setFlagged(j.flagged)
    } catch {}
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      title={flagged ? 'Quitar bandera' : 'Marcar como pendiente'}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
        flagged
          ? 'bg-amber-100 text-amber-500 hover:bg-amber-200'
          : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
      } ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24"
        fill={flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    </button>
  )
}
