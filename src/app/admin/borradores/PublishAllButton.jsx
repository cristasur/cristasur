'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishAllButton({ q, total }) {
  const [loading, setLoading] = useState(false)
  const [published, setPublished] = useState(null)
  const router = useRouter()

  async function handlePublishAll() {
    const label = q ? `los ${total} borradores con "${q}"` : `todos los ${total} borradores`
    if (!confirm(`¿Publicar ${label}? Quedarán visibles en la tienda.`)) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/borradores?action=publish-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q }),
      })
      const data = await res.json()
      if (res.ok) {
        setPublished(data.modifiedCount)
        router.refresh()
      }
    } catch {}
    setLoading(false)
  }

  if (published != null) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold">
        ✓ {published} publicados
      </span>
    )
  }

  return (
    <button
      onClick={handlePublishAll}
      disabled={loading || total === 0}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
    >
      {loading ? 'Publicando…' : `Publicar todos (${total})`}
    </button>
  )
}
