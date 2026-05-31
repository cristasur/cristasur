'use client'
// Edición masiva: selector de productos + selector de operación + parámetros.
// Aplica vía POST /api/products/bulk.
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n || 0)
}

const OPS = [
  { value: 'price.percent', label: 'Subir/bajar precio (%)', placeholder: 'Ej. 8 ó -10' },
  { value: 'price.fixed',   label: 'Sumar/restar al precio (MXN)', placeholder: 'Ej. 5 ó -2' },
  { value: 'price.set',     label: 'Setear precio exacto', placeholder: 'Ej. 199' },
  { value: 'stock.set',     label: 'Setear stock exacto', placeholder: 'Ej. 100' },
  { value: 'stock.add',     label: 'Sumar al stock', placeholder: 'Ej. 50' },
  { value: 'active.set',    label: 'Publicar/ocultar (active)' },
  { value: 'featured.set',  label: 'Destacar/no destacar' },
  { value: 'tags.add',      label: 'Añadir tags', placeholder: 'navidad, eco' },
  { value: 'tags.remove',   label: 'Quitar tags', placeholder: 'navidad' },
  { value: 'wholesale.set', label: 'Setear precio mayoreo' },
  { value: 'wholesale.clear', label: 'Quitar precio mayoreo' },
  { value: 'category.set',  label: 'Reemplazar categorías' },
]

