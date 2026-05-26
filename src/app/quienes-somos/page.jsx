// ============================================================
// /quienes-somos — Historia y valores de CRISTASUR
// ============================================================
import Link from 'next/link'
import Icon from '@/components/Icon'
import { LOCATIONS } from '@/lib/locations'

export const metadata = {
  title: 'Quiénes somos | CRISTASUR Mérida',
  description:
    'Conoce CRISTASUR, empresa 100% yucateca con más de 10 años de experiencia en venta de productos para el hogar y negocios al mayoreo y menudeo en Mérida, Yucatán.',
}

const VALORES = [
  {
    icon: 'shield',
    title: 'Sin engaños',
    desc: 'Lo que ves en la foto es lo que llega. Si algo no está disponible te lo decimos antes de que pagues, no después.',
  },
  {
    icon: 'tag',
    title: 'Precio real',
    desc: 'Nada de precios inflados para después "hacer descuento". Nuestro precio es nuestro precio, y el mayoreo siempre conviene.',
  },
  {
    icon: 'truck',
    title: 'Llegamos a donde estés',
    desc: 'Desde Tijuana hasta Cancún. Coordinamos el envío por WhatsApp y te buscamos la opción más barata para tu zona.',
  },
  {
    icon: 'users',
    title: 'Trato de vecino',
    desc: 'Somos yucatecos, atendemos como yucatecos. Sin robots, sin scripts. Si tienes una duda rara, pregúntanos sin pena.',
  },
]

// Sucursales tomadas de LOCATIONS para mantener consistencia con el resto del sitio

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
            Más de 10 años <br />
            <span className="text-accent-300">equipando Yucatán</span>
          </h1>
          <p className="mt-6 text-lg text-brand-100 max-w-2xl mx-auto">
            Somos una empresa peninsular dedicada a ofrecer productos de calidad
            para el hogar y negocios al mejor precio, en menudeo y mayoreo.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-card border border-slate-100 p-8 md:p-12">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Nuestra historia</div>
          <h2 className="text-3xl font-black text-slate-900 mb-6">Nacimos aquí, pensamos en los de aquí</h2>
          <div className="space-y-5 text-slate-600 text-base leading-relaxed">
            <p>
              CRISTASUR empezó como una apuesta familiar en Mérida, con la idea simple de que los productos
              que se necesitan en casa o en un negocio no tienen por qué ser caros ni difíciles de conseguir.
              Sin grandes pretensiones, solo con las ganas de servir bien.
            </p>
            <p>
              Con más de <strong>10 años en el mercado</strong>, hemos crecido hasta tener
              <strong> 3 puntos de venta en Mérida</strong> y una tienda en línea que llega a toda la república.
              Hemos surtido desde una familia que necesita sillas para su fiesta de xv hasta hoteles que
              piden cientos de piezas cada mes.
            </p>
            <p>
              Lo que no ha cambiado en todo este tiempo es cómo tratamos a la gente. Seguimos siendo
              los mismos de siempre: directos, sin rodeos, y con el precio claro desde el primer mensaje.
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Cómo trabajamos</div>
          <h2 className="text-3xl font-black text-slate-900">Lo que nos distingue</h2>
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
            { num: '10+', label: 'Años en el mercado' },
            { num: '3', label: 'Sucursales en la Península' },
            { num: '500+', label: 'Piezas para mayoreo' },
            { num: '100%', label: 'Empresa peninsular' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-black text-accent-300 mb-1">{s.num}</div>
              <div className="text-brand-200 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ¿A quién le vendemos? */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-card border border-slate-100 p-8 md:p-12">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Nuestros clientes</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">¿A quién le vendemos?</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            A todos, y lo decimos en serio. Desde la mamá que necesita un par de sillas para el cumpleaños
            de su hijo hasta el restaurantero que nos compra cada mes. Tenemos precios de menudeo para
            quien compra poco, y precios de mayoreo para quien compra seguido o en cantidad.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Familias', desc: 'Artículos para el hogar sin gastar de más.' },
              { label: 'Restaurantes y cocinas', desc: 'Utensilios, recipientes y todo para cocinar en cantidad.' },
              { label: 'Hoteles y posadas', desc: 'Equipamiento a mayoreo con entrega directa.' },
              { label: 'Escuelas y guarderías', desc: 'Mesas, sillas y artículos infantiles.' },
              { label: 'Comercios y revendedores', desc: 'Precios especiales para quien revende.' },
              { label: 'Eventos y fiestas', desc: 'Renta y venta para cualquier tipo de evento.' },
            ].map((c) => (
              <div key={c.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="font-bold text-slate-800 mb-1">{c.label}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sucursales */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Encuéntranos</div>
          <h2 className="text-3xl font-black text-slate-900">Nuestras sucursales</h2>
          <p className="text-slate-500 mt-2">Tres puntos de venta en la Península para servirte mejor</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {LOCATIONS.map((loc) => (
            <div key={loc.id} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
              <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-3">{loc.city}, {loc.state}</div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{loc.name}</h3>
              <p className="text-slate-500 text-sm mb-3 leading-relaxed">{loc.address}</p>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Icon name="phone" className="w-4 h-4 text-brand-600 shrink-0" />
                <span>{loc.phone}</span>
              </div>
              <div className="text-xs text-slate-400 mb-4">{loc.hours}</div>
              <a
                href={loc.mapsUrl}
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
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-10 text-center relative overflow-hidden">
          <h2 className="text-3xl font-black text-slate-900 mb-3">¿Tienes un negocio?</h2>
          <p className="text-slate-500 mb-6 max-w-lg mx-auto">
            Contáctanos por WhatsApp, dinos qué necesitas y cuánto, y te cotizamos sin rodeos.
            Atendemos restaurantes, escuelas, hoteles, comercios y más.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://wa.me/529994731919?text=Hola%2C%20me%20interesa%20cotizar%20por%20mayoreo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors"
            >
              Cotizar por WhatsApp
              <Icon name="arrow" className="w-4 h-4" />
            </a>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
