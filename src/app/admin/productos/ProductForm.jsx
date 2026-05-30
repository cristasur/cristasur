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

export default function ProductForm({ categories, brands = [], materials = [], initial }) {
  const router = useRouter()
  const isEdit = Boolean(initial?._id)

  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price ?? '',
    comparePrice: initial?.comparePrice ?? '',
    wholesalePrice: initial?.wholesalePrice ?? '',
    wholesaleMinQty: initial?.wholesaleMinQty ?? '',
    hundredPrice: initial?.hundredPrice ?? '',
    hundredMinQty: initial?.hundredMinQty ?? '',
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
          hundredPrice:    v.hundredPrice    ?? '',
          hundredMinQty:   v.hundredMinQty   ?? '',
        }))
      : [],
    // Grupos de opciones para variantes multi-dim.
    // Se guarda con valuesStr (string separado por comas) para el input del formulario.
    optionGroups: Array.isArray(initial?.optionGroups)
      ? initial.optionGroups.map((g) => ({
          name: g.name || '',
          valuesStr: (g.values || []).join(', '),
        }))
      : [],
    status: initial?.status || 'published',
    publishAt: initial?.publishAt || '',
    tags: Array.isArray(initial?.tags) ? initial.tags : [],
    brand: initial?.brand?._id || initial?.brand || '',
    materials: Array.isArray(initial?.materials)
      ? initial.materials.map((m) => m._id || m)
      : [],
    materialText: initial?.materialText || '',
    resistencia: initial?.resistencia || '',
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
    // Productos relacionados (selección manual). Se guarda como array de objetos
    // { _id, name, image, price } para mostrar en el formulario.
    // Al enviar, la API extrae solo los _id.
    relatedProducts: Array.isArray(initial?.relatedProducts)
      ? initial.relatedProducts
          .filter(Boolean)
          .map((r) =>
            typeof r === 'object'
              ? { _id: String(r._id || r), name: r.name || '', image: r.image || '', price: r.price ?? 0 }
              : { _id: String(r), name: '', image: '', price: 0 }
          )
      : [],
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
  const [relSearch, setRelSearch] = useState('')
  const [relResults, setRelResults] = useState([])
  const [relSearching, setRelSearching] = useState(false)
  const relTimerRef = useRef(null)

  async function searchRelated(q) {
    if (!q || q.length < 2) { setRelResults([]); return }
    setRelSearching(true)
    try {
      const res = await fetch(
        `/api/products?q=${encodeURIComponent(q)}&limit=8&all=1`,
        { cache: 'no-store' }
      )
      const data = await res.json().catch(() => ({}))
      const currentId = initial?._id ? String(initial._id) : null
      const addedIds = new Set(form.relatedProducts.map((r) => String(r._id)))
      setRelResults(
        (data.products || [])
          .filter((p) => String(p._id) !== currentId && !addedIds.has(String(p._id)))
          .map((p) => ({ _id: String(p._id), name: p.name, image: p.image || '', price: p.price ?? 0 }))
      )
    } catch {
      setRelResults([])
    } finally {
      setRelSearching(false)
    }
  }

  function onRelSearchChange(e) {
    const q = e.target.value
    setRelSearch(q)
    clearTimeout(relTimerRef.current)
    relTimerRef.current = setTimeout(() => searchRelated(q), 300)
  }

  function addRelated(product) {
    setForm((f) => {
      if (f.relatedProducts.some((r) => String(r._id) === String(product._id))) return f
      return { ...f, relatedProducts: [...f.relatedProducts, product] }
    })
    setRelSearch('')
    setRelResults([])
  }

  function removeRelated(id) {
    setForm((f) => ({
      ...f,
      relatedProducts: f.relatedProducts.filter((r) => String(r._id) !== String(id)),
    }))
  }

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
  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { label: 'Color', value: '', price: '', comparePrice: '', wholesalePrice: '', wholesaleMinQty: '', hundredPrice: '', hundredMinQty: '', stock: null, sku: '', image: '', images: [] },
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

  // ---- Grupos de opciones (multi-dim) ----
  function addOptionGroup() {
    setForm((f) => {
      if (f.optionGroups.length >= 3) return f
      return { ...f, optionGroups: [...f.optionGroups, { name: '', valuesStr: '' }] }
    })
  }
  function removeOptionGroup(i) {
    setForm((f) => ({ ...f, optionGroups: f.optionGroups.filter((_, idx) => idx !== i) }))
  }
  function updateOptionGroup(i, field, val) {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, idx) => (idx === i ? { ...g, [field]: val } : g)),
    }))
  }

  // Genera el producto cartesiano de todos los grupos y crea las filas de variantes.
  // Preserva datos (precio, stock, sku) de combinaciones que ya existían.
  function generateCombinations() {
    const groups = form.optionGroups
      .map((g) => ({
        name: g.name.trim(),
        values: g.valuesStr.split(',').map((s) => s.trim()).filter(Boolean),
      }))
      .filter((g) => g.name && g.values.length > 0)

    if (!groups.length) return

    // Producto cartesiano
    let combos = [{}]
    for (const group of groups) {
      combos = combos.flatMap((combo) =>
        group.values.map((v) => ({ ...combo, [group.name]: v }))
      )
    }

    const newVariants = combos.map((optionValues) => {
      // Reutilizar fila existente si ya tiene esa combinación
      const existing = form.variants.find(
        (v) =>
          v.optionValues &&
          Object.entries(optionValues).every(([k, val]) => v.optionValues[k] === val)
      )
      if (existing) return existing
      const entries = Object.entries(optionValues)
      return {
        label: entries[0]?.[0] || 'Opción',
        value: entries.map(([, val]) => val).join(' / '),
        optionValues,
        price: '',
        comparePrice: '',
        stock: 0,
        sku: '',
        image: '',
      }
    })

    update('variants', newVariants)
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

      // Convertir optionGroups de {valuesStr} a {values: string[]} para la API
      const payload = {
        ...form,
        optionGroups: form.optionGroups
          .map((g) => ({
            name: g.name.trim(),
            values: g.valuesStr.split(',').map((s) => s.trim()).filter(Boolean),
          }))
          .filter((g) => g.name && g.values.length > 0),
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
              value={form.hundredPrice}
              onChange={(e) => update('hundredPrice', e.target.value)}
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
              value={form.hundredMinQty}
              onChange={(e) => update('hundredMinQty', e.target.value)}
              className={input}
              placeholder="Ej. 100"
            />
            <span className="text-xs text-slate-500">
              Desde esa cantidad se aplicará el precio por ciento.
            </span>
          </label>
        </div>
        {form.hundredPrice && form.price &&
          Number(form.hundredPrice) >= Number(form.price) && (
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

      {/* Material en texto libre */}
      <div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Material (texto libre) <span className="text-slate-400 font-normal">— opcional</span>
          </span>
          <input
            type="text"
            value={form.materialText}
            onChange={(e) => update('materialText', e.target.value)}
            placeholder="Ej: Polipropileno virgen, acero inoxidable 304…"
            className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-xs text-slate-400 mt-1 block">Se mostrará junto al material del desplegable en la ficha del producto.</span>
        </label>
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

      {/* ── Variantes y opciones ───────────────────────────────────────────── */}
      <fieldset className="border border-slate-200 rounded-xl p-4 space-y-4">
        <legend className="px-2 text-sm font-bold text-slate-700">Variantes y opciones</legend>
        <p className="text-xs text-slate-500 -mt-2">
          ¿El producto viene en distintos <b>tamaños</b>, <b>colores</b> u otras opciones?
          Define cada dimensión abajo y genera las combinaciones automáticamente.
          O usa "Variante simple" para un solo nivel (ej. solo talla sin color).
        </p>

        {/* Editor de grupos de opciones */}
        <div className="space-y-2">
          {form.optionGroups.map((group, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center">
              <input
                value={group.name}
                onChange={(e) => updateOptionGroup(i, 'name', e.target.value)}
                placeholder="Nombre de opción (ej: Tamaño)"
                className="px-2 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 w-40"
              />
              <input
                value={group.valuesStr}
                onChange={(e) => updateOptionGroup(i, 'valuesStr', e.target.value)}
                placeholder="Valores separados por coma (ej: 7 pies, 9 pies, 11 pies)"
                className="px-2 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 flex-1 min-w-[180px]"
              />
              <button
                type="button"
                onClick={() => removeOptionGroup(i)}
                className="w-8 h-8 grid place-items-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold shrink-0"
                title="Eliminar esta opción"
              >
                ×
              </button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={addOptionGroup}
              disabled={form.optionGroups.length >= 3}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold disabled:opacity-40"
            >
              + Añadir opción
            </button>

            {form.optionGroups.length >= 1 && (
              <button
                type="button"
                onClick={generateCombinations}
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
              >
                ⚡ Generar combinaciones
              </button>
            )}

            {form.optionGroups.length === 0 && (
              <button
                type="button"
                onClick={addVariant}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                + Variante simple
              </button>
            )}
          </div>
        </div>

        {/* Tabla multi-dim (cuando hay optionGroups definidos y variantes generadas) */}
        {form.optionGroups.length >= 1 && form.variants.length > 0 && (() => {
          // Parsear los grupos para las columnas
          const cols = form.optionGroups
            .map((g) => ({ name: g.name.trim() }))
            .filter((g) => g.name)
          return (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    {cols.map((c) => (
                      <th key={c.name} className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">
                        {c.name}
                      </th>
                    ))}
                    <th className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">Precio</th>
                    <th className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">Anterior</th>
                    <th className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">Stock</th>
                    <th className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">SKU</th>
                    <th className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">Imagen</th>
                  </tr>
                </thead>
                <tbody>
                  {form.variants.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      {cols.map((c) => (
                        <td key={c.name} className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                          {v.optionValues?.[c.name] || v.value || '—'}
                        </td>
                      ))}
                      <td className="px-2 py-1.5">
                        <input
                          type="number" min={0} step="0.01"
                          value={v.price ?? ''}
                          onChange={(e) => updateVariant(i, 'price', e.target.value)}
                          placeholder="base"
                          className="w-24 px-2 py-1 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number" min={0} step="0.01"
                          value={v.comparePrice ?? ''}
                          onChange={(e) => updateVariant(i, 'comparePrice', e.target.value)}
                          className="w-24 px-2 py-1 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number" min={0}
                          value={v.stock ?? 0}
                          onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                          className="w-20 px-2 py-1 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={v.sku ?? ''}
                          onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                          placeholder="SKU-001"
                          className="w-28 px-2 py-1 rounded-md border border-slate-200 text-sm uppercase focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        {v.image ? (
                          <div className="flex items-center gap-1">
                            <img src={v.image} alt="" className="w-8 h-8 rounded object-cover border border-slate-200" />
                            <button
                              type="button"
                              onClick={() => updateVariant(i, 'image', '')}
                              className="text-rose-500 text-xs hover:text-rose-700"
                              title="Quitar imagen"
                            >×</button>
                          </div>
                        ) : (
                          <input
                            type="file" accept="image/*"
                            onChange={(e) => uploadVariantImage(i, e.target.files?.[0])}
                            className="text-xs max-w-[120px]"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

        {/* Lista simple de variantes (cuando NO hay optionGroups) */}
        {form.optionGroups.length === 0 && form.variants.length > 0 && (
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

                    {/* ── Precios ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-600 block mb-1">Precio unitario</span>
                        <input type="number" min={0} step="0.01"
                          value={v.price ?? ''}
                          onChange={(e) => updateVariant(i, 'price', e.target.value)}
                          placeholder="Hereda del producto"
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400 bg-slate-50 placeholder:text-slate-300"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-600 block mb-1">Precio anterior</span>
                        <input type="number" min={0} step="0.01"
                          value={v.comparePrice ?? ''}
                          onChange={(e) => updateVariant(i, 'comparePrice', e.target.value)}
                          placeholder="—"
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400 bg-slate-50 placeholder:text-slate-300"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-amber-700 block mb-1">Mayoreo — precio</span>
                        <input type="number" min={0} step="0.01"
                          value={v.wholesalePrice ?? ''}
                          onChange={(e) => updateVariant(i, 'wholesalePrice', e.target.value)}
                          placeholder="Hereda del producto"
                          className="w-full px-2.5 py-1.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-amber-50/40 placeholder:text-slate-300"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-amber-700 block mb-1">Mayoreo — mín. piezas</span>
                        <input type="number" min={2} step="1"
                          value={v.wholesaleMinQty ?? ''}
                          onChange={(e) => updateVariant(i, 'wholesaleMinQty', e.target.value)}
                          placeholder="Hereda del producto"
                          className="w-full px-2.5 py-1.5 text-sm border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-amber-50/40 placeholder:text-slate-300"
                        />
                      </label>
                    </div>

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
