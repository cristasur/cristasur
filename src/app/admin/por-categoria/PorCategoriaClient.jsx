'use client'
// Vista de /admin/por-categoria: árbol de categorías + productos.
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'

const dinero = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(Number(n) || 0)

function url({ cat = '', q = '', p = 1 }) {
  const s = new URLSearchParams()
  if (cat) s.set('cat', cat)
  if (q) s.set('q', q)
  if (p > 1) s.set('p', String(p))
  const t = s.toString()
  return `/admin/por-categoria${t ? `?${t}` : ''}`
}

function Fila({ activo, href, nombre, n, sub, oculta }) {
  return (
    <Link href={href}
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${sub ? 'pl-7' : ''}
        ${activo ? 'bg-brand-600 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
      <span className="truncate">
        {sub && <span className={activo ? 'text-white/70' : 'text-slate-300'}>└ </span>}
        {nombre}
        {oculta && <span className={`ml-1 text-[10px] ${activo ? 'text-white/70' : 'text-slate-400'}`}>(oculta)</span>}
      </span>
      <span className={`shrink-0 text-xs tabular-nums rounded-full px-2 py-0.5 ${activo ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
    </Link>
  )
}

export default function PorCategoriaClient({ arbol, total, sinCategoria, cat, q, pagina, paginas, enLista, productos }) {
  const router = useRouter()
  const [texto, setTexto] = useState(q)
  const [sel, setSel] = useState(new Set())
  const [destino, setDestino] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [aviso, setAviso] = useState('')

  const todas = arbol.flatMap((c) => [c, ...c.hijas.map((h) => ({ ...h, padre: c.name }))])
  const nombreDe = Object.fromEntries(todas.map((c) => [c._id, c.padre ? `${c.padre} › ${c.name}` : c.name]))
  const actual = cat === 'sin' ? 'Sin categoría' : cat ? nombreDe[cat] || 'Categoría' : 'Todos los productos'
  const catActual = arbol.find((c) => c._id === cat) || arbol.flatMap((c) => c.hijas).find((h) => h._id === cat)

  const todosMarcados = productos.length > 0 && productos.every((p) => sel.has(p._id))
  const alternar = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const alternarTodos = () => setSel(todosMarcados ? new Set() : new Set(productos.map((p) => p._id)))

  async function aplicar(op) {
    if (!sel.size) return
    const cats = op === 'category.remove' ? [cat] : [destino]
    if (!cats[0] || cats[0] === 'sin') { setAviso('Elige la categoría primero.'); return }
    setTrabajando(true); setAviso('')
    try {
      const r = await fetch('/api/products/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...sel], op, params: { categories: cats } }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'No se pudo aplicar')
      setAviso(`✓ Listo: ${d.modified} producto${d.modified === 1 ? '' : 's'} actualizados.`)
      setSel(new Set())
      router.refresh()
    } catch (e) { setAviso(e.message) }
    setTrabajando(false)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Productos por categoría</h1>
          <p className="text-slate-500 text-sm">Elige una categoría para ver sus productos, editarlos o cambiarlos de categoría.</p>
        </div>
        <Link href="/admin/categorias" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">
          <Icon name="edit" className="w-4 h-4" /> Crear o editar categorías
        </Link>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5 items-start">
        {/* ── Árbol ── */}
        <aside className="bg-white rounded-2xl border border-slate-100 shadow-card p-2 lg:sticky lg:top-4 max-h-[80vh] overflow-y-auto">
          <Fila href={url({ q })} nombre="Todos los productos" n={total} activo={!cat} />
          <Fila href={url({ cat: 'sin', q })} nombre="Sin categoría" n={sinCategoria} activo={cat === 'sin'} />
          <div className="my-2 border-t border-slate-100" />
          {arbol.map((c) => (
            <div key={c._id}>
              <Fila href={url({ cat: c._id, q })} nombre={c.name} n={c.n + c.hijas.reduce((a, h) => a + h.n, 0)} activo={cat === c._id} oculta={!c.active} />
              {c.hijas.map((h) => (
                <Fila key={h._id} sub href={url({ cat: h._id, q })} nombre={h.name} n={h.n} activo={cat === h._id} oculta={!h.active} />
              ))}
            </div>
          ))}
          {!arbol.length && <p className="p-3 text-sm text-slate-400">Aún no hay categorías.</p>}
        </aside>

        {/* ── Productos ── */}
        <section className="min-w-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 mb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-black text-slate-900 truncate">{actual}</div>
                <div className="text-xs text-slate-500">
                  {enLista} producto{enLista === 1 ? '' : 's'}
                  {catActual?.slug && (
                    <> · <a href={`/categoria/${catActual.slug}`} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">ver en la tienda ↗</a></>
                  )}
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); router.push(url({ cat, q: texto.trim() })) }} className="relative w-full sm:w-72">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre o SKU…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500" />
              </form>
            </div>

            {/* Acciones con los marcados */}
            <div className={`mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-sm ${sel.size ? '' : 'opacity-50 pointer-events-none'}`}>
              <span className="font-semibold text-slate-700">{sel.size} marcado{sel.size === 1 ? '' : 's'}:</span>
              <select value={destino} onChange={(e) => setDestino(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500">
                <option value="">Elige categoría…</option>
                {todas.map((c) => <option key={c._id} value={c._id}>{c.padre ? `   ${c.padre} › ${c.name}` : c.name}</option>)}
              </select>
              <button type="button" disabled={trabajando} onClick={() => aplicar('category.set')}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold" title="Quita las que tenga y deja solo esta">
                Mover aquí
              </button>
              <button type="button" disabled={trabajando} onClick={() => aplicar('category.add')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold" title="La agrega sin quitar las que ya tenga">
                Agregar también
              </button>
              {cat && cat !== 'sin' && (
                <button type="button" disabled={trabajando} onClick={() => aplicar('category.remove')}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold">
                  Quitar de {nombreDe[cat] || 'esta categoría'}
                </button>
              )}
              {trabajando && <span className="text-slate-400">Aplicando…</span>}
            </div>
            {aviso && <p className="mt-2 text-sm text-slate-600">{aviso}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <tr>
                  <th className="p-3 w-8"><input type="checkbox" checked={todosMarcados} onChange={alternarTodos} aria-label="Marcar todos" /></th>
                  <th className="p-3">Producto</th>
                  <th className="p-3 hidden md:table-cell">Categorías</th>
                  <th className="p-3 text-right">Precio</th>
                  <th className="p-3 text-right hidden sm:table-cell">Stock</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((p) => (
                  <tr key={p._id} className={sel.has(p._id) ? 'bg-brand-50/60' : 'hover:bg-slate-50'}>
                    <td className="p-3"><input type="checkbox" checked={sel.has(p._id)} onChange={() => alternar(p._id)} aria-label={`Marcar ${p.name}`} /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {p.image && <img src={p.image} alt="" loading="lazy" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 line-clamp-1">{p.name}</div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-2">
                            {p.sku && <span className="font-mono">{p.sku}</span>}
                            {p.lineLabel && <span>Línea {p.lineLabel}</span>}
                            {p.status === 'draft' && <span className="text-amber-600 font-semibold">Borrador</span>}
                            {p.active === false && <span className="text-rose-500 font-semibold">Oculto</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(p.categories || []).map((c) => (
                          <span key={c} className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">{nombreDe[c] || '—'}</span>
                        ))}
                        {!p.categories?.length && <span className="text-[11px] text-slate-400">Sin categoría</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums">{dinero(p.price)}</td>
                    <td className="p-3 text-right tabular-nums hidden sm:table-cell text-slate-500">{p.stock ?? '∞'}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/productos/${p._id}`} className="inline-flex items-center gap-1 text-brand-700 font-semibold hover:underline">
                        <Icon name="edit" className="w-3.5 h-3.5" /> Editar
                      </Link>
                    </td>
                  </tr>
                ))}
                {!productos.length && (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400">No hay productos aquí{q ? ` para "${q}"` : ''}.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {paginas > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              {pagina > 1 && <Link href={url({ cat, q, p: pagina - 1 })} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50">‹ Anterior</Link>}
              <span className="text-slate-500">Página {pagina} de {paginas}</span>
              {pagina < paginas && <Link href={url({ cat, q, p: pagina + 1 })} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50">Siguiente ›</Link>}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
