// Papelera de productos: lista los soft-deleted y permite
// restaurarlos o eliminarlos definitivamente.
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Icon from '@/components/Icon'
import RestoreButton from './RestoreButton'
import DeleteProductButton from '../DeleteProductButton'

export const dynamic = 'force-dynamic'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function loadTrash() {
  await dbConnect()
  const products = await Product.find({ deleted: true })
    .populate('categories', 'name')
    .sort({ deletedAt: -1 })
    .limit(500)
    .lean()
  return JSON.parse(JSON.stringify(products))
}

export default async function PapeleraPage() {
  const products = await loadTrash()

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Papelera</h1>
          <p className="text-slate-500">
            {products.length} producto(s) en papelera. Puedes restaurarlos u
            eliminarlos definitivamente.
          </p>
        </div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          <Icon name="arrow" className="w-4 h-4 rotate-180" />
          Volver a productos
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="p-3">Producto</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Eliminado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 grid place-items-center text-slate-300">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover grayscale" />
                        ) : (
                          <Icon name="box" className="w-6 h-6" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {p.categories?.length > 0
                        ? p.categories.map((c) => (
                            <span
                              key={c._id}
                              className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
                            >
                              {c.name}
                            </span>
                          ))
                        : '—'}
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{formatPrice(p.price)}</td>
                  <td className="p-3 text-xs text-slate-500">{formatDate(p.deletedAt)}</td>
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <RestoreButton id={p._id} />
                      <DeleteProductButton id={p._id} hard label="Borrar definitivo" />
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    La papelera está vacía.
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
