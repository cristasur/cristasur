// ============================================================
// Dashboard del admin con métricas reales:
//  - KPI: productos, activos, papelera, sin foto, sin ventas 30d
//  - Top 5 más vistos / clicks WhatsApp / ratio interés
//  - Stock bajo
//  - Pedidos recientes
//  - Reseñas pendientes
// ============================================================
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Review from '@/models/Review'
import Order from '@/models/Order'
import Icon from '@/components/Icon'

export const dynamic = 'force-dynamic'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n || 0)
}

// Las 13 queries del dashboard se cachean 30 s para no machacar MongoDB en
// cada recarga de pestaña. Con force-dynamic la página sigue siendo dinámica
// (no se pre-renderiza en build), pero los datos dentro sí se cachean.
async function _loadStats() {
  await dbConnect()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000)

  const [
    totalProducts,
    active,
    drafts,
    trashed,
    noImage,
    lowStock,
    topViewed,
    topWhatsappClicks,
    pendingReviews,
    intentOrders,
    confirmedOrders,
    recentOrders,
    interestSignals,
  ] = await Promise.all([
    Product.countDocuments({ deleted: { $ne: true } }),
    Product.countDocuments({ active: true, status: { $ne: 'draft' }, deleted: { $ne: true } }),
    Product.countDocuments({ status: 'draft', deleted: { $ne: true } }),
    Product.countDocuments({ deleted: true }),
    Product.countDocuments({
      deleted: { $ne: true },
      $or: [{ image: '' }, { image: { $exists: false } }],
    }),
    Product.find({ stock: { $lt: 5 }, active: true, deleted: { $ne: true } })
      .sort({ stock: 1 })
      .limit(8)
      .select('name stock image')
      .lean(),
    Product.find({ active: true, deleted: { $ne: true }, viewsCount: { $gt: 0 } })
      .sort({ viewsCount: -1 })
      .limit(5)
      .select('name viewsCount image')
      .lean(),
    Product.find({ active: true, deleted: { $ne: true }, whatsappClicks: { $gt: 0 } })
      .sort({ whatsappClicks: -1 })
      .limit(5)
      .select('name whatsappClicks viewsCount image')
      .lean(),
    Review.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'intent' }),
    Order.countDocuments({
      status: { $in: ['confirmed', 'shipped', 'delivered'] },
      createdAt: { $gte: thirtyDaysAgo },
    }),
    Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    Product.aggregate([
      { $match: { active: true, deleted: { $ne: true }, viewsCount: { $gte: 5 } } },
      {
        $project: {
          name: 1, image: 1, viewsCount: 1, whatsappClicks: 1,
          ratio: {
            $cond: [
              { $gt: ['$viewsCount', 0] },
              { $divide: ['$whatsappClicks', '$viewsCount'] },
              0,
            ],
          },
        },
      },
      { $sort: { ratio: -1 } },
      { $limit: 5 },
    ]),
  ])

  return {
    totalProducts, active, drafts, trashed, noImage,
    lowStock: JSON.parse(JSON.stringify(lowStock)),
    topViewed: JSON.parse(JSON.stringify(topViewed)),
    topWhatsappClicks: JSON.parse(JSON.stringify(topWhatsappClicks)),
    interestSignals: JSON.parse(JSON.stringify(interestSignals)),
    pendingReviews, intentOrders, confirmedOrders,
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
  }
}

// Versión cacheada: las métricas se actualizan cada 30 segundos.
// Si el admin necesita datos al instante puede recargar la página pasados 30 s.
const loadStats = unstable_cache(
  _loadStats,
  ['admin-dashboard-stats'],
  { revalidate: 30, tags: ['dashboard'] }
)

