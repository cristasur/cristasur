// Lista de productos (admin) con drag-and-drop para reordenar
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import ExportCsvButton from './ExportCsvButton'
import ProductsTableDnd from './ProductsTableDnd'
import Icon from '@/components/Icon'
import Category from '@/models/Category'

export const dynamic = 'force-dynamic'

async function loadProducts(categoryId, q) {
  await dbConnect()
  const filter = { deleted: { $ne: true } }
  if (categoryId) filter.categories = categoryId
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { sku:  { $regex: safe, $options: 'i' } },
    ]
  }
  // Sin filtros activos: ordenar por sortOrder para reflejar el orden manual.
  // Con filtros: createdAt desc (el DnD se deshabilita de todas formas).
  const sort = (categoryId || q) ? { createdAt: -1 } : { sortOrder: 1, createdAt: -1 }
  const products = await Product.find(filter)
    .populate('categories', 'name')
    .sort(sort)
    .limit(300)
    .lean()
  return JSON.parse(JSON.stringify(products))
}

async function countTrash() {
  await dbConnect()
  return Product.countDocuments({ deleted: true })
}

async function loadCategories() {
  await dbConnect()
  const cats = await Category.find().sort({ order: 1 }).lean()
  return JSON.parse(JSON.stringify(cats))
}

export default async function AdminProductos({ searchParams }) {
  const categoryId = searchParams?.category || ''
  const q = (searchParams?.q || '').trim()
  const hasFilter = !!(categoryId || q)
  const [products, categories, trashCount] = await Promise.all([
    loadProducts(categoryId, q),
    loadCategories(),
    countTrash(),
  ])

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Productos</h1>
          <p className="text-slate-500">{products.length} productos listados.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/productos/import"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
          >
            <Icon name="upload" className="w-4 h-4" />
            Importar CSV
          </Link>
          <ExportCsvButton categories={categories} />

          <Link
            href="/admin/productos/papelera"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
          >
            <Icon name="trash" className="w-4 h-4" />
            Papelera
            {trashCount > 0 && (
              <span className="ml-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {trashCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold"
          >
            <Icon name="plus" className="w-4 h-4" />
            Nuevo producto
          </Link>
        </div>
      </div>

      <div className="mb-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          {/* Búsqueda por nombre o SKU */}
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o SKU…"
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>
          {/* Filtro por categoría */}
          <select
            name="category"
            defaultValue={categoryId}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <button type="submit" className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold">
            Buscar
          </button>
          {(q || categoryId) && (
            <a href="/admin/productos" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium">
              Limpiar
            </a>
          )}
        </form>
        {q && (
          <p className="mt-2 text-xs text-slate-500">
            {products.length} resultado{products.length !== 1 ? 's' : ''} para <strong>"{q}"</strong>
          </p>
        )}
      </div>

      <ProductsTableDnd initialProducts={products} canReorder={!hasFilter} />
    </div>
  )
}
