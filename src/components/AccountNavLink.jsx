'use client'
// Botón de cuenta en el Navbar.
// - Si no hay sesión: "Inicia sesión"
// - Si hay sesión: muestra el nombre/email + dropdown con accesos
//   ("Mi cuenta", "Mayoreo VIP" si tiene acceso, "Salir")
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from './CartProvider'
import Icon from './Icon'

export default function AccountNavLink() {
  const { user } = useCart()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const closeTimer = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    try {
      localStorage.removeItem('cristasur:cart:v1')
    } catch {}
    window.location.href = '/'
  }

  if (!user) {
    return (
      <Link
        href="/cuenta/login"
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-700 rounded-lg"
      >
        <Icon name="user" className="w-4 h-4" />
        Inicia sesión
      </Link>
    )
  }

  const initials = (user.name || user.email || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('')

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => { clearTimeout(closeTimer.current); setOpen(true) }}
      onMouseLeave={() => { closeTimer.current = setTimeout(() => setOpen(false), 150) }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-sm"
        aria-expanded={open}
      >
        <span className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center text-xs font-bold">
          {initials || 'U'}
        </span>
        <span className="hidden md:inline font-semibold">{user.name?.split(' ')[0] || 'Mi cuenta'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-40">
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="text-sm font-bold text-slate-900 truncate">{user.name || 'Cliente'}</div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
          <Link
            href="/cuenta"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Mi cuenta
          </Link>
          <Link
            href="/favoritos"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            ♡ Mis favoritos
          </Link>
          {user.wholesaleAccess && (
            <Link
              href="/mayoreo"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100"
            >
              ★ Precios mayoreo VIP
            </Link>
          )}
          {(user.role === 'admin' || user.role === 'editor') && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Panel admin
            </Link>
          )}
          <button
            onClick={logout}
   