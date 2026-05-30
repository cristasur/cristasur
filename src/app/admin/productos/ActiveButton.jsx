'use client'
// ============================================================
// Botón de ojo para publicar/despublicar (active/ocultar) un producto
// directamente desde la lista, con soporte de callback para actualizar
// instantáneamente el estado y el badge de la fila.
// ============================================================
import { useState } from 'react'
import Icon from '@/components/Icon'

export default function ActiveButton({ id, active: initialActive, onToggle }) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  async function toggle(e) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${id}?action=active`, { method: 'PATCH' })
      const j = await res.json()
      if (j.ok) {
        setActive(j.active)
        if (onToggle) onToggle(j.active)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      title={active ? 'Ocultar producto (Despublicar)' : 'Mostrar producto (Publicar)'}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
        active
          ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
      } ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <Icon name="eye" className="w-3.5 h-3.5" strokeWidth={2.5} />
    </button>
  )
}
