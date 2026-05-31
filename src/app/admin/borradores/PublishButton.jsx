'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishButton({ productId }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function publish() {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}?action=publish`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } catch {}
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
    <button
      onClick={publish}
      disabled={loading}
      className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap transition-colors"
    >
      {loading ? 'Publicando…' : 'Publicar'}
    </button>
  )
}
