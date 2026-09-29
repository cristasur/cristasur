'use client'
// ============================================================
// /admin/imagenes — Fotos de las páginas Conócenos y Contacto.
// Subir desde la compu (o pegar URL), encuadrar arrastrando y con
// zoom, y guardar. La vista previa tiene la misma proporción que en
// la página, así que lo que ves es lo que sale.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { SLOTS_IMAGENES } from '@/lib/imagenesPaginasSlots'
import { estiloEncuadre, normalizarEncuadre, ENCUADRE_CENTRO } from '@/lib/encuadre'

async function subirImagen(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', 'paginas')
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'No se pudo subir la imagen')
  return data.url
}

function Tarjeta({ def, guardado, onGuardado }) {
  const [url, setUrl] = useState(guardado?.url || '')
  const [pos, setPos] = useState(normalizarEncuadre(guardado?.pos || ENCUADRE_CENTRO))
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const input = useRef()
  const caja = useRef()
  const arrastre = useRef(null)

  useEffect(() => {
    setUrl(guardado?.url || '')
    setPos(normalizarEncuadre(guardado?.pos || ENCUADRE_CENTRO))
  }, [guardado])

  const imagen = url || def.porDefecto
  const cambiar = (c) => setPos((p) => normalizarEncuadre({ ...p, ...c }))
  const cambiado = url !== (guardado?.url || '') || JSON.stringify(pos) !== JSON.stringify(normalizarEncuadre(guardado?.pos || ENCUADRE_CENTRO))

  async function elegir(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(''); setEstado('subiendo')
    try {
      setUrl(await subirImagen(file))
      setPos({ ...ENCUADRE_CENTRO })
    } catch (err) { setError(err.message) }
    setEstado('')
  }

  async function guardar() {
    setError(''); setEstado('guardando')
    try {
      const r = await fetch('/api/paginas-imagenes', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: def.slot, url, pos }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'No se pudo guardar')
      onGuardado(def.slot, { url, pos })
      setEstado('ok')
      setTimeout(() => setEstado(''), 1800)
    } catch (err) { setError(err.message); setEstado('') }
  }

  function abajo(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    arrastre.current = { x: e.clientX, y: e.clientY, inicio: pos }
  }
  function mover(e) {
    if (!arrastre.current || !caja.current) return
    const r = caja.current.getBoundingClientRect()
    const k = 1.6 / arrastre.current.inicio.zoom
    cambiar({
      x: arrastre.current.inicio.x - ((e.clientX - arrastre.current.x) / r.width) * 100 * k,
      y: arrastre.current.inicio.y - ((e.clientY - arrastre.current.y) / r.height) * 100 * k,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-700">{def.pagina}</div>
          <div className="font-bold text-slate-900">{def.nombre}</div>
          <div className="text-xs text-slate-400">Recomendado: {def.medida}{!url && ' · ahora usa la foto de respaldo'}</div>
        </div>
      </div>

      <div className={def.aspecto < 1.2 ? 'max-w-[280px]' : ''}>
        <div ref={caja} onPointerDown={abajo} onPointerMove={mover}
          onPointerUp={() => { arrastre.current = null }} onPointerCancel={() => { arrastre.current = null }}
          style={{ aspectRatio: def.aspecto }}
          className="relative rounded-xl overflow-hidden bg-slate-100 cursor-grab active:cursor-grabbing select-none touch-none">
          <img src={imagen} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" style={estiloEncuadre(pos)} />
          {estado === 'subiendo' && <div className="absolute inset-0 bg-white/80 grid place-items-center text-sm font-semibold text-brand-700">Subiendo…</div>}
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        {[['zoom', 'Zoom', 1, 2.5, 0.05, (v) => `${Math.round(v * 100)}%`], ['x', 'Izq. ↔ Der.', 0, 100, 1, (v) => `${Math.round(v)}%`], ['y', 'Arriba ↕ Abajo', 0, 100, 1, (v) => `${Math.round(v)}%`]].map(([k, l, min, max, step, fmt]) => (
          <label key={k} className="block">
            <span className="flex justify-between text-[11px] text-slate-500"><span>{l}</span><span>{fmt(pos[k])}</span></span>
            <input type="range" min={min} max={max} step={step} value={pos[k]} onChange={(e) => cambiar({ [k]: e.target.value })} className="w-full accent-brand-600" />
          </label>
        ))}
      </div>

      <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…o pega aquí la URL de una imagen"
        className="mt-3 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-500" />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={estado === 'subiendo'}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Subir desde la compu</button>
        <button type="button" onClick={() => setPos({ ...ENCUADRE_CENTRO })} className="px-3 py-2 text-sm text-slate-500 hover:underline">Centrar</button>
        {url && <button type="button" onClick={() => { setUrl(''); setPos({ ...ENCUADRE_CENTRO }) }} className="px-3 py-2 text-sm text-red-600 hover:underline">Usar foto de respaldo</button>}
        <button type="button" onClick={guardar} disabled={!cambiado || estado === 'guardando'}
          className="ml-auto px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold disabled:opacity-40">
          {estado === 'guardando' ? 'Guardando…' : estado === 'ok' ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={elegir} />
    </div>
  )
}

export default function ImagenesPaginasPage() {
  const [guardadas, setGuardadas] = useState({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/paginas-imagenes').then((r) => r.json()).then((d) => {
      setGuardadas(Object.fromEntries((d.imagenes || []).map((i) => [i.slot, i])))
    }).finally(() => setCargando(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900">Fotos de páginas</h1>
      <p className="text-slate-500 text-sm mt-1 mb-6">
        Las fotos de Conócenos y Contacto. Súbelas desde tu compu, arrástralas para encuadrar y guarda.
        La vista previa tiene la misma forma que en la página.
      </p>
      {cargando ? <div className="text-slate-400 text-sm">Cargando…</div> : (
        <div className="grid lg:grid-cols-2 gap-5">
          {SLOTS_IMAGENES.map((def) => (
            <Tarjeta key={def.slot} def={def} guardado={guardadas[def.slot]}
              onGuardado={(slot, v) => setGuardadas((g) => ({ ...g, [slot]: { ...g[slot], ...v } }))} />
          ))}
        </div>
      )}
    </div>
  )
}
