import Link from 'next/link'
import { notFound } from 'next/navigation'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Icon from '@/components/Icon'
import CouponForm from '../CouponForm'

export const dynamic = 'force-dynamic'

async function loadData(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  await dbConnect()
  const [coupon, categories, products] = await Promise.all([
    Coupon.findById(id).lean(),
    Category.find({}).select('_id name icon').sort({ order: 1 }).lean(),
    Product.find({ deleted: { $ne: true } })
      .select('_id name')
      .sort({ name: 1 })
      .limit(300)
      .lean(),
  ])
  if (!coupon) return null
  return {
    coupon: JSON.parse(JSON.stringify(coupon)),
    categories: JSON.parse(JSON.stringify(categories)),
    products: JSON.parse(JSON.stringify(products)),
  }
}

export default async function EditarCuponPage({ params }) {
  const data = await loadData(params.id)
  if (!data) return notFound()
  const { coupon, categories, products } = data

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-black text-slate-900">
          Editar cupón: <span className="font-mono">{coupon.code}</span>
        </h1>
        <Link
          href="/admin/cupones"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Volver
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <CouponForm initial={coupon} categories={categories} products={products} />
      </div>
    </div>
  )
}
