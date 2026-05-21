// ============================================================
// /admin/historial — Auditoría de cambios (solo admin supremo)
// Muestra editHistory de productos: creaciones, ediciones, eliminaciones.
// ============================================================
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Historial · CRISTASUR Admin' }

const ACTION_STYLES = {
  create:  { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✦ Creado' },
  edit:    { bg: 'bg-blue-100',    text: 'text-blue-800',    label: '✎ Editado' },
  delete:  { bg: 'bg-rose-100',    text: 'text-rose-700',    label: '✕ Eliminado' },
  restore: { bg: 'bg-amber-100',   text: 'text-amber-800',   label: '↩ Restaurado' },
  status:  { bg: 'bg-purple-100',  text: 'text-purple-800',  label: '◎ Estado' },
}

function ActionBadge({ action }) {
  const style = ACTION_STYLES[action] || ACTION_STYLES.edit
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

async function loadHistory() {
  await dbConnect()

  // Traer los 500 eventos más recientes de todos los productos (incluyendo eliminados)
  const products = await Product.find({})
    .select('name sku deleted editHistory')
    .lean()

  // Aplanar todos los eventos con referencia al producto
  const events = []
  for (const p of products) {
    for (const e of (p.editHistory || [])) {
      events.push({
        productId: String(p._id),
        productName: p.name,
        productSku: p.sku || '',
        deleted: Boolean(p.deleted),
        action: e.action || 'edit',
        userEmail: e.userEmail || '—',
        userId: e.userId || '',
        changes: e.changes || '',
        at: e.createdAt || e.at || null,
      })
    }
  }

  // Ordenar por fecha descendente y tomar los 300 más recientes
  events.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0
    const tb = b.at ? new Date(b.at).getTime() : 0
    return tb - ta
  })

  return events.slice(0, 300)
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function HistorialPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') notFound()

  const events = await loadHistory()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Historial de cambios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Registro completo de quién hizo qué y cuándo. Solo visible para el admin supremo.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Acción</th>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Cuenta</th>
                <th className="text-left px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {events.map((e, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {fmtDate(e.at)}
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={e.action} />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/productos/${e.productId}`}
                      className="font-medium text-slate-800 hover:text-brand-700 line-clamp-1"
                    >
                      {e.productName}
                    </a>
                    {e.productSku && (
                      <div className="text-[10px] text-slate-400">SKU: {e.productSku}</div>
                    )}
                    {e.deleted && (
                      <span className="text-[10px] text-rose-500 font-semibold">en papelera</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700 font-medium">{e.userEmail}</div>
                    {e.userId && (
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                        {e.userId}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs max-w-xs">
                    <span className="line-clamp-2">{e.changes || '—'}</span>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-slate-400">
                    Aún no hay eventos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {events.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-right">
            Mostrando los {events.length} cambios más recientes
          </div>
        )}
      </div>
    </div>
  )
}
