'use client'
// ============================================================
// Formulario reutilizable para crear/editar productos
// Incluye:
//   - Upload de imagen principal (/api/upload)
//   - Upload múltiple a la galería (varias imágenes adicionales)
//   - Reordenar y eliminar imágenes de la galería
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MAX_GALLERY = 10

export default function ProductForm({ categories, initial }) {
  const router = useRouter()
  const isEdit = Boolean(initial?._id)

  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price ?? '',
    comparePrice: initial?.comparePrice ?? '',
    wholesalePrice: initial?.wholesalePrice ?? '',
    wholesaleMinQty: initial?.wholesaleMinQty ?? '',
    categories: initial?.categories?.map((c) => c._id || c) || [],
    image: initial?.image || '',
    gallery: Array.isArray(initial?.gallery) ? initial.gallery : [],
    stock: initial?.stock ?? '',
    featured: initial?.featured || false,
    active: initial?.active ?? true,
    sku: initial?.sku || '',
    variants: Array.isArray(initial?.variants) ? initial.variants : [],
    status: initial?.status || 'published',
    publishAt: initial?.publishAt || '',
    tags: Array.isArray(initial?.tags) ? initial.tags : [],
  })
  const [uploading, setUploading] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
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
        categories: isSelected
          ? f.categories.filter((c) => c !== id)
          : [...f.categories, id],
      }
    })
  }

  // Sube un archivo a /api/upload y devuelve la URL generada.
  async function uploadOne(file) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
    return data.url
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadOne(file)
      update('image', url)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Sube múltiples archivos a la galería (acepta varios a la vez).
  async function onGalleryFilesChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingGallery(true)
    setError('')
    try {
      const slotsLeft = MAX_GALLERY - form.gallery.length
      if (slotsLeft <= 0) {
        setError(`Solo puedes tener hasta ${MAX_GALLERY} imágenes en la galería.`)
        return
      }
      const toUpload = files.slice(0, slotsLeft)
      // Subimos en paralelo - limitado a slotsLeft
      const urls = await Promise.all(toUpload.map(uploadOne))
      setForm((f) => ({
        ...f,
        gallery: [...f.gallery, ...urls.filter(Boolean)].slice(0, MAX_GALLERY),
      }))
      if (files.length > slotsLeft) {
        setError(
          `Solo se añadieron ${slotsLeft} imágenes (máx ${MAX_GALLERY} en la galería).`
        )
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingGallery(false)
      e.target.value = ''
    }
  }

  function removeGalleryItem(idx) {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== idx) }))
  }

  function moveGalleryItem(idx, dir) {
    setForm((f) => {
      const next = [...f.gallery]
      const target = idx + dir
      if (target < 0 || target >= next.length) return f
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return { ...f, gallery: next }
    })
  }

  // Promueve una imagen de la galería a principal
  function makeMain(idx) {
    setForm((f) => {
      const next = [...f.gallery]
      const [picked] = next.splice(idx, 1)
      const prevMain = f.image
      return {
        ...f,
        image: picked,
        gallery: prevMain ? [prevMain, ...next] : next,
      }
    })
  }

  // ---- Variantes ----
  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { label: 'Talla', value: '', price: '', comparePrice: '', stock: 0, sku: '', image: '' },
      ],
    }))
  }
  function updateVariant(idx, key, val) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === idx ? { ...v, [key]: val } : v)),
    }))
  }
  function removeVariant(idx) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))
  }
  async function uploadVariantImage(idx, file) {
    if (!file) return
    try {
      const url = await uploadOne(file)
      updateVariant(idx, 'image', url)
    } catch (err) {
      setError(err.message)
    }
  }

  async function onDuplicate() {
    if (!isEdit) return
    if (!confirm('¿Duplicar este producto? Se creará una copia inactiva para que la edites.'))
      return
    const res = await fetch('/api/products/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: initial._id }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.error || 'Error al duplicar')
      return
    }
    if (data?.product?._id) {
      router.push(`/admin/productos/${data.product._id}`)
    } else {
      router.push('/admin/productos')
    }
  }

  function onPreview() {
    if (isEdit && initial?._id) {
      window.open(`/productos/${initial._id}`, '_blank', 'noopener')
    } else {
      alert('Guarda el producto primero para ver la vista previa.')
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
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 grid gap-5"
    >
      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-5">
          <span className="text-sm font-medium text-slate-700 block mb-1">
            Nombre *
          </span>
          <input
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={input}
          />
        </label>

        <div className="col-span-full">
          <span className="text-sm font-medium text-slate-700 block mb-2">
            Categorías *
          </span>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <label
                key={c._id}
                className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form.categories.includes(c._id)}
                  onChange={() => toggleCategory(c._id)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">
                  {c.icon} {c.name}
                </span>
              </label>
            ))}
          </div>
          {form.categories.length === 0 && (
            <span className="text-xs text-rose-500 mt-1 block">
              Debes seleccionar al menos una categoría
            </span>
          )}
        </div>
      </div>

      <label className="block">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Descripción *</span>
          <span
            className={`text-xs ${
              form.description.length > 800
                ? 'text-rose-600 font-semibold'
                : form.description.length > 720
                ? 'text-amber-600'
                : 'text-slate-400'
            }`}
          >
            {form.description.length}/800
          </span>
        </div>
        <textarea
          required
          rows={4}
          maxLength={800}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className={input}
        />
      </label>

      <div className="grid md:grid-cols-3 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Precio (MXN) *</span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            className={input}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Precio anterior (opcional)
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.comparePrice}
            onChange={(e) => update('comparePrice', e.target.value)}
            className={input}
          />
          <span className="text-xs text-slate-500">
            Se mostrará tachado para indicar descuento.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Stock <span className="text-slate-400 font-normal">(opcional — vacío = disponible sin límite)</span></span>
          <input
            type="number"
            min="0"
            placeholder="Dejar vacío si no sabes o es ilimitado"
            value={form.stock}
            onChange={(e) => update('stock', e.target.value)}
            className={input}
          />
        </label>
      </div>

      {/* Precio mayoreo (opcional) */}
      <fieldset className="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-amber-800">
          Precio mayoreo (opcional)
        </legend>
        <p className="text-xs text-amber-800/80 mb-3">
          Si rellenas estos dos campos, los clientes verán también un precio de
          mayoreo y se aplicará automáticamente cuando añadan al carrito una
          cantidad igual o mayor a la mínima.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Precio mayoreo (MXN)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.wholesalePrice}
              onChange={(e) => update('wholesalePrice', e.target.value)}
              className={input}
              placeholder="Debe ser menor al precio normal"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Cantidad mínima para mayoreo
            </span>
            <input
              type="number"
              min="2"
              step="1"
              value={form.wholesaleMinQty}
              onChange={(e) => update('wholesaleMinQty', e.target.value)}
              className={input}
              placeholder="Ej. 10"
            />
            <span className="text-xs text-slate-500">
              Desde esa cantidad por producto se aplica el precio mayoreo.
            </span>
          </label>
        </div>
        {form.wholesalePrice && form.price &&
          Number(form.wholesalePrice) >= Number(form.price) && (
          <p className="mt-2 text-xs text-rose-600">
            El precio de mayoreo debe ser menor al precio normal.
          </p>
        )}
      </fieldset>

      <div className="grid md:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">SKU (opcional)</span>
          <div className="mt-1 flex gap-2">
            <input
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              className={input + ' flex-1'}
              placeholder="Ej. COC-0001"
            />
            <button
              type="button"
              onClick={async () => {
                const categoryId = form.categories[0] || ''
                const res = await fetch(
                  `/api/products/sku-suggest?categoryId=${encodeURIComponent(categoryId)}`
                )
                const data = await res.json().catch(() => ({}))
                if (data?.sku) update('sku', data.sku)
              }}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold whitespace-nowrap"
            >
              Generar
            </button>
          </div>
        </label>

        <div className="flex items-center gap-6 mt-6">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">🔥 Destacado</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => update('active', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">Publicado</span>
          </label>
        </div>
      </div>

      {/* Tags + estado + publishAt */}
      <fieldset className="border border-slate-200 rounded-xl p-4 space-y-4">
        <legend className="px-2 text-sm font-bold text-slate-700">Visibilidad y etiquetas</legend>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Estado</span>
            <select
              value={form.status || 'published'}
              onChange={(e) => update('status', e.target.value)}
              className={input}
            >
              <option value="published">Publicado</option>
              <option value="draft">Borrador (oculto al público)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Publicar el</span>
            <input
              type="datetime-local"
              value={
                form.publishAt
                  ? new Date(form.publishAt).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) => update('publishAt', e.target.value || null)}
              className={input}
            />
            <span className="text-xs text-slate-500">
              Opcional. Si lo dejas en el futuro, no se mostrará hasta esa fecha.
            </span>
          </label>
          <label className="block md:col-span-1">
            <span className="text-sm font-medium text-slate-700">Tags</span>
            <input
              value={Array.isArray(form.tags) ? form.tags.join(', ') : (form.tags || '')}
              onChange={(e) => update('tags', e.target.value)}
              className={input}
              placeholder="navidad, eco, restaurante"
            />
            <span className="text-xs text-slate-500">
              Separados por coma. Aparecen como filtros en /tag/&lt;nombre&gt;.
            </span>
          </label>
        </div>
      </fieldset>

      {/* Imagen principal */}
      <div>
        <span className="text-sm font-medium text-slate-700">Imagen principal</span>
        <div className="mt-2 flex items-center gap-4">
          <div className="w-32 h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 grid place-items-center shrink-0">
            {form.image ? (
              <img
                src={form.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl text-slate-300">📦</span>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <input type="file" accept="image/*" onChange={onFileChange} />
              <button
                type="button"
                onClick={async () => {
                  const url = prompt('Pega la URL de la imagen (Drive, Dropbox público, etc.):')
                  if (!url) return
                  setUploading(true)
                  try {
                    const res = await fetch('/api/upload/url', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url }),
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) throw new Error(data?.error || 'Error al descargar')
                    update('image', data.url)
                  } catch (err) {
                    setError(err.message)
                  } finally {
                    setUploading(false)
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
              >
                Descargar de URL
              </button>
            </div>
            <div className="text-xs text-slate-500">
              O pega una URL externa o ruta local (/uploads/...):
            </div>
            <input
              type="text"
              inputMode="url"
              placeholder="https://... o /uploads/..."
              value={form.image}
              onChange={(e) => update('image', e.target.value)}
              className={input}
            />
            {uploading && (
              <div className="text-xs text-slate-500">Subiendo imagen…</div>
            )}
          </div>
        </div>
      </div>

      {/* Galería de imágenes adicionales */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            Galería de imágenes{' '}
            <span className="text-slate-400 font-normal">
              ({form.gallery.length}/{MAX_GALLERY})
            </span>
          </span>
          {uploadingGallery && (
            <span className="text-xs text-slate-500">Subiendo…</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Imágenes adicionales que se muestran en el detalle del producto. Puedes
          seleccionar varios archivos a la vez.
        </p>

        <div className="mt-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
            <span>+ Añadir imágenes</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onGalleryFilesChange}
              className="hidden"
              disabled={form.gallery.length >= MAX_GALLERY}
            />
          </label>
        </div>

        {form.gallery.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {form.gallery.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square"
              >
                <img
                  src={url}
                  alt={`Galería ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(i, -1)}
                      disabled={i === 0}
                      className="w-7 h-7 grid place-items-center rounded-md bg-white/90 text-slate-700 hover:bg-white shadow disabled:opacity-40"
                      title="Mover a la izquierda"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(i, 1)}
                      disabled={i === form.gallery.length - 1}
                      className="w-7 h-7 grid place-items-center rounded-md bg-white/90 text-slate-700 hover:bg-white shadow disabled:opacity-40"
                      title="Mover a la derecha"
                    >
                      →
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => makeMain(i)}
                      className="px-2 h-7 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-semibold shadow"
                      title="Usar como principal"
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(i)}
                      className="w-7 h-7 grid place-items-center rounded-md bg-rose-500 hover:bg-rose-600 text-white shadow"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variantes */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-slate-700">Variantes</span>
            <p className="text-xs text-slate-500 mt-0.5">
              Presentaciones del mismo producto (ej. tallas, colores). Cada variante
              puede tener su propio precio, stock e imagen.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
          >
            + Añadir variante
          </button>
        </div>

        {form.variants.length > 0 && (
          <div className="mt-3 space-y-3">
            {form.variants.map((v, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_100px_100px_100px_140px_auto] gap-2 items-start p-3 border border-slate-200 rounded-xl bg-slate-50/50"
              >
                <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden grid place-items-center text-slate-300 text-xs">
                  {v.image ? (
                    <img src={v.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>sin foto</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500">Etiqueta</label>
                  <input
                    value={v.label}
                    onChange={(e) => updateVariant(i, 'label', e.target.value)}
                    placeholder="Talla, Color, Tamaño…"
                    maxLength={60}
                    className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500">Valor</label>
                  <input
                    value={v.value}
                    onChange={(e) => updateVariant(i, 'value', e.target.value)}
                    placeholder="M, Azul, 12oz…"
                    maxLength={60}
                    className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500">Precio</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={v.price ?? ''}
                    onChange={(e) => updateVariant(i, 'price', e.target.value)}
                    placeholder="(usa el base)"
                    className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500">Anterior</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={v.comparePrice ?? ''}
                    onChange={(e) => updateVariant(i, 'comparePrice', e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={v.stock ?? 0}
                    onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-500">Imagen</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadVariantImage(i, e.target.files?.[0])}
                    className="text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="self-end md:self-center w-8 h-8 grid place-items-center rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600"
                  title="Eliminar variante"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex gap-2">
          {isEdit && (
            <>
              <button
                type="button"
                onClick={onPreview}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                title="Abrir detalle del producto en una pestaña nueva"
              >
                Vista previa
              </button>
              <button
                type="button"
                onClick={onDuplicate}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Duplicar
              </button>
            </>
          )}
        </div>
        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={() => router.push('/admin/productos')}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading || uploadingGallery}
            className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </form>
  )
}
