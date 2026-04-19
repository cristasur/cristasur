'use client'
// Gestor de categorías - CRUD inline con subida de imagen
import { useState } from 'react'
import Icon from '@/components/Icon'

const emptyForm = { name: '', icon: '', image: '', description: '', order: 0, active: true, featured: false }

export default function CategoryManager({ initialCategories }) {
  const [cats, setCats] = useState(initialCategories)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al subir imagen')
        return
      }
      setForm((f) => ({ ...f, image: data.url }))
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }
      if (editingId) {
        setCats((cs) => cs.map((c) => (c._id === editingId ? { ...c, ...data.category } : c)))
      } else {
        setCats((cs) => [...cs, { ...data.category, productCount: 0 }].sort((a, b) => a.order - b.order))
      }
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id) {
    if (!confirm('¿Eliminar esta categoría?')) return
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.error || 'Error al eliminar')
      return
    }
    setCats((cs) => cs.filter((c) => c._id !== id))
    if (editingId === id) resetForm()
  }

  function onEdit(cat) {
    setEditingId(cat._id)
    setForm({
      name: cat.name,
      icon: cat.icon || '',
      image: cat.image || '',
      description: cat.description || '',
      order: cat.order || 0,
      active: cat.active,
      featured: Boolean(cat.featured),
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const featuredCount = cats.filter((c) => c.featured).length

  const input =
    'mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none'

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-800 flex items-center justify-between gap-3">
          <span>
            <strong>{featuredCount}</strong> de 4 categorías destacadas en el inicio.
            {featuredCount === 0 && ' (Mientras no marques ninguna, se mostrarán las primeras 4.)'}
            {featuredCount > 4 && ' Solo aparecerán las primeras 4 por orden.'}
          </span>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="p-3">Categoría</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Productos</th>
              <th className="p-3">Orden</th>
              <th className="p-3">Estado</th>
              <th className="p-3">En inicio</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cats.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-brand-50 overflow-hidden grid place-items-center text-brand-700 font-black shrink-0">
                      {c.image ? (
                        <img src={c.image} alt="" className="w-full h-full object-cover" />
                      ) : c.icon ? (
                        <span>{c.icon}</span>
                      ) : (
                        <span>{c.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      {c.description && <div className="text-xs text-slate-500 line-clamp-1">{c.description}</div>}
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-xs text-slate-500">{c.slug}</td>
                <td className="p-3">{c.productCount}</td>
                <td className="p-3">{c.order}</td>
                <td className="p-3">
                  {c.active ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Inactiva
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {c.featured ? (
                    <span className="inline-flex items-center gap-1 text-accent-700 bg-accent-50 px-2 py-0.5 rounded-full text-xs">
                      <Icon name="star" className="w-3 h-3" />
                      Destacada
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => onEdit(c)} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800">
                    Editar
                  </button>
                  <button onClick={() => onDelete(c._id)} className="ml-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {cats.length === 0 && (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-500">
                  Sin categorías todavía. Crea la primera con el formulario a la derecha.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 lg:sticky lg:top-8">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Icon name={editingId ? 'edit' : 'plus'} className="w-4 h-4 text-brand-700" />
          {editingId ? 'Editar categoría' : 'Nueva categoría'}
        </h3>

        {error && (
          <div className="mb-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <label className="block mb-3">
          <span className="text-sm font-medium text-slate-700">Nombre *</span>
          <input
            required
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={input}
          />
        </label>

        {/* Imagen */}
        <div className="mb-3">
          <span className="text-sm font-medium text-slate-700">Imagen de portada</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 grid place-items-center shrink-0 text-slate-300">
              {form.image ? (
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="box" className="w-8 h-8" strokeWidth={1.5} />
              )}
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <input type="file" accept="image/*" onChange={onFileChange} className="text-sm w-full" />
              <input
                type="text"
                inputMode="url"
                placeholder="o pega una URL: https://... o /uploads/..."
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className={input}
              />
              {uploading && <div className="text-xs text-brand-700">Subiendo...</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block mb-3">
            <span className="text-sm font-medium text-slate-700">Icono (opcional)</span>
            <input
              maxLength={10}
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className={input}
              placeholder="Letra o emoji"
            />
            <span className="block text-[11px] text-slate-400 mt-1">
              Se muestra si no hay imagen.
            </span>
          </label>
          <label className="block mb-3">
            <span className="text-sm font-medium text-slate-700">Orden</span>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              className={input}
            />
          </label>
        </div>
        <label className="block mb-3">
          <span className="text-sm font-medium text-slate-700">Descripción (opcional)</span>
          <textarea
            rows={2}
            maxLength={300}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={input}
          />
        </label>
        <label className="inline-flex items-center gap-2 mb-2">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm text-slate-700">Visible en la tienda</span>
        </label>
        <label className="flex items-start gap-2 mb-4">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            className="w-4 h-4 mt-0.5"
          />
          <span className="text-sm text-slate-700">
            Destacada en el inicio
            <span className="block text-[11px] text-slate-400">
              Aparece en el mosaico principal del hero (máx. 4).
            </span>
          </span>
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={saving || uploading} className="flex-1 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold">
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear categoría'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
