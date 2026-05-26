// Moderación de reseñas
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import ReviewRow from './ReviewRow'

export const dynamic = 'force-dynamic'

async function loadReviews(status) {
  await dbConnect()
  const filter = status && status !== 'all' ? { status } : {}
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(200).lean()
  // poblamos manualmente los productos (para evitar el error de
  // "Schema hasn't been registered" si el modelo Product aún no
  // fue importado antes en la request)
  const productIds = [...new Set(reviews.map((r) => String(r.product)))]
  const prods = await Product.find({ _id: { $in: productIds } })
    .select('_id name image slug')
    .lean()
  const byId = Object.fromEntries(prods.map((p) => [String(p._id), p]))
  return JSON.parse(
    JSON.stringify(
      reviews.map((r) => ({ ...r, productDoc: byId[String(r.product)] || null }))
    )
  )
}

export default async function ResenasPage({ searchParams }) {
  const status = searchParams?.status || 'pending'
  const reviews = await loadReviews(status)
  const counts = await countsByStatus()

  const tabs = [
    { key: 'pending', label: 'Pendientes', count: counts.pending },
    { key: 'approved', label: 'Aprobadas', count: counts.approved },
    { key: 'rejected', label: 'Rechazadas', count: counts.rejected },
    { key: 'all', label: 'Todas', count: counts.total },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Reseñas</h1>
        <p className="text-slate-500 text-sm">Modera las reseñas publicadas por tus clientes.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/resenas?status=${t.key}`}
            className={
              'px-4 py-2 rounded-full text-sm font-semibold ' +
              (status === t.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200')
            }
          >
            {t.label}
            <span className="ml-2 text-xs opacity-75">{t.count}</span>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewRow key={r._id} review={r} />
        ))}
        {reviews.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-10 text-center text-slate-500">
            No hay reseñas {status !== 'all' ? `en estado "${status}"` : ''}.
          </div>
        )}
      </div>
    </div>
  )
}

async function countsByStatus() {
  await dbConnect()
  const [pending, approved, rejected, total] = await Promise.all([
    Review.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'approved' }),
    Review.countDocuments({ status: 'rejected' }),
    Review.countDocuments({}),
  ])
  return { pending, approved, rejected, total }
}
