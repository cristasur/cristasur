// Lista de productos (admin)
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import DeleteProductButton from './DeleteProductButton'
import DuplicateButton from './DuplicateButton'
import ExportCsvButton from './ExportCsvButton'
import Icon from '@/components/Icon'
import Category from '@/models/Category'

export const dynamic = 'force-dynamic'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)
}

async function loadProducts(categoryId) {
  await dbConnect()
  const filter = { deleted: { $ne: true } }
  if (categoryId) filter.categories = categoryId
  const products = await Product.find(filter)
    .populate('categories', 'name')
    .sort({ createdAt: -1 })
    .limit(200)
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
  const [products, categories, trashCount] = await Promise.all([
    loadProducts(categoryId),
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

      <div className="mb-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
        <form method="GET" className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">Filtrar por categoría:</label>
          <select 
            name="category" 
            defaultValue={categoryId} 
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">Todas</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <button type="submit" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">
            Filtrar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="p-3">Producto</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 grid place-items-center text-slate-300">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="box" className="w-6 h-6" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {p.categories?.length > 0 ? p.categories.map(c => (
                        <span key={c._id} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap">
                          {c.name}
                        </span>
                      )) : '—'}
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{formatPrice(p.price)}</td>
                  <td className="p-3">
                    <span className={p.stock < 5 ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3">
                    {p.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        Oculto
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                      <Link
                        href={`/admin/productos/${p._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                      >
                        <Icon name="edit" className="w-3.5 h-3.5" />
                        Editar
                      </Link>
                      <DuplicateButton id={p._id} />
                      <DeleteProductButton id={p._id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    No hay productos aún.{' '}
                    <Link
                      href="/admin/productos/nuevo"
                      className="text-brand-700 font-semibold hover:underline"
                    >
                      Crea el primero
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
