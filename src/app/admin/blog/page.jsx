// ============================================================
// /admin/blog  – Lista de artículos del blog (Client Component)
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/posts?all=1')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      setError('Error al cargar artículos')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnpublish(id) {
    if (!confirm('¿Despublicar este artículo?')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    loadPosts()
  }

  async function handleDelete(id, title) {
    if (!confirm(`¿Eliminar "${title}" permanentemente? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/posts/${id}?permanent=1`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Error al eliminar')
      return
    }
    loadPosts()
  }

  useEffect(() => { loadPosts() }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Blog</h1>
          <p className="text-slate-500 text-sm">
            {posts.length} artículo(s) en total.
          </p>
        </div>
        <Link
          href="/admin/blog/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm"
        >
          + Nuevo artículo
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Cargando...</div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No hay artículos aún.{' '}
            <Link href="/admin/blog/nuevo" className="text-brand-700 font-semibold">
              Crear el primero
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="p-3">Título</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Publicado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">
                      <div>{post.title}</div>
                      <div className="text-xs text-slate-400 font-mono">/blog/{post.slug}</div>
                    </td>
                    <td className="p-3">
                      {post.published ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                          Borrador
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{formatDate(post.publishedAt)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/blog/${post._id}`}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          Editar
                        </Link>
                        {post.published && (
                          <button
                            onClick={() => handleUnpublish(post._id)}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700"
                          >
                            Despublicar
                          </button>
                        )}
                        {post.published && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700"
                          >
                            Ver
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(post._id, post.title)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
