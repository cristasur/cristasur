// /cuenta — Dashboard del cliente
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LogoutClientButton from './LogoutClientButton'
import Icon from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Mi cuenta · CRISTASUR',
  robots: { index: false, follow: false },
}

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n || 0)
}

async function loadData() {
  const session = await getCurrentUser()
  if (!session) return null
  await dbConnect()
  const [user, orders] = await Promise.all([
    User.findById(session.sub).select('email name role phone wholesaleAccess address cart').lean(),
    Order.find({ customerEmail: session.email })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ])
  return {
    user: JSON.parse(JSON.stringify(user || {})),
    orders: JSON.parse(JSON.stringify(orders || [])),
  }
}

export default async function CuentaPage({ searchParams }) {
  const data = await loadData()
  if (!data?.user) redirect('/cuenta/login')
  const { user, orders } = data
  const showNoMayoreo = searchParams?.['no-mayoreo'] === '1'

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Hola, {user.name || 'cliente'}</h1>
          <p className="text-slate-500 text-sm">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.wholesaleAccess && (
            <Link
              href="/mayoreo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm"
            >
              <Icon name="ticket" className="w-4 h-4" />
              Precios mayoreo VIP
            </Link>
          )}
          <Link
            href="/cuenta/perfil"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm text-sm"
          >
            <Icon name="user" className="w-4 h-4" />
            Editar perfil
          </Link>
          <LogoutClientButton />
        </div>
      </header>

      {showNoMayoreo && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 p-4 text-sm">
          Aún no tienes acceso al catálogo de precios especiales. Si crees que deberías,
          escríbenos por WhatsApp.
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-4">
        <article className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
          <Icon name="cart" className="w-6 h-6 text-brand-600" />
          <h3 className="font-bold text-slate-900 mt-2">Tu carrito</h3>
          <p className="text-slate-500 text-sm">
            {(user.cart || []).length} producto{(user.cart || []).length === 1 ? '' : 's'} guardados.
            Se conservan aunque cierres sesión.
          </p>
          <Link href="/productos" className="mt-3 inline-block text-brand-700 font-semibold text-sm hover:underline">
            Seguir comprando →
          </Link>
        </article>

        <article className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
          <Icon name="box" className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-slate-900 mt-2">Tus pedidos</h3>
          <p className="text-slate-500 text-sm">
            {orders.length} pedido{orders.length === 1 ? '' : 's'} en total.
          </p>
        </article>

        <article className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
          <Icon name="user" className="w-6 h-6 text-slate-700" />
          <h3 className="font-bold text-slate-900 mt-2">Acceso</h3>
          <p className="text-slate-500 text-sm">
            {user.wholesaleAccess
              ? '✅ Tienes acceso a precios mayoreo VIP.'
              : 'Solicita acceso a precios mayoreo por WhatsApp.'}
          </p>
          {!user.wholesaleAccess && (
            <a
              href="https://wa.me/529994731919?text=Hola%20CRISTASUR%2C%20me%20gustar%C3%ADa%20pedir%20acceso%20a%20precios%20mayoreo%20VIP"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-emerald-700 font-semibold text-sm hover:underline"
            >
              Pedir por WhatsApp →
            </a>
          )}
        </article>
      </section>

      <section className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-black text-slate-900">Historial de pedidos</h2>
        </div>
        {orders.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            Aún no tienes pedidos. Cuando termines uno por WhatsApp aparecerá aquí.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-slate-50">
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(o.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-3 text-slate-700 line-clamp-2 max-w-md">
                    {(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')}
                  </td>
                  <td className="p-3 font-bold">{formatMXN(o.total)}</td>
                  <td className="p-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
