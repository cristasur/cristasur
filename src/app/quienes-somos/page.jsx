// ============================================================
// /quienes-somos — Historia y valores de CRISTASUR
// Empresa 100% Yucateca con más de 9 años de experiencia
// ============================================================
import Link from 'next/link'
import Icon from '@/components/Icon'

export const metadata = {
  title: 'Quiénes somos | CRISTASUR Mérida',
  description:
    'Conoce CRISTASUR, empresa 100% yucateca con más de 9 años de experiencia en venta de plásticos, mesas, sillas y juguetes al mayoreo y menudeo en Mérida, Yucatán.',
}

const VALORES = [
  {
    icon: 'shield',
    title: 'Calidad garantizada',
    desc: 'Seleccionamos cuidadosamente cada producto para asegurar que cumpla con los estándares que tu hogar o negocio merece.',
  },
  {
    icon: 'tag',
    title: 'Precios justos',
    desc: 'Manejamos precios competitivos tanto en menudeo como en mayoreo, sin intermediarios y directo al cliente.',
  },
  {
    icon: 'truck',
    title: 'Envío a toda la república',
    desc: 'Hacemos llegar nuestros productos a cualquier rincón de México, coordinando el envío directamente contigo.',
  },
  {
    icon: 'users',
    title: 'Atención personalizada',
    desc: 'Somos una empresa familiar yucateca. Cada cliente es importante y lo atendemos con el trato cercano que nos caracteriza.',
  },
]

const SUCURSALES = [
  {
    nombre: 'Matriz',
    direccion: 'Periférico Lic. Manuel Berzunza S/N, Leandro Valle, Mérida, Yucatán',
    telefono: '999 429 7815',
    maps: 'https://maps.google.com/?q=CRISTASUR+Merida+Yucatan',
  },
  {
    nombre: 'Sucursal Chuburná',
    direccion: 'Chuburná, Mérida, Yucatán',
    telefono: '999 473 1919',
    maps: 'https://maps.google.com/?q=Cristasur+Chuburnа+Merida',
  },
  {
    nombre: 'Sucursal Carretera Campeche',
    direccion: 'Carretera Campeche TANIL, Mérida, Yucatán',
    telefono: '999 473 1919',
    maps: 'https://maps.google.com/?q=Cristasur+Carretera+Campeche+Merida',
  },
]

export default function QuienesSomosPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute -top-32 -right-16 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-widest mb-6 backdrop-blur">
            Empresa 100% Yucateca
          </span>
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
            Más de 9 años <br />
            <span className="text-accent-300">equipando Yucatán</span>
          </h1>
          <p className="mt-6 text-lg text-brand-100 max-w-2xl mx-auto">
            Somos una empresa orgullosamente yucateca dedicada a ofrecer plásticos, mesas, sillas
            y juguetes de calidad al mejor precio, tanto en menudeo como en mayoreo.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-card border border-slate-100 p-8 md:p-12">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Nuestra historia</div>
          <h2 className="text-3xl font-black text-slate-900 mb-6">Nacimos en Mérida, crecimos con Yucatán</h2>
          <div className="prose prose-slate max-w-none text-slate-600 space-y-4 text-base leading-relaxed">
            <p>
              CRISTASUR nació en Mérida, Yucatán, con una misión clara: acercar productos de calidad a los hogares
              y negocios yucatecos a precios accesibles. Desde nuestros inicios hemos sido una empresa familiar
              comprometida con nuestra comunidad.
            </p>
            <p>
              Con más de 9 años de experiencia en el mercado, hemos crecido hasta contar con <strong>3 puntos de
              venta en Mérida</strong>, atendiendo tanto a familias como a restaurantes, escuelas, hoteles y
              comercios de toda la península.
            </p>
            <p>
              Hoy, gracias a nuestra tienda en línea, podemos llevar nuestros productos a cualquier rincón de
              México, manteniendo siempre el trato cercano y la calidad que nos distingue.
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Lo que nos define</div>
          <h2 className="text-3xl font-black text-slate-900">Nuestros valores</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALORES.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-50 grid place-items-center mx-auto mb-4">
                <Icon name={v.icon} className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cifras */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '9+', label: 'Años de experiencia' },
            { num: '3', label: 'Sucursales en Mérida' },
            { num: '6+', label: 'Piezas para mayoreo' },
            { num: '100%', label: 'Empresa yucateca' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-black text-accent-300 mb-1">{s.num}</div>
              <div className="text-brand-200 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sucursales */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Encuéntranos</div>
          <h2 className="text-3xl font-black text-slate-900">Nuestras sucursales</h2>
          <p className="text-slate-500 mt-2">Tres puntos de venta en Mérida para servirte mejor</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {SUCURSALES.map((s) => (
            <div key={s.nombre} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 grid place-items-center mb-4">
                <Icon name="location" className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{s.nombre}</h3>
              <p className="text-slate-500 text-sm mb-3 leading-relaxed">{s.direccion}</p>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <Icon name="phone" className="w-4 h-4 text-brand-600 shrink-0" />
                <span>{s.telefono}</span>
              </div>
              <a
                href={s.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 text-sm font-semibold"
              >
                Ver en Google Maps
                <Icon name="arrow" className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-br from-accent-500 to-accent-700 rounded-3xl p-10 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-black mb-3">¿Tienes un negocio?</h2>
            <p className="text-accent-100 mb-6 max-w-lg mx-auto">
              Atendemos a restaurantes, escuelas, hoteles y comercios con precios especiales por mayoreo.
              Contáctanos y con gusto te cotizamos.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-accent-700 font-bold hover:bg-accent-50 transition-colors"
              >
                Cotizar por mayoreo
                <Icon name="arrow" className="w-4 h-4" />
              </Link>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold border border-white/30 transition-colors"
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
