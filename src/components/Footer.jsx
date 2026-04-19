// Footer
import Link from 'next/link'
import Icon from './Icon'

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
              className="h-24 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <p className="text-sm text-slate-400">
            Plásticos, juguetes y artículos para el hogar y negocios desde hace años.
            Precios accesibles, trato cercano.
          </p>
          <div className="mt-4 flex gap-2">
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
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Tienda</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/productos" className="hover:text-white">Catálogo</Link></li>
            <li><Link href="/productos?featured=1" className="hover:text-white">Destacados</Link></li>
            <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Información</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>Ventas por mayoreo y menudeo</li>
            <li>Lunes a sábado, 9am a 7pm</li>
            <li>Envíos a toda la república</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Para empresas</h4>
          <p className="text-sm text-slate-400">
            Si tienes un restaurante, fonda o negocio, escríbenos y te cotizamos por volumen.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {year} CRISTASUR · Todos los derechos reservados
      </div>
    </footer>
  )
}
