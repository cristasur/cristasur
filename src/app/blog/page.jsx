// ============================================================
// /blog  – Lista de artículos publicados (Server Component)
// ============================================================
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog — Consejos para tu hogar y negocio | CRISTASUR',
  description:
    'Guías y artículos sobre plásticos, cristalería y artículos para el hogar y negocio. Aprende cómo elegir los mejores productos para tu restaurante, negocio o casa.',
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

async function fetchPosts() {
  try {
    await dbConnect()
    const posts = await Post.find({ published: true })
      .sort({ publishedAt: -1 })
      .select('title slug excerpt coverImage author publishedAt tags')
      .lean()
    return JSON.parse(JSON.stringify(posts))
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await fetchPosts()

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2">
          Blog CRISTASUR — Consejos y guías
        </h1>
        <p className="text-slate-500 text-lg">
          Artículos sobre plásticos, cristalería y todo lo que necesitas para tu hogar o negocio.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 text-slate-400 text-lg">
          Próximamente publicaremos artículos y guías.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post._id}
              className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex flex-col"
            >
              {post.coverImage && (
                <Link href={`/blog/${post.slug}`}>
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                  />
                </Link>
              )}
              <div className="p-5 flex flex-col flex-1">
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="text-lg font-bold text-slate-900 leading-snug mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-brand-700">
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-4">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{formatDate(post.publishedAt)}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-semibold text-brand-700 hover:text-brand-900"
                  >
                    Leer más →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
