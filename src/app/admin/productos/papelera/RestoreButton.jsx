'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RestoreButton({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onRestore() {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${id}?action=restore`, { method: 'PATCH' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Error al restaurar')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onRestore}
      disabled={loading}
      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-60"
    >
      {loading ? '…' : 'Restaurar'}
    </button>
  )
}
