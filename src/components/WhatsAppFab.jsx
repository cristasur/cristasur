'use client'
// ============================================================
// Botón flotante de WhatsApp. Aparece en todas las páginas
// (excepto admin). Lleva contexto: si estás en una ficha de
// producto, el mensaje pre-escrito menciona el producto.
// Se oculta automáticamente cuando el carrito está abierto
// y en rutas /admin*.
// ============================================================
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Icon from './Icon'

const WHATSAPP_PHONE = '529994731919'

function defaultMessage(pathname) {
  if (!pathname) return 'Hola CRISTASUR, me gustaría más información.'
  if (pathname.startsWith('/productos/')) {
    return `Hola CRISTASUR, me interesa este producto: ${typeof window !== 'undefined' ? window.location.href : ''}`
  }
  if (pathname.startsWith('/categoria/')) {
    return `Hola CRISTASUR, quería preguntar sobre productos en esta categoría: ${typeof window !== 'undefined' ? window.location.href : ''}`
  }
  if (pathname === '/contacto') {
    return 'Hola CRISTASUR, los contacto desde su web.'
  }
  return 'Hola CRISTASUR, me gustaría más información.'
}

export default function WhatsAppFab() {
  const pathname = usePathname() || ''
  const [show, setShow] = useState(false)

  // Mostrar solo después de hidratar para evitar mismatch SSR.
  useEffect(() => {
    setShow(true)
  }, [])

  // Ocultar en admin / login / admincr
  if (
    !show ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/admincr')
  ) {
    return null
  }

  const href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(defaultMessage(pathname))}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed z-30 right-4 bottom-4 sm:right-6 sm:bottom-6 group"
    >
      {/* Burbuja con texto que se asoma en hover */}
      <span className="hidden md:inline-flex absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-3 py-1.5 rounded-full text-sm font-semibold text-slate-800 shadow-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
        ¿Te ayudamos? Escríbenos
      </span>
      {/* Botón */}
      <span className="relative grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg ring-4 ring-white overflow-hidden">
        {/* Anillo pulsante — clipped al botón para no causar overflow en iOS */}
        <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-60 pointer-events-none" />
        <Icon name="whatsapp" className="relative w-7 h-7 sm:w-8 sm:h-8" />
      </span>
    </a>
  )
}
