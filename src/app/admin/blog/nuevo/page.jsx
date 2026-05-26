// ============================================================
// /admin/blog/nuevo  – Crear nuevo artículo
// ============================================================
import Link from 'next/link'
import PostForm from '../PostForm'

export const metadata = { title: 'Nuevo artículo · Admin CRISTASUR' }

export default function NuevoPostPage() {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-black text-slate-900">Nuevo artículo</h1>
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          ← Volver
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <PostForm />
      </div>
    </div>
  )
}
