// ============================================================
// /envios — Política de envíos y devoluciones CRISTASUR
// ============================================================
import Link from 'next/link'
import Icon from '@/components/Icon'

export const metadata = {
  title: 'Envíos y devoluciones | CRISTASUR Mérida',
  description:
    'Conoce nuestra política de envíos y devoluciones. Enviamos a toda la república mexicana. El costo y la opción de envío se acuerdan contigo directamente por WhatsApp.',
}

const PASOS = [
  {
    num: '1',
    title: 'Haz tu pedido',
    desc: 'Agrega los productos a tu carrito y envíanos tu pedido por WhatsApp. Te llegará un mensaje con el resumen completo.',
  },
  {
    num: '2',
    title: 'Te cotizamos el envío',
    desc: 'Nuestro equipo te propone las opciones de envío disponibles para tu zona: paquetería, flete o recogida en sucursal.',
  },
  {
    num: '3',
    title: 'Eliges y confirmamos',
    desc: 'Tú eliges la opción que más te convenga según costo y tiempo de entrega. Confirmamos y coordinamos la salida.',
  },
  {
    num: '4',
    title: 'Recibe tu pedido',
    desc: 'Te compartimos el número de guía para que puedas rastrear tu paquete hasta que llegue a tu puerta.',
  },
]

const FAQ = [
  {
    q: '¿Envían a todo México?',
    a: 'Sí, hacemos envíos a toda la república mexicana. El costo y el tiempo de entrega varían según tu estado y el peso del pedido.',
  },
  {
    q: '¿Cuánto cuesta el envío?',
    a: 'El costo depende de tu ubicación, el peso y las dimensiones del paquete. Te lo cotizamos directamente por WhatsApp sin compromiso.',
  },
  {
    q: '¿Puedo recoger en sucursal?',
    a: 'Claro que sí. Tenemos 3 sucursales en Mérida: Matriz (Leandro Valle), Chuburná y Carretera Campeche. La recolección en tienda es sin costo de envío.',
  },
  {
    q: '¿Cuánto tarda en llegar?',
    a: 'Los pedidos locales en Mérida se pueden entregar el mismo día o al día siguiente. Envíos foráneos generalmente tardan entre 2 y 5 días hábiles según la paquetería elegida.',
  },
  {
    q: '¿Qué paqueterías manejan?',
    a: 'Trabajamos con las principales paqueterías según disponibilidad en tu zona. Te ofrecemos las opciones disponibles para que elijas la que más te convenga.',
  },
  {
    q: '¿Hacen envíos a mayoreo?',
    a: 'Sí. Para pedidos grandes coordinamos fletes especiales que resultan más económicos. Contáctanos para una cotización personalizada.',
  },
]

export default function EnviosPage() {
  const waLink =
    'https://wa.me/529994731919?text=Hola%2C%20me%20gustar%C3%ADa%20cotizar%20un%20env%C3%ADo'

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 grid place-items-center mx-auto mb-5">
            <Icon name="truck" className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900">Envíos y devoluciones</h1>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
            Enviamos a toda la república. El costo y la opción de envío los acordamos
            contigo directamente por WhatsApp para encontrar la mejor alternativa.
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Proceso de envío</div>
          <h2 className="text-3xl font-black text-slate-900">¿Cómo funciona?</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PASOS.map((p) => (
            <div key={p.num} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 relative">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-black text-lg grid place-items-center mb-4">
                {p.num}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA WhatsApp */}
        <div className="mt-10 text-center">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base shadow-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Cotizar envío por WhatsApp
          </a>
        </div>
      </section>

      {/* Info de envío local */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-14 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-50 grid place-items-center mx-auto mb-3">
              <Icon name="location" className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Mérida y área metropolitana</h3>
            <p className="text-slate-500 text-sm">Entrega el mismo día o siguiente día hábil. Coordinamos directamente contigo.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-brand-50 grid place-items-center mx-auto mb-3">
              <Icon name="truck" className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Interior de la república</h3>
            <p className="text-slate-500 text-sm">2 a 5 días hábiles según la paquetería y destino. Te compartimos la guía de rastreo.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 grid place-items-center mx-auto mb-3">
              <Icon name="box" className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Recoger en sucursal</h3>
            <p className="text-slate-500 text-sm">Sin costo de envío. Pasa por tu pedido en cualquiera de nuestras 3 sucursales en Mérida.</p>
          </div>
        </div>
      </section>

      {/* Devoluciones */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 grid place-items-center shrink-0">
              <Icon name="shield" className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Política de devoluciones</h2>
          </div>
          <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              En CRISTASUR nos importa que estés satisfecho con tu compra. Si recibes un producto
              con defecto de fábrica o diferente al descrito, contáctanos dentro de los
              <strong> 3 días naturales</strong> siguientes a la recepción.
            </p>
            <p>
              Para iniciar una devolución escríbenos por WhatsApp con:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Número de pedido o captura de la conversación</li>
              <li>Fotografía del producto y del empaque</li>
              <li>Descripción del problema</li>
            </ul>
            <p>
              Revisaremos tu caso y te daremos solución — ya sea reposición del producto,
              nota de crédito o reembolso, según corresponda.
            </p>
            <p className="text-slate-400 text-xs border-t border-slate-100 pt-4 mt-4">
              Nota: No se aceptan devoluciones por cambio de opinión una vez recibido el producto.
              Los productos deben estar sin uso y en su empaque original para ser aceptados.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-brand-600 font-bold mb-2">Preguntas frecuentes</div>
          <h2 className="text-3xl font-black text-slate-900">Dudas sobre envíos</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="bg-white rounded-2xl border border-slate-100 shadow-card group"
            >
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-slate-900 list-none select-none">
                {item.q}
                <Icon name="arrow" className="w-4 h-4 text-slate-400 rotate-90 group-open:rotate-[270deg] transition-transform shrink-0 ml-3" />
              </summary>
              <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-3">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm mb-4">¿Tienes alguna otra duda?</p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors"
          >
            Contáctanos
            <Icon name="arrow" className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  )
}
