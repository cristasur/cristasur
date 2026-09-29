// ============================================================
// /productos - Catálogo con filtros tipo MAHA y búsqueda.
// Toda la lógica de filtros y conteos vive en lib/catalogo.js.
// ============================================================
import { Suspense } from 'react'
import dbConnect from '@/lib/mongodb'
import ProductGrid from '@/components/ProductGrid'
import ProductFilters from '@/components/ProductFilters'
import CatalogoBarra, { CatalogoPaginas } from '@/components/CatalogoBarra'
import { consultarCatalogo } from '@/lib/catalogo'

export const dynamic = 'force-dynamic'
export const metadata = { alternates: { canonical: '/productos' } }

export default async function CatalogoPage({ searchParams = {} }) {
  await dbConnect()
  const { productos, total, pagina, paginas, facetas, filtros, marcados } = await consultarCatalogo(searchParams)

  const unaCat = filtros.categorias.length === 1 ? facetas.categorias.find((c) => c.value === filtros.categorias[0]) : null
  const unaMarca = filtros.marcas.length === 1 ? facetas.marcas.find((m) => m.value === filtros.marcas[0]) : null

  let title = 'Catálogo completo'
  if (filtros.q) title = `Resultados para "${filtros.q}"`
  else if (unaCat) title = unaCat.label
  else if (unaMarca) title = `Marca: ${unaMarca.label}`
  else if (filtros.colores.length === 1) title = `Color: ${filtros.colores[0]}`
  else if (filtros.destacados) title = 'Productos destacados'
  else if (filtros.oferta) title = 'En oferta'
  else if (filtros.nuevo) title = 'Lo más nuevo'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">{title}</h1>
      </header>

      <div className="grid lg:grid-cols-[270px_1fr] gap-6 lg:gap-8">
        <aside className="lg:sticky lg:top-24 h-fit">
          <Suspense fallback={<div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />}>
            <ProductFilters facetas={facetas} total={total} marcados={marcados} basePath="/productos" />
          </Suspense>
        </aside>
        <div className="min-w-0">
          <Suspense fallback={null}>
            <CatalogoBarra total={total} facetas={facetas} basePath="/productos" />
          </Suspense>
          {productos.length > 0 ? (
            <ProductGrid products={productos} colorFilter={filtros.colores[0] || ''} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
              No encontramos productos con esos filtros. Quita alguno o escríbenos por WhatsApp y te ayudamos.
            </div>
          )}
          <CatalogoPaginas pagina={pagina} paginas={paginas} basePath="/productos" searchParams={searchParams} />
        </div>
      </div>
    </div>
  )
}
