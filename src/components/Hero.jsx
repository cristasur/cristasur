// Hero principal de la home
import Link from 'next/link'
import Icon from './Icon'

export default function Hero({ categories = [] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -right-20 w-[28rem] h-[28rem] bg-accent-500/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] bg-brand-400/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-widest mb-6 backdrop-blur">
            Tienda en línea
          </span>
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
            Todo para tu <span className="text-accent-300">hogar</span> y tu <span className="text-accent-300">negocio</span>.
          </h1>
          <p className="mt-6 text-lg text-brand-100 max-w-xl">
            Plásticos, mesas, sillas, juguetes y desechables. Precios al mayoreo,
            calidad que dura y envío a toda la república.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-semibold shadow-lg"
            >
              Ver catálogo
              <Icon name="arrow" className="w-4 h-4" />
            </Link>
            <Link
              href="/productos?featured=1"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold backdrop-blur"
            >
              Productos destacados
            </Link>
          </div>

          {/* Beneficios */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
            {[
              { icon: 'tag',   t: 'Precios de mayoreo' },
              { icon: 'truck', t: 'Envío nacional' },
              { icon: 'shield', t: 'Calidad garantizada' },
            ].map((b) => (
              <div key={b.t} className="text-sm">
                <Icon name={b.icon} className="w-6 h-6 text-accent-300" />
                <div className="mt-2 font-semibold">{b.t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid de categorías preview */}
        <div className="grid grid-cols-2 gap-3">
          {categories.slice(0, 4).map((c, i) => (
            <Link
              key={c._id}
              href={`/categoria/${c.slug}`}
              className={`group relative overflow-hidden aspect-[5/4] rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex flex-col justify-end hover:bg-white/15 transition ${i === 1 ? 'md:translate-y-6' : ''} ${i === 2 ? 'md:-translate-y-6' : ''}`}
            >
              {c.image ? (
                <>
                  <img
                    src={c.image}
                    alt={c.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
                </>
              ) : c.icon ? (
                <div className="absolute inset-0 grid place-items-center text-6xl opacity-70">
                  {c.icon}
                </div>
              ) : null}
              <div className="relative p-5">
                <span className="text-[10px] uppercase tracking-widest text-white/70">
                  Categoría
                </span>
                <div className="text-xl font-bold leading-tight mt-1">{c.name}</div>
                <div className="text-sm text-white/80 mt-1 flex items-center gap-1 group-hover:text-white">
                  Explorar
                  <Icon name="arrow" className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
