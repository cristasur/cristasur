'use client'
// Se monta en el layout raíz. Registra cada visita de página
// enviando un beacon a /api/analytics/track (fire & forget).
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    // No rastrear rutas admin
    if (url.startsWith('/admin')) return
    // No rastrear API
    if (url.startsWith('/api')) return

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }).catch(() => {})
  }, [pathname, searchParams])

  return null
}
