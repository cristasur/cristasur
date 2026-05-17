'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DuplicateButton({ id }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDuplicate() {
    if (!confirm('¿Duplicar este producto? Se creará una copia inactiva para que la edites.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/products/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Error al duplicar')
        return
      }
      if (data?.product?._id) {
        router.push(`/admin/productos/${data.product._id}`)
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onDuplicate}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-60"
      title="Duplicar este producto"
    >
      {loading ? '…' : 'Duplicar'}
    </button>
  )
}
