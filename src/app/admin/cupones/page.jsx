// Lista de cupones
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import Icon from '@/components/Icon'

export const dynamic = 'force-dynamic'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

async function loadCoupons() {
  await dbConnect()
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean()
  return JSON.parse(JSON.stringify(coupons))
}

export default async function CuponesPage() {
  const coupons = await loadCoupons()
  const now = new Date()

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Cupones</h1>
          <p className="text-slate-500 text-sm">
            {coupons.length} cupón(es). Úsalos para promociones y ofertas especiales.
          </p>
        </div>
        <Link
          href="/admin/cupones/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold"
        >
          <Icon name="plus" className="w-4 h-4" />
          Nuevo cupón
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Descuento</th>
                <th className="p-3">Vigencia</th>
                <th className="p-3">Usos</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c) => {
                const expired = c.endsAt && new Date(c.endsAt) < now
                const notStarted = c.startsAt && new Date(c.startsAt) > now
                const exhausted = c.usageLimit > 0 && c.usageCount >= c.usageLimit
                const usable = c.active && !expired && !notStarted && !exhausted
                return (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">{c.code}</td>
                    <td className="p-3">
                      {c.type === 'percent' ? `${c.value}%` : `$${c.value}`}
                      {c.minSubtotal > 0 && (
                        <div className="text-xs text-slate-500">
                          mín. ${c.minSubtotal}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-600">
                      {formatDate(c.startsAt)} → {formatDate(c.endsAt)}
                    </td>
                    <td className="p-3 text-xs">
                      {c.usageCount}
                      {c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="p-3">
                      {usable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          {!c.active
                            ? 'Inactivo'
                            : expired
                              ? 'Expirado'
                              : notStarted
                                ? 'Aún no inicia'
                                : 'Agotado'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/cupones/${c._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                      >
                        <Icon name="edit" className="w-3.5 h-3.5" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    No hay cupones aún.{' '}
                    <Link
                      href="/admin/cupones/nuevo"
                      className="text-brand-700 font-semibold hover:underline"
                    >
                      Crea el primero
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
