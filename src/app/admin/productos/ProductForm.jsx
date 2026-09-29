'use client'
// ============================================================
// Formulario reutilizable para crear/editar productos
// Incluye:
//   - Upload de imagen principal (/api/upload)
//   - Upload múltiple a la galería (varias imágenes adicionales)
//   - Reordenar y eliminar imágenes de la galería
// ============================================================
import ProductVariantsFields from './form/ProductVariantsFields'
import ProductDimensionsFields from './form/ProductDimensionsFields'
import ProductMediaFields from './form/ProductMediaFields'
import ProductPricingFields from './form/ProductPricingFields'
import { variantesIniciales, colorInicial } from './form/initial-variants'
import AutocompletarLinea from './AutocompletarLinea'
import { COMMON_COLORS } from './form/constants'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MAX_GALLERY = 10



// ── Variantes al cargar un producto ─────────────────────────────
//
// Solo se conservan los campos del modelo (label, value, sku, barcode,
// available, stock, image, images). Los precios por variante ya no
// existen: el precio es siempre el del producto.
//
// Productos del formato viejo (color "Azul" arriba + variante "Rojo"):
// el azul se muestra como la primera variante, con las fotos del
// producto, y el campo Color queda vacío. Al guardar ya quedan bien.
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
    variants: variantesIniciales(initial),
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
    lineColor: initial?.lineColor || '',
    specs: Array.isArray(initial?.specs) ? initial.specs : [],
    highlights: Array.isArray(initial?.highlights) ? initial.highlights : [],
    usage: initial?.usage || '',
    color: colorInicial(initial),
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
    //
    // Si el campo "Color" de arriba está lleno, ese color es una opción
    // más: se convierte en la primera variante, con las fotos del
    // producto. Así nunca vuelve a pasar lo de "la hielera azul que en
    // la ficha solo tiene la bolita roja".
    setForm((f) => {
      const nueva = { label: 'Color', value: '', sku: '', barcode: '', available: true, stock: null, image: '', images: [] }
      const base = (f.color || '').trim()
      if (base && !f.variants.some((v) => (v.value || '').trim().toLowerCase() === base.toLowerCase())) {
        const fotos = [f.image, ...(f.gallery || [])].filter(Boolean).slice(0, 10)
        return {
          ...f,
          color: '',
          variants: [
            { ...nueva, value: base, sku: f.sku || '', image: fotos[0] || '', images: fotos },
            ...f.variants,
            nueva,
          ],
        }
      }
      return { ...f, variants: [...f.variants, nueva] }
    })
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
            Categorías
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
            <span className="text-xs text-slate-400 mt-1 block">
              Sin categoría: sale en “Todos los productos” y en la búsqueda.
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

      <ProductPricingFields form={form} update={update} input={input} />

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
          {(() => {
            const hayVarColor = form.variants.some((v) => /color/i.test(v.label || ''))
            return (
              <>
                <input
                  list="color-suggestions"
                  value={hayVarColor ? '' : form.color}
                  onChange={(e) => update('color', e.target.value)}
                  placeholder={hayVarColor ? 'Se define en cada variante (abajo)' : 'Ej: Rojo, Azul marino, Transparente'}
                  disabled={hayVarColor}
                  className={`${input} ${hayVarColor ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
                <datalist id="color-suggestions">
                  {COMMON_COLORS.map((c) => <option key={c} value={c} />)}
                </datalist>
                <span className={`text-xs ${hayVarColor ? 'text-amber-700' : 'text-slate-500'}`}>
                  {hayVarColor
                    ? 'Este producto viene en varios colores: cada color es una variante (sección Variantes).'
                    : 'Solo si viene en UN color. Si viene en varios, usa la sección Variantes: al añadir la primera, este color se pasa solo como variante.'}
                </span>
              </>
            )
          })()}
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
        <legend className="px-2 text-sm font-bold text-slate-700">Línea o colección (Variantes y Variante de color)</legend>
        <p className="text-xs text-slate-500 mb-3">
          Agrupa productos <strong>hermanos</strong> que tienen su propio precio y SKU. En la ficha salen dos filas,
          como en MAHA: <strong>Variantes</strong> (la etiqueta: 27 cm, 19 cm, 48 QTS…) y <strong>Variante de color</strong>
          (los hermanos con la misma etiqueta y distinto color). Si los colores cuestan lo mismo y son el mismo
          producto, mejor ponlos como variantes de color de este producto (sección Variantes) y deja el color de la línea vacío.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="block">
            <span className="text-sm font-medium text-slate-700">Nombre de la línea</span>
            {/* Sugerencias en tiempo real con las líneas que ya existen:
                escribir "Caribe" y "caribe " crearía dos líneas distintas. */}
            <AutocompletarLinea
              value={form.line}
              onChange={(v) => update('line', v)}
              opciones={lines}
              placeholder="Escribe: M → Manhattan…"
              className={input}
            />
            <span className="block text-[11px] text-slate-400 mt-1">
              Elige una de la lista para que quede igual que en sus hermanos.
            </span>
          </div>

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
              Tamaño, capacidad o tipo. Sale en la fila "Variantes".
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Color de este producto</span>
            <input
              list="colores-linea"
              maxLength={30}
              value={form.lineColor}
              onChange={(e) => update('lineColor', e.target.value)}
              placeholder="Ej: Blanco, Rosa, Azul"
              className={input}
            />
            <datalist id="colores-linea">
              {['Blanco', 'Negro', 'Gris', 'Rojo', 'Rosa', 'Amarillo', 'Naranja', 'Verde', 'Turquesa', 'Azul', 'Morado', 'Café', 'Beige', 'Hueso', 'Transparente', 'Dorado', 'Plata', 'Talavera', 'Varios'].map((c) => <option key={c} value={c} />)}
            </datalist>
            <span className="block text-[11px] text-slate-400 mt-1">
              Solo si cada color es un producto aparte. Sale en "Variante de color".
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

      <ProductDimensionsFields form={form} update={update} input={input} />

      <ProductMediaFields form={form} input={input} uploading={uploading} uploadingGallery={uploadingGallery} onFileChange={onFileChange} onGalleryFilesChange={onGalleryFilesChange} update={update} galleryUrlInput={galleryUrlInput} setGalleryUrlInput={setGalleryUrlInput} addingGalleryUrl={addingGalleryUrl} addGalleryByUrl={addGalleryByUrl} makeMain={makeMain} moveGalleryItem={moveGalleryItem} removeGalleryItem={removeGalleryItem} />

      <ProductVariantsFields form={form} input={input} addVariant={addVariant} removeVariant={removeVariant} updateVariant={updateVariant} addVariantGalleryImages={addVariantGalleryImages} removeVariantGalleryImage={removeVariantGalleryImage} uploadVariantImage={uploadVariantImage} />

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
