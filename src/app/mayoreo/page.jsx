// ============================================================
// /mayoreo — Vista exclusiva con precios mayoreo VIP.
// Sólo accesible para clientes con wholesaleAccess = true.
// El middleware ya bloquea acceso no autorizado.
// Para cada producto con wholesalePrice definido, mostramos
// ese precio como precio único (sin cantidad mínima).
// Para los demás, mostramos precio normal con un badge.
// ============================================================
import Link from 'next/link'
import { redirect } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import MayoreoGrid from './MayoreoGrid'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Precios mayoreo · CRISTASUR',
  robots: { index: false, follow: false },
}

async function loadData() {
  const session = await getCurrentUser()
  if (!session) return { unauthorized: true }
  await dbConnect()
  const user = await User.findById(session.sub).select('wholesaleAccess name').lean()
  if (!user) return { unauthorized: true }
  if (!user.wholesaleAccess && session.role !== 'admin') {
    return { forbidden: true }
  }
  const now = new Date()
  const [products, categories] = await Promise.all([
    Product.find({
      active: true,
      deleted: { $ne: true },
      $and: [
        { $or: [{ status: { $exists: false } }, { status: 'published' }] },
        { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
      ],
    })
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .sort({ featured: -1, salesCount: -1, viewsCount: -1, createdAt: -1 })
      .limit(500)
      .lean(),
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
  ])
  return {
    user: { name: user.name },
    products: JSON.parse(JSON.stringify(products)),
    categories: JSON.parse(JSON.stringify(categories)),
  }
}

export default async function MayoreoPage() {
  const data = await loadData()
  if (data?.unauthorized) redirect('/cuenta/login?next=/mayoreo')
  if (data?.forbidden) redirect('/cuenta?no-mayoreo=1')

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-8 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold opacity-90">
          ★ Acceso VIP
        </div>
        <h1 className="text-3xl md:text-4xl font-black mt-1">Precios mayoreo</h1>
        <p className="mt-2 opacity-95 max-w-2xl">
          Catálogo exclusivo. Cada producto que tiene precio mayoreo se muestra ya
          al precio especial — <b>sin cantidad mínima</b>. Pide lo que necesites
          por WhatsApp; los precios normales no aparecen aquí.
        </p>
        <p className="mt-3 text-sm opacity-90">
          Hola {data.user?.name?.split(' ')[0] || 'cliente'}, gracias por confiar en
          CRISTASUR. Si querés solicitar un volumen aún mayor, escríbenos.
        </p>
      </header>

      <MayoreoGrid products={data.products} categories={data.categories} />

      <p className="mt-10 text-xs text-slate-500 text-center">
        Esta página es exclusiva para clientes mayoristas autorizados. Por favor no
        compartas precios fuera del equipo de tu negocio.
      </p>
    </div>
  )
}
