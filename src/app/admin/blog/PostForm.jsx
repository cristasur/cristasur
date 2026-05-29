// ============================================================
// PostForm – formulario compartido para crear/editar artículos
// ============================================================
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── Editor de encuadre de portada ──────────────────────────────
function CoverPicker({ src, position, onChange }) {
  const parsePos = (p) => {
    if (!p) return { x: 50, y: 50 }
    const parts = String(p).split(' ')
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 }
  }

  const [pos, setPos] = useState(() => parsePos(position))
  const dragging = useRef(false)
  const lastMouse = useRef(null)
  const containerRef = useRef(null)

  function applyDelta(dx, dy) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // Invertimos el delta: arrastrar la imagen a la derecha mueve el foco a la izquierda
    setPos((prev) => {
      const next = {
        x: Math.max(0, Math.min(100, prev.x - (dx / rect.width) * 100)),
        y: Math.max(0, Math.min(100, prev.y - (dy / rect.height) * 100)),
      }
      onChange(`${next.x.toFixed(1)}% ${next.y.toFixed(1)}%`)
      return next
    })
  }

  const onMouseDown = (e) => { e.preventDefault(); dragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY } }
  const onMouseMove = (e) => {
    if (!dragging.current) return
    applyDelta(e.clientX - lastMouse.current.x, e.clientY - lastMouse.current.y)
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseUp = () => { dragging.current = false }

  const onTouchStart = (e) => { const t = e.touches[0]; dragging.current = true; lastMouse.current = { x: t.clientX, y: t.clientY } }
  const onTouchMove = (e) => {
    if (!dragging.current) return
    const t = e.touches[0]
    applyDelta(t.clientX - lastMouse.current.x, t.clientY - lastMouse.current.y)
    lastMouse.current = { x: t.clientX, y: t.clientY }
  }

  return (
    <div className="mt-3">
      <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
        <span>↔</span> Arrastra para ajustar el encuadre — así se verá en el blog
      </p>
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none border border-slate-200"
        style={{ aspectRatio: '16/9' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { dragging.current = false }}
      >
        <img
          src={src}
          alt="Portada"
          draggable={false}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
        />
        {/* Mira central */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-5 h-5 opacity-60">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          </div>
        </div>
        {/* Hint */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none backdrop-blur-sm">
          Arrastra para ajustar
        </div>
      </div>
    </div>
  )
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function PostForm({ initial }) {
  const router = useRouter()
  const isEdit = Boolean(initial?._id)

  const [form, setForm] = useState({
    title: initial?.title || '',
    slug: initial?.slug || '',
    excerpt: initial?.excerpt || '',
    content: initial?.content || '',
    coverImage: initial?.coverImage || '',
    coverPosition: initial?.coverPosition || '50% 50%',
    author: initial?.author || 'CRISTASUR',
    tags: (initial?.tags || []).join(', '),
    published: initial?.published || false,
    postType: initial?.postType || 'article',
    featured: initial?.featured || false,
    seoTitle: initial?.seoTitle || '',
    seoDescription: initial?.seoDescription || '',
    linkedProducts: Array.isArray(initial?.linkedProducts)
      ? initial.linkedProducts.map((p) => (typeof p === 'object' ? p : { _id: String(p), name: '', image: '', price: 0 }))
      : [],
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('editor') // 'editor' | 'preview'
  const [uploading, setUploading] = useState(false)
  const [prodSearch, setProdSearch] = useState('')
  const [prodResults, setProdResults] = useState([])
  const [prodSearching, setProdSearching] = useState(false)

  async function searchProducts(q) {
    if (!q.trim()) { setProdResults([]); return }
    setProdSearching(true)
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=8`)
      const data = await res.json()
      setProdResults(data.products || [])
    } catch { setProdResults([]) }
    finally { setProdSearching(false) }
  }

  function addLinkedProduct(p) {
    if (form.linkedProducts.find((x) => x._id === String(p._id))) return
    setForm((f) => ({
      ...f,
      linkedProducts: [...f.linkedProducts, { _id: String(p._id), name: p.name, image: p.image || '', price: p.price }],
    }))
    setProdSearch('')
    setProdResults([])
  }

  function removeLinkedProduct(id) {
    setForm((f) => ({ ...f, linkedProducts: f.linkedProducts.filter((x) => x._id !== id) }))
  }
  const fileInputRef = useRef(null)

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al subir imagen'); return }
      setForm((prev) => ({ ...prev, coverImage: data.url }))
    } catch {
      setError('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value }
      // Auto-generar slug solo al crear y si el campo slug está vacío o coincide con el slug previo
      if (name === 'title' && !isEdit) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      linkedProducts: form.linkedProducts.map((p) => p._id),
    }

    try {
      const url = isEdit ? `/api/posts/${initial._id}` : '/api/posts'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }
      router.push('/admin/blog')
      router.refresh()
    } catch {
      setError('Error de red')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs Editor / Vista previa */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button
          type="button"
          onClick={() => setTab('editor')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            tab === 'editor'
              ? 'border-brand-600 text-brand-700 bg-brand-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ✏️ Editor
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            tab === 'preview'
              ? 'border-brand-600 text-brand-700 bg-brand-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          👁 Vista previa
        </button>
      </div>

      {/* ── VISTA PREVIA ── */}
      {tab === 'preview' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
          {form.coverImage && (
            <img
              src={form.coverImage}
              alt={form.title}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="max-w-2xl mx-auto px-6 py-10">
            {form.tags && (
              <div className="flex flex-wrap gap-2 mb-4">
                {form.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              {form.title || <span className="text-slate-300">Sin título</span>}
            </h1>
            {form.excerpt && (
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">{form.excerpt}</p>
            )}
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
              <span>{form.author || 'CRISTASUR'}</span>
              <span>·</span>
              <span>{new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {!form.published && (
                <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full text-xs">
                  Borrador
                </span>
              )}
            </div>
            <hr className="my-8 border-slate-200" />
            {form.content ? (
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: form.content }}
              />
            ) : (
              <p className="text-slate-400 italic">El contenido aparecerá aquí…</p>
            )}
          </div>
        </div>
      )}

      {/* ── EDITOR ── */}
    <form onSubmit={handleSubmit} className={`space-y-6 ${tab === 'preview' ? 'hidden' : ''}`}>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Título */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="Cómo elegir mesas para restaurante"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Slug (URL) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0">/blog/</span>
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            required
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="como-elegir-mesas-para-restaurante"
          />
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Resumen (excerpt)
        </label>
        <textarea
          name="excerpt"
          value={form.excerpt}
          onChange={handleChange}
          rows={2}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="1-2 oraciones que resumen el artículo (aparece en la lista del blog)."
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Contenido (HTML)
        </label>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          rows={18}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="<p>Puedes escribir HTML directamente aquí...</p>"
        />
        <p className="text-xs text-slate-400 mt-1">
          Escribe HTML directamente. Usa &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, etc.
        </p>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Imagen de portada
        </label>
        <div className="flex gap-2">
          <input
            name="coverImage"
            value={form.coverImage}
            onChange={handleChange}
            type="url"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="https://... o sube un archivo →"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold whitespace-nowrap disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Subiendo…' : '📁 Subir'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </div>
        {form.coverImage && (
          <div className="mt-2 relative">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, coverImage: '', coverPosition: '50% 50%' }))}
              className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow hover:bg-red-600"
            >
              ✕
            </button>
            <CoverPicker
              src={form.coverImage}
              position={form.coverPosition}
              onChange={(pos) => setForm((p) => ({ ...p, coverPosition: pos }))}
            />
          </div>
        )}
      </div>

      {/* Author */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Autor</label>
        <input
          name="author"
          value={form.author}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Etiquetas (separadas por coma)
        </label>
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="restaurante, mesas, plásticos"
        />
      </div>

      {/* SEO */}
      <div className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">SEO</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              SEO Title (dejar vacío para usar el título)
            </label>
            <input
              name="seoTitle"
              value={form.seoTitle}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Título para Google (máx. 60 caracteres)"
            />
            <p className="text-xs text-slate-400 mt-0.5">{form.seoTitle.length}/60</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              SEO Description (dejar vacío para usar el excerpt)
            </label>
            <textarea
              name="seoDescription"
              value={form.seoDescription}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Descripción para Google (máx. 160 caracteres)"
            />
            <p className="text-xs text-slate-400 mt-0.5">{form.seoDescription.length}/160</p>
          </div>
        </div>
      </div>

      {/* Tipo de post + Destacado */}
      <div className="flex flex-wrap gap-4 items-center border border-slate-100 rounded-xl p-4 bg-slate-50">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            Tipo de publicación
          </label>
          <div className="flex gap-2">
            {[{ v: 'article', l: '📝 Artículo' }, { v: 'video', l: '▶ Video' }].map(({ v, l }) => (
              <label
                key={v}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-semibold transition-colors ${
                  form.postType === v
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-brand-400'
                }`}
              >
                <input
                  type="radio"
                  name="postType"
                  value={v}
                  checked={form.postType === v}
                  onChange={handleChange}
                  className="sr-only"
                />
                {l}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            id="featured"
            name="featured"
            type="checkbox"
            checked={form.featured}
            onChange={handleChange}
            className="w-4 h-4 accent-amber-500"
          />
          <label htmlFor="featured" className="text-sm font-semibold text-slate-700 cursor-pointer">
            ⭐ Destacado
          </label>
        </div>
      </div>

      {/* Published */}
      <div className="flex items-center gap-3">
        <input
          id="published"
          name="published"
          type="checkbox"
          checked={form.published}
          onChange={handleChange}
          className="w-4 h-4 accent-brand-600"
        />
        <label htmlFor="published" className="text-sm font-semibold text-slate-700">
          Publicado (visible en /blog)
        </label>
      </div>

      {/* Productos vinculados */}
      <div className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-bold text-slate-700 mb-1">Productos vinculados</h3>
        <p className="text-xs text-slate-400 mb-3">Aparecerán como cards "Ver producto" al final del artículo.</p>

        {/* Buscador */}
        <div className="relative">
          <input
            type="text"
            value={prodSearch}
            onChange={(e) => { setProdSearch(e.target.value); searchProducts(e.target.value) }}
            placeholder="Buscar producto por nombre…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {prodSearching && (
            <span className="absolute right-3 top-2.5 text-xs text-slate-400">Buscando…</span>
          )}
          {prodResults.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {prodResults.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => addLinkedProduct(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
                  >
                    {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p.price)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Lista de vinculados */}
        {form.linkedProducts.length > 0 && (
          <ul className="mt-3 space-y-2">
            {form.linkedProducts.map((p) => (
              <li key={p._id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover shrink-0" />}
                <span className="flex-1 text-sm text-slate-800 truncate">{p.name}</span>
                <button
                  type="button"
                  onClick={() => removeLinkedProduct(p._id)}
                  className="text-slate-400 hover:text-red-500 transition-colors text-lg leading-none px-1"
                  aria-label="Quitar"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-60"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear artículo'}
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
        >
          👁 Vista previa
        </button>
        <a
          href="/admin/blog"
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
        >
          Cancelar
        </a>
      </div>
    </form>
    </div>
  )
}
