// Footer con dos sucursales, links legales y contacto.
import Link from 'next/link'
import Icon from './Icon'
import { LOCATIONS } from '@/lib/locations'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16 bg-slate-900 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="mb-4">
            <img
              src="/logo.png"
              alt="CRISTASUR Mérida"
              className="h-16 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <p className="text-sm text-slate-400">
            Plásticos, juguetes y artículos para el hogar y negocios desde hace años.
            Precios accesibles, trato cercano. Mérida y Bacalar.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="https://www.instagram.com/cristasurmx/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
              aria-label="Instagram"
            >
              <Icon name="instagram" className="w-4 h-4" />
              <span>@cristasurmx</span>
            </a>
            <a
              href="https://www.facebook.com/CristasurMX/?locale=es_LA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-sm"
              aria-label="Facebook"
            >
              <Icon name="facebook" className="w-4 h-4" />
              <span>Facebook</span>
            </a>
            <a
              href="mailto:cristasur@live.com.mx"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
              aria-label="Correo"
            >
              <Icon name="mail" className="w-4 h-4" />
              <span>Correo</span>
            </a>
            <a
              href="https://wa.me/529994731919"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm"
              aria-label="WhatsApp"
            >
              <Icon name="whatsapp" className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Tienda</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/productos" className="hover:text-white">Catálogo</Link></li>
            <li><Link href="/productos?featured=1" className="hover:text-white">Destacados</Link></li>
            <li><Link href="/productos?onSale=1" className="hover:text-white">En oferta</Link></li>
            <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Empresa</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/quienes-somos" className="hover:text-white">Quiénes somos</Link></li>
            <li><Link href="/envios" className="hover:text-white">Envíos</Link></li>
            <li><Link href="/envios#devoluciones" className="hover:text-white">Política de devoluciones</Link></li>
            <li><Link href="/mayoreo" className="hover:text-white">Precios mayoreo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Sucursales</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            {LOCATIONS.map((loc) => (
              <li key={loc.id}>
                <div className="font-semibold text-slate-200">{loc.city}</div>
                <a
                  href={loc.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white block leading-snug"
                >
                  {loc.address}
                </a>
                <div className="text-xs text-slate-500 mt-1">{loc.hours}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/aviso-de-privacidad" className="hover:text-white">
                Aviso de privacidad
              </Link>
            </li>
            <li>
              <Link href="/terminos" className="hover:text-white">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:text-white">
                Preguntas frecuentes
              </Link>
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-4">
            Si tienes restaurante o negocio, escríbenos y te cotizamos por volumen.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {year} CRISTASUR · Todos los derechos reservados ·{' '}
        <Link href="/aviso-de-privacidad" className="hover:text-slate-300">
          Privacidad
        </Link>{' '}
        ·{' '}
        <Link href="/terminos" className="hover:text-slate-300">
          Términos
        </Link>
      </div>
    </footer>
  )
}
