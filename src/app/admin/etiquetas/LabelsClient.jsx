'use client'
// Selector de productos + opciones de papel/grilla/póster, descarga el PDF.
import { useMemo, useState } from 'react'
import Icon from '@/components/Icon'

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n || 0)
}

export default function LabelsClient({ products, categories }) {
  const [selected, setSelected] = useState(new Set())
  const [filter, setFilter] = useState('')
  const [filterCat, setFilterCat] = useState('')

  // Modo: 'grid' = grilla varias etiquetas | 'poster' = 1 por hoja, grande
  const [mode, setMode] = useState('grid')

  // Opciones grilla
  const [paper, setPaper] = useState('LETTER')
  const [cols, setCols] = useState(2)
  const [rows, setRows] = useState(4)
  const [repeat, setRepeat] = useState(1)

  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const f = filter.toLowerCase().trim()
    return products.filter((p) => {
      if (filterCat && !(p.categories || []).some((c) => c._id === filterCat)) return false
      if (!f) return true
      return p.name?.toLowerCase().includes(f) || (p.sku || '').toLowerCase().includes(f)
    })
  }, [products, filter, filterCat])

  function toggle(id) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((p) => p._id)))
  }

  async function downloadPdf() {
    if (!selected.size) return alert('Selecciona al menos un producto')
    setBusy(true)
    try {
      const body = {
        ids: Array.from(selected),
        mode,
        repeat: Number(repeat) || 1,
        layout: {
          cols: Number(cols) || 2,
          rows: Number(rows) || 4,
          paper,
        },
      }
      const res = await fetch('/api/products/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Error al generar PDF')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `etiquetas-cristasur-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
    } finally {
      setBusy(false)
    }
  }

  const perPage = mode === 'poster' ? 1 : (Number(cols) || 1) * (Number(rows) || 1)
  const totalLabels = selected.size * (Number(repeat) || 1)
  const pages = Math.ceil(totalLabels / perPage) || 0

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Etiquetas PDF con QR</h1>
          <p className="text-slate-500 text-sm">
            Genera un PDF imprimible con QR. Tus clientes escanean, ven la ficha
            con fotos y compran por WhatsApp.
          </p>
        </div>
        <div className="text-sm text-slate-500 text-right">
          <div><b className="text-slate-900">{selected.size}</b> seleccionados</div>
          <div>{totalLabels} etiquetas · {pages} hoja{pages === 1 ? '' : 's'}</div>
        </div>
      </header>

      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4">
        <h2 className="font-bold text-slate-900">Formato</h2>

        {/* Selector de modo */}
        <div className="flex gap-3">
          <button
            onClick={() => setMode('grid')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-colors text-left ${
              mode === 'grid'
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-lg mb-0.5">📋</div>
            <div className="font-bold">Grilla</div>
            <div className="text-xs font-normal text-slate-500 mt-0.5">Varias etiquetas por hoja</div>
          </button>
          <button
            onClick={() => setMode('poster')}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-colors text-left ${
              mode === 'poster'
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="text-lg mb-0.5">🖼️</div>
            <div className="font-bold">Póster</div>
            <div className="text-xs font-normal text-slate-500 mt-0.5">1 producto por hoja, QR grande</div>
          </button>
        </div>

        {/* Opciones de grilla (solo en modo grid) */}
        {mode === 'grid' && (
          <div className="grid sm:grid-cols-4 gap-3 pt-1">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Papel</span>
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="LETTER">Carta (Letter)</option>
                <option value="A4">A4</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Columnas</span>
              <input
                type="number" min="1" max="5" value={cols}
                onChange={(e) => setCols(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Filas</span>
              <input
                type="number" min="1" max="12" value={rows}
                onChange={(e) => setRows(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Copias por producto</span>
              <input
                type="number" min="1" max="50" value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
          </div>
        )}

        {/* Opciones de póster */}
        {mode === 'poster' && (
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Papel</span>
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="LETTER">Carta (Letter)</option>
                <option value="A4">A4</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Copias por producto</span>
              <input
                type="number" min="1" max="10" value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
          </div>
        )}

        {mode === 'poster' && (
          <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
            💡 Cada producto ocupa una hoja completa con QR grande. Ideal para imprimir y colocar junto al producto en tu tienda.
          </p>
        )}

        <button
          onClick={downloadPdf}
          disabled={busy || !selected.size}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 transition-colors"
        >
          <Icon name="download" className="w-4 h-4" />
          {busy
            ? 'Generando…'
            : `Descargar PDF${pages > 0 ? ` (${pages} hoja${pages === 1 ? '' : 's'})` : ''}`}
        </button>
      </section>

      {/* Tabla de selección */}
      <section className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-100">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar en nombre o SKU..."
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
        </div>

        <div className="max-h-[600px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">SKU</th>
                <th className="p-3 text-left">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr
                  key={p._id}
                  className={selected.has(p._id) ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}
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
                  <td className="p-3 font-mono text-xs">{p.sku || '—'}</td>
                  <td className="p-3 font-mono">{formatMXN(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
