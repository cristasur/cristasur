// ============================================================
// PostForm – formulario compartido para crear/editar artículos
// ============================================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    author: initial?.author || 'CRISTASUR',
    tags: (initial?.tags || []).join(', '),
    published: initial?.published || false,
    seoTitle: initial?.seoTitle || '',
    seoDescription: initial?.seoDescription || '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
    <form onSubmit={handleSubmit} className="space-y-6">
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
          URL de imagen de portada
        </label>
        <input
          name="coverImage"
          value={form.coverImage}
          onChange={handleChange}
          type="url"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="https://..."
        />
        {form.coverImage && (
          <img
            src={form.coverImage}
            alt="Vista previa"
            className="mt-2 h-36 w-auto object-cover rounded-lg border border-slate-100"
          />
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

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-60"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear artículo'}
        </button>
        <a
          href="/admin/blog"
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
