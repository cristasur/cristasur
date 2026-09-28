'use client'
// ============================================================
// Footer de CRISTASUR.
//   - Banda superior con 4 accesos de contacto (WhatsApp, correo,
//     facturación, sucursales).
//   - Bloque de marca + redes + suscripción al boletín
//     (usa /api/newsletter/subscribe, el mismo modelo Newsletter).
//   - Columnas de enlaces (acordeón en móvil).
//   - Sucursales con dirección (Google Maps) y horario de @/lib/locations.
//   - Barra inferior con © año, legales y "Hecho en Yucatán".
// ============================================================
import { useState } from 'react'
import Link from 'next/link'
import Icon from './Icon'
import { LOCATIONS } from '@/lib/locations'

const WHATSAPP_URL = 'https://wa.me/529994731919'
const EMAIL = 'cristasur@live.com.mx'

// Accesos rápidos de la banda superior
const CONTACT_ITEMS = [
  {
    icon: 'whatsapp',
    title: 'WhatsApp',
    text: '+52 999 473 1919',
    href: WHATSAPP_URL,
    external: true,
  },
  {
    icon: 'mail',
    title: 'Correo',
    text: EMAIL,
    href: `mailto:${EMAIL}`,
  },
  {
    icon: 'ticket',
    title: 'Facturación',
    text: 'Solicita tu factura por correo',
    href: `mailto:${EMAIL}?subject=${encodeURIComponent('Solicitud de factura')}`,
  },
  {
    icon: 'pin',
    title: 'Sucursales',
    text: 'Mérida · Tanil · Bacalar',
    href: '/contacto',
    internal: true,
  },
]

// Columnas de enlaces (solo rutas que existen en src/app)
const LINK_GROUPS = [
  {
    title: 'Tienda',
    links: [
      { href: '/productos', label: 'Catálogo' },
      { href: '/productos?featured=1', label: 'Destacados' },
      { href: '/productos?onSale=1', label: 'En oferta' },
      { href: '/mayoreo', label: 'Precios mayoreo' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Mi pedido',
    links: [
      { href: '/cuenta', label: 'Mi cuenta' },
      { href: '/carrito', label: 'Carrito' },
      { href: '/favoritos', label: 'Favoritos' },
      { href: '/envios', label: 'Envíos' },
      { href: '/envios#devoluciones', label: 'Política de devoluciones' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '/quienes-somos', label: 'Quiénes somos' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/contacto', label: 'Preguntas frecuentes' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/aviso-de-privacidad', label: 'Aviso de privacidad' },
      { href: '/terminos', label: 'Términos y condiciones' },
    ],
  },
]

// Formulario de boletín: reutiliza el endpoint existente.
function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | ok | error
  const [msg, setMsg] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('error')
      setMsg('Escribe un correo válido.')
      return
    }
    setStatus('loading')
    setMsg('')
    try {
      const r = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setStatus('error')
        setMsg(j?.error || 'No pudimos registrarte. Intenta de nuevo.')
        return
      }
      setStatus('ok')
      setMsg('¡Listo! Te avisaremos de ofertas y novedades.')
      setEmail('')
    } catch {
      setStatus('error')
      setMsg('Sin conexión. Intenta de nuevo.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full" noValidate>
      <label htmlFor="footer-newsletter" className="block text-sm font-bold text-white">
        Ofertas y novedades en tu correo
      </label>
      <p className="text-xs text-slate-400 mt-1">
        Promociones, productos nuevos y precios de temporada. Sin spam.
      </p>
      <div className="mt-3 flex items-stretch rounded-xl bg-white/5 ring-1 ring-white/10 focus-within:ring-accent-400 transition overflow-hidden">
        <input
          id="footer-newsletter"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status !== 'loading') setStatus('idle') }}
          className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 px-4 sm:px-5 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
        >
          {status === 'loading' ? 'Enviando…' : 'Suscribirme'}
        </button>
      </div>
      {msg && (
        <p className={`mt-2 text-xs ${status === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`} role="status">
          {msg}
        </p>
      )}
    </form>
  )
}

