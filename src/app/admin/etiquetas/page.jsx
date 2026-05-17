// /admin/etiquetas — Generador de etiquetas PDF con QR
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import LabelsClient from './LabelsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Etiquetas PDF · CRISTASUR Admin' }

async function loadAll() {
  await dbConnect()
  const [products, categories] = await Promise.all([
    Product.find({ deleted: { $ne: true } })
      .select('name image price stock sku categories wholesalePrice wholesaleMinQty')
      .populate('categories', 'name')
      .sort({ name: 1 })
      .limit(2000)
      .lean(),
    Category.find({ active: true }).select('name slug').sort({ order: 1, name: 1 }).lean(),
  ])
  return {
    products: JSON.parse(JSON.stringify(products)),
    categories: JSON.parse(JSON.stringify(categories)),
  }
}

export default async function LabelsPage() {
  const { products, categories } = await loadAll()
  return <LabelsClient products={products} categories={categories} />
}
