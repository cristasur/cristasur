'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishButton({ productId }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function publish() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}?action=publish`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al publicar')
      }
    } catch {
      setError('Error de red')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
        ✓ Publicado
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={publish}
        disabled={loading}
        className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap transition-colors"
      >
        {loading ? 'Publicando…' : 'Publicar'}
      </button>
      {error && (
        <span className="text-[10px] text-rose-600 max-w-[160px] text-right leading-tight">
          {error}
        </span>
      )}
    </div>
  )
}
