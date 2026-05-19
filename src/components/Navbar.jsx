// ============================================================
// Navbar con categorías dinámicas desde la DB.
// Server component - consulta Mongoose directo.
// ============================================================
import Link from 'next/link'
import SearchAutocomplete from './SearchAutocomplete'
import CartButton from './CartButton'
import AccountNavLink from './AccountNavLink'
import MobileMenu from './MobileMenu'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'

async function fetchCategories() {
  try {
    await dbConnect()
    const cats = await Category.find({ active: true })
      .sort({ order: 1, name: 1 })
      .select('name slug')
      .lean()
    return JSON.parse(JSON.stringify(cats))
  } catch {
    return []
  }
}

export default async function Navbar() {
  const categories = await fetchCategories()

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-20 md:h-24 gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 py-2" aria-label="CRISTASUR inicio">
            <img
              src="/logo.png"
              alt="CRISTASUR Mérida"
              className="h-16 md:h-20 w-auto object-contain"
            />
            <span className="sr-only">CRISTASUR</span>
          </Link>

          <div className="flex-1 max-w-xl hidden md:block">
            <SearchAutocomplete />
          </div>

          <nav className="flex items-center gap-1">
            <Link
              href="/productos"
              className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-700 rounded-lg"
            >
              Catálogo
            </Link>
            <Link
              href="/blog"
              className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-700 rounded-lg"
            >
              Blog
            </Link>
            <Link
              href="/contacto"
              className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-700 rounded-lg"
            >
              Contacto
            </Link>
            <CartButton />
            <AccountNavLink />
            {/* Hamburguesa — solo en móvil */}
            <MobileMenu categories={categories} />
          </nav>
        </div>

        {/* Search bar en mobile */}
        <div className="pb-3 md:hidden">
          <SearchAutocomplete />
        </div>

        {/* Chips de categoría */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 py-3 overflow-x-auto scroll-chip border-t border-slate-100">
            <Link
              href="/productos"
              className="whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-800"
            >
              Todos los productos
            </Link>
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/categoria/${c.slug}`}
                className="whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-800"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