// Columna de enlaces: acordeón en móvil, lista fija en escritorio.
function LinkColumn({ group }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10 md:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 md:py-0 md:mb-4 md:cursor-default text-left"
      >
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white">
          {group.title}
        </span>
        <span className="md:hidden text-slate-400 text-lg leading-none" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      <ul className={`${open ? 'block' : 'hidden'} md:block pb-4 md:pb-0 space-y-2.5 text-sm`}>
        {group.links.map((l) => (
          <li key={`${l.href}-${l.label}`}>
            <Link
              href={l.href}
              className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group"
            >
              <span className="w-0 group-hover:w-2 h-px bg-accent-400 transition-all" aria-hidden="true" />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 bg-[#0a1226] text-slate-300">
      {/* Línea de color de marca */}
      <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-accent-500" aria-hidden="true" />

      {/* ── Banda de contacto ── */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {CONTACT_ITEMS.map((c) => {
            const inner = (
              <>
                <span className={`shrink-0 w-11 h-11 rounded-xl grid place-items-center ${
                  c.icon === 'whatsapp' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand-500/15 text-brand-300'
                } group-hover:scale-105 transition-transform`}>
                  <Icon name={c.icon} className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white">{c.title}</span>
                  <span className="block text-xs text-slate-400 truncate">{c.text}</span>
                </span>
              </>
            )
            const cls = 'group flex items-center gap-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] ring-1 ring-white/10 p-3 md:p-4 transition-colors min-w-0'
            return c.internal ? (
              <Link key={c.title} href={c.href} className={cls}>{inner}</Link>
            ) : (
              <a
                key={c.title}
                href={c.href}
                className={cls}
                {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {inner}
              </a>
            )
          })}
        </div>
      </div>

      {/* ── Área principal ── */}
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 grid gap-10 lg:grid-cols-12">
        {/* Marca + redes + boletín */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <img
              src="/logo.png"
              alt="CRISTASUR Mérida"
              className="h-14 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
              Plásticos, desechables, vajilla y artículos para el hogar, restaurantes
              y negocios. Precios accesibles y trato cercano en Mérida y Bacalar.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://www.instagram.com/cristasurmx/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @cristasurmx"
                className="w-10 h-10 grid place-items-center rounded-full ring-1 ring-white/15 text-slate-300 hover:text-white hover:bg-gradient-to-br hover:from-fuchsia-500 hover:to-amber-400 hover:ring-transparent transition"
              >
                <Icon name="instagram" className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/CristasurMX/?locale=es_LA"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook CristasurMX"
                className="w-10 h-10 grid place-items-center rounded-full ring-1 ring-white/15 text-slate-300 hover:text-white hover:bg-[#1877F2] hover:ring-transparent transition"
              >
                <Icon name="facebook" className="w-4 h-4" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 grid place-items-center rounded-full ring-1 ring-white/15 text-slate-300 hover:text-white hover:bg-emerald-600 hover:ring-transparent transition"
              >
                <Icon name="whatsapp" className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${EMAIL}`}
                aria-label="Correo"
                className="w-10 h-10 grid place-items-center rounded-full ring-1 ring-white/15 text-slate-300 hover:text-white hover:bg-brand-600 hover:ring-transparent transition"
              >
                <Icon name="mail" className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-brand-900/60 to-transparent ring-1 ring-white/10 p-5">
            <NewsletterForm />
          </div>
        </div>

        {/* Columnas de enlaces */}
        <div className="lg:col-span-5 grid md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 md:gap-8 lg:gap-x-6 lg:gap-y-8">
          {LINK_GROUPS.map((g) => (
            <LinkColumn key={g.title} group={g} />
          ))}
          <p className="md:col-span-4 lg:col-span-2 xl:col-span-4 mt-6 md:mt-0 text-xs text-slate-500 leading-relaxed">
            ¿Tienes restaurante o negocio? Escríbenos y te cotizamos por volumen.
          </p>
        </div>

        {/* Sucursales */}
        <div className="lg:col-span-3">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white mb-4">
            Sucursales
          </div>
          <ul className="space-y-3">
            {LOCATIONS.map((loc) => (
              <li key={loc.id} className="rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-3.5">
                <div className="flex items-center gap-2">
                  <Icon name="pin" className="w-4 h-4 text-accent-400 shrink-0" />
                  <span className="font-semibold text-sm text-white">{loc.city}</span>
                  {loc.primary && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent-300 bg-accent-500/15 px-1.5 py-0.5 rounded">
                      Matriz
                    </span>
                  )}
                </div>
                <a
                  href={loc.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 block text-xs text-slate-400 hover:text-white leading-snug"
                >
                  {loc.address}
                </a>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Icon name="clock" className="w-3.5 h-3.5 shrink-0" />
                  <span>{loc.hours}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Barra inferior ── */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="text-center md:text-left">
            © {year} CRISTASUR · Todos los derechos reservados
          </div>
          <div className="flex items-center gap-4">
            <Link href="/aviso-de-privacidad" className="hover:text-slate-300">Privacidad</Link>
            <Link href="/terminos" className="hover:text-slate-300">Términos</Link>
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              Hecho con <span className="text-accent-400" aria-hidden="true">♥</span> en Yucatán
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
