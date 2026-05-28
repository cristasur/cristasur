// ============================================================
// /blog  – Lista de artículos/videos publicados
// Soporta filtros: tipo (article/video), orden, búsqueda, destacados
// ============================================================
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import BlogFilters from './BlogFilters'

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

// Extrae thumbnail de YouTube o detecta el tipo de embed
function extractEmbed(content) {
  if (!content) return null
  // YouTube
  const yt = content.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)
  if (yt) return { platform: 'youtube', thumb: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` }
  // Facebook video
  if (/facebook\.com\/plugins\/video/.test(content)) return { platform: 'facebook', thumb: null }
  // TikTok
  if (/tiktok\.com/.test(content)) return { platform: 'tiktok', thumb: null }
  // Vimeo
  const vimeo = content.match(/player\.vimeo\.com\/video\/(\d+)/)
  if (vimeo) return { platform: 'vimeo', thumb: null }
  return null
}

const PLATFORM_META = {
  youtube:  { label: 'YouTube',  bg: 'bg-red-600',  icon: '▶' },
  facebook: { label: 'Facebook', bg: 'bg-blue-700', icon: '▶' },
  tiktok:   { label: 'TikTok',   bg: 'bg-black',    icon: '▶' },
  vimeo:    { label: 'Vimeo',    bg: 'bg-sky-500',  icon: '▶' },
}

async function fetchPosts({ tipo, orden, q }) {
  try {
    await dbConnect()
    const filter = { published: true }
    if (tipo && tipo !== 'todos') filter.postType = tipo
    if (orden === 'destacados') filter.featured = true
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }]
    }
    const sortMap = {
      reciente:    { publishedAt: -1, createdAt: -1 },
      vistos:      { viewsCount: -1, publishedAt: -1 },
      destacados:  { publishedAt: -1, createdAt: -1 },
    }
    const sort = sortMap[orden] || sortMap.reciente
    const posts = await Post.find(filter)
      .sort(sort)
      .select('title slug excerpt coverImage author publishedAt tags postType featured viewsCount content')
      .lean()
    return JSON.parse(JSON.stringify(posts))
  } catch {
    return []
  }
}

export default async function BlogPage({ searchParams }) {
  const tipo   = searchParams?.tipo   || 'todos'
  const orden  = searchParams?.orden  || 'reciente'
  const q      = searchParams?.q      || ''

  const posts = await fetchPosts({ tipo, orden, q })

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 mb-2">
          Blog CRISTASUR — Consejos y guías
        </h1>
        <p className="text-slate-500 text-lg">
          Artículos sobre plásticos, cristalería y todo lo que necesitas para tu hogar o negocio.
        </p>
      </div>

      {/* Filtros (Client Component) */}
      <BlogFilters tipo={tipo} orden={orden} q={q} />

      {posts.length === 0 ? (
        <div className="text-center py-24 text-slate-400 text-lg">
          {q || tipo !== 'todos' || orden === 'destacados'
            ? 'No se encontraron resultados. Prueba otra búsqueda.'
            : 'Próximamente publicaremos artículos y guías.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const embed = extractEmbed(post.content)
            const plat = embed ? PLATFORM_META[embed.platform] : null

            // Thumbnail: coverImage > YouTube thumb > placeholder de plataforma > sin imagen
            const hasCover = Boolean(post.coverImage)
            const hasYtThumb = embed?.platform === 'youtube' && embed.thumb
            const isVideo = post.postType === 'video' || Boolean(embed)

            return (
              <article
                key={post._id}
                className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex flex-col"
              >
                {/* Miniatura */}
                <Link href={`/blog/${post.slug}`} className="block relative">
                  {hasCover ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-44 object-cover"
                      loading="lazy"
                    />
                  ) : hasYtThumb ? (
                    <div className="relative w-full h-44 bg-black overflow-hidden">
                      <img
                        src={embed.thumb}
                        alt={post.title}
                        className="w-full h-full object-cover opacity-90"
                        loading="lazy"
                      />
                      {/* Botón play */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : embed ? (
                    /* Plataforma sin thumbnail — tarjeta de color */
                    <div className={`w-full h-44 flex flex-col items-center justify-center gap-3 ${plat?.bg || 'bg-slate-800'}`}>
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <span className="text-white text-xs font-semibold tracking-wide opacity-80">
                        {plat?.label || 'Video'}
                      </span>
                    </div>
                  ) : null}

                  {/* Badges superpuestos */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {post.featured && (
                      <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                        ⭐ Destacado
                      </span>
                    )}
                    {isVideo && (
                      <span className="bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        ▶ Video
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-5 flex flex-col flex-1">
                  {/* Tags */}
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

                  {/* Título */}
                  <h2 className="text-lg font-bold text-slate-900 leading-snug mb-2">
                    <Link href={`/blog/${post.slug}`} className="hover:text-brand-700">
                      {post.title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{formatDate(post.publishedAt)}</span>
                      {post.viewsCount > 0 && (
                        <span className="text-xs text-slate-300">· {post.viewsCount} vistas</span>
                      )}
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm font-semibold text-brand-700 hover:text-brand-900"
                    >
                      {isVideo ? 'Ver video →' : 'Leer más →'}
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
