'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteProductButton({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
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

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="ml-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-60"
    >
      {loading ? '…' : 'Eliminar'}
    </button>
  )
}
