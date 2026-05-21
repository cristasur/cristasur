// ============================================================
// /admin/historial — Auditoría completa (solo admin supremo)
// Muestra editHistory de todos los productos con diff estructurado,
// filtros por acción/editor y detalle campo por campo sin truncar.
// ============================================================
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'
import HistorialClient from './HistorialClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Historial · CRISTASUR Admin' }

async function loadHistory() {
  await dbConnect()
  const products = await Product.find({})
    .select('name sku deleted editHistory')
    .lean()

  const events = []
  for (const p of products) {
    for (const e of (p.editHistory || [])) {
      events.push({
        productId: String(p._id),
        productName: p.name || '—',
        productSku: p.sku || '',
        deleted: Boolean(p.deleted),
        action: e.action || 'update',
        userEmail: e.userEmail || '—',
        userId: String(e.userId || ''),
        changes: e.changes || '',
        diff: Array.isArray(e.diff) ? e.diff : [],
        source: e.source || 'manual',
        at: e.at ? new Date(e.at).toISOString() : null,
      })
    }
  }

  events.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0
    const tb = b.at ? new Date(b.at).getTime() : 0
    return tb - ta
  })

  return events.slice(0, 500)
}

export default async function HistorialPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') notFound()

  const events = await loadHistory()

  // Extraer lista única de editores para el filtro
  const editors = [...new Set(events.map((e) => e.userEmail).filter(Boolean))].sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Historial de cambios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Registro detallado de cada acción. Filtrable por editor y tipo. Solo visible para el admin supremo.
        </p>
      </div>
      <HistorialClient events={events} editors={editors} />
    </div>
  )
}
