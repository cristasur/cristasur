// /contacto — Sucursales, mapas, FAQ y canales de contacto
import Icon from '@/components/Icon'
import LocationHero from '@/components/LocationHero'
import { LOCATIONS } from '@/lib/locations'

export const metadata = {
  title: 'Contacto · CRISTASUR',
  description:
    'Visítanos en Mérida y Bacalar. Pídenos por WhatsApp, llámanos, o contáctanos en redes. Horarios y direcciones.',
}

const FAQS = [
  {
    q: '¿Cómo hago un pedido?',
    a: 'Agrega productos al carrito desde la web y al final da clic en "Pedir por WhatsApp". Nos llega tu pedido pre-formateado y te respondemos con disponibilidad, costo de envío y forma de pago. También puedes escribirnos directo a WhatsApp con la lista de lo que necesitas.',
  },
  {
    q: '¿Qué formas de pago aceptan?',
    a: 'Aceptamos efectivo en sucursal, transferencia bancaria (SPEI) y depósito. Para pedidos a domicilio, se confirma la forma de pago al cotizar.',
  },
  {
    q: '¿Cuál es el mínimo para mayoreo?',
    a: 'El mayoreo se activa automáticamente al alcanzar la cantidad mínima que aparece en cada ficha de producto. Para volúmenes mayores o cotización especial, contáctanos directamente.',
  },
  {
    q: '¿Hacen envíos a domicilio?',
    a: 'Sí. Cubrimos Mérida y su zona metropolitana, Bacalar y alrededores. Otros destinos los evaluamos caso por caso. El costo y tiempo de envío se confirman al cotizar.',
  },
  {
    q: '¿Puedo recoger mi pedido en sucursal?',
    a: 'Claro. Puedes recoger en cualquiera de nuestras dos sucursales sin costo de envío. Sólo confírmanos por WhatsApp en cuál vas a recoger y cuándo.',
  },
  {
    q: '¿Atienden a restaurantes y negocios?',
    a: 'Sí. Trabajamos con restaurantes, escuelas, eventos y comercios. Para clientes recurrentes manejamos catálogo personalizado y precios especiales por volumen.',
  },
  {
    q: '¿Tienen política de devolución?',
    a: 'Aceptamos devolución de producto defectuoso o equivocado dentro de 7 días naturales, presentando el producto en su estado original. Más detalle en nuestros Términos y condiciones.',
  },
]

export default function ContactoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
      {/* Hero */}
      <section>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900">Hablemos</h1>
        <p className="text-lg text-slate-600 mt-3 max-w-2xl">
          Estamos para ayudarte a encontrar lo que necesitas. Visítanos en Mérida o Bacalar,
          o escríbenos por el medio que te quede más cómodo. Te respondemos en el día.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://wa.me/529994731919"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
          >
            <Icon name="whatsapp" className="w-5 h-5" />
            WhatsApp +52 999 473 1919
          </a>
          <a
            href="https://www.instagram.com/cristasurmx/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
          >
            <Icon name="instagram" className="w-5 h-5" />
            @cristasurmx
          </a>
        </div>
      </section>

      {/* Sucursales con imagen + mapa */}
      <section>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
          Nuestras 3 sucursales
        </h2>
        <p className="text-slate-500 mt-1">
          Visítanos físicamente en Mérida (Matriz y Tanil) o Bacalar.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {LOCATIONS.map((loc) => (
            <article
              key={loc.id}
              className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex flex-col"
            >
              {/* Hero: imagen de la sucursal con fallback al mapa */}
              <LocationHero
                image={loc.image}
                embedSrc={loc.embedSrc}
                name={loc.name}
                badge={loc.primary ? 'Matriz' : null}
                mapsUrl={loc.mapsUrl}
              />

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-slate-900">{loc.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{loc.address}</p>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                  <Icon name="clock" className="w-4 h-4" />
                  {loc.hours}
                </p>
                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <Icon name="map" className="w-4 h-4" />
                    Cómo llegar
                  </a>
                  <a
                    href={`https://wa.me/${loc.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Icon name="whatsapp" className="w-4 h-4" />
                    Pedir
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">Preguntas frecuentes</h2>
        <div className="mt-6 space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 open:shadow-card transition"
            >
              <summary className="cursor-pointer font-bold text-slate-900 flex items-center justify-between gap-3">
                <span>{f.q}</span>
                <span className="text-brand-600 text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* JSON-LD FAQ para rich snippets en Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />
    </div>
  )
}
