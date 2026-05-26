'use client'
// Filtro de categorías para la página de catálogo
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function CategoryFilter({ categories = [], currentSlug }) {
  const params = useSearchParams()
  const q = params.get('q')
  const featured = params.get('featured')

  function linkFor(slug) {
    const url = new URLSearchParams()
    if (slug) url.set('category', slug)
    if (q) url.set('q', q)
    if (featured) url.set('featured', featured)
    const s = url.toString()
    return s ? `/productos?${s}` : '/productos'
  }

  return (
    <aside className="lg:sticky lg:top-40 h-fit">
      <h3 className="font-bold text-slate-900 mb-3">Categorías</h3>
      <div className="flex lg:flex-col gap-2 overflow-x-auto scroll-chip lg:overflow-visible">
        <Link
          href={linkFor('')}
          className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition ${
            !currentSlug ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 hover:bg-brand-50'
          }`}
        >
          Todas
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            href={linkFor(c.slug)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition ${
              currentSlug === c.slug
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-700 hover:bg-brand-50'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>
    </aside>
  )
}
