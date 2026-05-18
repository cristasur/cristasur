'use client'
// Filtros avanzados para /productos
// Sincroniza con el URL (?category, ?q, ?minPrice, ?maxPrice, ?inStock, ?onSale, ?featured, ?sort)
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Icon from './Icon'

export default function ProductFilters({ categories = [], initialFilters = {} }) {
  const router = useRouter()
  const sp = useSearchParams()

  const [form, setForm] = useState({
    q: sp.get('q') ?? initialFilters.q ?? '',
    category: sp.get('category') ?? initialFilters.category ?? '',
    minPrice: sp.get('minPrice') ?? initialFilters.minPrice ?? '',
    maxPrice: sp.get('maxPrice') ?? initialFilters.maxPrice ?? '',
    inStock: (sp.get('inStock') ?? (initialFilters.inStock ? '1' : '')) === '1',
    onSale: (sp.get('onSale') ?? (initialFilters.onSale ? '1' : '')) === '1',
    featured: (sp.get('featured') ?? (initialFilters.featured ? '1' : '')) === '1',
    sort: sp.get('sort') ?? initialFilters.sort ?? 'newest',
  })

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function apply(e) {
    e?.preventDefault?.()
    const params = new URLSearchParams()
    if (form.q) params.set('q', form.q)
    if (form.category) params.set('category', form.category)
    if (form.minPrice) params.set('minPrice', form.minPrice)
    if (form.maxPrice) params.set('maxPrice', form.maxPrice)
    if (form.inStock) params.set('inStock', '1')
    if (form.onSale) params.set('onSale', '1')
    if (form.featured) params.set('featured', '1')
    if (form.sort && form.sort !== 'newest') params.set('sort', form.sort)
    const qs = params.toString()
    router.push('/productos' + (qs ? `?${qs}` : ''))
  }

  function reset() {
    setForm({
      q: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      onSale: false,
      featured: false,
      sort: 'newest',
    })
    router.push('/productos')
  }

  return (
    <form
      onSubmit={apply}
      className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-900 flex items-center gap-2">
          <Icon name="filter" className="w-4 h-4 text-slate-400" />
          Filtros
        </h3>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-slate-500 hover:text-slate-900 underline"
        >
          Limpiar
        </button>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">Buscar</label>
        <input
          value={form.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Palabra clave…"
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
            <option key={c._id} value={c.slug || c._id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">
          Rango de precio (MXN)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Mín"
            value={form.minPrice}
            onChange={(e) => set('minPrice', e.target.value)}
            className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
          <input
            type="number"
            min={0}
            placeholder="Máx"
            value={form.maxPrice}
            onChange={(e) => set('maxPrice', e.target.value)}
            className="w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.inStock}
            onChange={(e) => set('inStock', e.target.checked)}
            className="w-4 h-4"
          />
          <span>Sólo con stock disponible</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.onSale}
            onChange={(e) => set('onSale', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="inline-flex items-center gap-1">
            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
              OFERTA
            </span>
            En oferta
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="w-4 h-4"
          />
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

      <button
        type="submit"
        className="w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold"
      >
        Aplicar filtros
      </button>
    </form>
  )
}
