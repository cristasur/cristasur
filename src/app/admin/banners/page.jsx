'use client'
// ============================================================
// /admin/banners — Gestión de slides del carrusel hero
//
// Cada banner lleva dos imágenes:
//   Compu   2000 × 800  (obligatoria)
//   Celular 1080 × 1920 vertical (opcional)
//
// En celular el carrusel se vuelve cuadrado y usa la versión de
// celular solo si TODOS los banners activos la tienen (ver Hero.jsx).
// ============================================================
import { useState, useEffect, useRef } from 'react'
import EditorEncuadre from './EditorEncuadre'
import { estiloEncuadre } from '@/lib/encuadre'

async function subirImagen(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', 'banners')
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al subir')
  return data.url
}

/** Recuadro para subir una imagen, con vista previa. */
function CajaImagen({ titulo, medida, ayuda, url, onUrl, obligatoria, cuadrada, onError }) {
  const ref = useRef()
  const [preview, setPreview] = useState('')
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => { if (!url) { setPreview(''); if (ref.current) ref.current.value = '' } }, [url])

  async function alElegir(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setSubiendo(true)
    try {
      onUrl(await subirImagen(file))
    } catch (err) {
      onError(err.message)
      setPreview('')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {titulo} {obligatoria ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(opcional)</span>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 transition overflow-hidden bg-slate-50 ${cuadrada ? 'aspect-[9/16] max-w-[220px] mx-auto' : 'aspect-[2000/800]'}`}
      >
        {preview ? (
          <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-slate-400 p-3 text-center">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm">Haz click para subir</span>
            <span className="text-xs font-semibold text-slate-500">{medida}</span>
            <span className="text-xs text-slate-400">{ayuda}</span>
          </div>
        )}
        {subiendo && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-brand-600">Subiendo…</span>
          </div>
        )}
        {url && !subiendo && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">✓ Lista</div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={alElegir} />
    </div>
  )
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const [form, setForm] = useState({ title: '', subtitle: '', href: '', cta: '', order: 0 })
  const [imageUrl, setImageUrl] = useState('')
  const [imageMobileUrl, setImageMobileUrl] = useState('')
  const [subiendoCel, setSubiendoCel] = useState(null) // id del banner al que se le sube versión de celular
  const [encuadrando, setEncuadrando] = useState(null) // banner abierto en el editor de encuadre
  const celRef = useRef()
  const celPara = useRef(null)

  async function load() {
    setLoading(true)
    try {
      const res  = await fetch('/api/banners?all=1')
      const data = await res.json()
      setBanners(data.banners || [])
    } catch {
      setError('Error al cargar banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!imageUrl) { setError('Sube la imagen para compu primero'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El nuevo se pone al final; luego se acomoda con ↑ ↓
        body: JSON.stringify({ ...form, order: banners.length, image: imageUrl, imageMobile: imageMobileUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      setForm({ title: '', subtitle: '', href: '', cta: '', order: 0 })
      setImageUrl('')
      setImageMobileUrl('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function actualizar(id, cambios) {
    await fetch(`/api/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    })
    load()
  }

  // Subir o bajar un banner: se renumera toda la lista 0, 1, 2…
  // (así también se arreglan números repetidos de antes).
  const [moviendo, setMoviendo] = useState(false)
  async function mover(i, dir) {
    const j = i + dir
    if (j < 0 || j >= banners.length) return
    const lista = [...banners]
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    const nueva = lista.map((b, k) => ({ ...b, order: k }))
    setBanners(nueva)
    setMoviendo(true)
    try {
      await Promise.all(nueva
        .filter((b) => banners.find((x) => x._id === b._id)?.order !== b.order)
        .map((b) => fetch(`/api/banners/${b._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: b.order }),
        })))
    } finally {
      setMoviendo(false)
      load()
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este banner?')) return
    await fetch(`/api/banners/${id}`, { method: 'DELETE' })
    load()
  }

  // Subir o cambiar la versión de celular de un banner que ya existe.
  function pedirCelular(id) { celPara.current = id; celRef.current?.click() }
  async function alElegirCelular(e) {
    const file = e.target.files?.[0]
    const id = celPara.current
    e.target.value = ''
    if (!file || !id) return
    setSubiendoCel(id)
    try {
      await actualizar(id, { imageMobile: await subirImagen(file) })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendoCel(null)
    }
  }

  const activos = banners.filter((b) => b.active)
  const sinCelular = activos.filter((b) => !b.imageMobile)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Banners del carrusel</h1>
        <p className="text-slate-500 text-sm mt-1">
          Los slides que aparecen en la portada. Cada uno lleva una imagen para compu y, de preferencia, otra para celular.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {activos.length > 0 && (
        sinCelular.length === 0 ? (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
            ✓ Todos los banners activos tienen versión de celular: en celular el banner ocupa casi toda la pantalla, con letra grande.
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
            <b>{sinCelular.length} {sinCelular.length === 1 ? 'banner activo no tiene' : 'banners activos no tienen'} versión de celular.</b>{' '}
            En celular el banner ocupa casi toda la pantalla; sin versión de celular se recorta la imagen de compu (ajústala con “Ajustar encuadre” → Celular), pero se ve mucho mejor con una vertical propia.
            Súbela con el botón <b>“Versión celular”</b> de cada uno.
          </div>
        )
      )}

      {/* ── Formulario nuevo banner ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-8">
        <h2 className="font-bold text-slate-900 mb-4">Añadir nuevo banner</h2>
        <form onSubmit={handleCreate} className="space-y-4">

          <div className="grid md:grid-cols-[2.5fr_1fr] gap-4 items-start">
            <CajaImagen
              titulo="Imagen para compu" medida="2400 × 800 px"
              ayuda="Horizontal. Va de orilla a orilla: lo importante (texto, producto) al centro; en pantallas anchas se recorta un poco arriba y abajo. Ajústalo con “Ajustar encuadre”."
              url={imageUrl} onUrl={setImageUrl} obligatoria onError={setError}
            />
            <CajaImagen
              titulo="Imagen para celular" medida="1080 × 1920 px"
              ayuda="Vertical. Texto grande al centro, pocas palabras."
              url={imageMobileUrl} onUrl={setImageMobileUrl} cuadrada onError={setError}
            />
          </div>
          <p className="text-xs text-slate-400">JPG, PNG o WebP · máx 8MB. De preferencia menos de 400 KB para que la portada cargue rápido.</p>

          {/* Campos opcionales */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Título (opcional)</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Nueva temporada"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Subtítulo (opcional)</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="Ej: Descuentos en cocina"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Enlace al hacer click (opcional)</label>
              <input
                type="text"
                value={form.href}
                onChange={e => setForm(f => ({ ...f, href: e.target.value }))}
                placeholder="Ej: /productos?tag=verano"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Texto del botón (opcional)</label>
              <input
                type="text"
                value={form.cta}
                onChange={e => setForm(f => ({ ...f, cta: e.target.value }))}
                placeholder="Ej: Ver ofertas"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || !imageUrl}
              className="mt-5 px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando…' : 'Añadir banner'}
            </button>
          </div>
        </form>
      </div>

      {encuadrando && (
        <EditorEncuadre
          banner={encuadrando}
          onCerrar={() => setEncuadrando(null)}
          onGuardar={async (cambios) => {
            await actualizar(encuadrando._id, cambios)
            setEncuadrando(null)
          }}
        />
      )}

      {/* ── Lista de banners ────────────────────────────── */}
      <input ref={celRef} type="file" accept="image/*" className="hidden" onChange={alElegirCelular} />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Banners actuales</h2>
          <p className="text-xs text-slate-400 mt-0.5">Salen en la portada en este orden. Muévelos con las flechas ↑ ↓.</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Cargando…</div>
        ) : banners.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No hay banners aún. Añade el primero arriba.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {banners.map((b, i) => (
              <div key={b._id} className="flex flex-wrap items-center gap-4 p-4">
                {/* Posición + flechas */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-6 text-center text-lg font-black text-slate-300">{i + 1}</span>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => mover(i, -1)} disabled={i === 0 || moviendo} aria-label="Subir" title="Subir"
                      className="w-8 h-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">↑</button>
                    <button onClick={() => mover(i, 1)} disabled={i === banners.length - 1 || moviendo} aria-label="Bajar" title="Bajar"
                      className="w-8 h-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30">↓</button>
                  </div>
                </div>

                {/* Miniaturas: compu y celular */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-32 h-[51px] rounded-lg overflow-hidden bg-slate-100 border border-slate-200" title="Compu">
                    <img src={b.image} alt={b.title || 'Banner'} className="w-full h-full object-cover" style={estiloEncuadre(b.pos)} />
                  </div>
                  <div className="w-[51px] h-[51px] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center" title="Celular">
                    {b.imageMobile
                      ? <img src={b.imageMobile} alt="Versión celular" className="w-full h-full object-cover" style={estiloEncuadre(b.posMobile)} />
                      : <span className="text-[10px] text-slate-400 text-center leading-tight">sin<br />celular</span>}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-[140px]">
                  <div className="font-semibold text-slate-900 truncate">{b.title || <span className="text-slate-400 font-normal italic">Sin título</span>}</div>
                  {b.subtitle && <div className="text-sm text-slate-500 truncate">{b.subtitle}</div>}
                  {b.href && <div className="text-xs text-brand-600 truncate">{b.href}</div>}
                </div>


                {/* Acciones */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEncuadrando(b)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100"
                  >
                    Ajustar encuadre
                  </button>
                  <button
                    onClick={() => pedirCelular(b._id)}
                    disabled={subiendoCel === b._id}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg ${b.imageMobile
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                  >
                    {subiendoCel === b._id ? 'Subiendo…' : b.imageMobile ? 'Cambiar celular' : 'Versión celular'}
                  </button>
                  {b.imageMobile && (
                    <button
                      onClick={() => { if (confirm('¿Quitar la versión de celular de este banner?')) actualizar(b._id, { imageMobile: '' }) }}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100"
                    >
                      Quitar celular
                    </button>
                  )}
                  <button
                    onClick={() => actualizar(b._id, { active: !b.active })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                      b.active
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {b.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
