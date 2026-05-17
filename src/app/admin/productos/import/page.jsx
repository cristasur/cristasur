// Importar productos desde CSV. Client Component: drag & drop,
// selector de modo (upsert/create/update), dry-run y resultado.
'use client'
import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'

const EXAMPLE = `_id,name,description,price,comparePrice,wholesalePrice,wholesaleMinQty,stock,sku,featured,active,image,gallery,categories
,Vaso plástico 12oz,Vaso resistente para bebidas frías,15,20,12,10,120,VAS-12-CR,false,true,/uploads/vaso.webp,/uploads/vaso-2.webp|/uploads/vaso-3.webp,Cocina|Desechables
,Escoba económica,Escoba de cerdas firmes con mango,59,,,,40,ESC-001,true,true,/uploads/escoba.webp,,Limpieza
`

const MODE_OPTIONS = [
  {
    value: 'upsert',
    title: 'Actualizar y crear',
    subtitle: 'Recomendado',
    description:
      'Si la fila trae _id o SKU de un producto existente, lo actualiza. Si no existe, lo crea. Ideal para exportar → editar → re-importar sin duplicar.',
  },
  {
    value: 'create',
    title: 'Sólo crear nuevos',
    subtitle: 'Evita duplicados',
    description:
      'Crea únicamente filas que NO existen en la BD (por _id o SKU). Los productos ya existentes se saltan.',
  },
  {
    value: 'update',
    title: 'Sólo actualizar',
    subtitle: 'Sincronizar precios/stock',
    description:
      'Actualiza productos que ya existen (match por _id o SKU). No crea nada nuevo.',
  },
]

