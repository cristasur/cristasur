'use client'
// Client component - maneja el input y redirige a /productos?q=...
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')

  useEffect(() => {
    setQ(params.get('q') || '')
  }, [params])

  function onSubmit(e) {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) {
      router.push(`/productos?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/productos')
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar productos (ej. vaso, silla, cubeta…)"
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none text-sm placeholder:text-slate-400"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
    </form>
  )
}