function Stat({ label, value, icon, href, tint = 'brand', sub }) {
  const tints = {
    brand:   'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    accent:  'bg-accent-50 text-accent-700',
    rose:    'bg-rose-50 text-rose-700',
    amber:   'bg-amber-50 text-amber-700',
    slate:   'bg-slate-100 text-slate-700',
  }
  const content = (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 h-full">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${tints[tint]}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="text-3xl font-black text-slate-900 mt-3">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function ProductRow({ p, value, valueSuffix = '' }) {
  return (
    <li className="py-2 flex items-center gap-3">
      <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden shrink-0 grid place-items-center text-slate-300">
        {p.image ? (
          <img src={p.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon name="box" className="w-4 h-4" />
        )}
      </div>
      <Link
        href={`/admin/productos/${p._id}`}
        className="flex-1 min-w-0 text-sm font-semibold text-slate-800 hover:text-brand-700 line-clamp-1"
      >
        {p.name}
      </Link>
      <span className="text-sm font-mono text-slate-700 shrink-0">
        {value}{valueSuffix}
      </span>
    </li>
  )
}

export default async function AdminDashboard() {
  const s = await loadStats()
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-6">Tus productos y pedidos en números reales.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Productos publicados" value={s.active}    icon="check" href="/admin/productos" tint="emerald" />
        <Stat label="Borradores"           value={s.drafts}    icon="edit"  href="/admin/productos?status=draft" tint="amber" />
        <Stat label="En papelera"          value={s.trashed}   icon="trash" href="/admin/productos/papelera" tint="slate" />
        <Stat label="Sin foto"             value={s.noImage}   icon="box"   tint="rose" sub="Hay que subirles imagen" />
      </div>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Pedidos pendientes"   value={s.intentOrders}    icon="cart"  href="/admin/pedidos" tint="brand"   sub="Intent vía WhatsApp" />
        <Stat label="Confirmados (30d)"    value={s.confirmedOrders} icon="check" href="/admin/pedidos" tint="emerald" />
        <Stat label="Reseñas por moderar"  value={s.pendingReviews}  icon="star"  href="/admin/resenas" tint="accent" />
        <Stat label="Total productos"      value={s.totalProducts}   icon="box"   tint="slate" />
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-3">Más vistos</h2>
          {s.topViewed.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no hay vistas.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.topViewed.map((p) => (
                <ProductRow key={p._id} p={p} value={p.viewsCount} valueSuffix=" vistas" />
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-3">Top clicks WhatsApp</h2>
          {s.topWhatsappClicks.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no se registran clicks.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.topWhatsappClicks.map((p) => (
                <ProductRow key={p._id} p={p} value={p.whatsappClicks} valueSuffix=" clicks" />
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-3">Señal de interés (clicks WA / vistas)</h2>
          <p className="text-xs text-slate-500 mb-3">
            Productos con mejor ratio de visitantes que dan clic en WhatsApp.
          </p>
          {s.interestSignals.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no hay datos.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.interestSignals.map((p) => (
                <ProductRow key={p._id} p={p} value={`${(p.ratio * 100).toFixed(1)}%`} />
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-3">Stock bajo</h2>
          {s.lowStock.length === 0 ? (
            <p className="text-slate-500 text-sm">Todo en orden.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.lowStock.map((p) => (
                <ProductRow key={p._id} p={p} value={p.stock} valueSuffix=" pzs" />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">Pedidos recientes</h2>
          <Link href="/admin/pedidos" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Ver todos →
          </Link>
        </div>
        {s.recentOrders.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Aún no hay pedidos. Cuando un cliente dé clic en "Pedir por WhatsApp",
            aparecerán aquí.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {s.recentOrders.map((o) => (
              <li key={o._id} className="py-2 flex items-center gap-3">
                <span
                  className={
                    'text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ' +
                    (o.status === 'intent'
                      ? 'bg-amber-100 text-amber-800'
                      : o.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700')
                  }
                >
                  {o.status}
                </span>
                <span className="flex-1 text-sm text-slate-700 line-clamp-1">
                  {(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')}
                </span>
                <span className="text-sm font-bold text-slate-900 shrink-0">
                  {formatPrice(o.total)}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(o.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <h2 className="font-bold text-slate-900 mb-3">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/productos/nuevo" className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold">
            + Nuevo producto
          </Link>
          <Link href="/admin/productos/import" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">
            Importar CSV
          </Link>
          <Link href="/admin/productos/bulk" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">
            Edición masiva
          </Link>
          <Link href="/admin/etiquetas" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">
            Etiquetas PDF con QR
          </Link>
        </div>
      </div>
    </div>
  )
}
