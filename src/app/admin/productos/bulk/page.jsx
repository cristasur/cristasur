// /admin/productos/bulk — Edición masiva de productos
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import BulkEditClient from './BulkEditClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edición masiva · CRISTASUR Admin' }

async function loadAll() {
  await dbConnect()
  const [products, categories] = await Promise.all([
    Product.find({ deleted: { $ne: true } })
      .select('name image price stock categories active status featured tags')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean(),
    Category.find({ active: true }).select('name slug').sort({ order: 1, name: 1 }).lean(),
  ])
  return {
    products: JSON.parse(JSON.stringify(products)),
    categories: JSON.parse(JSON.stringify(categories)),
  }
}

export default async function BulkPage() {
  const { products, categories } = await loadAll()
  return <BulkEditClient products={products} categories={categories} />
}
