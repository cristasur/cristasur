// ============================================================
// /quienes-somos — Conócenos.
// Las fotos se cambian en Admin → Fotos de páginas (con encuadre).
// ============================================================
import Link from 'next/link'
import Icon from '@/components/Icon'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { LOCATIONS } from '@/lib/locations'
import { imagenesPaginas } from '@/lib/imagenesPaginas'
import { estiloEncuadre } from '@/lib/encuadre'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Conócenos | CRISTASUR Mérida',
  description:
    'CRISTASUR, empresa 100% yucateca con más de 10 años equipando hogares, restaurantes y negocios con plásticos, vajilla y artículos para el hogar al mayoreo y menudeo.',
}

const trazo = (d) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)

const VALORES = [
  { t: 'Calidad', d: 'Seleccionamos productos duraderos y funcionales.',
    i: trazo(<><circle cx="12" cy="9" r="5" /><path d="m9 13-2 8 5-3 5 3-2-8" /></>) },
  { t: 'Cercanía', d: 'Estamos contigo en cada paso, antes y después de tu compra.',
    i: trazo(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8.3 5 2.6 5 5.5" /></>) },
  { t: 'Variedad', d: 'Todo lo que necesitas para tu hogar y negocio, en un solo lugar.',
    i: trazo(<><path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" /><path d="M3 7.5V16.5L12 21l9-4.5V7.5M12 12v9" /></>) },
  { t: 'Compromiso', d: 'Con nuestros clientes, con la comunidad y con el desarrollo de Yucatán.',
    i: trazo(<><path d="m11 17 2 2a2 2 0 0 0 3-3" /><path d="m14 14 2.5 2.5a2 2 0 0 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a2 2 0 0 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7-.9L21 7M3 7l4.5-2.2a5 5 0 0 1 4 .1M3 13l4 4" /></>) },
]

async function contarProductos() {
  try {
    await dbConnect()
    return await Product.countDocuments({ active: true, deleted: { $ne: true }, $or: [{ status: { $exists: false } }, { status: 'published' }] })
  } catch {
    return 0
  }
}

export default async function QuienesSomosPage() {
  const [img, total] = await Promise.all([imagenesPaginas(), contarProductos()])
  const redondeo = total >= 1000 ? `${(Math.floor(total / 500) * 500).toLocaleString('es-MX')}+` : total ? `${total}` : 'Miles de'

  const DATOS = [
    { n: redondeo, t: 'Productos disponibles', i: trazo(<><path d="M3 9h18l-1.5-5h-15L3 9Z" /><path d="M4 9v11h16V9M9 20v-6h6v6" /></>) },
    { n: `${LOCATIONS.length} sucursales`, t: 'Mérida, Tanil y Bacalar', i: trazo(<><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></>) },
    { n: '+10 años', t: 'Equipando hogares y negocios', i: trazo(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8.3 5 2.6 5 5.5" /></>) },
    { n: 'Envíos', t: 'A todo México, directo a tu puerta', i: trazo(<><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17.5" cy="18" r="1.8" /></>) },
  ]

  return (
    <div className="bg-white">
      {/* ── Portada ───────────────────────────────────────────── */}
      <section className="relative h-[340px] md:h-[420px] overflow-hidden bg-slate-900">
        <img src={img['conocenos.hero'].url} alt="" className="absolute inset-0 w-full h-full object-cover" style={estiloEncuadre(img['conocenos.hero'].pos)} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/10" />
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center text-white">
          <nav className="text-sm text-white/80 mb-4">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span className="mx-2">›</span>
            <span>Conócenos</span>
          </nav>
          <h1 className="text-4xl md:text-6xl font-black">Conócenos</h1>
          <p className="mt-3 text-lg md:text-xl text-white/90 max-w-xl">
            En CRISTASUR creemos que un mejor hogar y un negocio más productivo comienzan con los artículos correctos.
          </p>
        </div>
      </section>

      {/* ── Historia · tienda · valores ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 grid lg:grid-cols-[1.1fr_1fr_0.95fr] gap-8 items-stretch">
        <div className="flex flex-col justify-center">
          <div className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Nuestra historia</div>
          <h2 className="mt-2 text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            Un proyecto yucateco para hacer tu vida más fácil
          </h2>
          <p className="mt-5 text-slate-600 leading-relaxed">
            CRISTASUR nace en Mérida, Yucatán, con el propósito de ofrecer artículos para el hogar y negocio que combinen
            calidad, variedad y buen precio. Desde nuestros inicios hemos trabajado para ser un aliado confiable, con
            productos que se adaptan a las necesidades de cada espacio, en menudeo y mayoreo.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Nos mueve la idea de que cada hogar, oficina, restaurante o comercio pueda encontrar en un solo lugar las
            herramientas para crecer, organizarse y disfrutar más.
          </p>
          <div className="mt-7">
            <Link href="/productos"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3.5 transition">
              Ver productos <Icon name="arrow" className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="relative min-h-[360px] rounded-2xl overflow-hidden bg-slate-100 shadow-card">
          <img src={img['conocenos.tienda'].url} alt="Tienda CRISTASUR" className="absolute inset-0 w-full h-full object-cover" style={estiloEncuadre(img['conocenos.tienda'].pos)} />
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 md:p-7">
          <h3 className="text-xl font-black text-slate-900 mb-4">Nuestros valores</h3>
          <ul className="space-y-5">
            {VALORES.map((v) => (
              <li key={v.t} className="flex gap-4">
                <span className="w-12 h-12 shrink-0 rounded-full bg-white border border-slate-200 text-slate-800 grid place-items-center">{v.i}</span>
                <div>
                  <div className="font-bold text-slate-900">{v.t}</div>
                  <div className="text-sm text-slate-600 leading-snug">{v.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Datos ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-200">
          {DATOS.map((d) => (
            <div key={d.t} className="flex items-center gap-4 lg:px-6 first:lg:pl-0">
              <span className="text-slate-800 shrink-0 [&_svg]:w-10 [&_svg]:h-10">{d.i}</span>
              <div>
                <div className="font-black text-slate-900 text-lg md:text-xl leading-tight">{d.n}</div>
                <div className="text-[13px] text-slate-500 leading-snug">{d.t}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sucursales ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">Visítanos</h2>
          <Link href="/contacto" className="text-sm font-bold text-slate-900 hover:text-brand-700 inline-flex items-center gap-1">
            Contacto <Icon name="chevron" className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {LOCATIONS.map((l) => (
            <a key={l.id} href={l.mapsUrl} target="_blank" rel="noopener noreferrer"
              className="group flex gap-3 rounded-2xl border border-slate-200 p-5 hover:border-brand-300 hover:shadow-card transition">
              <span className="w-10 h-10 shrink-0 rounded-full bg-brand-50 text-brand-700 grid place-items-center"><Icon name="pin" className="w-5 h-5" /></span>
              <div>
                <div className="font-bold text-slate-900">{l.name}</div>
                <div className="text-sm text-slate-600 leading-snug">{l.address}</div>
                <div className="text-xs text-slate-500 mt-1">{l.hours}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
