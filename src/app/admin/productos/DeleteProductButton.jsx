'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteProductButton({ id, hard = false, label }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    const msg = hard
      ? '¿Eliminar DEFINITIVAMENTE este producto? Esta acción no se puede deshacer.'
      : '¿Enviar este producto a la papelera? Podrás restaurarlo más tarde.'
    if (!confirm(msg)) return
    setLoading(true)
    try {
      const url = hard ? `/api/products/${id}?hard=1` : `/api/products/${id}`
      const res = await fetch(url, { method: 'DELETE' })
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

  const defaultLabel = hard ? 'Borrar definitivamente' : 'Papelera'

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className={
        hard
          ? 'ml-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60'
          : 'ml-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-60'
      }
    >
      {loading ? '…' : label || defaultLabel}
    </button>
  )
}
