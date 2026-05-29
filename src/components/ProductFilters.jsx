'use client'
// Filtros avanzados para /productos
// Desktop (lg+): sidebar completo siempre visible.
// Móvil (<lg):   barra colapsable "Filtros ▼" — se expande al tocar.
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Icon from './Icon'

export default function ProductFilters({ categories = [], brands = [], materials = [], initialFilters = {} }) {
  const router = useRouter()
  const sp = useSearchParams()

  const [form, setForm] = useState({
    q:        sp.get('q')        ?? initialFilters.q        ?? '',
    category: sp.get('category') ?? initialFilters.category ?? '',
    minPrice: sp.get('minPrice') ?? initialFilters.minPrice ?? '',
    maxPrice: sp.get('maxPrice') ?? initialFilters.maxPrice ?? '',
    inStock:  (sp.get('inStock')  ?? (initialFilters.inStock  ? '1' : '')) === '1',
    onSale:   (sp.get('onSale')   ?? (initialFilters.onSale   ? '1' : '')) === '1',
    featured: (sp.get('featured') ?? (initialFilters.featured ? '1' : '')) === '1',
    sort:     sp.get('sort')     ?? initialFilters.sort     ?? 'newest',
    brand:    sp.get('brand')    ?? initialFilters.brand    ?? '',
    color:    sp.get('color')    ?? initialFilters.color    ?? '',
    material: sp.get('material') ?? initialFilters.material ?? '',
  })

  // Cuenta filtros activos para el badge
  const activeCount = [
    form.q, form.category, form.brand, form.color, form.material,
    form.minPrice, form.maxPrice,
    form.inStock ? '1' : '', form.onSale ? '1' : '', form.featured ? '1' : '',
    form.sort !== 'newest' ? '1' : '',
  ].filter(Boolean).length

  // En móvil: siempre cerrado al entrar, el usuario lo abre manualmente
  const [mobileOpen, setMobileOpen] = useState(false)

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function apply(e) {
    e?.preventDefault?.()
    const params = new URLSearchParams()
    if (form.q)        params.set('q',        form.q)
    if (form.category) params.set('category', form.category)
    if (form.minPrice) params.set('minPrice', form.minPrice)
    if (form.maxPrice) params.set('maxPrice', form.maxPrice)
    if (form.inStock)  params.set('inStock',  '1')
    if (form.onSale)   params.set('onSale',   '1')
    if (form.featured) params.set('featured', '1')
    if (form.sort && form.sort !== 'newest') params.set('sort', form.sort)
    if (form.brand)    params.set('brand',    form.brand)
    if (form.color)    params.set('color',    form.color)
    if (form.material) params.set('material', form.material)
    const qs = params.toString()
    router.push('/productos' + (qs ? `?${qs}` : ''))
  }

  function reset() {
    setForm({ q:'', category:'', minPrice:'', maxPrice:'', inStock:false, onSale:false, featured:false, sort:'newest', brand:'', color:'', material:'' })
    router.push('/productos')
  }

  return (
    <form
      onSubmit={apply}
      className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden"
    >
      {/* ── Cabecera ─────────────────────────────────────────────────────
          En móvil: es un botón que despliega el panel.
          En desktop: es solo el título estático.
      ─────────────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between p-4 lg:cursor-default cursor-pointer select-none"
        onClick={() => setMobileOpen((o) => !o)}
        role="button"
        aria-expanded={mobileOpen}
        aria-label="Mostrar u ocultar filtros"
      >
        <span className="font-black text-slate-900 flex items-center gap-2 text-sm">
          <Icon name="filter" className="w-4 h-4 text-slate-400" />
          Filtros
          {activeCount > 0 && (
            <span className="text-[11px] bg-brand-600 text-white rounded-full px-2 py-0.5 font-bold leading-none">
              {activeCount}
            </span>
          )}
        </span>

        <div className="flex items-center gap-3">
          {/* Limpiar — solo desktop */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset() }}
              className="hidden lg:inline text-xs text-slate-500 hover:text-slate-900 underline"
            >
              Limpiar
            </button>
          )}
          {/* Flecha — solo móvil */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 lg:hidden ${mobileOpen ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" clipRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </div>
      </div>

      {/* ── Cuerpo ────────────────────────────────────────────────────────
          Móvil: oculto/visible según mobileOpen.
          Desktop: siempre visible (lg:block sobrescribe hidden).
      ─────────────────────────────────────────────────────────────────── */}
      <div className={`px-4 pb-4 space-y-4 border-t border-slate-100 pt-3 ${mobileOpen ? 'block' : 'hidden'} lg:block`}>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Buscar</label>
          <input
            value={form.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Palabra clave, marca…"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Categoría</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug || c._id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {brands.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Marca</label>
            <select
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand-500"
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b._id} value={b.slug}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {materials.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Material</label>
            <select
              value={form.material}
              onChange={(e) => set('material', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand-500"
            >
              <option value="">Todos los materiales</option>
              {materials.map((m) => (
                <option key={m._id} value={m.slug}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Color</label>
          <input
            value={form.color}
            onChange={(e) => set('color', e.target.value)}
            placeholder="Ej: Rojo, Azul…"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Rango de precio (MXN)
          </label>
          <div className="flex gap-2">
            <input
              type="number" min={0} placeholder="Mín"
              value={form.minPrice}
              onChange={(e) => set('minPrice', e.target.value)}
              className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            />
            <input
              type="number" min={0} placeholder="Máx"
              value={form.maxPrice}
              onChange={(e) => set('maxPrice', e.target.value)}
              className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.inStock} onChange={(e) => set('inStock', e.target.checked)} className="w-4 h-4" />
            <span>Sólo con stock disponible</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.onSale} onChange={(e) => set('onSale', e.target.checked)} className="w-4 h-4" />
            <span className="inline-flex items-center gap-1">
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">OFERTA</span>
              En oferta
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="w-4 h-4" />
            <span className="inline-flex items-center gap-1">
              <span className="text-amber-500">★</span>
              Destacados
            </span>
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Ordenar por</label>
          <select
            value={form.sort}
            onChange={(e) => set('sort', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="newest">Más recientes</option>
            <option value="priceAsc">Precio: menor a mayor</option>
            <option value="priceDesc">Precio: mayor a menor</option>
            <option value="popular">Más populares</option>
          </select>
        </div>

        {/* Limpiar — solo móvil, dentro del panel abierto */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="lg:hidden text-xs text-slate-500 hover:text-slate-900 underline"
          >
            Limpiar filtros
          </button>
        )}

        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
  )
}
