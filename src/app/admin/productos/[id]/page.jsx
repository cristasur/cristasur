// ============================================================
// /admin/productos/:id - Editar producto
// ============================================================
import { notFound } from 'next/navigation'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Brand from '@/models/Brand'
import Material from '@/models/Material'
import Product from '@/models/Product'
import ProductForm from '../ProductForm'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound()
  await dbConnect()
  const [product, categories, brands, materialsList] = await Promise.all([
    Product.findById(params.id)
      .populate('relatedProducts', '_id name image price')
      .lean(),
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Brand.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Material.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
  ])
  if (!product) notFound()

  const serialize = (v) => JSON.parse(JSON.stringify(v))

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 mb-1">Editar producto</h1>
      <p className="text-slate-500 mb-6">Actualiza los datos y guarda los cambios.</p>
      <ProductForm
        categories={serialize(categories)}
        brands={serialize(brands)}
        materials={serialize(materialsList