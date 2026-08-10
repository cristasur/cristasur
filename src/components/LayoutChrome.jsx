'use client'
// ============================================================
// LayoutChrome — envoltura para elementos del "marco del sitio"
// (navbar, footer, drawers, popups) que se ocultan en ciertas
// rutas donde no queremos distracciones (ej. /link para NFC).
// ============================================================
import { usePathname } from 'next/navigation'

// Rutas donde NO se muestran los elementos del chrome.
const CHROMELESS_PATHS = ['/link']

export default function LayoutChrome({ children }) {
  const pathname = usePathname() || '/'
  const isChromeless = CHROMELESS_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (isChromeless) return null
  return <>{children}</>
}
