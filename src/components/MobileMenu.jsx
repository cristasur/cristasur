'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/productos', label: 'Catálogo'  },
  { href: '/blog',      label: 'Blog'      },
  { href: '/contacto',  label: 'Contacto'  },
  { href: '/favoritos', label: 'Favoritos' },
]

export default function MobileMenu({ categories = [] }) {
  const [open, setOpen]       = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname              = usePathname()

  // Esperamos al mount para usar createPortal (SSR safe)
  useEffect(() => { setMounted(true) }, [])

  // Cierra al navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloquea scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const overlay = (
    <>
      {/* Backdrop difuminado — directo en body, encima de todo */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'opacity 0.3s',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Drawer — directo en body */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: '80vw', maxWidth: '320px',
          zIndex: 9999,
          background: '#fff',
          overflowY: 'auto',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        {/* Cabecera */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <Link href="/" onClick={() => setOpen(false)}>
            <img src="/logo.png" alt="CRISTASUR" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
          </Link>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#f1f5f9', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#64748b',
            }}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '16px', paddingBottom: 32 }}>

          {/* Navegación */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 8, padding: '0 4px' }}>
            NAVEGACIÓN
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                  background: pathname === l.href ? '#eff6ff' : 'transparent',
                  color: pathname === l.href ? '#1d4ed8' : '#334155',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Categorías */}
          {categories.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 8, padding: '0 4px' }}>
                CATEGORÍAS
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
                <Link
                  href="/productos"
                  onClick={() => setOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderRadius: 10, textDecoration: 'none', color: '#334155', fontSize: 14, fontWeight: 500 }}
                >
                  Todos los productos
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c._id}
                    href={`/categoria/${c.slug}`}
                    onClick={() => setOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderRadius: 10, textDecoration: 'none', color: '#334155', fontSize: 14, fontWeight: 500 }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Mi cuenta */}
          <Link
            href="/cuenta"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '12px', borderRadius: 10,
              background: '#1d4ed8', color: '#fff',
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}
          >
            Mi cuenta
          </Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Botón hamburguesa — dentro del navbar */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
        aria-label="Abrir menú"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 5.5h16M3 11h16M3 16.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Portal: drawer y backdrop se renderizan directo en document.body */}
      {mounted && createPortal(overlay, document.body)}
    </>
  )
}
