// Layout del panel admin
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import Icon from '@/components/Icon'
import { getCurrentUser } from '@/lib/auth'
import AdminMobileNav from './AdminMobileNav'

export const metadata = {
  title: 'Admin · CRISTASUR',
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

const links = [
  { href: '/admin',                     label: 'Dashboard',     icon: 'chart' },
  { href: '/admin/analytics',           label: 'Analytics',     icon: 'chart' },
  { href: '/admin/productos',           label: 'Productos',     icon: 'box' },
  { href: '/admin/productos/bulk',      label: 'Edición masiva', icon: 'edit' },
  { href: '/admin/productos/papelera',  label: 'Papelera',      icon: 'trash' },
  { href: '/admin/productos/import',    label: 'Importar CSV',  icon: 'upload' },
  { href: '/admin/etiquetas',           label: 'Etiquetas PDF', icon: 'tag' },
  { href: '/admin/categorias',          label: 'Categorías',    icon: 'tag' },
  { href: '/admin/cupones',             label: 'Cupones',       icon: 'ticket' },
  { href: '/admin/banners',             label: 'Banners',       icon: 'sparkle' },
  { href: '/admin/marcas',              label: 'Marcas',        icon: 'tag' },
  { href: '/admin/materiales',          label: 'Materiales',    icon: 'tag' },
  { href: '/admin/blog',                label: 'Blog',          icon: 'edit' },
  { href: '/admin/resenas',             label: 'Reseñas',       icon: 'star' },
  { href: '/admin/pedidos',             label: 'Pedidos',       icon: 'cart' },
  { href: '/admin/usuarios',            label: 'Usuarios',      icon: 'user', adminOnly: true },
  { href: '/admin/historial',           label: 'Historial',     icon: 'edit', adminOnly: true },
]

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser()
  const visibleLinks = links.filter((l) => !l.adminOnly || user?.role === 'admin')

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navegación hamburger — solo móvil */}
      <AdminMobileNav links={visibleLinks} user={user} />

      <div className="max-w-7xl mx-auto px-4 py-8 lg:grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar — solo desktop (lg+) */}
        <aside className="hidden lg:block lg:sticky lg:top-8 h-fit bg-white rounded-2xl shadow-card border border-slate-100 p-4">
          <div className="px-2 pb-4 mb-2 border-b border-slate-100">
            <img
              src="/logo.png"
              alt="CRISTASUR Mérida"
              className="h-20 w-auto object-contain mx-auto"
            />
            <div className="text-xs text-slate-500 mt-2 text-center">
              Panel de administración
            </div>
            {user?.email && (
              <div className="text-[11px] text-slate-400 mt-1 text-center truncate">
                {user.email} · <span className="uppercase">{user.role || 'admin'}</span>
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {visibleLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-brand-50 text-slate-700 hover:text-brand-800"
              >
                <Icon name={l.icon} className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 mt-4 border-t border-slate-100 pt-3"
            >
              <Icon name="home" className="w-4 h-4" />
              Ver tienda
            </Link>
            <LogoutButton />
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="min-w-0 overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}
