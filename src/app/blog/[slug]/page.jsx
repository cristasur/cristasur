// ============================================================
// /blog/[slug]  – Artículo individual (Server Component)
// ============================================================
import Link from 'next/link'
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'

export const dynamic = 'force-dynamic'

async function fetchPost(slug) {
  try {
    await dbConnect()
    const post = await Post.findOne({ slug, published: true }).lean()
    return post ? JSON.parse(JSON.stringify(post)) : null
  } catch {
    return null
  }
}

async function fetchRelated(currentId) {
  try {
    await dbConnect()
    const posts = await Post.find({ published: true, _id: { $ne: currentId } })
      .sort({ publishedAt: -1 })
      .limit(3)
      .select('title slug excerpt coverImage publishedAt')
      .lean()
    return JSON.parse(JSON.stringify(posts))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }) {
  const post = await fetchPost(params.slug)
  if (!post) return {}
  return {
    title: post.seoTitle || post.title + ' | CRISTASUR',
    description: post.seoDescription || post.excerpt || '',
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || '',
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPostPage({ params }) {
  const post = await fetchPost(params.slug)
  if (!post) return notFound()

  // Incrementar contador de vistas (fire & forget en servidor)
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    fetch(`${base}/api/posts/${post._id}?action=view`, { method: 'PATCH' }).catch(() => {})
  } catch {}

  const related = await fetchRelated(post._id)

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-700">Inicio</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-brand-700">Blog</Link>
        <span>/</span>
        <span className="text-slate-700 truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Cover image */}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title + meta */}
      <h1 className="text-3xl font-black text-slate-900 leading-tight mb-3">{post.title}</h1>
      <div className="flex items-center gap-3 text-sm text-slate-400 mb-8">
        <span>{post.author}</span>
        {post.publishedAt && (
          <>
            <span>·</span>
            <span>{formatDate(post.publishedAt)}</span>
          </>
        )}
      </div>

      {/* Content */}
      <div
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Back link */}
      <div className="mt-12 pt-6 border-t border-slate-100">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-brand-700 font-semibold hover:text-brand-900"
        >
          ← Volver al blog
        </Link>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Artículos relacionados</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <article
                key={r._id}
                className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-card flex flex-col"
              >
                {r.coverImage && (
                  <img
                    src={r.coverImage}
                    alt={r.title}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2">
                    <Link href={`/blog/${r.slug}`} className="hover:text-brand-700">
                      {r.title}
                    </Link>
                  </h3>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="text-xs font-semibold text-brand-700 hover:text-brand-900 mt-auto"
                  >
                    Leer →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
