'use client'
// ============================================================
// CatalogoBarra — arriba de la cuadrícula del catálogo:
//   "588 productos" · chips de filtros activos (se quitan con ×)
//   · "Ordenar por".
// Y CatalogoPaginas — números de página abajo.
// ============================================================
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { normalizarColor } from '@/lib/colores'

const ORDEN = [
  ['relevancia', 'Características'],
  ['popular', 'Más vendidos'],
  ['nuevos', 'Más nuevos'],
  ['priceAsc', 'Precio: menor a mayor'],
  ['priceDesc', 'Precio: mayor a menor'],
  ['nombre', 'Nombre (A-Z)'],
]

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(n) || 0)

export default function CatalogoBarra({ total = 0, facetas, basePath }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const ruta = basePath || pathname

  const ir = (p) => {
    p.delete('page')
    const qs = p.toString()
    router.push(qs ? `${ruta}?${qs}` : ruta, { scroll: false })
  }
  const quitar = (k, v) => {
    const p = new URLSearchParams(sp.toString())
    if (v == null) p.delete(k)
    else {
      const resto = p.getAll(k).flatMap((x) => x.split(',')).map((x) => x.trim()).filter((x) => x && x !== v)
      p.delete(k)
      resto.forEach((x) => p.append(k, x))
    }
    ir(p)
  }

  // Nombres bonitos para los chips
  const nombre = (lista, v) => lista?.find((o) => o.value === v)?.label || v
  const chips = []
  for (const v of sp.getAll('category')) chips.push(['category', v, nombre(facetas?.categorias, v)])
  for (const v of sp.getAll('brand')) chips.push(['brand', v, nombre(facetas?.marcas, v)])
  for (const v of sp.getAll('material')) chips.push(['material', v, nombre(facetas?.materiales, v)])
  for (const v of sp.getAll('color')) chips.push(['color', v, normalizarColor(v)])
  for (const v of sp.getAll('spec')) chips.push(['spec', v, v.replace('~', ': ')])
  if (sp.get('nuevo') === '1') chips.push(['nuevo', null, 'Nuevo'])
  if (sp.get('inStock') === '1') chips.push(['inStock', null, 'En existencia'])
  if (sp.get('onSale') === '1') chips.push(['onSale', null, 'En oferta'])
  if (sp.get('featured') === '1') chips.push(['featured', null, 'Destacados'])
  if (sp.get('minPrice') || sp.get('maxPrice')) {
    chips.push(['precio', null, `${sp.get('minPrice') ? fmt(sp.get('minPrice')) : '$0'} – ${sp.get('maxPrice') ? fmt(sp.get('maxPrice')) : 'máx'}`])
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-slate-600">{total.toLocaleString('es-MX')} {total === 1 ? 'producto' : 'productos'}</span>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900">Ordenar por:</span>
          <select value={sp.get('sort') || 'relevancia'}
            onChange={(e) => { const p = new URLSearchParams(sp.toString()); if (e.target.value === 'relevancia') p.delete('sort'); else p.set('sort', e.target.value); ir(p) }}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300">
            {ORDEN.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map(([k, v, l]) => (
            <button key={`${k}-${v}`} type="button"
              onClick={() => (k === 'precio' ? (() => { const p = new URLSearchParams(sp.toString()); p.delete('minPrice'); p.delete('maxPrice'); ir(p) })() : quitar(k, v))}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-sm text-slate-800">
              {l} <span aria-hidden="true" className="text-slate-500">×</span>
              <span className="sr-only">Quitar filtro</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function CatalogoPaginas({ pagina = 1, paginas = 1, basePath, searchParams = {} }) {
  if (paginas <= 1) return null
  const href = (n) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === 'page') continue
      ;(Array.isArray(v) ? v : [v]).forEach((x) => x != null && p.append(k, x))
    }
    if (n > 1) p.set('page', String(n))
    const qs = p.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  // 1 … 4 5 [6] 7 8 … 20
  const nums = new Set([1, paginas, pagina - 2, pagina - 1, pagina, pagina + 1, pagina + 2])
  const lista = [...nums].filter((n) => n >= 1 && n <= paginas).sort((a, b) => a - b)
  const btn = 'min-w-[40px] h-10 px-3 rounded-full grid place-items-center text-sm font-semibold'
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Páginas">
      {pagina > 1 && <Link href={href(pagina - 1)} className={`${btn} border border-slate-300 hover:bg-slate-100`}>‹ Anterior</Link>}
      {lista.map((n, i) => (
        <span key={n} className="contents">
          {i > 0 && n - lista[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
          {n === pagina
            ? <span className={`${btn} bg-slate-900 text-white`} aria-current="page">{n}</span>
            : <Link href={href(n)} className={`${btn} hover:bg-slate-100 text-slate-700`}>{n}</Link>}
        </span>
      ))}
      {pagina < paginas && <Link href={href(pagina + 1)} className={`${btn} border border-slate-300 hover:bg-slate-100`}>Siguiente ›</Link>}
    </nav>
  )
}
