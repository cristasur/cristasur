'use client'
// ============================================================
// MobileMenu.jsx — Hamburguesa + drawer lateral para móvil
// ============================================================
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/productos',  label: 'Catálogo',  icon: '🛍️' },
  { href: '/blog',       label: 'Blog',       icon: '📝' },
  { href: '/contacto',   label: 'Contacto',   icon: '📞' },
  { href: '/favoritos',  label: 'Favoritos',  icon: '❤️' },
]

export default function MobileMenu({ categories = [] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Cierra el menú al navegar
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
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-slate-100 gap-1.5"
        aria-label="Abrir menú"
      >
        <span className="block w-5 h-0.5 bg-slate-700 rounded" />
        <span className="block w-5 h-0.5 bg-slate-700 rounded" />
        <span className="block w-5 h-0.5 bg-slate-700 rounded" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <Link href="/" onClick={() => setOpen(false)}>
            <img src="/logo.png" alt="CRISTASUR" className="h-12 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-slate-100 text-slate-500 text-xl"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Links principales */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2">
            <p className="px-3 text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Navegación
            </p>
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
                <span className="text-lg leading-none">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Categorías */}
          {categories.length > 0 && (
            <div className="px-3 mt-4">
              <p className="px-3 text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Categorías
              </p>
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
          )}
        </nav>

        {/* Footer del drawer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <Link
            href="/cuenta"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors"
          >
            Mi cuenta
          </Link>
        </div>
      </div>
    </>
  )
}
