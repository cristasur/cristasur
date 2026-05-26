'use client'
// ============================================================
// /admin/banners — Gestión de slides del carrusel hero
// ============================================================
import { useState, useEffect, useRef } from 'react'

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  // Form nuevo banner
  const [form, setForm]         = useState({ title: '', subtitle: '', href: '', cta: '', order: 0 })
  const [preview, setPreview]   = useState('')   // URL local para previsualizar
  const [imageUrl, setImageUrl] = useState('')   // URL Blob definitiva
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

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

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'banners')
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir')
      setImageUrl(data.url)
    } catch (err) {
      setError(err.message)
      setPreview('')
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!imageUrl) { setError('Sube una imagen primero'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, image: imageUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      setForm({ title: '', subtitle: '', href: '', cta: '', order: 0 })
      setPreview('')
      setImageUrl('')
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(banner) {
    await fetch(`/api/banners/${banner._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !banner.active }),
    })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este banner?')) return
    await fetch(`/api/banners/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleOrder(id, order) {
    await fetch(`/api/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: Number(order) }),
    })
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Banners del carrusel</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestiona los slides que aparecen en la portada. El slide principal con texto siempre es el primero.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* ── Formulario nuevo banner ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-8">
        <h2 className="font-bold text-slate-900 mb-4">Añadir nuevo banner</h2>
        <form onSubmit={handleCreate} className="space-y-4">

          {/* Subida de imagen */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Imagen del banner <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 transition overflow-hidden bg-slate-50"
              style={{ minHeight: 180 }}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full object-cover" style={{ maxHeight: 240 }} />
              ) : (
                <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-400">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm">Haz click para subir imagen</span>
                  <span className="text-xs">JPG, PNG o WebP · máx 8MB</span>
                  <span className="text-xs text-slate-300">Recomendado: 1440 × 500 px</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="text-sm font-semibold text-brand-600">Subiendo imagen…</span>
                </div>
              )}
              {imageUrl && !uploading && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  ✓ Lista
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

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
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Orden</label>
              <input
                type="number"
                value={form.order}
                min={0}
                onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving || uploading || !imageUrl}
              className="mt-5 px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando…' : 'Añadir banner'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Lista de banners ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Banners actuales</h2>
          <p className="text-xs text-slate-400 mt-0.5">El slide principal de bienvenida siempre aparece primero automáticamente.</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">Cargando…</div>
        ) : banners.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No hay banners aún. Añade el primero arriba.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {banners.map((b) => (
              <div key={b._id} className="flex items-center gap-4 p-4">
                {/* Miniatura */}
                <div className="shrink-0 w-32 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={b.image} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{b.title || <span className="text-slate-400 font-normal italic">Sin título</span>}</div>
                  {b.subtitle && <div className="text-sm text-slate-500 truncate">{b.subtitle}</div>}
                  {b.href && <div className="text-xs text-brand-600 truncate">{b.href}</div>}
                </div>

                {/* Orden */}
                <div className="shrink-0">
                  <input
                    type="number"
                    defaultValue={b.order}
                    min={0}
                    className="w-16 px-2 py-1 rounded border border-slate-200 text-sm text-center"
                    onBlur={e => handleOrder(b._id, e.target.value)}
                  />
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(b)}
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
