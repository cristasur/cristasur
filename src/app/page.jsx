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
import CategoryGrid from '@/components/CategoryGrid'

// El home es dinámico: cuando un admin cambia "destacado" o publica algo,
// el siguiente visitante debe verlo ya. Si se necesita aliviar carga, cambiar
// a `export const revalidate = 10` (10 segundos) — pero confirma probarlo
// primero porque los cambios desde admin no se reflejan hasta el TTL.
export const dynamic = 'force-dynamic'

async function loadHome() {
  await dbConnect()
  const now = new Date()
  // Filtro común para producto visible al público:
  // - activo, no eliminado, status != draft, publicado (publishAt vencido).
  const publicMatch = {
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  }
  const [categories, featured, newest, banners] = await Promise.all([
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Product.find({ ...publicMatch, featured: true })
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(8)
      .lean(),
    Product.find(publicMatch)
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

  return (
    <div>
      {/* Carrusel de banners. Todo se administra en /admin/banners. */}
      <Hero banners={banners} />

      {/* Banner: repetir último pedido (solo si el cliente tiene historial local) */}
      <div className="pt-6">
        <RepeatOrder />
      </div>

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Comprar por categoría</h2>
          </div>
          <Link href="/productos" className="text-sm font-bold text-slate-900 hover:text-brand-700 inline-flex items-center gap-1.5 shrink-0">
            Ver todos
            <Icon name="arrow" className="w-4 h-4" />
          </Link>
        </div>
        {/* Celdas: solo principales. `allCategories` lleva la lista completa
            para poder armar el desplegable de subcategorías al pasar el mouse. */}
        <CategoryGrid
          categories={categories.filter((c) => !c.parent)}
          allCategories={categories}
        />
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

  