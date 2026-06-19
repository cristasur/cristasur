'use client'
// ============================================================
// PresenceHeartbeat — manda un POST /api/presence/ping cada 30s
// mientras la pestaña esté visible. Se incluye en el layout raíz
// para que aplique a TODAS las páginas (visitantes anónimos + logueados).
// ============================================================
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const SESSION_KEY = 'cristasur:presenceSession:v1'
const PING_EVERY_MS = 30_000 // 30 segundos

function getOrCreateSessionId() {
  try {
    let s = sessionStorage.getItem(SESSION_KEY)
    if (!s) {
      s =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem(SESSION_KEY, s)
    }
    return s
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

export default function PresenceHeartbeat() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    // Excluir las páginas admin del conteo de "usuarios en línea" no tiene sentido
    // — los admins son los que miran el dashboard. Mejor incluirlos a todos.
    const sessionId = getOrCreateSessionId()
    let cancelled = false

    function ping() {
      if (cancelled) return
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        fetch('/api/presence/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
          body: JSON.stringify({ sessionId, path: pathname }),
        }).catch(() => {})
      } catch {}
    }

    // Primer ping inmediato cuando se carga la página o cambia de ruta.
    ping()
    const intervalId = setInterval(ping, PING_EVERY_MS)

    // Cuando vuelve la pestaña al foco, ping inmediato (mejor UX para conteo).
    function onVisibility() {
      if (!document.hidden) ping()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [pathname])

  return null
}
