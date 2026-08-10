// ============================================================
// /link — Landing tipo "tarjeta digital" para tag NFC en tienda.
// Diseño minimalista, elegante, humano. Solo 4 accesos:
// Instagram, Facebook, TikTok, Reseña Google.
// Sin navbar, sin footer, sin distracciones.
// ============================================================

const LINKS = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@cristasurmx',
    href: 'https://www.instagram.com/cristasurmx/',
    accent: '#E1306C',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: 'CristasurMX',
    href: 'https://www.facebook.com/CristasurMX/?locale=es_LA',
    accent: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    handle: '@cristasurmx',
    href: 'https://www.tiktok.com/@cristasurmx',
    accent: '#0f172a',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z" />
      </svg>
    ),
  },
  {
    id: 'google-review',
    label: 'Déjanos una reseña',
    handle: 'Google',
    href: 'https://www.google.com/search?q=CRISTASUR+M%C3%A9rida#lrd=0x0:0x0,3',
    accent: '#EA4335',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    id: 'website',
    label: 'Ir a nuestra página web',
    handle: 'cristasur.com',
    href: 'https://cristasur.com',
    accent: '#0f172a',
    external: false, // abrir en la misma pestaña, es sitio propio
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" strokeLinecap="round" />
        <path d="M3.5 12h17" strokeLinecap="round" />
        <path d="M12 3c2.5 2.7 3.9 5.9 3.9 9s-1.4 6.3-3.9 9c-2.5-2.7-3.9-5.9-3.9-9S9.5 5.7 12 3z" strokeLinecap="round" />
      </svg>
    ),
  },
]

export const metadata = {
  title: 'CRISTASUR · Síguenos',
  description: 'Instagram, Facebook, TikTok y reseñas en Google.',
  robots: { index: false, follow: false },
  themeColor: '#faf6f1',
}

export default function LinkPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-6 pt-14 pb-12"
      style={{ backgroundColor: '#faf6f1' }}
    >
      {/* Logo */}
      <div
        className="w-20 h-20 rounded-full bg-white overflow-hidden flex items-center justify-center"
        style={{ boxShadow: '0 6px 24px rgba(15,23,42,0.08)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-symbol.png"
          alt="CRISTASUR"
          className="w-14 h-14 object-contain"
        />
      </div>

      {/* Nombre */}
      <h1
        className="mt-6 text-[26px] font-semibold tracking-[0.14em] text-slate-900 uppercase"
        style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}
      >
        Cristasur
      </h1>

      {/* Ubicación */}
      <div className="mt-2 text-[11px] tracking-[0.25em] uppercase text-slate-400">
        México
      </div>

      {/* Línea decorativa */}
      <div className="mt-6 w-8 h-px bg-slate-300" />

      <p className="mt-6 text-[13px] text-slate-500 text-center max-w-[260px] leading-relaxed">
        Gracias por visitarnos. Síguenos o déjanos tu reseña.
      </p>

      {/* Botones */}
      <div className="mt-10 w-full max-w-[380px] space-y-3">
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            {...(link.external === false
              ? {}
              : { target: '_blank', rel: 'noopener noreferrer' })}
            className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-white border border-slate-200/70 hover:border-slate-300 hover:-translate-y-[1px] active:scale-[0.99] transition-all duration-200"
            style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
          >
            <span
              className="shrink-0 grid place-items-center w-9 h-9 rounded-lg"
              style={{
                color: link.accent,
                backgroundColor: link.id === 'google-review' ? '#ffffff' : `${link.accent}12`,
              }}
            >
              {link.icon}
            </span>
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-[15px] font-semibold text-slate-900 leading-tight">
                {link.label}
              </span>
              <span className="block text-[12px] text-slate-400 mt-0.5">
                {link.handle}
              </span>
            </span>
            <span className="shrink-0 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        ))}
      </div>

      {/* Firma discreta */}
      <div className="mt-12 text-[10px] tracking-[0.2em] uppercase text-slate-300">
        cristasur.com
      </div>
    </main>
  )
}
