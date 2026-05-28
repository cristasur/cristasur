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
      <div className="mb-10 border-b border-slate-100 pb-8">
        <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">Blog</p>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-3">
          Consejos, guías y novedades
        </h1>
        <p className="text-slate-500 max-w-xl">
          Todo lo que necesitas saber sobre plásticos, cristalería y artículos para tu hogar o negocio.
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {posts.map((post) => {
            const embed = extractEmbed(post.content)
            const plat = embed ? PLATFORM_META[embed.platform] : null
            const hasCover = Boolean(post.coverImage)
            const hasYtThumb = embed?.platform === 'youtube' && embed.thumb
            const isVideo = post.postType === 'video' || Boolean(embed)
            const imgSrc = hasCover ? post.coverImage : hasYtThumb ? embed.thumb : null

            return (
              <article key={post._id} className="group flex flex-col">

                {/* Imagen */}
                <Link href={`/blog/${post.slug}`} className="block relative overflow-hidden rounded-xl mb-4 bg-slate-100">
                  {imgSrc ? (
                    <>
                      <img
                        src={imgSrc}
                        alt={post.title}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Play overlay para videos */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow group-hover:scale-110 transition-transform duration-200">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-800 ml-0.5">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </>
                  ) : isVideo ? (
                    <div className="w-full h-48 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400 ml-0.5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48" />
                  )}

                  {post.featured && (
                    <span className="absolute top-3 left-3 bg-white/95 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm tracking-widest uppercase">
                      Destacado
                    </span>
                  )}
                </Link>

                {/* Meta superior */}
                <div className="flex items-center gap-2 mb-2">
                  {post.tags?.length > 0 && (
                    <span className="text-[11px] font-bold text-brand-600 uppercase tracking-widest">
                      {post.tags[0]}
                    </span>
                  )}
                  {isVideo && (
                    <>
                      {post.tags?.length > 0 && <span className="text-slate-200 text-xs">·</span>}
                      <span className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">Video</span>
                    </>
                  )}
                </div>

                {/* Título */}
                <h2 className="text-[15px] font-bold text-slate-900 leading-snug mb-2 group-hover:text-brand-700 transition-colors duration-200">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{formatDate(post.publishedAt)}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-semibold text-slate-400 hover:text-brand-700 transition-colors"
                  >
                    {isVideo ? 'Ver →' : 'Leer →'}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
