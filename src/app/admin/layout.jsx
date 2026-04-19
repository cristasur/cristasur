// Layout del panel admin
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import Icon from '@/components/Icon'

export const metadata = { title: 'Admin · CRISTASUR', robots: { index: false, follow: false } }

const links = [
  { href: '/admin',            label: 'Dashboard',  icon: 'chart' },
  { href: '/admin/productos',  label: 'Productos',  icon: 'box' },
  { href: '/admin/categorias', label: 'Categorías', icon: 'tag' },
]

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="lg:sticky lg:top-8 h-fit bg-white rounded-2xl shadow-card border border-slate-100 p-4">
          <div className="px-2 pb-4 mb-2 border-b border-slate-100">
            <img
              src="/logo.png"
              alt="CRISTASUR Mérida"
              className="h-20 w-auto object-contain mx-auto"
            />
            <div className="text-xs text-slate-500 mt-2">Panel de administración</div>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {links.map((l) => (
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
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
