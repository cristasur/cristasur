'use client'
// Barra de navegación superior para móvil en el panel admin.
// En pantallas grandes (lg+) este componente no renderiza nada;
// el sidebar estático del layout.jsx toma el control.
import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/Icon'
import LogoutButton from './LogoutButton'

export default function AdminMobileNav({ links, user }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      {/* Top bar pegajosa */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <img src="/logo.png" alt="CRISTASUR" className="h-8 w-auto object-contain" />
        <div className="flex items-center gap-2">
          {user?.email && (
            <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{user.email}</span>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú desplegable */}
      {open && (
        <div className="sticky top-[53px] z-30 bg-white border-b border-slate-200 shadow-md">
          <nav className="flex flex-col gap-0.5 text-sm px-3 py-3 max-h-[60vh] overflow-y-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 text-slate-700 hover:text-brand-800 active:bg-brand-100"
              >
                <Icon name={l.icon} className="w-4 h-4 shrink-0" />
                {l.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 mt-2 pt-2 flex flex-col gap-0.5">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                <Icon name="home" className="w-4 h-4 shrink-0" />
                Ver tienda
              </Link>
              <LogoutButton />
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
