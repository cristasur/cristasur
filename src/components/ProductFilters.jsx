'use client'
// ============================================================
// ProductFilters — filtros de la izquierda, estilo MAHA.
//
// · Cada grupo se abre/cierra con − / +.
// · Casillas con el número de productos a la derecha.
// · "Mostrar más" después de 6 opciones.
// · Color con su muestra (incluye Dorado, Plata, Talavera, Varios).
// · Precio con barra de dos puntas y cajas de texto.
// · Se aplica al instante: cada clic actualiza la URL (sin botón).
//
// En celular: botón "Filtrar (n)" que abre un panel de pantalla
// completa con los mismos grupos y un botón "Ver N productos".
//
// Los datos vienen de lib/catalogo.js (facetas con conteos).
// ============================================================
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Icon from './Icon'

const VISIBLES = 6
const SEP = '~'
const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)

// ── Hook: leer y cambiar la URL ─────────────────────────────
function useFiltrosUrl(basePath) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [pendiente, startTransition] = useTransition()
  const ruta = basePath || pathname

  const ir = (params) => {
    params.delete('page')
    const qs = params.toString()
    startTransition(() => router.push(qs ? `${ruta}?${qs}` : ruta, { scroll: false }))
  }
  const copia = () => new URLSearchParams(sp.toString())

  return {
    pendiente,
    todos: (k) => sp.getAll(k).flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean),
    valor: (k) => sp.get(k) || '',
    alternar(k, v) {
      const p = copia()
      const actuales = p.getAll(k).flatMap((x) => x.split(',')).map((x) => x.trim()).filter(Boolean)
      p.delete(k)
      const nuevos = actuales.includes(v) ? actuales.filter((x) => x !== v) : [...actuales, v]
      nuevos.forEach((x) => p.append(k, x))
      ir(p)
    },
    bandera(k, activo) {
      const p = copia()
      if (activo) p.set(k, '1'); else p.delete(k)
      ir(p)
    },
    precio(min, max) {
      const p = copia()
      if (min != null && min !== '') p.set('minPrice', String(min)); else p.delete('minPrice')
      if (max != null && max !== '') p.set('maxPrice', String(max)); else p.delete('maxPrice')
      ir(p)
    },
    quitar(...claves) {
      const p = copia()
      claves.forEach((k) => p.delete(k))
      ir(p)
    },
    limpiar() {
      const p = copia()
      const q = p.get('q')
      const sort = p.get('sort')
      const nueva = new URLSearchParams()
      if (q) nueva.set('q', q)
      if (sort) nueva.set('sort', sort)
      ir(nueva)
    },
  }
}

// ── Piezas visuales ─────────────────────────────────────────
function Grupo({ titulo, abierto: inicial = true, marcados = 0, children }) {
  const [abierto, setAbierto] = useState(inicial)
  return (
    <section className="border-b border-slate-200 py-4">
      <button type="button" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}
        className="w-full flex items-center justify-between text-left">
        <span className="font-bold text-slate-900 text-[15px]">
          {titulo}
          {marcados > 0 && <span className="ml-2 text-[11px] font-bold text-white bg-brand-600 rounded-full px-1.5 py-0.5 align-middle">{marcados}</span>}
        </span>
        <span className="text-xl leading-none text-slate-700 w-5 text-center" aria-hidden="true">{abierto ? '−' : '+'}</span>
      </button>
      {abierto && <div className="mt-3">{children}</div>}
    </section>
  )
}

