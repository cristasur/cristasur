// Dashboard principal del admin
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import Icon from '@/components/Icon'

export const dynamic = 'force-dynamic'

async function loadStats() {
  await dbConnect()
  const [totalProducts, active, featured, categories, lowStock] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ active: true }),
    Product.countDocuments({ featured: true }),
    Category.countDocuments(),
    Product.find({ stock: { $lt: 5 }, active: true }).limit(5).select('name stock').lean(),
  ])
  return {
    totalProducts,
    active,
    featured,
    categories,
    lowStock: JSON.parse(JSON.stringify(lowStock)),
  }
}

function Stat({ label, value, icon, href, tint = 'brand' }) {
  const tints = {
    brand:   'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    accent:  'bg-accent-50 text-accent-700',
    slate:   'bg-slate-100 text-slate-700',
  }
  const content = (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${tints[tint]}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="text-3xl font-black text-slate-900 mt-3">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default async function AdminDashboard() {
  const stats = await loadStats()
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-6">Un vistazo rápido al catálogo.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Productos totales" value={stats.totalProducts} icon="box"   href="/admin/productos" tint="brand" />
        <Stat label="Productos activos" value={stats.active}        icon="check" tint="emerald" />
        <Stat label="Destacados"        value={stats.featured}      icon="star"  tint="accent" />
        <Stat label="Categorías"        value={stats.categories}    icon="tag"   href="/admin/categorias" tint="slate" />
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-3">Stock bajo</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-slate-500 text-sm">Todo en orden.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.lowStock.map((p) => (
                <li key={p._id} className="py-2 flex justify-between text-sm">
                  <span className="text-slate-700">{p.name}</span>
                  <span className="font-mono text-rose-600">{p.stock} pzs</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-3">Acciones rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/productos/nuevo" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm">
              <Icon name="plus" className="w-4 h-4" />
              Nuevo producto
            </Link>
            <Link href="/admin/categorias" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm">
              <Icon name="tag" className="w-4 h-4" />
              Gestionar categorías
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
