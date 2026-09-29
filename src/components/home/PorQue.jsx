// ============================================================
// src/components/home/PorQue.jsx
// ¿Por qué elegir CRISTASUR?
//
// Izquierda: la foto (section.image) redondeada, con manchas amarillas
// detrás y el sello azul "3 sucursales". Derecha: etiqueta (subtitle),
// título grande con la última palabra en azul, texto (data.texto) y
// las razones en tarjetas de 3 columnas: ícono en círculo de color,
// número, título, texto y una rayita del mismo color.
// ============================================================
import Icon from '@/components/Icon'
import { LOCATIONS } from '@/lib/locations'

const TEXTO_BASE = 'Todo lo que necesitas para tu hogar, negocio o restaurante, con la mejor calidad, surtido y atención.'

// Color de cada tarjeta, en orden.
const COLORES = [
  { circulo: 'bg-blue-100 text-blue-600', raya: 'bg-blue-400' },
  { circulo: 'bg-amber-100 text-amber-600', raya: 'bg-amber-400' },
  { circulo: 'bg-emerald-100 text-emerald-600', raya: 'bg-emerald-400' },
  { circulo: 'bg-rose-100 text-rose-500', raya: 'bg-rose-400' },
  { circulo: 'bg-violet-100 text-violet-600', raya: 'bg-violet-500' },
  { circulo: 'bg-sky-100 text-sky-600', raya: 'bg-sky-400' },
]

const Factura = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
)

// El ícono se elige por lo que dice el título; si no coincide, por orden.
const RESPALDO = ['tag', 'box', 'truck', 'users', 'whatsapp', 'shield']
function icono(titulo = '', i) {
  const t = titulo.toLowerCase()
  if (/factur/.test(t)) return 'factura'
  if (/whats|atenci/.test(t)) return 'whatsapp'
  if (/env[ií]o|mand|entrega/.test(t)) return 'truck'
  if (/sucursal|tienda|vis[ií]ta/.test(t)) return 'pin'
  if (/mayoreo|precio|ahorr/.test(t)) return 'tag'
  if (/surtido|variedad|cat[aá]logo/.test(t)) return 'box'
  if (/calidad|garant/.test(t)) return 'shield'
  if (/cliente|equipo|asesor/.test(t)) return 'users'
  return RESPALDO[i % RESPALDO.length]
}

function Titulo({ title }) {
  const t = (title || '¿Por qué elegir CRISTASUR?').trim()
  const corte = t.lastIndexOf(' ')
  if (corte < 1) return <span className="text-brand-700">{t}</span>
  return (
    <>
      {t.slice(0, corte)}
      <br />
      <span className="text-brand-700">{t.slice(corte + 1)}</span>
    </>
  )
}

export default function PorQue({ title, subtitle, image, items = [], texto = '' }) {
  const reasons = items.slice(0, 6)
  if (!reasons.length) return null

  return (
    <div className="relative">
      {/* Manchas amarillas detrás de la foto */}
      <div className="pointer-events-none absolute -left-4 md:-left-10 -bottom-4 w-56 h-56 md:w-72 md:h-72 rounded-full bg-amber-300" aria-hidden="true" />
      <div className="pointer-events-none absolute left-[22%] -top-6 w-56 h-40 md:w-72 md:h-48 rounded-full bg-amber-300 hidden lg:block" aria-hidden="true" />

      <div className="relative grid lg:grid-cols-[5fr_8fr] gap-8 lg:gap-12 items-stretch">
        {/* ── Foto ── */}
        <div className="relative min-h-[320px] sm:min-h-[420px] lg:min-h-full rounded-3xl overflow-hidden bg-brand-700 shadow-card-hover ring-4 ring-white">
          {image ? (
            <img src={image} alt={title || 'CRISTASUR'} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 grid place-items-center text-center text-white p-8">
              <div>
                <div className="text-4xl md:text-5xl font-black tracking-tight">CRISTASUR</div>
                <div className="mt-2 text-xs md:text-sm uppercase tracking-[0.3em] font-bold text-white/75">Plásticos · Desechables · Restaurantes · Hogar</div>
              </div>
            </div>
          )}

          {/* Sello de sucursales */}
          <div className="absolute left-4 bottom-4 flex items-center gap-3 rounded-2xl bg-brand-700 text-white px-4 py-3 shadow-lg">
            <span className="w-10 h-10 rounded-full bg-white text-brand-700 grid place-items-center shrink-0">
              <Icon name="pin" className="w-5 h-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black">{LOCATIONS.length} sucursales</div>
              <div className="text-xs text-white/85">Mérida · Tanil · Bacalar</div>
            </div>
          </div>
        </div>

        {/* ── Texto y razones ── */}
        <div className="flex flex-col justify-center">
          {subtitle && (
            <div className="self-start inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] md:text-xs uppercase tracking-widest font-bold text-brand-700">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              {subtitle}
            </div>
          )}
          <h2 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.02] tracking-tight">
            <Titulo title={title} />
          </h2>
          <p className="mt-4 max-w-xl text-slate-600 md:text-lg leading-relaxed">{texto || TEXTO_BASE}</p>

          <ul className="mt-8 grid sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {reasons.map((it, i) => {
              const c = COLORES[i % COLORES.length]
              const ic = icono(it.title, i)
              return (
                <li key={it._id || i}
                  className="relative rounded-2xl bg-white border border-slate-100 shadow-card p-5 flex flex-col hover:-translate-y-0.5 hover:shadow-card-hover transition-all">
                  <span className="absolute top-4 right-5 text-sm font-black text-slate-200 tabular-nums" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`w-12 h-12 rounded-full grid place-items-center ${c.circulo}`}>
                    {ic === 'factura' ? <Factura className="w-6 h-6" /> : <Icon name={ic} className="w-6 h-6" />}
                  </span>
                  {it.title && <h3 className="mt-4 font-black text-slate-900 leading-snug">{it.title}</h3>}
                  {it.text && <p className="mt-1.5 text-sm text-slate-500 leading-relaxed flex-1">{it.text}</p>}
                  <span className={`mt-4 h-1 w-10 rounded-full ${c.raya}`} aria-hidden="true" />
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
