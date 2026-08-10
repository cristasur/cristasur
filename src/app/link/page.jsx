// ============================================================
// /link — Landing tipo Linktree para tag NFC en tienda.
// Cliente acerca su celular al NFC → se abre esta página con
// 4 botones grandes: Instagram, Facebook, TikTok, Reseña Google.
// Sin navbar ni footer (layout limpio). Pensado para pantalla móvil.
// ============================================================
import Link from 'next/link'

// URLs — actualiza aquí si cambia algo.
const LINKS = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@cristasurmx',
    href: 'https://www.instagram.com/cristasurmx/',
    // Gradiente típico de Instagram
    gradient: 'from-yellow-400 via-pink-500 to-purple-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: 'CristasurMX',
    href: 'https://www.facebook.com/CristasurMX/?locale=es_LA',
    gradient: 'from-blue-600 to-blue-700',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    handle: '@cristasurmx',
    href: 'https://www.tiktok.com/@cristasurmx',
    gradient: 'from-slate-900 to-slate-800',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.1z"/>
      </svg>
    ),
  },
  {
    id: 'google-review',
    label: 'Déjanos una reseña',
    handle: 'en Google',
    // Búsqueda directa de la sucursal Matriz de Mérida.
    // Si tienes el Place ID, cambia a: https://search.google.com/local/writereview?placeid=TU_PLACE_ID
    href: 'https://www.google.com/search?q=CRISTASUR+M%C3%A9rida#lrd=0x0:0x0,3',
    gradient: 'from-amber-400 to-amber-500',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 .587l3.668 7.568L24 9.423l-6 5.848 1.416 8.253L12 19.771l-7.416 3.753L6 15.271 0 9.423l8.332-1.268z"/>
      </svg>
    ),
  },
]

export const metadata = {
  title: 'CRISTASUR · Síguenos',
  description: 'Encuéntranos en Instagram, Facebook, TikTok y déjanos tu reseña en Google.',
  robots: { index: false, follow: false },
  // Viewport apretado para que se vea limpio en móvil
  themeColor: '#1e40af',
}

export default function LinkPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-700 via-brand-600 to-brand-800 text-white flex flex-col items-center px-5 pt-12 pb-10">
      {/* Logo circular */}
      <div className="w-24 h-24 rounded-full bg-white shadow-xl overflow-hidden flex items-center justify-center mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-symbol.png"
          alt="CRISTASUR"
          className="w-full h-full object-contain"
        />
      </div>

      <h1 className="text-3xl font-black tracking-tight text-center">CRISTASUR</h1>
      <p className="mt-1 text-white/80 text-sm text-center max-w-xs">
        Plásticos y artículos para hogar y negocio. Mérida y Bacalar.
      </p>

      {/* Botones */}
      <div className="mt-8 w-full max-w-sm space-y-3">
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={
              'group flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r ' +
              link.gradient +
              ' text-white font-bold shadow-lg shadow-black/10 ' +
              'active:scale-[0.98] transition-transform'
            }
          >
            <span className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm">
              {link.icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-base leading-tight">{link.label}</span>
              <span className="block text-xs font-medium text-white/80 truncate">
                {link.handle}
              </span>
            </span>
            <span className="shrink-0 opacity-70 group-active:translate-x-0.5 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        ))}
      </div>

      {/* Pie con enlace opcional al sitio principal */}
      <Link
        href="/"
        className="mt-10 text-xs text-white/60 hover:text-white/90 underline underline-offset-2"
      >
        Ver catálogo completo →
      </Link>
    </main>
  )
}
