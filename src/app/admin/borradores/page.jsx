// ============================================================
// /admin/borradores — Lista de productos en estado "draft".
// Permite buscar, paginar, publicar individualmente o en masa.
// ============================================================
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Icon from '@/components/Icon'
import PublishButton from './PublishButton'
import PublishAllButton from './PublishAllButton'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

async function loadDrafts(q, page) {
  await dbConnect()
  const filter = { status: 'draft', deleted: { $ne: true } }
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { sku: { $regex: safe, $options: 'i' } },
    ]
  }
  const skip = (page - 1) * PAGE_SIZE
  const [drafts, total] = await Promise.all([
    Product.find(filter)
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    Product.countDocuments(filter),
  ])
  return { drafts: JSON.parse(JSON.stringify(drafts)), total }
}

export default async function BorradoresPage({ searchParams }) {
  const q = (searchParams?.q || '').trim()
  const page = Math.max(1, Number(searchParams?.page) || 1)
  const { drafts, total } = await loadDrafts(q, page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const buildHref = (p) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (p > 1) params.set('page', p)
    const qs = params.toString()
    return `/admin/borradores${qs ? '?' + qs : ''}`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Borradores</h1>
          <p className="text-slate-500">
            {total} {total === 1 ? 'producto' : 'productos'} en borrador.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/productos/import"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
          >
            <Icon name="upload" className="w-4 h-4" />
            Importar CSV
          </Link>
          <PublishAllButton q={q} total={total} />
        </div>
      </div>

      {/* Info para importar */}
      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        <strong>¿Cómo importar borradores?</strong> Usa{' '}
        <Link href="/admin/productos/import" className="underline font-semibold">
          Importar CSV
        </Link>{' '}
        con modo <em>Solo crear</em>. Los productos con <code className="bg-amber-100 px-1 rounded">status=draft</code>{' '}
        en el CSV se guardarán como borradores y no serán visibles en la tienda hasta que los publiques aquí.
        SKUs ya existentes se omiten automáticamente.
      </div>

      {/* Búsqueda */}
      <div className="mb-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o SKU…"
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold"
          >
            Buscar
          </button>
          {q && (
            <a
              href="/admin/borradores"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium"
            >
              Limpiar
            </a>
          )}
        </form>
        {q && (
          <p className="mt-2 text-xs text-slate-500">
            {total} resultado{total !== 1 ? 's' : ''} para <strong>"{q}"</strong>
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        {drafts.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            {q
              ? 'No hay borradores con esa búsqueda.'
              : '¡No hay borradores! Importa un CSV con modo "Solo crear" para empezar.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">
                  Producto
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                  Categorías
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">
                  Precio
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {drafts.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  {/* Nombre / SKU / imagen */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 grid place-items-center flex-shrink-0">
                          <Icon name="box" className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate max-w-[260px] leading-tight">
                          {p.name}
                        </div>
                        {p.sku && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {p.sku}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Categorías */}
                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                    {(p.categories || []).map((c) => c.name).join(', ') || '—'}
                  </td>

                  {/* Precio */}
                  <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatPrice(p.price)}
                    {p.wholesalePrice && (
                      <div className="text-[11px] text-amber-700 font-normal">
                        May: {formatPrice(p.wholesalePrice)}
                      </div>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/productos/${p._id}`}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                      >
                        Editar
                      </Link>
                      <PublishButton productId={p._id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Página {page} de {totalPages} · {total} borradores en total
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref(page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref(page + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
