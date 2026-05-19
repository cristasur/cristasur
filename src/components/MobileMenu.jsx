'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/productos', label: 'Catálogo',  icon: '🛍️' },
  { href: '/blog',      label: 'Blog',       icon: '📝' },
  { href: '/contacto',  label: 'Contacto',   icon: '📞' },
  { href: '/favoritos', label: 'Favoritos',  icon: '❤️' },
]

export default function MobileMenu({ categories = [] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Cierra al navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloquea scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
        aria-label="Abrir menú"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 5.5h16M3 11h16M3 16.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Menú pantalla completa en móvil */}
      <div
        className={`fixed inset-0 z-[70] bg-white overflow-y-auto transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
          <Link href="/" onClick={() => setOpen(false)}>
            <img src="/logo.png" alt="CRISTASUR" className="h-12 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Cerrar menú"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 pb-8">

          {/* Links principales */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
            Navegación
          </p>
          <div className="space-y-0.5">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === l.href
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Categorías */}
          {categories.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mt-6 mb-2">
                Categorías
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/productos"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Todos los productos
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c._id}
                    href={`/categoria/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Mi cuenta */}
          <div className="mt-6">
            <Link
              href="/cuenta"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors"
            >
              Mi cuenta
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
