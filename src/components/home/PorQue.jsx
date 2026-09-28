// ============================================================
// src/components/home/PorQue.jsx
// ¿Por qué elegir CRISTASUR? — diseño propio (no copia de MAHA).
//
// Bloque dividido sobre fondo azul muy claro: a la izquierda una
// foto grande (section.image) con un sello de las sucursales; si no
// hay foto, un panel con los colores de la marca y el nombre
// CRISTASUR en vez de un cuadro vacío. A la derecha, las razones en
// tarjetas (2 columnas) con ícono y número.
// ============================================================
import Icon from '@/components/Icon'
import { LOCATIONS } from '@/lib/locations'

// Íconos que se asignan en orden a cada razón.
const ICONS = ['tag', 'box', 'truck', 'users', 'shield', 'star', 'clock', 'map']

function BrandPanel() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 overflow-hidden">
      {/* Círculos decorativos */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
      <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-accent-500/25" />
      <div className="absolute top-1/3 left-1/2 w-24 h-24 rounded-full border-[10px] border-white/10" />
      <div className="relative h-full grid place-items-center p-8 text-center text-white">
        <div>
          <div className="text-4xl md:text-5xl font-black tracking-tight">CRISTASUR</div>
          <div className="mt-2 text-xs md:text-sm uppercase tracking-[0.3em] font-bold text-white/75">
            Plásticos · Desechables · Restaurantes
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PorQue({ title, subtitle, image, items = [] }) {
  const reasons = items.slice(0, 6)
  if (!reasons.length) return null

  return (
    <div className="rounded-3xl bg-brand-50 p-4 sm:p-6 md:p-10 lg:p-12">
      <div className="grid lg:grid-cols-[5fr_7fr] gap-8 lg:gap-12 items-stretch">
        {/* ── Foto / panel de marca ── */}
        <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-full rounded-2xl overflow-hidden bg-brand-100">
          {image ? (
            <>
              <img src={image} alt={title || 'Equipo CRISTASUR'} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/50 via-transparent to-transparent" />
            </>
          ) : (
            <BrandPanel />
          )}

          {/* Sello de sucursales */}
          <div className="absolute left-4 bottom-4 right-4 sm:right-auto flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-card">
            <span className="w-10 h-10 rounded-full bg-accent-500 text-white grid place-items-center shrink-0">
              <Icon name="pin" className="w-5 h-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black text-slate-900">{LOCATIONS.length} sucursales</div>
              <div className="text-xs text-slate-500">Mérida · Tanil · Bacalar</div>
            </div>
          </div>
        </div>

        {/* ── Razones ── */}
        <div>
          {subtitle && (
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] md:text-xs uppercase tracking-widest font-bold text-brand-700 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              {subtitle}
            </div>
          )}
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.05] tracking-tight">
            {title || '¿Por qué elegir CRISTASUR?'}
          </h2>

          <ul className="mt-8 grid sm:grid-cols-2 gap-3 md:gap-4">
            {reasons.map((it, i) => (
              <li
                key={it._id || i}
                className="group relative rounded-2xl bg-white p-5 border border-brand-100 hover:border-brand-300 hover:shadow-card transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="w-11 h-11 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0 group-hover:bg-accent-500 transition-colors">
                    <Icon name={ICONS[i % ICONS.length]} className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    {it.title && <h3 className="font-black text-slate-900 leading-snug">{it.title}</h3>}
                    {it.text && <p className="mt-1 text-sm text-slate-600 leading-relaxed">{it.text}</p>}
                  </div>
                </div>
                <span className="absolute top-4 right-5 text-xs font-black text-brand-200 tabular-nums" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