export default function BulkEditClient({ products, categories }) {
  const router = useRouter()
  const [selected, setSelected] = useState(new Set())
  const [filter, setFilter] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [op, setOp] = useState('price.percent')
  const [params, setParams] = useState({})
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const filtered = useMemo(() => {
    const f = filter.toLowerCase().trim()
    return products.filter((p) => {
      if (filterCat && !(p.categories || []).some((c) => c._id === filterCat)) return false
      if (!f) return true
      return p.name?.toLowerCase().includes(f)
    })
  }, [products, filter, filterCat])

  function toggle(id) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((p) => p._id)))
  }
  function clearSel() {
    setSelected(new Set())
  }

  async function apply() {
    if (!selected.size) return alert('Selecciona al menos un producto')
    if (!confirm(`Aplicar "${OPS.find((o) => o.value === op)?.label}" a ${selected.size} producto(s)?`)) return
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selected),
          op,
          params: buildParams(op, params),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data?.error || 'Error al aplicar')
        return
      }
      setResult(data)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Edición masiva</h1>
          <p className="text-slate-500 text-sm">
            Seleccioná productos, elegí una operación y aplicala. Los cambios quedan
            registrados en el historial de cada producto.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          <b className="text-slate-900">{selected.size}</b> seleccionados · {filtered.length} visibles
        </div>
      </header>

      {/* Toolbar de operación */}
      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <h2 className="font-bold text-slate-900 mb-3">Operación</h2>
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <label className="block flex-1">
            <span className="text-sm font-medium text-slate-700">Tipo de cambio</span>
            <select
              value={op}
              onChange={(e) => {
                setOp(e.target.value)
                setParams({})
              }}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
            >
              {OPS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <OpParams op={op} params={params} setParams={setParams} categories={categories} />
          <button
            onClick={apply}
            disabled={busy || !selected.size}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-50"
          >
            {busy ? 'Aplicando…' : `Aplicar a ${selected.size}`}
          </button>
        </div>
        {result?.ok && (
          <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
            ✅ Aplicado a {result.modified} de {result.matched} productos. ({result.summary})
          </div>
        )}
      </section>

      {/* Filtros + tabla */}
      <section className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-100">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar en nombre..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={clearSel}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
          >
            Limpiar selección
          </button>
        </div>

        <div className="max-h-[600px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left sticky top-0">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="p-3">Producto</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr
                  key={p._id}
                  className={selected.has(p._id) ? 'bg-brand-50/50' : 'hover:bg-slate-50'}
                  onClick={() => toggle(p._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p._id)}
                      onChange={() => toggle(p._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden shrink-0 grid place-items-center">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="box" className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-800 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono">{formatMXN(p.price)}</td>
                  <td className="p-3 font-mono">{p.stock}</td>
                  <td className="p-3">
                    <span
                      className={
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' +
                        (p.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600')
                      }
                    >
                      {p.active ? 'publicado' : 'oculto'}
                    </span>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500 text-sm">
                    Sin productos para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function buildParams(op, p) {
  switch (op) {
    case 'price.percent': return { percent: Number(p.percent) }
    case 'price.fixed':   return { delta: Number(p.delta) }
    case 'price.set':     return { value: Number(p.value) }
    case 'stock.set':     return { value: Number(p.value) }
    case 'stock.add':     return { value: Number(p.value) }
    case 'active.set':    return { active: !!p.active }
    case 'status.set':    return { status: p.status === 'draft' ? 'draft' : 'published' }
    case 'featured.set':  return { featured: !!p.featured }
    case 'tags.add':
    case 'tags.remove':   return { tags: String(p.tags || '').split(',').map((t) => t.trim()).filter(Boolean) }
    case 'category.set':  return { categories: p.categories || [] }
    case 'wholesale.set': return { wholesalePrice: Number(p.wholesalePrice), wholesaleMinQty: Number(p.wholesaleMinQty) }
    case 'wholesale.clear': return {}
    default: return {}
  }
}

function OpParams({ op, params, setParams, categories }) {
  const cls = 'mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm'

  if (op === 'price.percent' || op === 'price.fixed' || op === 'price.set' || op === 'stock.set' || op === 'stock.add') {
    const key = op === 'price.percent' ? 'percent' : op === 'price.fixed' ? 'delta' : 'value'
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Valor</span>
        <input
          type="number"
          step={op.startsWith('price') ? '0.01' : '1'}
          value={params[key] ?? ''}
          onChange={(e) => setParams({ ...params, [key]: e.target.value })}
          className={cls}
        />
      </label>
    )
  }
  if (op === 'active.set') {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Activo</span>
        <select
          value={params.active ? '1' : '0'}
          onChange={(e) => setParams({ ...params, active: e.target.value === '1' })}
          className={cls}
        >
          <option value="1">Publicar</option>
          <option value="0">Ocultar</option>
        </select>
      </label>
    )
  }
  if (op === 'status.set') {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Estado</span>
        <select
          value={params.status || 'published'}
          onChange={(e) => setParams({ ...params, status: e.target.value })}
          className={cls}
        >
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
        </select>
      </label>
    )
  }
  if (op === 'featured.set') {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Destacado</span>
        <select
          value={params.featured ? '1' : '0'}
          onChange={(e) => setParams({ ...params, featured: e.target.value === '1' })}
          className={cls}
        >
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </label>
    )
  }
  if (op === 'tags.add' || op === 'tags.remove') {
    return (
      <label className="block flex-1">
        <span className="text-sm font-medium text-slate-700">Tags (separados por coma)</span>
        <input
          value={params.tags || ''}
          onChange={(e) => setParams({ ...params, tags: e.target.value })}
          className={cls + ' w-full'}
          placeholder="navidad, eco-friendly"
        />
      </label>
    )
  }
  if (op === 'wholesale.set') {
    return (
      <>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Precio mayoreo</span>
          <input
            type="number"
            step="0.01"
            value={params.wholesalePrice ?? ''}
            onChange={(e) => setParams({ ...params, wholesalePrice: e.target.value })}
            className={cls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Cant. mín.</span>
          <input
            type="number"
            min="2"
            value={params.wholesaleMinQty ?? ''}
            onChange={(e) => setParams({ ...params, wholesaleMinQty: e.target.value })}
            className={cls}
          />
        </label>
      </>
    )
  }
  if (op === 'category.set') {
    const sel = new Set(params.categories || [])
    return (
      <div>
        <span className="text-sm font-medium text-slate-700 block mb-1">Categorías</span>
        <div className="flex flex-wrap gap-1 max-w-md">
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => {
                const next = new Set(sel)
                next.has(c._id) ? next.delete(c._id) : next.add(c._id)
                setParams({ ...params, categories: Array.from(next) })
              }}
              className={
                'px-2 py-1 rounded-full text-xs font-semibold ' +
                (sel.has(c._id)
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
              }
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    )
  }
  return null
}
