// ============================================================
// Home - Hero + Destacados + Categorías + CTA
// ============================================================
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Banner from '@/models/Banner'
import Hero from '@/components/Hero'
import ProductGrid from '@/components/ProductGrid'
import Icon from '@/components/Icon'
import RepeatOrder from '@/components/RepeatOrder'

export const dynamic = 'force-dynamic'

async function loadHome() {
  await dbConnect()
  const [categories, featured, newest, banners] = await Promise.all([
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Product.find({ active: true, featured: true })
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Product.find({ active: true })
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Banner.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean(),
  ])
  const serialize = (arr) => JSON.parse(JSON.stringify(arr))
  return {
    categories: serialize(categories),
    featured:   serialize(featured),
    newest:     serialize(newest),
    banners:    serialize(banners),
  }
}

export default async function HomePage() {
  const { categories, featured, newest, banners } = await loadHome()
  // Selección manual de las 4 que aparecen en el mosaico del hero.
  // Si no hay ninguna marcada, caemos en las primeras 4 por orden.
  const heroCategories =
    categories.filter((c) => c.featured).slice(0, 4).length > 0
      ? categories.filter((c) => c.featured).slice(0, 4)
      : categories.slice(0, 4)

  return (
    <div>
      <Hero categories={heroCategories} banners={banners} />

      {/* Banner: repetir último pedido (solo si el cliente tiene historial local) */}
      <div className="pt-6">
        <RepeatOrder />
      </div>

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">Explora</div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">Nuestras categorías</h2>
          </div>
          <Link href="/productos" className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
            Ver todo
            <Icon name="arrow" className="w-4 h-4" />
          </Link>
        </div>
        <div className="stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <Link
              key={c._id}
              href={`/categoria/${c.slug}`}
              className="card-hover group bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 hover:border-brand-200 flex flex-col"
            >
              <div className="aspect-square bg-brand-50 overflow-hidden relative">
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : c.icon ? (
                  <div className="w-full h-full grid place-items-center text-4xl text-brand-700">
                    {c.icon}
                  </div>
                ) : (
                  <div className="w-full h-full grid place-items-center text-3xl font-black text-brand-700">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="px-3 py-3 text-center">
                <div className="font-semibold text-slate-900 text-sm line-clamp-1">{c.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-accent-600 font-bold">Lo que más se vende</div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">Productos destacados</h2>
            </div>
            <Link href="/productos?featured=1" className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
              Ver todos
              <Icon name="arrow" className="w-4 h-4" />
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}

      {/* Banner promo */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-700 text-white p-8 md:p-12">
          <div className="absolute inset-0 bg-dots opacity-40" />
          <div className="relative md:flex items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-black">¿Tienes un negocio?</h3>
              <p className="mt-2 text-accent-100 max-w-xl">
                Atendemos a restaurantes, escuelas y comercios con precios especiales por mayoreo.
              </p>
            </div>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-accent-700 font-bold hover:bg-accent-50 mt-4 md:mt-0 whitespace-nowrap"
            >
              Cotizar por mayoreo
              <Icon name="arrow" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Nuevos */}
      {newest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">Recién llegados</div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">Nuevos productos</h2>
            </div>
          </div>
          <ProductGrid products={newest} />
        </section>
      )}
    </div>
  )
}

  