function Casilla({ marcado, onClick, children, count, sangria = false, deshabilitado = false }) {
  return (
    <button type="button" onClick={onClick} disabled={deshabilitado} role="checkbox" aria-checked={marcado}
      className={`w-full flex items-center gap-3 py-1.5 text-left group ${sangria ? 'pl-5' : ''} ${deshabilitado ? 'opacity-40' : ''}`}>
      <span className={`w-5 h-5 shrink-0 rounded border-2 grid place-items-center transition-colors
        ${marcado ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-400 group-hover:border-slate-700'}`}>
        {marcado && <Icon name="check" className="w-3.5 h-3.5 text-white" />}
      </span>
      <span className={`flex-1 min-w-0 text-[14.5px] leading-snug ${marcado ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>{children}</span>
      {count != null && <span className="text-[13px] text-slate-500 tabular-nums">{count}</span>}
    </button>
  )
}

function ListaOpciones({ opciones, marcados, onToggle, render }) {
  const [todas, setTodas] = useState(false)
  // Las marcadas siempre a la vista aunque estén después de las 6.
  const visibles = todas ? opciones : [
    ...opciones.slice(0, VISIBLES),
    ...opciones.slice(VISIBLES).filter((o) => marcados.includes(o.value)),
  ]
  return (
    <div>
      {visibles.map((o) => (
        <Casilla key={o.value} marcado={marcados.includes(o.value)} count={o.count} sangria={o.nivel === 1}
          deshabilitado={!o.count && !marcados.includes(o.value)} onClick={() => onToggle(o.value)}>
          {render ? render(o) : o.label}
        </Casilla>
      ))}
      {opciones.length > VISIBLES && (
        <button type="button" onClick={() => setTodas((t) => !t)}
          className="mt-2 text-[14px] font-semibold text-slate-900 underline underline-offset-4 hover:text-brand-700">
          {todas ? 'Mostrar menos' : 'Mostrar más'}
        </button>
      )}
    </div>
  )
}

function Muestra({ css, claro }) {
  return (
    <span className={`inline-block w-5 h-5 rounded-[4px] shrink-0 align-middle ${claro ? 'ring-1 ring-slate-300' : ''}`}
      style={{ background: css }} aria-hidden="true" />
  )
}

// ── Precio: barra de dos puntas + cajas ─────────────────────
function Precio({ limite, min, max, onAplicar }) {
  const tope = Math.max(1, limite.max || 0)
  const [a, setA] = useState(min ?? 0)
  const [b, setB] = useState(max ?? tope)
  useEffect(() => { setA(min ?? 0); setB(max ?? tope) }, [min, max, tope])

  const aplicar = (x = a, y = b) => {
    const lo = Math.max(0, Math.min(Number(x) || 0, Number(y) || 0))
    const hi = Math.max(Number(x) || 0, Number(y) || 0)
    onAplicar(lo > 0 ? lo : '', hi < tope ? hi : '')
  }
  const pa = Math.min(100, (Number(a) / tope) * 100)
  const pb = Math.min(100, (Number(b) / tope) * 100)

  return (
    <div>
      <p className="text-[14px] text-slate-500 mb-4">El precio más alto es {fmt(tope)} mxn</p>
      <div className="relative h-6 mx-2">
        <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1 rounded bg-slate-200" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1 rounded bg-slate-900" style={{ left: `${pa}%`, right: `${100 - pb}%` }} />
        {[['a', a, setA], ['b', b, setB]].map(([k, v, set]) => (
          <input key={k} type="range" min="0" max={tope} step="1" value={v} aria-label={k === 'a' ? 'Precio mínimo' : 'Precio máximo'}
            onChange={(e) => set(Number(e.target.value))}
            onMouseUp={() => aplicar()} onTouchEnd={() => aplicar()} onKeyUp={() => aplicar()}
            className="rango-doble absolute inset-0 w-full appearance-none bg-transparent pointer-events-none" />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-slate-500">$</span>
        <input type="number" inputMode="numeric" min="0" value={a} onChange={(e) => setA(e.target.value)}
          onBlur={() => aplicar()} onKeyDown={(e) => e.key === 'Enter' && aplicar()}
          className="w-full min-w-0 rounded-full bg-slate-100 px-4 py-2.5 text-slate-700 text-[15px] focus:outline-none focus:ring-2 focus:ring-slate-300" />
        <span className="text-slate-500">$</span>
        <input type="number" inputMode="numeric" min="0" value={b} onChange={(e) => setB(e.target.value)}
          onBlur={() => aplicar()} onKeyDown={(e) => e.key === 'Enter' && aplicar()}
          className="w-full min-w-0 rounded-full bg-slate-100 px-4 py-2.5 text-slate-700 text-[15px] focus:outline-none focus:ring-2 focus:ring-slate-300" />
      </div>
      <style jsx>{`
        .rango-doble::-webkit-slider-thumb { pointer-events: auto; -webkit-appearance: none; width: 20px; height: 20px; border-radius: 9999px; background: #fff; border: 2px solid #0f172a; cursor: pointer; }
        .rango-doble::-moz-range-thumb { pointer-events: auto; width: 18px; height: 18px; border-radius: 9999px; background: #fff; border: 2px solid #0f172a; cursor: pointer; }
      `}</style>
    </div>
  )
}

// ── Contenido de los filtros (se usa en compu y en el panel del cel) ─
function Grupos({ facetas, url, hideCategory }) {
  const cats = url.todos('category')
  const marcas = url.todos('brand')
  const mats = url.todos('material')
  const colores = url.todos('color')
  const specsMarcadas = url.todos('spec')
  const minP = url.valor('minPrice')
  const maxP = url.valor('maxPrice')

  return (
    <>
      <Grupo titulo="Precio" marcados={minP || maxP ? 1 : 0}>
        <Precio limite={facetas.precio} min={minP === '' ? null : Number(minP)} max={maxP === '' ? null : Number(maxP)}
          onAplicar={(lo, hi) => url.precio(lo, hi)} />
      </Grupo>

      {(facetas.nuevo > 0 || url.valor('nuevo')) && (
        <Grupo titulo="Nuevo" marcados={url.valor('nuevo') ? 1 : 0}>
          <Casilla marcado={url.valor('nuevo') === '1'} count={facetas.nuevo} onClick={() => url.bandera('nuevo', url.valor('nuevo') !== '1')}>Nuevo</Casilla>
        </Grupo>
      )}

      {!hideCategory && facetas.categorias.length > 0 && (
        <Grupo titulo="Categoría" marcados={cats.length}>
          <ListaOpciones opciones={facetas.categorias} marcados={cats} onToggle={(v) => url.alternar('category', v)} />
        </Grupo>
      )}
      {hideCategory && facetas.categorias.length > 1 && (
        <Grupo titulo="Subcategoría" marcados={cats.length}>
          <ListaOpciones opciones={facetas.categorias} marcados={cats} onToggle={(v) => url.alternar('category', v)} />
        </Grupo>
      )}

      {facetas.materiales.length > 0 && (
        <Grupo titulo="Material" marcados={mats.length}>
          <ListaOpciones opciones={facetas.materiales} marcados={mats} onToggle={(v) => url.alternar('material', v)} />
        </Grupo>
      )}

      {facetas.specs.map((g) => {
        const marcadosG = specsMarcadas.filter((s) => s.startsWith(g.label + SEP)).map((s) => s.slice(g.label.length + 1))
        return (
          <Grupo key={g.label} titulo={g.label} marcados={marcadosG.length}>
            <ListaOpciones opciones={g.values} marcados={marcadosG} onToggle={(v) => url.alternar('spec', `${g.label}${SEP}${v}`)} />
          </Grupo>
        )
      })}

      {facetas.colores.length > 0 && (
        <Grupo titulo="Color" marcados={colores.length}>
          <ListaOpciones opciones={facetas.colores} marcados={colores} onToggle={(v) => url.alternar('color', v)}
            render={(o) => (
              <span className="inline-flex items-center gap-3">
                <Muestra css={o.css} claro={['Blanco', 'Hueso', 'Transparente', 'Beige', 'Plata', 'Talavera', 'Varios'].includes(o.label) || !o.conocido} />
                {o.label}
              </span>
            )} />
        </Grupo>
      )}

      {facetas.marcas.length > 0 && (
        <Grupo titulo="Marca" marcados={marcas.length}>
          <ListaOpciones opciones={facetas.marcas} marcados={marcas} onToggle={(v) => url.alternar('brand', v)} />
        </Grupo>
      )}

      <Grupo titulo="Disponibilidad" marcados={['inStock', 'onSale', 'featured'].filter((k) => url.valor(k)).length}>
        <Casilla marcado={url.valor('inStock') === '1'} count={facetas.stock} onClick={() => url.bandera('inStock', url.valor('inStock') !== '1')}>En existencia</Casilla>
        <Casilla marcado={url.valor('onSale') === '1'} count={facetas.oferta} deshabilitado={!facetas.oferta && url.valor('onSale') !== '1'}
          onClick={() => url.bandera('onSale', url.valor('onSale') !== '1')}>En oferta</Casilla>
        <Casilla marcado={url.valor('featured') === '1'} onClick={() => url.bandera('featured', url.valor('featured') !== '1')}>Destacados</Casilla>
      </Grupo>
    </>
  )
}

export default function ProductFilters({ facetas, total = 0, marcados = 0, basePath, hideCategory = false }) {
  const url = useFiltrosUrl(basePath)
  const [panel, setPanel] = useState(false)

  useEffect(() => {
    if (!panel) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e) => e.key === 'Escape' && setPanel(false)
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc) }
  }, [panel])

  if (!facetas) return null

  return (
    <>
      {/* Celular: botón que abre el panel */}
      <div className="lg:hidden flex items-center gap-2">
        <button type="button" onClick={() => setPanel(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-900">
          <Icon name="filter" className="w-4 h-4" /> Filtrar{marcados ? ` (${marcados})` : ''}
        </button>
        {marcados > 0 && (
          <button type="button" onClick={url.limpiar} className="px-4 py-2.5 text-sm font-semibold text-slate-600 underline">Limpiar</button>
        )}
      </div>

      {/* Compu: columna fija */}
      <div className={`hidden lg:block transition-opacity ${url.pendiente ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between pb-2">
          <span className="inline-flex items-center gap-2 font-bold text-slate-900"><Icon name="filter" className="w-4 h-4" /> Filtrar</span>
          {marcados > 0 && (
            <button type="button" onClick={url.limpiar} className="text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-900">
              Limpiar todo
            </button>
          )}
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-3 -mr-3 [scrollbar-width:thin]">
          <Grupos facetas={facetas} url={url} hideCategory={hideCategory} />
        </div>
      </div>

      {/* Panel del celular */}
      {panel && (
        <div className="lg:hidden fixed inset-0 z-[80] bg-white flex flex-col" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <span className="font-black text-lg text-slate-900">Filtrar</span>
            <button type="button" onClick={() => setPanel(false)} aria-label="Cerrar" className="w-10 h-10 grid place-items-center rounded-full hover:bg-slate-100">
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
          <div className={`flex-1 overflow-y-auto px-5 transition-opacity ${url.pendiente ? 'opacity-60' : ''}`}>
            <Grupos facetas={facetas} url={url} hideCategory={hideCategory} />
          </div>
          <div className="border-t border-slate-200 p-4 flex gap-3">
            {marcados > 0 && (
              <button type="button" onClick={url.limpiar} className="px-5 py-3 rounded-full border border-slate-300 font-semibold text-slate-700">Limpiar</button>
            )}
            <button type="button" onClick={() => setPanel(false)} className="flex-1 py-3 rounded-full bg-slate-900 text-white font-bold">
              {url.pendiente ? 'Buscando…' : `Ver ${total} ${total === 1 ? 'producto' : 'productos'}`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
