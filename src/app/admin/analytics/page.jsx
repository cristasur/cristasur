// ============================================================
// /admin/analytics  — Estadísticas de visitas (datos propios en MongoDB)
// ============================================================
import dbConnect from '@/lib/mongodb'
import PageView from '@/models/PageView'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmt(n) {
  return new Intl.NumberFormat('es-MX').format(n ?? 0)
}

async function loadStats() {
  await dbConnect()

  const now = new Date()
  // Últimos 30 días
  const days30 = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days30.push(d.toISOString().slice(0, 10))
  }
  const today = days30[days30.length - 1]
  const yesterday = days30[days30.length - 2]
  const week = days30.slice(-7)

  // Visitas totales por día (últimos 30 días)
  const dailyRaw = await PageView.aggregate([
    { $match: { date: { $in: days30 } } },
    {
      $group: {
        _id: '$date',
        pageviews: { $sum: '$count' },
        visitors: { $addToSet: '$ipHash' },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const dailyMap = {}
  for (const d of dailyRaw) {
    dailyMap[d._id] = { pageviews: d.pageviews, visitors: d.visitors.length }
  }
  const daily = days30.map((d) => ({
    date: d,
    pageviews: dailyMap[d]?.pageviews ?? 0,
    visitors: dailyMap[d]?.visitors ?? 0,
  }))

  // Totales hoy / ayer / 7 días / 30 días
  const sum = (key, arr) => arr.reduce((a, b) => a + (b[key] ?? 0), 0)
  const todayData = daily.find((d) => d.date === today) ?? { pageviews: 0, visitors: 0 }
  const yestData = daily.find((d) => d.date === yesterday) ?? { pageviews: 0, visitors: 0 }
  const week7Data = daily.filter((d) => week.includes(d.date))
  const all30 = daily

  // Top páginas (últimos 30 días)
  const topPages = await PageView.aggregate([
    { $match: { date: { $in: days30 } } },
    {
      $group: {
        _id: '$url',
        pageviews: { $sum: '$count' },
        visitors: { $addToSet: '$ipHash' },
      },
    },
    { $sort: { pageviews: -1 } },
    { $limit: 10 },
  ])

  return {
    today: todayData,
    yesterday: yestData,
    week7: {
      pageviews: sum('pageviews', week7Data),
      visitors: sum('visitors', week7Data),
    },
    month30: {
      pageviews: sum('pageviews', all30),
      visitors: sum('visitors', all30),
    },
    daily,
    topPages,
  }
}

function StatCard({ label, pv, vis, accent = 'brand' }) {
  const colors = {
    brand: 'from-brand-500 to-brand-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-400 to-orange-500',
    slate: 'from-slate-500 to-slate-700',
  }
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors[accent]} text-white p-5 shadow-lg`}>
      <div className="text-sm font-semibold opacity-80 mb-3">{label}</div>
      <div className="flex items-end gap-4">
        <div>
          <div className="text-3xl font-black">{fmt(pv)}</div>
          <div className="text-xs opacity-70 mt-0.5">páginas vistas</div>
        </div>
        <div className="border-l border-white/30 pl-4">
          <div className="text-2xl font-black">{fmt(vis)}</div>
          <div className="text-xs opacity-70 mt-0.5">visitantes únicos</div>
        </div>
      </div>
    </div>
  )
}

// Mini gráfica de barras en SVG (no requiere librería)
function BarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.pageviews), 1)
  const W = 700
  const H = 120
  const barW = Math.floor(W / data.length) - 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
      {data.map((d, i) => {
        const bh = Math.max(4, (d.pageviews / maxVal) * (H - 20))
        const x = i * (W / data.length)
        const y = H - bh
        const isToday = i === data.length - 1
        return (
          <g key={d.date}>
            <rect
              x={x + 1}
              y={y}
              width={barW}
              height={bh}
              rx={3}
              fill={isToday ? '#3b82f6' : '#93c5fd'}
              opacity={isToday ? 1 : 0.7}
            />
            <title>{`${d.date}: ${d.pageviews} vistas, ${d.visitors} visitantes`}</title>
          </g>
        )
      })}
    </svg>
  )
}

export default async function AnalyticsPage() {
  const stats = await loadStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Visitas registradas directamente en tu base de datos.
          </p>
        </div>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 shadow-sm"
        >
          📊 Abrir Google Analytics
        </a>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Hoy"       pv={stats.today.pageviews}    vis={stats.today.visitors}    accent="brand" />
        <StatCard label="Ayer"      pv={stats.yesterday.pageviews} vis={stats.yesterday.visitors} accent="slate" />
        <StatCard label="7 días"    pv={stats.week7.pageviews}    vis={stats.week7.visitors}    accent="emerald" />
        <StatCard label="30 días"   pv={stats.month30.pageviews}  vis={stats.month30.visitors}  accent="amber" />
      </div>

      {/* Gráfica de barras - 30 días */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Páginas vistas — últimos 30 días</h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Días anteriores
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Hoy
            </span>
          </div>
        </div>
        <BarChart data={stats.daily} />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
          <span>{stats.daily[0]?.date}</span>
          <span>{stats.daily[stats.daily.length - 1]?.date}</span>
        </div>
      </div>

      {/* Tabla de días recientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Últimos 7 días</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
                <th className="text-left px-5 py-3">Fecha</th>
                <th className="text-right px-5 py-3">Páginas vistas</th>
                <th className="text-right px-5 py-3">Visitantes únicos</th>
              </tr>
            </thead>
            <tbody>
              {stats.daily.slice(-7).reverse().map((d) => (
                <tr key={d.date} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{d.date}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{fmt(d.pageviews)}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{fmt(d.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top páginas */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Páginas más visitadas (30 días)</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {stats.topPages.map((p, i) => {
            const maxPv = stats.topPages[0]?.pageviews || 1
            const pct = Math.round((p.pageviews / maxPv) * 100)
            return (
              <div key={p._id} className="px-5 py-3 flex items-center gap-4">
                <span className="text-slate-400 text-xs w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{p._id || '/'}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-slate-800">{fmt(p.pageviews)}</div>
                  <div className="text-[10px] text-slate-400">{p.visitors?.length ?? fmt(p.visitors)} únicos</div>
                </div>
              </div>
            )
          })}
          {stats.topPages.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              Aún no hay datos — las visitas se empezarán a registrar ahora.
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center pb-4">
        Los visitantes se identifican por IP hasheada (anónima). Los datos se guardan en tu base de datos.
      </p>
    </div>
  )
}
