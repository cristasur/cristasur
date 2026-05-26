// ============================================================
// /admin/blog/[id]  – Editar artículo existente (Server Component)
// ============================================================
import Link from 'next/link'
import { notFound } from 'next/navigation'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import PostForm from '../PostForm'

export const dynamic = 'force-dynamic'

async function loadPost(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  await dbConnect()
  const post = await Post.findById(id).lean()
  return post ? JSON.parse(JSON.stringify(post)) : null
}

export async function generateMetadata({ params }) {
  const post = await loadPost(params.id)
  return { title: post ? `Editar: ${post.title} · Admin` : 'Editar artículo · Admin' }
}

export default async function EditarPostPage({ params }) {
  const post = await loadPost(params.id)
  if (!post) return notFound()

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-black text-slate-900 truncate max-w-lg">
          Editar: {post.title}
        </h1>
        <div className="flex items-center gap-2">
          {post.published && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="px-3 py-2 text-sm font-medium rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700"
            >
              Ver artículo →
            </Link>
          )}
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            ← Volver
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <PostForm initial={post} />
      </div>
    </div>
  )
}
