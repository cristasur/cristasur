'use client'
// ============================================================
// Formulario reutilizable para crear/editar productos
// Incluye upload de imagen via /api/upload
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProductForm({ categories, initial }) {
  const router = useRouter()
  const isEdit = Boolean(initial?._id)

  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price ?? '',
    comparePrice: initial?.comparePrice ?? '',
    categories: initial?.categories?.map(c => c._id || c) || [],
    image: initial?.image || '',
    stock: initial?.stock ?? 0,
    featured: initial?.featured || false,
    active: initial?.active ?? true,
    sku: initial?.sku || '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function toggleCategory(id) {
    setForm((f) => {
      const isSelected = f.categories.includes(id)
      return {
        ...f,
        categories: isSelected ? f.categories.filter(c => c !== id) : [...f.categories, id]
      }
    })
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
      update('image', data.url)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const endpoint = isEdit ? `/api/products/${initial._id}` : '/api/products'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }
      router.push('/admin/productos')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const input =
    'mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none'

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 grid gap-5">
      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-5">
          <span className="text-sm font-medium text-slate-700 block mb-1">Nombre *</span>
          <input required maxLength={120} value={form.name} onChange={(e) => update('name', e.target.value)} className={input} />
        </label>

        <div className="col-span-full">
          <span className="text-sm font-medium text-slate-700 block mb-2">Categorías *</span>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <label key={c._id} className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={form.categories.includes(c._id)} 
                  onChange={() => toggleCategory(c._id)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500" 
                />
                <span className="text-sm text-slate-700">{c.icon} {c.name}</span>
              </label>
            ))}
          </div>
          {form.categories.length === 0 && <span className="text-xs text-rose-500 mt-1 block">Debes seleccionar al menos una categoría</span>}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Descripción *</span>
        <textarea
          required
          rows={4}
          maxLength={2000}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className={input}
        />
      </label>

      <div className="grid md:grid-cols-3 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Precio (MXN) *</span>
          <input type="number" min="0" step="0.01" required value={form.price} onChange={(e) => update('price', e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Precio anterior (opcional)</span>
          <input type="number" min="0" step="0.01" value={form.comparePrice} onChange={(e) => update('comparePrice', e.target.value)} className={input} />
          <span className="text-xs text-slate-500">Se mostrará tachado para indicar descuento.</span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Stock</span>
          <input type="number" min="0" value={form.stock} onChange={(e) => update('stock', e.target.value)} className={input} />
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">SKU (opcional)</span>
          <input value={form.sku} onChange={(e) => update('sku', e.target.value)} className={input} />
        </label>

        <div className="flex items-center gap-6 mt-6">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-700">🔥 Destacado</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-700">Publicado</span>
          </label>
        </div>
      </div>

      {/* Imagen */}
      <div>
        <span className="text-sm font-medium text-slate-700">Imagen</span>
        <div className="mt-2 flex items-center gap-4">
          <div className="w-32 h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 grid place-items-center shrink-0">
            {form.image ? (
              <img src={form.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-slate-300">📦</span>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <input type="file" accept="image/*" onChange={onFileChange} />
            <div className="text-xs text-slate-500">O pega una URL externa o ruta local (/uploads/...):</div>
            <input
              type="text"
              inputMode="url"
              placeholder="https://... o /uploads/..."
              value={form.image}
              onChange={(e) => update('image', e.target.value)}
              className={input}
            />
            {uploading && <div className="t