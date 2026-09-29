// ============================================================
// /categoria/[slug] — landing page de cada categoría con SEO real.
// Muestra título, descripción corta, productos publicados, sidebar de
// filtros (sin la opción "Categoría" porque ya estás dentro de una)
// y un texto largo (seoText) indexable. Si no existe, 404.
// ============================================================
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import ProductGrid from '@/components/ProductGrid'
import ProductFilters from '@/components/ProductFilters'
import CatalogoBarra, { CatalogoPaginas } from '@/components/CatalogoBarra'
import SubcategoryStrip from '@/components/SubcategoryStrip'
import CategoryHero from '@/components/CategoryHero'
import { consultarCatalogo } from '@/lib/catalogo'

export const dynamic = 'force-dynamic'

async function loadData(slug, sp) {
  await dbConnect()
  const category = await Category.findOne({ slug, active: true }).lean()
  if (!category) return null

  // Si es una categoría principal, también cuenta lo de sus subcategorías.
  const children = await Category.find({ parent: category._id, active: true })
    // `image` e `icon` los usa la tira de círculos de SubcategoryStrip.
    .select('_id name slug image icon')
    .sort({ order: 1, name: 1 })
    .lean()
  const categoryIds = [category._id, ...children.map((c) => c._id)]

  const [catalogo, parentCat] = await Promise.all([
    consultarCatalogo(sp, { alcance: categoryIds, hijas: children }),
    category.parent ? Category.findById(category.parent).select('name slug').lean() : null,
  ])

  return {
    category: JSON.parse(JSON.stringify(category)),
    children: JSON.parse(JSON.stringify(children)),
    parentCat: parentCat ? JSON.parse(JSON.stringify(parentCat)) : null,
    ...catalogo,
  }
}

export async function generateMetadata({ params }) {
  await dbConnect()
  const category = await Category.findOne({ slug: params.slug, active: true }).lean()
  if (!category) return { title: 'Categoría no encontrada · CRISTASUR' }
  const title = category.seoTitle || `${category.name} · CRISTASUR`
  const description =
    category.seoDescription ||
    category.description ||
    `Encuentra ${category.name.toLowerCase()} en CRISTASUR. Precios económicos, mayoreo y entrega en Mérida y Bacalar.`
  return { title, description }
}

export default async function CategoryLanding({ params, searchParams }) {
  const data = await loadData(params.slug, searchParams || {})
  if (!data) notFound()
  const { category, children, parentCat, productos, total, pagina, paginas, facetas, filtros, marcados } = data
  const basePath = `/categoria/${category.slug}`

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Miga de pan */}
      <nav className="text-xs uppercase tracking-widest text-brand-600 font-bold">
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="text-slate-300 mx-1.5">/</span>
        {parentCat ? (
          <>
            <Link href={`/categoria/${parentCat.slug}`} className="hover:underline">
              {parentCat.name}
            </Link>
            <span className="text-slate-300 mx-1.5">/</span>
          </>
        ) : null}
        <span className="text-slate-400">{category.name}</span>
      </nav>

      {/* Banner de la categoría */}
      <CategoryHero category={category} parentCat={parentCat} total={total} />

      {/* Subcategorías en círculos, como MAHA */}
      <SubcategoryStrip subcategories={children} />

      <div className="grid lg:grid-cols-[270px_1fr] gap-6 lg:gap-8">
        <aside className="lg:sticky lg:top-24 h-fit">
          <Suspense fallback={<div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />}>
            <ProductFilters facetas={facetas} total={total} marcados={marcados} basePath={basePath} hideCategory />
          </Suspense>
        </aside>

        <div className="min-w-0">
          <Suspense fallback={null}>
            <CatalogoBarra total={total} facetas={facetas} basePath={basePath} />
          </Suspense>
          {productos.length > 0 ? (
            <ProductGrid products={productos} colorFilter={filtros.colores[0] || ''} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
              No encontramos productos con esos filtros. Quita alguno o escríbenos por WhatsApp para cotizar.
            </div>
          )}
          <CatalogoPaginas pagina={pagina} paginas={paginas} basePath={basePath} searchParams={searchParams || {}} />
        </div>
      </div>

      {/* SEO long text controlado desde admin */}
      {category.seoText && (
        <article className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 md:p-8 prose prose-slate max-w-none">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Sobre {category.name.toLowerCase()}
          </h2>
          <div className="text-slate-700 leading-relaxed whitespace-pre-line">
            {category.seoText}
          </div>
        </article>
      )}
    </div>
  )
}
