'use client'
// ============================================================
// Formulario reutilizable para crear/editar productos
// Incluye:
//   - Upload de imagen principal (/api/upload)
//   - Upload múltiple a la galería (varias imágenes adicionales)
//   - Reordenar y eliminar imágenes de la galería
// ============================================================
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const MAX_GALLERY = 10

const COMMON_COLORS = [
  'Blanco', 'Negro', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo',
  'Naranja', 'Rosa', 'Morado', 'Café', 'Beige', 'Dorado', 'Plateado', 'Transparente',
]

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Único']

export default function ProductForm({ categories, brands = [], materials = [], initial, lines = []}) {
  const router = useRouter()
  const isEdit = Boolean(initial?._id)

  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price ?? '',
    comparePrice: initial?.comparePrice ?? '',
    wholesalePrice: initial?.wholesalePrice ?? '',
    wholesaleMinQty: initial?.wholesaleMinQty ?? '',
    bulkPrice: initial?.bulkPrice ?? initial?.hundredPrice ?? '',
    bulkMinQty: initial?.bulkMinQty ?? initial?.hundredMinQty ?? '',
    categories: initial?.categories?.map((c) => c._id || c) || [],
    image: initial?.image || '',
    gallery: Array.isArray(initial?.gallery) ? initial.gallery : [],
    videoUrl: initial?.videoUrl || '',
    stock: initial?.stock ?? '',
    qtyStep: initial?.qtyStep ?? '',
    featured: initial?.featured || false,
    active: initial?.active ?? true,
    sku: initial?.sku || '',
    variants: Array.isArray(initial?.variants)
      ? initial.variants.map((v) => ({
          ...v,
          // Garantizar que images exista: si no tiene galería propia y tiene image, la usamos como base
          images: Array.isArray(v.images) && v.images.length > 0
            ? v.images
            : v.image ? [v.image] : [],
          wholesalePrice:  v.wholesalePrice  ?? '',
          wholesaleMinQty: v.wholesaleMinQty ?? '',
          bulkPrice:       v.bulkPrice       ?? v.hundredPrice    ?? '',
          bulkMinQty:      v.bulkMinQty      ?? v.hundredMinQty   ?? '',
        }))
      : [],
    status: initial?.status || 'published',
    publishAt: initial?.publishAt || '',
    tags: Array.isArray(initial?.tags) ? initial.tags : [],
    brand: initial?.brand?._id || initial?.brand || '',
    materials: Array.isArray(initial?.materials)
      ? initial.materials.map((m) => m._id || m)
      : [],
    resistencia: initial?.resistencia || '',
    line: initial?.line || '',
    lineLabel: initial?.lineLabel || '',
    specs: Array.isArray(initial?.specs) ? initial.specs : [],
    highlights: Array.isArray(initial?.highlights) ? initial.highlights : [],
    usage: initial?.usage || '',
    color: initial?.color || '',
    weight: initial?.weight ?? '',
    length: initial?.length ?? '',
    width:  initial?.width  ?? '',
    height: initial?.height ?? '',
    capacity:     initial?.capacity     ?? '',
    capacityUnit: initial?.capacityUnit || 'L',
    pkgWeight: initial?.pkgWeight ?? '',
    pkgLength: initial?.pkgLength ?? '',
    pkgWidth:  initial?.pkgWidth  ?? '',
    pkgHeight: initial?.pkgHeight ?? '',
    pkgNote:   initial?.pkgNote   || '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [galleryUrlInput, setGalleryUrlInput] = useState('')
  const [addingGalleryUrl, setAddingGalleryUrl] = useState(false)

  // Listas locales de marcas y materiales (se actualizan al crear uno nuevo)
  const [brandList, setBrandList] = useState(brands)
  const [materialList, setMaterialList] = useState(materials)

  // Estado para crear nueva marca en línea
  const [addingBrand, setAddingBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandError, setBrandError] = useState('')

  // Estado para crear nuevo material en línea
  const [addingMaterial, setAddingMaterial] = useState(false)
  const [newMaterialName, setNewMaterialName] = useState('')
  const [materialSaving, setMaterialSaving] = useState(false)
  const [materialError, setMaterialError] = useState('')

  async function createBrand() {
    const name = newBrandName.trim()
    if (!name) return
    setBrandSaving(true); setBrandError('')
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) { setBrandError(data.error || 'Error al crear marca'); return }
      setBrandList((prev) => [...prev, data.brand])
      update('brand', data.brand._id)
      setAddingBrand(false)
      setNewBrandName('')
    } catch { setBrandError('Error de red') }
    finally { setBrandSaving(false) }
  }

  async function createMaterial() {
    const name = newMaterialName.trim()
    if (!name) return
    setMaterialSaving(true); setMaterialError('')
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) { setMaterialError(data.error || 'Error al crear material'); return }
      setMaterialList((prev) => [...prev, data.material])
      update('materials', [...form.materials, data.material._id])
      setAddingMaterial(false)
      setNewMaterialName('')
    } catch { setMaterialError('Error de red') }
    finally { setMaterialSaving(false) }
  }

  // ---- Chip input de etiquetas ----
  const [familyTagInput, setFamilyTagInput] = useState('')
  const [familyTagSuggestions, setFamilyTagSuggestions] = useState([])
  const [allExistingTags, setAllExistingTags] = useState([])
  const [tagsLoaded, setTagsLoaded] = useState(false)

  async function loadFamilyTagSuggestions() {
    if (tagsLoaded) return
    try {
      const res = await fetch('/api/products/tags')
      const data = await res.json().catch(() => ({}))
      setAllExistingTags(data.tags || [])
      setTagsLoaded(true)
    } catch {}
  }

  function onFamilyTagInputChange(e) {
    const val = e.target.value
    // Si escribe coma, confirmar el tag automáticamente
    if (val.endsWith(',')) {
      addFamilyTag(val.slice(0, -1).trim())
      return
    }
    setFamilyTagInput(val)
    const q = val.trim().toLowerCase()
    if (q.length >= 1) {
      const current = Array.isArray(form.tags) ? form.tags : []
      setFamilyTagSuggestions(
        allExistingTags
          .filter((t) => t.toLowerCase().includes(q) && !current.includes(t))
          .slice(0, 8)
      )
    } else {
      setFamilyTagSuggestions([])
    }
  }

  function onFamilyTagInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFamilyTag(familyTagInput.trim())
    } else if (e.key === 'Backspace' && familyTagInput === '') {
      const current = Array.isArray(form.tags) ? form.tags : []
      if (current.length > 0) update('tags', current.slice(0, -1))
    }
  }

  function addFamilyTag(raw) {
    const val = raw.toLowerCase().trim().replace(/\s+/g, '-')
    if (!val) return
    const current = Array.isArray(form.tags) ? form.tags : []
    if (!current.includes(val)) update('tags', [...current, val])
    setFamilyTagInput('')
    setFamilyTagSuggestions([])
  }

  function removeFamilyTag(tag) {
    const current = Array.isArray(form.tags) ? form.tags : []
    update('tags', current.filter((t) => t !== tag))
  }

  // ---- Búsqueda de productos relacionados (mantenido internamente, UI removida) ----

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
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      // Subimos todos en paralelo
      const urls = await Promise.all(files.map(uploadOne))
      const validUrls = urls.filter(Boolean)
      if (!validUrls.length) return

      setForm((f) => {
        // Si ya hay imagen principal, todos van a la galería
        if (f.image) {
          const slotsLeft = MAX_GALLERY - f.gallery.length
          const toAdd = validUrls.slice(0, slotsLeft)
          return { ...f, gallery: [...f.gallery, ...toAdd].slice(0, MAX_GALLERY) }
        }
        // Si no hay imagen principal: primera → portada, resto → galería
        const [first, ...rest] = validUrls
        const slotsLeft = MAX_GALLERY - f.gallery.length
        return {
          ...f,
          image: first,
          gallery: [...f.gallery, ...rest.slice(0, slotsLeft)].slice(0, MAX_GALLERY),
        }
      })
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

  // Añade una imagen a la galería desde una URL (descarga a Blob vía /api/upload/url)
  async function addGalleryByUrl() {
    const raw = galleryUrlInput.trim()
    if (!raw) return
    if (form.gallery.length >= MAX_GALLERY) {
      setError(`Solo puedes tener hasta ${MAX_GALLERY} imágenes en la galería.`)
      return
    }
    setAddingGalleryUrl(true)
    setError('')
    try {
      let finalUrl = raw
      // Si es URL externa, intentamos re-hospedar vía /api/upload/url
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const res = await fetch('/api/upload/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: raw }),
        })
        const data = await res.json()
        if (res.ok && data.url) {
          finalUrl = data.url
        }
        // Si falla el re-hospedaje, usamos la URL directa igualmente
      }
      setForm((f) => ({
        ...f,
        gallery: [...f.gallery, finalUrl].slice(0, MAX_GALLERY),
      }))
      setGalleryUrlInput('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingGalleryUrl(false)
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

  // ---- Ficha técnica (specs) ----
  // Cada fila es { group, label, value }. El grupo se hereda de la fila
  // anterior al añadir, que es como se captura en la práctica: primero
  // "Medidas", luego varias filas seguidas de ese mismo grupo.
  function addSpec() {
    setForm((f) => {
      const last = f.specs[f.specs.length - 1]
      return { ...f, specs: [...f.specs, { group: last?.group || '', label: '', value: '' }] }
    })
  }
  function updateSpec(i, key, val) {
    setForm((f) => {
      const next = [...f.specs]
      next[i] = { ...next[i], [key]: val }
      return { ...f, specs: next }
    })
  }
  function removeSpec(i) {
    setForm((f) => ({ ...f, specs: f.specs.filter((_, j) => j !== i) }))
  }
  function moveSpec(i, dir) {
    setForm((f) => {
      const j = i + dir
      if (j < 0 || j >= f.specs.length) return f
      const next = [...f.specs]
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...f, specs: next }
    })
  }

  // ---- Atributos destacados ----
  function addHighlight() {
    setForm((f) => ({ ...f, highlights: [...f.highlights, ''] }))
  }
  function updateHighlight(i, val) {
    setForm((f) => {
      const next = [...f.highlights]
      next[i] = val
      return { ...f, highlights: next }
    })
  }
  function removeHighlight(i) {
    setForm((f) => ({ ...f, highlights: f.highlights.filter((_, j) => j !== i) }))
  }

  function addVariant() {
    // Solo los campos que el modelo conserva. Precio y caja se heredan
    // del padre SIEMPRE (ver REGLA DE ORO en models/Product.js).
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { label: 'Color', value: '', sku: '', barcode: '', available: true, stock: null, image: '', images: [] },
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
  async function addVariantGalleryImages(vIdx, files) {
    if (!files?.length) return
    try {
      const urls = await Promise.all(Array.from(files).map(uploadOne))
      setForm((f) => {
        const v = f.variants[vIdx]
        const current = Array.isArray(v.images) ? v.images : (v.image ? [v.image] : [])
        const merged = [...current, ...urls.filter((u) => !current.includes(u))].slice(0, 10)
        return {
          ...f,
          variants: f.variants.map((vv, i) =>
            i === vIdx ? { ...vv, images: merged, image: merged[0] || vv.image } : vv
          ),
        }
      })
    } catch (err) {
      setError(err.message)
    }
  }
  function removeVariantGalleryImage(vIdx, url) {
    setForm((f) => {
      const v = f.variants[vIdx]
      const newImages = (Array.isArray(v.images) ? v.images : []).filter((u) => u !== url)
      return {
        ...f,
        variants: f.variants.map((vv, i) =>
          i === vIdx ? { ...vv, images: newImages, image: newImages[0] || '' } : vv
        ),
      }
    })
  }
  async function uploadVariantImage(idx, file) {
    if (!file) return
    try {
      const url = await uploadOne(file)
      // Sube como primera foto de la galería de variante y también como thumbnail
      setForm((f) => {
        const v = f.variants[idx]
        const currentImages = Array.isArray(v.images) ? v.images : []
        const newImages = [url, ...currentImages.filter((u) => u !== url)]
        return {
          ...f,
          variants: f.variants.map((vv, i) =>
            i === idx ? { ...vv, image: url, images: newImages } : vv
          ),
        }
      })
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

      const payload = {
        ...form,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 md:p-6 grid gap-5"
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
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Disponibilidad</span>
          {(() => {
            const stockMode =
              form.stock === '' || form.stock === null
                ? 'disponible'
                : Number(form.stock) === 0
                ? 'agotado'
                : 'cantidad'
            return (
              <>
                <div className="flex gap-2 flex-wrap mt-1">
                  {[
                    { val: 'disponible', label: '✅ Disponible' },
                    { val: 'agotado',    label: '❌ Sin stock'  },
                    { val: 'cantidad',   label: '🔢 Cantidad'   },
                  ].map(({ val, label }) => (
                    <label
                      key={val}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition text-sm ${
                        stockMode === val
                          ? 'border-brand-500 bg-brand-50 text-brand-800 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="stockMode"
                        checked={stockMode === val}
                        onChange={() => {
                          if (val === 'disponible') update('stock', '')
                          else if (val === 'agotado') update('stock', 0)
                          else update('stock', form.stock > 0 ? form.stock : 1)
                        }}
                        className="w-4 h-4 accent-brand-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {stockMode === 'cantidad' && (
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 50"
                    value={form.stock}
                    onChange={(e) => update('stock', e.target.value)}
                    className={input}
                  />
                )}
              </>
            )
          })()}
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Vender de <span className="text-brand-600 font-semibold">N en N</span> <span className="text-slate-400 font-normal">(opcional)</span></span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Ej: 3, 6, 12 — vacío = de 1 en 1"
            value={form.qtyStep}
            onChange={(e) => update('qtyStep', e.target.value)}
            className={input}
          />
          <span className="text-xs text-slate-500">
            {form.qtyStep && Number(form.qtyStep) > 1
              ? `El cliente podrá pedir: ${[1,2,3].map(n => n * Number(form.qtyStep)).join(', ')}…`
              : 'Dejar vacío para vender de 1 en 1.'}
          </span>
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

      {/* Precio por ciento (tercer precio — sin funcionalidad activa aún) */}
      <fieldset className="border border-violet-200 bg-violet-50/30 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-violet-800">
          Precio por ciento <span className="font-normal text-violet-500 text-xs">(tercer precio — próximamente)</span>
        </legend>
        <p className="text-xs text-violet-700/80 mb-3">
          Para clientes que compran 100 piezas o más. Solo se guarda por ahora — la lógica automática se activará próximamente.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Precio por ciento (MXN)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.bulkPrice}
              onChange={(e) => update('bulkPrice', e.target.value)}
              className={input}
              placeholder="Debe ser menor al precio normal"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Cantidad mínima
            </span>
            <input
              type="number"
              min="2"
              step="1"
              value={form.bulkMinQty}
              onChange={(e) => update('bulkMinQty', e.target.value)}
              className={input}
              placeholder="Ej. 100"
            />
            <span className="text-xs text-slate-500">
              Desde esa cantidad se aplicará el precio por ciento.
            </span>
          </label>
        </div>
        {form.bulkPrice && form.price &&
          Number(form.bulkPrice) >= Number(form.price) && (
          <p className="mt-2 text-xs text-rose-600">
            El precio por ciento debe ser menor al precio normal.
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
          <label className="inline-flex items-center gap-2" title="Si lo desactivas, el producto se oculta del catálogo aunque esté publicado.">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => {
                const next = e.target.checked
                setForm((f) => ({
                  ...f,
                  active: next,
                  // Si activas Visible y todavía está en borrador, lo pasamos a publicado
                  // automáticamente para que no quede en limbo (publicar=visible al cliente).
                  status: next && f.status === 'draft' ? 'published' : f.status,
                }))
              }}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">Visible en el catálogo</span>
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Para sacar un producto de <b>Borradores</b>, cambia el <b>Estado</b> a “Publicado” en la
          sección <i>Visibilidad y etiquetas</i> más abajo.
        </p>
      </div>

      {/* Marca y color */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="block">
          <span className="text-sm font-medium text-slate-700">Marca (opcional)</span>
          <select
            value={addingBrand ? '__new__' : form.brand}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setAddingBrand(true); setBrandError(''); setNewBrandName('')
              } else {
                setAddingBrand(false); update('brand', e.target.value)
              }
            }}
            className={input}
          >
            <option value="">— Sin marca —</option>
            <option value="__new__">＋ Añadir nueva marca…</option>
            {brandList.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          {addingBrand && (
            <div className="mt-2 flex gap-2 items-center">
              <input
                autoFocus
                type="text"
                placeholder="Nombre de la nueva marca"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createBrand() } }}
                className="flex-1 px-3 py-2 rounded-lg border border-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={createBrand}
                disabled={brandSaving || !newBrandName.trim()}
                className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold"
              >
                {brandSaving ? '…' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => { setAddingBrand(false); setNewBrandName('') }}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
              >
                ✕
              </button>
            </div>
          )}
          {brandError && <p className="text-xs text-rose-600 mt-1">{brandError}</p>}
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Color (opcional)</span>
          <input
            list="color-suggestions"
            value={form.color}
            onChange={(e) => update('color', e.target.value)}
            placeholder="Ej: Rojo, Azul marino, Transparente"
            className={input}
          />
          <datalist id="color-suggestions">
            {COMMON_COLORS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <span className="text-xs text-slate-500">Escribe o selecciona un color de la lista.</span>
        </label>
      </div>

      {/* Materiales (multi-selección) */}
      <div>
        <span className="text-sm font-medium text-slate-700 block mb-2">
          Materiales <span className="text-slate-400 font-normal">(opcional, puedes seleccionar varios)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {materialList.map((m) => {
            const selected = form.materials.includes(m._id)
            return (
              <button
                key={m._id}
                type="button"
                onClick={() =>
                  update(
                    'materials',
                    selected
                      ? form.materials.filter((id) => id !== m._id)
                      : [...form.materials, m._id]
                  )
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  selected
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-brand-400'
                }`}
              >
                {selected ? '✓ ' : ''}{m.name}
              </button>
            )
          })}
          {/* Botón para añadir nuevo material */}
          {!addingMaterial && (
            <button
              type="button"
              onClick={() => { setAddingMaterial(true); setMaterialError(''); setNewMaterialName('') }}
              className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-slate-400 text-slate-500 hover:border-brand-500 hover:text-brand-600 transition"
            >
              ＋ Añadir material
            </button>
          )}
        </div>
        {/* Input inline para nuevo material */}
        {addingMaterial && (
          <div className="mt-2 flex gap-2 items-center">
            <input
              autoFocus
              type="text"
              placeholder="Nombre del nuevo material"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createMaterial() } }}
              className="flex-1 px-3 py-2 rounded-lg border border-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none text-sm"
            />
            <button
              type="button"
              onClick={createMaterial}
              disabled={materialSaving || !newMaterialName.trim()}
              className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {materialSaving ? '…' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => { setAddingMaterial(false); setNewMaterialName('') }}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
            >
              ✕
            </button>
          </div>
        )}
        {materialError && <p className="text-xs text-rose-600 mt-1">{materialError}</p>}
        {form.materials.length === 0 && (
          <span className="text-xs text-slate-400 mt-1 block">Ningún material seleccionado.</span>
        )}
      </div>

      {/* Resistencia */}
      <div>
        <span className="text-sm font-medium text-slate-700 block mb-2">
          Resistencia <span className="text-slate-400 font-normal">— opcional</span>
        </span>
        <div className="flex gap-3">
          {[
            { value: '', label: 'Sin especificar' },
            { value: 'baja', label: '🟡 Baja' },
            { value: 'media', label: '🟠 Media' },
            { value: 'alta', label: '🟢 Alta' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('resistencia', opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                form.resistencia === opt.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-brand-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Línea / colección */}
      <fieldset className="border border-slate-200 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-slate-700">Línea o colección</legend>
        <p className="text-xs text-slate-500 mb-3">
          Agrupa productos <strong>hermanos</strong>: el plato de 28 cm, el de 26, el
          tazón y la taza de la misma colección. En la ficha aparecen como miniaturas
          para saltar entre ellos. No son variantes: cada uno tiene su precio y su SKU.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nombre de la línea</span>
            <input
              list="lineas-existentes"
              maxLength={80}
              value={form.line}
              onChange={(e) => update('line', e.target.value)}
              placeholder="Ej: Caribe NYC, Liora Ripple"
              className={input}
            />
            {/* Autocompletado con las líneas que ya existen: escribir
                "Caribe" y "caribe " crearía dos líneas distintas. */}
            <datalist id="lineas-existentes">
              {(lines || []).map((l) => <option key={l} value={l} />)}
            </datalist>
            <span className="block text-[11px] text-slate-400 mt-1">
              Debe escribirse IGUAL en todos los productos de la línea.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Etiqueta de este producto</span>
            <input
              maxLength={30}
              value={form.lineLabel}
              onChange={(e) => update('lineLabel', e.target.value)}
              placeholder="Ej: 28 cm, 350 ml, Grande"
              className={input}
            />
            <span className="block text-[11px] text-slate-400 mt-1">
              Lo que distingue a este de sus hermanos. Se ve bajo la miniatura.
            </span>
          </label>
        </div>
      </fieldset>

      {/* Atributos destacados */}
      <fieldset className="border border-slate-200 rounded-xl p-4 space-y-3">
        <legend className="px-2 text-sm font-bold text-slate-700">Atributos destacados</legend>
        <p className="text-xs text-slate-500">
          Lo más importante del producto, en frases cortas. Se muestran con palomita
          arriba de la ficha técnica. Ej: «Apto lavavajillas», «Caja de 6 piezas».
        </p>

        {form.highlights.map((h, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-emerald-500 shrink-0">✓</span>
            <input
              value={h}
              maxLength={120}
              onChange={(e) => updateHighlight(i, e.target.value)}
              placeholder="Ej: Resistente a temperaturas de -20 °C a 250 °C"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeHighlight(i)}
              className="shrink-0 px-2.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm"
              aria-label="Quitar atributo"
            >
              ✕
            </button>
          </div>
        ))}

        {form.highlights.length === 0 && (
          <p className="text-xs text-slate-400 italic">Sin atributos destacados todavía.</p>
        )}

        <button
          type="button"
          onClick={addHighlight}
          disabled={form.highlights.length >= 12}
          className="text-sm font-semibold text-brand-700 hover:text-brand-800 disabled:text-slate-400"
        >
          + Añadir atributo {form.highlights.length >= 12 && '(máximo 12)'}
        </button>
      </fieldset>

      {/* Ficha técnica */}
      <fieldset className="border border-slate-200 rounded-xl p-4 space-y-3">
        <legend className="px-2 text-sm font-bold text-slate-700">Ficha técnica</legend>
        <p className="text-xs text-slate-500">
          Una fila por dato. El <strong>grupo</strong> junta las filas en bloques
          («Medidas y dimensiones», «Materiales»…). Repite el mismo grupo en filas
          seguidas para que queden juntas.
        </p>

        {form.specs.length > 0 && (
          <div className="hidden md:grid grid-cols-[1fr_1fr_1.4fr_auto] gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide px-1">
            <span>Grupo</span><span>Etiqueta</span><span>Valor</span><span />
          </div>
        )}

        {form.specs.map((row, i) => {
          const newGroup = i === 0 || form.specs[i - 1]?.group !== row.group
          return (
            <div
              key={i}
              className={`grid md:grid-cols-[1fr_1fr_1.4fr_auto] gap-2 ${
                newGroup && i > 0 ? 'pt-3 border-t border-slate-100' : ''
              }`}
            >
              <input
                value={row.group || ''}
                maxLength={60}
                onChange={(e) => updateSpec(i, 'group', e.target.value)}
                placeholder="Medidas y dimensiones"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
              <input
                value={row.label || ''}
                maxLength={60}
                onChange={(e) => updateSpec(i, 'label', e.target.value)}
                placeholder="Diámetro"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand-500 focus:outline-none"
              />
              <input
                value={row.value || ''}
                maxLength={200}
                onChange={(e) => updateSpec(i, 'value', e.target.value)}
                placeholder="28 cm"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand-500 focus:outline-none"
              />
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => moveSpec(i, -1)} disabled={i === 0}
                  className="px-1.5 py-2 text-slate-400 hover:text-slate-700 disabled:opacity-25" aria-label="Subir">↑</button>
                <button type="button" onClick={() => moveSpec(i, 1)} disabled={i === form.specs.length - 1}
                  className="px-1.5 py-2 text-slate-400 hover:text-slate-700 disabled:opacity-25" aria-label="Bajar">↓</button>
                <button type="button" onClick={() => removeSpec(i)}
                  className="px-2 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm" aria-label="Quitar fila">✕</button>
              </div>
            </div>
          )
        })}

        {form.specs.length === 0 && (
          <p className="text-xs text-slate-400 italic">Sin ficha técnica todavía.</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={addSpec}
            disabled={form.specs.length >= 60}
            className="text-sm font-semibold text-brand-700 hover:text-brand-800 disabled:text-slate-400"
          >
            + Añadir fila {form.specs.length >= 60 && '(máximo 60)'}
          </button>
          {form.specs.length === 0 && (
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  specs: [
                    { group: 'Información general', label: 'Tipo de producto', value: '' },
                    { group: 'Información general', label: 'Formato de venta', value: '' },
                    { group: 'Medidas y dimensiones', label: 'Largo', value: '' },
                    { group: 'Medidas y dimensiones', label: 'Ancho', value: '' },
                    { group: 'Medidas y dimensiones', label: 'Alto', value: '' },
                    { group: 'Materiales', label: 'Material', value: '' },
                    { group: 'Materiales', label: 'Color', value: '' },
                  ],
                }))
              }
              className="text-sm text-slate-500 hover:text-brand-700"
            >
              Empezar con una plantilla básica
            </button>
          )}
        </div>
      </fieldset>

      {/* Cómo utilizar */}
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Cómo utilizar <span className="text-slate-400 font-normal">— opcional</span>
        </span>
        <textarea
          rows={3}
          maxLength={1200}
          value={form.usage}
          onChange={(e) => update('usage', e.target.value)}
          placeholder="Ej: Ideal para servir cortes de carne, pastas y platillos principales en restaurantes y banquetes."
          className={input}
        />
        <span className="block text-[11px] text-slate-400 mt-1">
          {form.usage.length}/1200 — aparece como «Recomendaciones de uso» en la ficha.
        </span>
      </label>

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
              <option value="draft">📝 Borrador (oculto)</option>
              <option value="published">✓ Publicado (visible)</option>
            </select>
            <span className="text-xs text-slate-500">
              Los borradores no aparecen en el catálogo público ni en el feed de Instagram/Google.
            </span>
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
        </div>
      </fieldset>

      {/* ── Etiquetas de familia (productos relacionados por tag) ── */}
      <fieldset className="border border-violet-200 bg-violet-50/30 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-violet-800">
          🏷️ Etiquetas de familia{' '}
          <span className="font-normal text-violet-500 text-xs">(opcional)</span>
        </legend>
        <p className="text-xs text-violet-700/70 mb-3">
          Escribe una etiqueta (ej: <strong>termo</strong> o <strong>silla-plastico</strong>). Todos los
          productos con la misma etiqueta aparecerán en la sección{' '}
          <strong>"También disponible en"</strong>. No es visible para los clientes —
          solo sirve para agrupar productos relacionados. Se muestran hasta 6 al azar.
        </p>

        {/* Área de chips + input */}
        <div
          className="flex flex-wrap gap-2 min-h-[46px] p-2 rounded-xl border border-violet-200 bg-white cursor-text focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all"
          onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
        >
          {(Array.isArray(form.tags) ? form.tags : []).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-violet-100 text-violet-800 text-xs font-semibold px-2.5 py-1.5 rounded-full shrink-0"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFamilyTag(tag) }}
                className="text-violet-400 hover:text-rose-500 ml-0.5 leading-none text-sm font-bold"
                aria-label={`Quitar ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <div className="relative flex-1 min-w-[140px]">
            <input
              type="text"
              value={familyTagInput}
              onChange={onFamilyTagInputChange}
              onKeyDown={onFamilyTagInputKeyDown}
              onFocus={loadFamilyTagSuggestions}
              placeholder={(Array.isArray(form.tags) && form.tags.length > 0) ? 'Añadir otra…' : 'Ej: termo, silla-plastico…'}
              className="w-full bg-transparent text-sm text-slate-800 outline-none py-1 placeholder-slate-400"
            />
            {/* Dropdown de sugerencias */}
            {familyTagSuggestions.length > 0 && (
              <div className="absolute z-30 top-full mt-1 left-0 min-w-[200px] bg-white border border-violet-200 rounded-xl shadow-lg overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-slate-400 border-b border-slate-100">
                  Etiquetas ya usadas
                </div>
                {familyTagSuggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addFamilyTag(t) }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-violet-50 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-[11px] text-slate-400">
          Presiona{' '}
          <kbd className="bg-slate-100 px-1 rounded text-slate-500 font-mono text-[10px]">Enter</kbd>{' '}
          o{' '}
          <kbd className="bg-slate-100 px-1 rounded text-slate-500 font-mono text-[10px]">,</kbd>{' '}
          para añadir. Backspace borra la última.
        </p>
      </fieldset>

      {/* ── Dimensiones del PRODUCTO (visibles al cliente) ── */}
      <fieldset className="border border-slate-200 bg-slate-50/40 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-slate-700">
          📐 Dimensiones del producto
        </legend>
        <p className="text-xs text-slate-500 mb-4">
          Medidas reales del producto. Se muestran <strong>públicamente</strong> en la ficha para que el cliente sepa el tamaño.
          Peso en <strong>kg</strong>, dimensiones en <strong>cm</strong>.
        </p>

        {/* Capacidad (opcional) */}
        <div className="mb-4">
          <span className="text-sm font-semibold text-slate-700 block mb-1">
            Capacidad <span className="font-normal text-slate-400">(opcional — para termos, vasos, botellitas…)</span>
          </span>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Ej: 500"
              value={form.capacity}
              onChange={(e) => update('capacity', e.target.value)}
              className="w-32 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none text-sm"
            />
            <select
              value={form.capacityUnit}
              onChange={(e) => update('capacityUnit', e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:outline-none text-sm bg-white"
            >
              {['L', 'mL', 'oz', 'fl oz', 'gal', 'cl', 'cc'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {form.capacity && (
              <span className="text-sm text-slate-500">
                = {form.capacity} {form.capacityUnit}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Peso (kg)</span>
            <input
              type="number"
              min="0"
              step="0.001"
              placeholder="Ej: 1.500"
              value={form.weight}
              onChange={(e) => update('weight', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Largo (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 30.0"
              value={form.length}
              onChange={(e) => update('length', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Ancho (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 20.0"
              value={form.width}
              onChange={(e) => update('width', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Alto (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 15.0"
              value={form.height}
              onChange={(e) => update('height', e.target.value)}
              className={input}
            />
          </label>
        </div>
      </fieldset>

      {/* ── Caja para envío / logística (USO INTERNO — no se muestra al cliente) ── */}
      <fieldset className="border border-blue-200 bg-blue-50/30 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-blue-800">
          📦 Caja para envío <span className="font-normal text-blue-600">(uso interno)</span>
        </legend>
        <p className="text-xs text-blue-700/80 mb-4">
          Dimensiones de la <strong>caja lista para embarcar</strong> (producto + embalaje).
          <strong> No se muestran al cliente.</strong> Se usan para cotizar con envia.com.
          Si vendes de <strong>{form.qtyStep > 1 ? form.qtyStep : 'N'} en {form.qtyStep > 1 ? form.qtyStep : 'N'}</strong>, pon aquí las medidas de la caja completa que sale del almacén.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Peso caja (kg)</span>
            <input
              type="number"
              min="0"
              step="0.001"
              placeholder="Ej: 2.000"
              value={form.pkgWeight}
              onChange={(e) => update('pkgWeight', e.target.value)}
              className={input}
            />
            <span className="text-[11px] text-slate-400">Con embalaje</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Largo caja (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 40.0"
              value={form.pkgLength}
              onChange={(e) => update('pkgLength', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Ancho caja (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 30.0"
              value={form.pkgWidth}
              onChange={(e) => update('pkgWidth', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Alto caja (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 25.0"
              value={form.pkgHeight}
              onChange={(e) => update('pkgHeight', e.target.value)}
              className={input}
            />
          </label>
        </div>

        <label className="block mt-4">
          <span className="text-sm font-semibold text-slate-700">Nota interna</span>
          <input
            type="text"
            placeholder="Ej: caja de 6 piezas, rollo de 3 metros, pack doble..."
            value={form.pkgNote}
            onChange={(e) => update('pkgNote', e.target.value)}
            className={input}
          />
          <span className="text-[11px] text-slate-400">
            Opcional. Para recordarte qué contiene la caja (solo lo ves tú).
          </span>
        </label>

        {/* Indicadores de peso volumétrico en vivo */}
        {(form.pkgWeight || (form.pkgLength && form.pkgWidth && form.pkgHeight)) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            {form.pkgWeight && (
              <div className="bg-white border border-blue-200 rounded-lg px-3 py-2">
                <span className="text-slate-500">Peso real:</span>{' '}
                <strong className="text-slate-800">{parseFloat(form.pkgWeight).toFixed(3)} kg</strong>
              </div>
            )}
            {form.pkgLength && form.pkgWidth && form.pkgHeight && (() => {
              const volKg = (parseFloat(form.pkgLength) * parseFloat(form.pkgWidth) * parseFloat(form.pkgHeight)) / 5000
              const real = parseFloat(form.pkgWeight) || 0
              const cobrable = Math.max(real, volKg)
              return (
                <>
                  <div className="bg-white border border-blue-200 rounded-lg px-3 py-2">
                    <span className="text-slate-500">Peso volumétrico:</span>{' '}
                    <strong className="text-slate-800">{volKg.toFixed(3)} kg</strong>
                    <span className="text-slate-400 ml-1">(L×A×H ÷ 5 000)</span>
                  </div>
                  {form.pkgWeight && (
                    <div className={`border rounded-lg px-3 py-2 ${cobrable > real ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
                      <span>Peso cobrable por carrier:</span>{' '}
                      <strong>{cobrable.toFixed(3)} kg</strong>
                      {cobrable > real && <span className="ml-1 font-normal">(se cobra el volumétrico)</span>}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </fieldset>

      {/* Imagen principal */}
      <div>
        <span className="text-sm font-medium text-slate-700">Imagen principal</span>

        {/* Tip de medidas ideales — aplica también a la galería */}
        <div className="mt-2 mb-3 rounded-lg bg-sky-50 border border-sky-200 p-3 text-xs text-sky-900">
          <p className="font-bold mb-1">💡 Medida recomendada para fotos de producto</p>
          <ul className="list-disc pl-5 space-y-0.5 leading-relaxed">
            <li>
              <b>1200 × 1200 px (cuadrada 1:1)</b> es lo ideal — se ve nítida en cualquier pantalla.
            </li>
            <li>
              Mínimo aceptable: 800 × 800 px. Máximo: 1600 × 1600 px
              (se redimensiona automáticamente, no más grande).
            </li>
            <li>
              Formato JPG, PNG o WebP. Peso máximo 8 MB (el server las comprime a WebP
              ~150-300 KB).
            </li>
            <li>
              Fondo blanco o neutro, producto centrado y con buena luz.
              Sin marcas de agua ni texto pegado.
            </li>
          </ul>
        </div>

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
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-sm font-semibold cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {form.image ? 'Añadir más fotos' : 'Seleccionar fotos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
              <span className="text-xs text-slate-400">Puedes seleccionar varias a la vez</span>
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

      {/* Video del producto */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Video del producto{' '}
          <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Pega un link de YouTube, TikTok o un enlace directo a un archivo .mp4.
          El video aparecerá como primer elemento en la galería.
        </p>
        <input
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=... o https://www.tiktok.com/@..."
          value={form.videoUrl}
          onChange={(e) => update('videoUrl', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
        />
        {form.videoUrl && (
          <button
            type="button"
            onClick={() => update('videoUrl', '')}
            className="mt-1 text-xs text-red-500 hover:text-red-700"
          >
            Quitar video
          </button>
        )}
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
          seleccionar varios archivos a la vez.{' '}
          <span className="text-sky-700 font-semibold">
            Misma medida ideal: 1200 × 1200 px cuadradas, fondo blanco.
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-3 items-center">
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

          {/* Añadir imagen de galería por URL */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <input
              type="text"
              inputMode="url"
              placeholder="https://... pega un link de imagen"
              value={galleryUrlInput}
              onChange={(e) => setGalleryUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryByUrl())}
              disabled={form.gallery.length >= MAX_GALLERY || addingGalleryUrl}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={addGalleryByUrl}
              disabled={!galleryUrlInput.trim() || form.gallery.length >= MAX_GALLERY || addingGalleryUrl}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-40"
            >
              {addingGalleryUrl ? 'Añadiendo…' : 'Añadir URL'}
            </button>
          </div>
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

      {/* ── Variantes ──────────────────────────────────────────────────────── */}
      <fieldset className="border border-slate-200 rounded-xl p-4 space-y-4">
        <legend className="px-2 text-sm font-bold text-slate-700">Variantes</legend>
        <div className="text-xs text-slate-600 -mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
          <p>
            <b>Regla:</b> si este producto se vende en varios colores o tamaños,
            <b> cada opción debe ser una variante</b> — incluyendo la del color principal.
          </p>
          <p className="text-slate-500">
            Ejemplo: una hielera que viene en azul y rojo lleva <b>dos</b> variantes
            (Color: Azul y Color: Rojo). El campo "Color" de arriba se deja vacío.
          </p>
          <p className="text-slate-500">
            Cada variante necesita su <b>SKU</b>, su <b>peso de caja</b> y sus
            <b> medidas</b> para poder cotizar envíos automáticamente.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-sm font-semibold"
          >
            + Añadir variante
          </button>
          {form.variants.length > 0 && (
            <span className="text-xs text-slate-500">
              {form.variants.length} variante{form.variants.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {form.variants.length === 0 && (
          <p className="text-xs text-slate-400 italic">
            Sin variantes. El producto se vende como una sola opción, usando el
            precio, SKU y medidas de arriba.
          </p>
        )}

        {form.variants.length > 0 && (
          <div className="space-y-4">
            {form.variants.map((v, i) => {
              const vLabel = v.label || 'Color'
              const vImgs = Array.isArray(v.images) && v.images.length > 0 ? v.images : v.image ? [v.image] : []
              const vStockMode = v.stock === null || v.stock === undefined || v.stock === '' ? 'disponible' : Number(v.stock) === 0 ? 'agotado' : 'cantidad'
              return (
                <div key={i} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">

                  {/* ── Cabecera: tipo + valor + eliminar ── */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                    {/* Miniatura */}
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 grid place-items-center">
                      {v.image
                        ? <img src={v.image} alt="" className="w-full h-full object-cover" />
                        : <span className="text-slate-300 text-[10px] text-center leading-tight">sin foto</span>
                      }
                    </div>

                    {/* Tipo */}
                    <div className="flex gap-1 shrink-0">
                      {['Color', 'Tamaño'].map((tipo) => (
                        <button key={tipo} type="button" onClick={() => updateVariant(i, 'label', tipo)}
                          className={`px-3 py-1 rounded-lg border text-xs font-semibold transition ${
                            vLabel === tipo ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                          }`}>
                          {tipo === 'Color' ? '🎨 Color' : '📐 Tamaño'}
                        </button>
                      ))}
                    </div>

                    {/* Valor */}
                    <input
                      value={v.value}
                      onChange={(e) => updateVariant(i, 'value', e.target.value)}
                      placeholder={vLabel === 'Color' ? 'Ej: Rojo, Azul marino…' : vLabel === 'Tamaño' ? 'Ej: S, M, L, XL…' : 'Valor'}
                      maxLength={60}
                      className="flex-1 px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 bg-white min-w-0"
                    />

                    {/* Tipo personalizado (si no es Color ni Tamaño) */}
                    {!['Color', 'Tamaño'].includes(vLabel) && (
                      <input
                        value={vLabel}
                        onChange={(e) => updateVariant(i, 'label', e.target.value || 'Color')}
                        placeholder="Otro tipo…"
                        maxLength={30}
                        className="w-28 px-2 py-1.5 text-xs border border-brand-300 rounded-lg focus:outline-none focus:border-brand-500 bg-brand-50 text-brand-800"
                      />
                    )}
                    {['Color', 'Tamaño'].includes(vLabel) && (
                      <input
                        value=""
                        onChange={(e) => { if (e.target.value) updateVariant(i, 'label', e.target.value) }}
                        placeholder="Otro tipo…"
                        maxLength={30}
                        className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400 text-slate-500 bg-white"
                      />
                    )}

                    {/* Eliminar */}
                    <button type="button" onClick={() => removeVariant(i)}
                      className="w-8 h-8 shrink-0 grid place-items-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 font-bold text-lg transition ml-auto"
                      title="Eliminar variante">×</button>
                  </div>

                  <div className="px-4 py-3 space-y-4">
                    {/* ── Chips rápidos ── */}
                    {vLabel === 'Color' && (
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => updateVariant(i, 'value', c)}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition ${
                              v.value === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                            }`}>{c}</button>
                        ))}
                      </div>
                    )}
                    {vLabel === 'Tamaño' && (
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_SIZES.map((s) => (
                          <button key={s} type="button" onClick={() => updateVariant(i, 'value', s)}
                            className={`px-3 py-0.5 rounded-lg text-xs font-semibold border transition ${
                              v.value === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
                            }`}>{s}</button>
                        ))}
                      </div>
                    )}

                    {/* ── Disponibilidad ── */}
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block mb-2">Disponibilidad</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { val: 'disponible', icon: '✅', text: 'Disponible' },
                          { val: 'agotado',    icon: '❌', text: 'Sin stock'  },
                          { val: 'cantidad',   icon: '🔢', text: 'Cantidad'   },
                        ].map(({ val, icon, text }) => (
                          <label key={val}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer text-sm transition ${
                              vStockMode === val
                                ? 'border-brand-500 bg-brand-50 text-brand-800 font-semibold'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}>
                            <input type="radio" name={`stockMode-${i}`} checked={vStockMode === val}
                              onChange={() => {
                                if (val === 'disponible') updateVariant(i, 'stock', null)
                                else if (val === 'agotado') updateVariant(i, 'stock', 0)
                                else updateVariant(i, 'stock', v.stock > 0 ? v.stock : 1)
                              }}
                              className="w-3.5 h-3.5 accent-brand-600"
                            />
                            {icon} {text}
                          </label>
                        ))}
                        {vStockMode === 'cantidad' && (
                          <input type="number" min={1}
                            value={v.stock ?? 1}
                            onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                            placeholder="Ej: 10"
                            className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* ── Código de barras ── */}
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600 block mb-1">
                        Código de barras <span className="font-normal text-slate-400">(EAN/UPC, opcional)</span>
                      </span>
                      <input
                        value={v.barcode || ''}
                        onChange={(e) => updateVariant(i, 'barcode', e.target.value)}
                        placeholder="7501234567890"
                        className="w-full sm:w-64 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400 bg-white font-mono placeholder:text-slate-300"
                      />
                    </label>

                    {/* ── Fotos de esta variante ── */}
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block mb-2">
                        Fotos de esta variante{' '}
                        <span className="text-slate-400 font-normal">({vImgs.length}/10)</span>
                      </span>
                      {vImgs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {vImgs.map((url, pi) => (
                            <div key={url} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {pi === 0 && (
                                <span className="absolute bottom-0 inset-x-0 text-center text-[8px] bg-brand-600/80 text-white font-bold py-0.5">
                                  principal
                                </span>
                              )}
                              <button type="button"
                                onClick={() => removeVariantGalleryImage(i, url)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-xs grid place-items-center opacity-0 group-hover:opacity-100 transition"
                                title="Quitar">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 transition">
                        <span>+ Añadir fotos</span>
                        <input type="file" accept="image/*" multiple className="hidden"
                          onChange={(e) => addVariantGalleryImages(i, e.target.files)} />
                      </label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </fieldset>

      {/* Barra de acciones — sticky en móvil para que siempre sea visible */}
      <div className="sticky bottom-0 z-20 bg-white -mx-4 md:-mx-6 px-4 md:px-6 py-3 border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-3 mt-2">
        <div className="flex gap-2 flex-wrap">
          {isEdit && (
            <>
              <button
                type="button"
                onClick={onPreview}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
                title="Abrir detalle del producto en una pestaña nueva"
              >
                Vista previa
              </button>
              <button
                type="button"
                onClick={onDuplicate}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
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
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading || uploadingGallery}
            className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60 text-sm"
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </form>
  )
}
