// /admin/categorias - CRUD completo inline
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import CategoryManager from './CategoryManager'

export const dynamic = 'force-dynamic'

async function loadData() {
  await dbConnect()
  const cats = await Category.find().sort({ order: 1, name: 1 }).lean()
  const counts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]))
  const withCounts = cats.map((c) => ({
    ...c,
    productCount: countMap[String(c._id)] || 0,
  }))
  return JSON.parse(JSON.stringify(withCounts))
}

export default async function AdminCategorias() {
  const categories = await loadData()
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 mb-1">Categorías</h1>
      <p className="text-slate-500 mb-6">
        Aquí puedes crear, editar y eliminar categorías. Los cambios se reflejan en la tienda al instante.
      </p>
      <CategoryManager initialCategories={categories} />
    </div>
  )
}
