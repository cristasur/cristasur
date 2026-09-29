'use client'
// Gestor de categorías - CRUD inline con subida de imagen
import { useState } from 'react'
import Icon from '@/components/Icon'
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors'

const emptyForm = {
  name: '',
  icon: '',
  image: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  seoText: '',
  order: 0,
  active: true,
  featured: false,
  parent: '',
  bannerColor: '',
}

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
      seoTitle: cat.seoTitle || '',
      seoDescription: cat.seoDescription || '',
      seoText: cat.seoText || '',
      order: cat.order || 0,
      active: cat.active,
      featured: Boolean(cat.featured),
      parent: cat.parent ? String(cat.parent) : '',
      bannerColor: cat.bannerColor || '',
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const featuredCount = cats.filter((c) => c.featured).length

  // Solo pueden ser padre las categorías principales (sin padre propio),
  // y nunca la categoría que se está editando.
  const parentOptions = cats.filter(
    (c) => !c.parent && c._id !== editingId
  )
  const nameById = Object.fromEntries(cats.map((c) => [String(c._id), c.name]))
  // La que se edita no puede volverse subcategoría si ya tiene hijas.
  const editingHasChildren =
    editingId && cats.some((c) => String(c.parent) === String(editingId))

  // Orden de la tabla: cada principal seguida de sus subcategorías.
  const porOrden = (a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name)
  const ordered = []
  for (const root of cats.filter((c) => !c.parent).sort(porOrden)) {
    ordered.push(root)
    for (const kid of cats.filter((c) => String(c.parent) === String(root._id)).sort(porOrden)) {
      ordered.push(kid)
    }
  }
  // Huérfanas (por si el padre fue eliminado) van al final.
  for (const c of cats) {
    if (c.parent && !ordered.includes(c)) ordered.push(c)
  }

  // ── Reordenar arrastrando ──────────────────────────────────
  // Se arrastra una fila y se suelta sobre otra del mismo nivel:
  // principales entre principales, subcategorías dentro de su padre.
  // Al soltar se guarda solo el nuevo orden.
  const [arrastrando, setArrastrando] = useState(null)
  const [sobre, setSobre] = useState(null)
  const [guardandoOrden, setGuardandoOrden] = useState(false)
  const mismoNivel = (a, b) => a && b && String(a.parent || '') === String(b.parent || '')

  async function soltar(destino) {
    const origen = cats.find((c) => c._id === arrastrando)
    setArrastrando(null); setSobre(null)
    if (!origen || !destino || origen._id === destino._id || !mismoNivel(origen, destino)) return
    const hermanas = ordered.filter((c) => mismoNivel(c, origen))
    const sin = hermanas.filter((c) => c._id !== origen._id)
    const iDestino = sin.findIndex((c) => c._id === destino._id)
    const iOrigen = hermanas.findIndex((c) => c._id === origen._id)
    const iDestinoOriginal = hermanas.findIndex((c) => c._id === destino._id)
    // Bajando: queda después del destino; subiendo: antes.
    sin.splice(iOrigen < iDestinoOriginal ? iDestino + 1 : iDestino, 0, origen)
    const nuevoOrden = Object.fromEntries(sin.map((c, i) => [c._id, i]))
    const antes = cats
    setCats((cs) => cs.map((c) => (c._id in nuevoOrden ? { ...c, order: nuevoOrden[c._id] } : c)))
    setGuardandoOrden(true)
    try {
      const r = await fetch('/api/categories/reorder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: sin.map((c) => c._id) }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No se pudo guardar el orden')
    } catch (err) {
      setCats(antes)
      alert(err.message)
    } finally {
      setGuardandoOrden(false)
    }
  }

  const input =
    'mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none'

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
      {/* Lista */}
      <div className="min-w-0 bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>{featuredCount}</strong> de 4 categorías destacadas en el inicio.
            {featuredCount === 0 && ' (Mientras no marques ninguna, se mostrarán las primeras 4.)'}
            {featuredCount > 4 && ' Solo aparecerán las primeras 4 por orden.'}
          </span>
          <span className="text-amber-700/80">
            {guardandoOrden ? 'Guardando orden…' : 'Arrastra ⠿ para cambiar el orden'}
          </span>
        </div>

        <div className="grid grid-cols-[24px_minmax(0,1fr)_64px_auto_auto] items-center gap-x-3 px-3 py-2 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <span />
          <span>Categoría</span>
          <span className="text-center">Productos</span>
          <span>Estado</span>
          <span className="text-right">Acciones</span>
        </div>

        <ul className="divide-y divide-slate-100">
          {ordered.map((c) => {
            const origen = cats.find((x) => x._id === arrastrando)
            const valido = sobre === c._id && origen && origen._id !== c._id && mismoNivel(origen, c)
            return (
              <li
                key={c._id}
                draggable
                onDragStart={(e) => { setArrastrando(c._id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c._id) }}
                onDragEnd={() => { setArrastrando(null); setSobre(null) }}
                onDragOver={(e) => { if (mismoNivel(origen, c)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (sobre !== c._id) setSobre(c._id) } }}
                onDrop={(e) => { e.preventDefault(); soltar(c) }}
                className={`grid grid-cols-[24px_minmax(0,1fr)_64px_auto_auto] items-center gap-x-3 px-3 py-2.5 transition-colors
                  ${arrastrando === c._id ? 'opacity-40' : ''}
                  ${valido ? 'bg-brand-50 ring-2 ring-inset ring-brand-400' : c.parent ? 'bg-slate-50/40 hover:bg-slate-50' : 'hover:bg-slate-50'}`}
              >
                <span className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 select-none text-lg leading-none text-center" title="Arrastra para mover">⠿</span>

                <div className={`flex items-center gap-3 min-w-0 ${c.parent ? 'pl-5' : ''}`}>
                  {c.parent && <span className="text-slate-300 -ml-4 select-none" aria-hidden="true">└</span>}
                  <div className={`${c.parent ? 'w-9 h-9' : 'w-11 h-11'} rounded-lg bg-brand-50 overflow-hidden grid place-items-center text-brand-700 font-black shrink-0`}>
                    {c.image ? (
                      <img src={c.image} alt="" draggable={false} className="w-full h-full object-cover" />
                    ) : c.icon ? (
                      <span>{c.icon}</span>
                    ) : (
                      <span>{c.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className={`truncate ${c.parent ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{c.name}</div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">/{c.slug}</div>
                  </div>
                </div>

                <span className="text-center text-sm tabular-nums text-slate-700">{c.productCount}</span>

                <div className="flex flex-col items-start gap-1">
                  {c.active ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Oculta
                    </span>
                  )}
                  {c.featured && (
                    <span className="inline-flex items-center gap-1 text-accent-700 bg-accent-50 px-2 py-0.5 rounded-full text-[11px]">
                      <Icon name="star" className="w-3 h-3" /> En inicio
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(c)} title="Editar" aria-label={`Editar ${c.name}`}
                    className="w-8 h-8 grid place-items-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                    <Icon name="edit" className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(c._id)} title="Eliminar" aria-label={`Eliminar ${c.name}`}
                    className="w-8 h-8 grid place-items-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600">
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </li>
            )
          })}
          {cats.length === 0 && (
            <li className="p-10 text-center text-slate-500">
              Sin categorías todavía. Crea la primera con el formulario.
            </li>
          )}
        </ul>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 xl:sticky xl:top-8">
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

        {/* Color del banner de la landing */}
        <div className="mb-4">
          <span className="text-sm font-medium text-slate-700">Color del banner</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(CATEGORY_COLORS).map(([key, c]) => {
              const active = (form.bannerColor || DEFAULT_CATEGORY_COLOR) === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, bannerColor: key })}
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={active}
                  className={`w-9 h-9 rounded-lg border-2 transition ${
                    active ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: c.bg }}
                />
              )
            })}
          </div>
          <span className="block text-[11px] text-slate-400 mt-1.5">
            Fondo del panel diagonal del banner. El texto siempre va en blanco.
          </span>
        </div>

        {/* Categoría padre — define la jerarquía del menú */}
        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700">Categoría padre</span>
          <select
            value={form.parent}
            disabled={editingHasChildren}
            onChange={(e) => setForm({ ...form, parent: e.target.value })}
            className={`${input} disabled:bg-slate-100 disabled:text-slate-400`}
          >
            <option value="">— Ninguna (categoría principal) —</option>
            {parentOptions.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <span className="block text-[11px] text-slate-400 mt-1">
            {editingHasChildren
              ? 'Esta categoría ya tiene subcategorías, por eso no puede volverse subcategoría de otra.'
              : form.parent
                ? 'Aparecerá en el desplegable de la categoría que elegiste, no en la barra principal.'
                : 'Aparecerá directamente en la barra de navegación de la tienda.'}
          </span>
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

        <details className="mb-4 bg-slate-50 rounded-xl p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-700">
            SEO (Google) — opcional
          </summary>
          <div className="space-y-3 mt-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Título SEO</span>
              <input
                type="text"
                maxLength={80}
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                className={input}
                placeholder="Vasos plásticos en Mérida · CRISTASUR"
              />
              <span className="text-xs text-slate-500">
                Si lo dejas vacío usamos &quot;{form.name || 'Nombre'} · CRISTASUR&quot;.
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Meta descripción SEO</span>
              <textarea
                rows={2}
                maxLength={200}
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                className={input}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Texto largo (aparece al final de la página de categoría)
              </span>
              <textarea
                rows={6}
                maxLength={8000}
                value={form.seoText}
                onChange={(e) => setForm({ ...form, seoText: e.target.value })}
                className={input}
                placeholder="Cuenta sobre tus productos en esta categoría: variedad, usos, materiales, garantías, recomendaciones por tipo de negocio... Mientras más texto único y útil, más posiciona."
              />
              <span className="text-xs text-slate-500">
                Recomendado: 200-500 palabras, vocabulario natural. Influye fuerte en SEO.
              </span>
            </label>
          </div>
        </details>
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
