// ============================================================
// /admin/productos/nuevo - Crear producto
// ============================================================
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Brand from '@/models/Brand'
import ProductForm from '../ProductForm'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  await dbConnect()
  const serialize = (arr) => JSON.parse(JSON.stringify(arr))
  const [categories, brands] = await Promise.all([
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Brand.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
  ])

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center">
        <div className="text-5xl mb-3">🏷️</div>
        <h2 className="text-xl font-bold">Primero crea una categoría</h2>
        <p className="text-slate-500 mt-2">
          Los productos deben pertenecer a una categoría. Crea al menos una antes de continuar.
        </p>
        <a href="/admin/categorias" className="mt-4 inline-flex px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">
          Ir a categorías
        </a>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 mb-1">Nuevo producto</h1>
      <p className="text-slate-500 mb-6">Llena los datos y guarda.</p>
      <ProductForm categories={serialize(categories)} brands={serialize(brands)} />
    </div>
  )
}
