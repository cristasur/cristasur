import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Icon from '@/components/Icon'
import CouponForm from '../CouponForm'

export const dynamic = 'force-dynamic'

async function loadData() {
  await dbConnect()
  const [categories, products] = await Promise.all([
    Category.find({}).select('_id name icon').sort({ order: 1 }).lean(),
    Product.find({ deleted: { $ne: true } })
      .select('_id name')
      .sort({ name: 1 })
      .limit(300)
      .lean(),
  ])
  return {
    categories: JSON.parse(JSON.stringify(categories)),
    products: JSON.parse(JSON.stringify(products)),
  }
}

export default async function NuevoCuponPage() {
  const { categories, products } = await loadData()
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-black text-slate-900">Nuevo cupón</h1>
        <Link
          href="/admin/cupones"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Volver
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <CouponForm categories={categories} products={products} />
      </div>
    </div>
  )
}