export default function ImportCsvPage() {
  const [file, setFile] = useState(null)
  const [csvText, setCsvText] = useState('')
  const [mode, setMode] = useState('upsert')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState('preview') // 'preview' | 'commit'
  const fileRef = useRef(null)
  const router = useRouter()

  function handleFile(f) {
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setCsvText(String(reader.result || ''))
    reader.readAsText(f, 'utf-8')
  }

  async function runImport(dryRun) {
    if (!csvText.trim()) {
      alert('Pega un CSV o selecciona un archivo primero')
      return
    }
    setLoading(true)
    setLastAction(dryRun ? 'preview' : 'commit')
    try {
      const qs = new URLSearchParams()
      if (dryRun) qs.set('dryRun', '1')
      qs.set('mode', mode)
      const res = await fetch(`/api/products/import?${qs.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data?.error || 'Error al importar')
        return
      }
      setReport(data)
      if (!dryRun) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function downloadExample() {
    const blob = new Blob(['\uFEFF' + EXAMPLE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ejemplo-productos-cristasur.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 500)
  }

  // Contadores del reporte (funcionan tanto para dryRun como para commit).
  const stats = useMemo(() => {
    if (!report) return null
    const detailCount = (status) =>
      report.details?.filter((d) => d.status === status).length || 0
    const isDry = report.dryRun
    return {
      total: report.total || 0,
      toCreate: isDry ? detailCount('create') : report.created || 0,
      toUpdate: isDry ? detailCount('update') : report.updated || 0,
      skipped: isDry ? detailCount('skip') : report.skipped || 0,
      errors: report.errors || detailCount('error'),
    }
  }, [report])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Importar productos (CSV)</h1>
          <p className="text-slate-500 text-sm">
            Carga cientos de productos de una sola vez. Si exportaste desde este mismo admin,
            mantén la columna <code className="bg-slate-100 rounded px-1">_id</code> para que no
            se dupliquen al re-importar.
          </p>
        </div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Volver
        </Link>
      </div>

      <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-3 justify-between">
        <div>
          <h2 className="font-bold text-emerald-900">¿Quieres editar el catálogo actual?</h2>
          <p className="text-sm text-emerald-800/80">
            Descarga el CSV con todos los productos (incluye la columna{' '}
            <code className="bg-white/60 px-1 rounded">_id</code>), edítalo en Excel
            y vuelve a importarlo en modo <b>Actualizar y crear</b>.
          </p>
        </div>
        <a
          href="/api/products/export"
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm shrink-0"
        >
          <Icon name="download" className="w-4 h-4" />
          Descargar CSV actual
        </a>
      </section>

      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <h2 className="font-bold text-slate-900 mb-2">Formato esperado</h2>
        <p className="text-sm text-slate-600">
          Columnas (acepta acentos y variantes en español):{' '}
          <code className="bg-slate-100 rounded px-1">_id</code> (opcional, se usa para
          actualizar),{' '}
          <code className="bg-slate-100 rounded px-1">name</code>,{' '}
          <code className="bg-slate-100 rounded px-1">description</code>,{' '}
          <code className="bg-slate-100 rounded px-1">price</code>,{' '}
          <code className="bg-slate-100 rounded px-1">comparePrice</code>,{' '}
          <code className="bg-slate-100 rounded px-1">wholesalePrice</code>,{' '}
          <code className="bg-slate-100 rounded px-1">wholesaleMinQty</code>,{' '}
          <code className="bg-slate-100 rounded px-1">stock</code>,{' '}
          <code className="bg-slate-100 rounded px-1">sku</code>,{' '}
          <code className="bg-slate-100 rounded px-1">featured</code>,{' '}
          <code className="bg-slate-100 rounded px-1">active</code>,{' '}
          <code className="bg-slate-100 rounded px-1">image</code>,{' '}
          <code className="bg-slate-100 rounded px-1">gallery</code> (separada por{' '}
          <code className="bg-slate-100 rounded px-1">|</code>) y{' '}
          <code className="bg-slate-100 rounded px-1">categories</code> (nombres o slugs
          separados por <code className="bg-slate-100 rounded px-1">|</code>).
        </p>
        <button
          type="button"
          onClick={downloadExample}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-semibold"
        >
          <Icon name="download" className="w-4 h-4" />
          Descargar ejemplo
        </button>
      </section>

      {/* Selector de modo */}
      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <h2 className="font-bold text-slate-900 mb-1">1) ¿Qué quieres hacer?</h2>
        <p className="text-sm text-slate-500 mb-3">
          Elige cómo tratar las filas cuyo producto ya existe en la base de datos.
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {MODE_OPTIONS.map((opt) => {
            const active = mode === opt.value
            return (
              <label
                key={opt.value}
                className={
                  'cursor-pointer rounded-xl border-2 p-4 transition ' +
                  (active
                    ? 'border-brand-600 bg-brand-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white')
                }
              >
                <input
                  type="radio"
                  name="import-mode"
                  value={opt.value}
                  checked={active}
                  onChange={() => setMode(opt.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">{opt.title}</div>
                  {opt.subtitle && (
                    <span
                      className={
                        'text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ' +
                        (active
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600')
                      }
                    >
                      {opt.subtitle}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {opt.description}
                </p>
              </label>
            )
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <h2 className="font-bold text-slate-900 mb-3">2) Selecciona tu archivo</h2>
        <div
          onDragOver={(e) => {
            e.preventDefault()
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0])
          }}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Icon name="upload" className="w-8 h-8 mx-auto text-slate-400" />
          <p className="mt-2 text-sm text-slate-700">
            Arrastra un archivo <b>.csv</b> o haz clic para seleccionar
          </p>
          {file && (
            <p className="mt-2 text-xs text-brand-700 font-semibold">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
        <details className="mt-4">
          <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-900">
            …o pega el CSV directamente
          </summary>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            placeholder="_id,name,description,price,stock,categories..."
            className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:border-brand-500"
          />
        </details>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => runImport(true)}
            disabled={loading || !csvText.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold disabled:opacity-60"
          >
            <Icon name="eye" className="w-4 h-4" />
            {loading && lastAction === 'preview' ? 'Validando…' : 'Vista previa (sin importar)'}
          </button>
          <button
            onClick={() => runImport(false)}
            disabled={loading || !csvText.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
          >
            <Icon name="upload" className="w-4 h-4" />
            {loading && lastAction === 'commit' ? 'Importando…' : 'Importar ahora'}
          </button>
        </div>
      </section>

      {report && stats && (
        <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
          <h2 className="font-bold text-slate-900 mb-1">
            {report.dryRun ? '3) Vista previa' : '3) Resultado de la importación'}
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Modo: <b>{MODE_OPTIONS.find((m) => m.value === report.mode)?.title || report.mode}</b>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <Stat label="Filas leídas" value={stats.total} />
            <Stat
              label={report.dryRun ? 'Se crearán' : 'Creadas'}
              value={stats.toCreate}
              accent="brand"
            />
            <Stat
              label={report.dryRun ? 'Se actualizarán' : 'Actualizadas'}
              value={stats.toUpdate}
              accent="emerald"
            />
            <Stat label="Saltadas" value={stats.skipped} accent="slate" />
            <Stat label="Errores" value={stats.errors} accent="rose" />
          </div>

          <div className="max-h-96 overflow-auto border border-slate-100 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 text-left sticky top-0">
                <tr>
                  <th className="p-2">Fila</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Producto</th>
                  <th className="p-2">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.details.map((d, i) => (
                  <tr
                    key={i}
                    className={
                      d.status === 'error'
                        ? 'bg-rose-50/50'
                        : d.status === 'skip' || d.status === 'skipped'
                          ? 'bg-slate-50/50'
                          : 'hover:bg-slate-50'
                    }
                  >
                    <td className="p-2 font-mono">{d.line ?? '—'}</td>
                    <td className="p-2">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="p-2">{d.name || '—'}</td>
                    <td className="p-2 text-slate-600">
                      {d.missing?.length ? `Faltan: ${d.missing.join(', ')}` : ''}
                      {d.unknownCategories?.length
                        ? ` · Categorías no existen: ${d.unknownCategories.join(', ')}`
                        : ''}
                      {d.errors?.length ? d.errors.join(' · ') : ''}
                      {d.note || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!report.dryRun && (
            <div className="mt-4 flex justify-end">
              <Link
                href="/admin/productos"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold"
              >
                Ver productos
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  const map = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    brand: 'bg-brand-50 text-brand-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <div className="rounded-xl p-3 bg-slate-50">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`text-2xl font-black ${
          map[accent] || 'text-slate-900'
        } rounded-md inline-block px-2 -mx-2`}
      >
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const MAP = {
    create: { label: 'Se creará', className: 'bg-brand-100 text-brand-700' },
    created: { label: 'Creada', className: 'bg-brand-100 text-brand-700' },
    update: { label: 'Se actualizará', className: 'bg-emerald-100 text-emerald-700' },
    updated: { label: 'Actualizada', className: 'bg-emerald-100 text-emerald-700' },
    skip: { label: 'Saltada', className: 'bg-slate-200 text-slate-700' },
    skipped: { label: 'Saltada', className: 'bg-slate-200 text-slate-700' },
    ok: { label: 'OK', className: 'bg-emerald-100 text-emerald-700' },
    error: { label: 'Error', className: 'bg-rose-100 text-rose-700' },
  }
  const info = MAP[status] || { label: status, className: 'bg-slate-100 text-slate-700' }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${info.className}`}
    >
      {info.label}
    </span>
  )
}
