// /contacto — Sucursales, mapas, FAQ y canales de contacto
import Icon from '@/components/Icon'
import LocationHero from '@/components/LocationHero'
import { LOCATIONS } from '@/lib/locations'
import ContactForm from '@/components/ContactForm'

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

const WA = 'https://wa.me/529994731919'
const TEL = '+52 999 473 1919'
const CORREO = 'cristasur@live.com.mx'

function Circulo({ children }) {
  return (
    <span className="w-12 h-12 shrink-0 rounded-full bg-brand-50 text-brand-700 grid place-items-center">{children}</span>
  )
}

function Canal({ icono, titulo, detalle, valor, boton, href, externo = true }) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-slate-100 last:border-0">
      <Circulo>{icono}</Circulo>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900">{titulo}</div>
        <div className="text-[13px] text-slate-500 leading-snug">{detalle}</div>
        <div className="mt-1.5 font-bold text-slate-900 text-[15px] break-words">{valor}</div>
      </div>
      <a href={href} {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="shrink-0 self-center inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 transition">
        {boton}
      </a>
    </div>
  )
}

const svg = (d, cls = 'w-5 h-5') => (
  <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)

export default function ContactoPage() {
  const matriz = LOCATIONS.find((l) => l.primary) || LOCATIONS[0]
  return (
    <div>
      {/* ── Encabezado con foto ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
        <div className="absolute inset-y-0 right-0 w-full md:w-[60%]">
          <img src="/locations/tanil.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/70 to-transparent md:via-slate-50/10" />
          <p className="hidden md:block absolute right-10 bottom-8 -rotate-6 text-white text-3xl lg:text-4xl font-serif italic leading-tight drop-shadow-lg text-right">
            Tu espacio,<br />nuestro compromiso
          </p>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="max-w-xl">
            <div className="text-xs font-bold tracking-[0.2em] text-brand-700 uppercase">Contacto</div>
            <h1 className="mt-2 text-4xl md:text-6xl font-black text-slate-900 leading-[1.05]">
              Estamos para<br /><span className="text-brand-600">ayudarte</span>
            </h1>
            <p className="mt-4 text-lg text-slate-700 max-w-md">
              ¿Tienes alguna duda, comentario o necesitas una cotización? Escríbenos, llámanos o visítanos.
              Será un gusto atenderte.
            </p>
          </div>
        </div>
      </section>

      {/* ── Canales · formulario · tienda ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10 md:py-14 grid lg:grid-cols-[1fr_1.15fr_1fr] gap-8 lg:gap-10 items-start">
        {/* Canales */}
        <div>
          <Canal icono={<Icon name="whatsapp" className="w-5 h-5" />} titulo="WhatsApp"
            detalle="Escríbenos y te respondemos en minutos." valor={TEL} boton={<><Icon name="whatsapp" className="w-4 h-4" /> Chatear</>} href={WA} />
          <Canal icono={<Icon name="phone" className="w-5 h-5" />} titulo="Teléfono"
            detalle={matriz.hours} valor={TEL} boton={<><Icon name="phone" className="w-4 h-4" /> Llamar</>} href="tel:+529994731919" externo={false} />
          <Canal icono={<Icon name="mail" className="w-5 h-5" />} titulo="Correo electrónico"
            detalle="Te respondemos en menos de 24 horas." valor={CORREO} boton={<><Icon name="mail" className="w-4 h-4" /> Enviar correo</>} href={`mailto:${CORREO}`} externo={false} />
          <Canal icono={<Icon name="pin" className="w-5 h-5" />} titulo="Visítanos"
            detalle={matriz.address} valor="Mérida · Tanil · Bacalar" boton={<><Icon name="map" className="w-4 h-4" /> Cómo llegar</>} href={matriz.mapsUrl} />

          <div className="mt-5 flex items-center gap-3">
            <a href="https://www.instagram.com/cristasurmx/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-slate-900 text-white grid place-items-center hover:bg-brand-700"><Icon name="instagram" className="w-5 h-5" /></a>
            <a href="https://www.facebook.com/CristasurMX/?locale=es_LA" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-slate-900 text-white grid place-items-center hover:bg-brand-700"><Icon name="facebook" className="w-5 h-5" /></a>
            <div className="text-[13px] text-slate-600 leading-tight">Síguenos en redes<br /><b className="text-slate-900">@cristasurmx</b></div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 md:p-7">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Envíanos un mensaje</h2>
          <p className="mt-1 mb-5 text-slate-600 text-[15px]">Completa el formulario y nos pondremos en contacto contigo a la brevedad.</p>
          <ContactForm />
        </div>

        {/* Tienda, mapa y confianza */}
        <div className="space-y-4">
          <a href={matriz.mapsUrl} target="_blank" rel="noopener noreferrer" className="group relative block h-64 rounded-2xl overflow-hidden bg-slate-200">
            <img src={matriz.image} alt={matriz.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="absolute left-4 right-4 bottom-4 flex items-start gap-3 text-white">
              <span className="mt-0.5"><Icon name="pin" className="w-5 h-5" /></span>
              <div>
                <div className="font-bold">Nuestra tienda matriz</div>
                <div className="text-[13px] text-white/85 leading-snug">{matriz.address}</div>
              </div>
            </div>
          </a>

          <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <iframe src={matriz.embedSrc} title="Mapa de CRISTASUR Matriz" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full border-0" />
            <div className="absolute right-3 top-3 flex items-center gap-2 rounded-xl bg-white shadow-card px-3 py-2">
              <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center">
                {svg(<><path d="M3 21h18M5 21V8l7-5 7 5v13" /><path d="M9 21v-6h6v6" /></>, 'w-4 h-4')}
              </span>
              <div className="leading-tight">
                <div className="text-[12px] font-bold text-slate-900">3 sucursales</div>
                <div className="text-[11px] text-slate-500">Mérida, Tanil y Bacalar</div>
              </div>
            </div>
          </div>

          <a href="#preguntas" className="flex items-center gap-3 rounded-2xl bg-brand-50 border border-brand-100 p-4 hover:bg-brand-100/60 transition">
            <span className="w-10 h-10 shrink-0 rounded-full bg-white text-brand-700 grid place-items-center">
              {svg(<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />)}
            </span>
            <div className="flex-1">
              <div className="font-bold text-slate-900 text-[15px]">Tu confianza es importante</div>
              <div className="text-[13px] text-slate-600 leading-snug">Si tienes alguna situación con tu compra, escríbenos. Estamos aquí para ayudarte.</div>
            </div>
            <Icon name="chevron" className="w-4 h-4 text-slate-500" />
          </a>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-14 space-y-14">
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
      <section id="preguntas" className="scroll-mt-28">
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
    </div>
  )
}
