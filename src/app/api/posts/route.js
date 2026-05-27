// ============================================================
// GET  /api/posts   – posts publicados (o todos si ?all=1 + admin)
// POST /api/posts   – crear post (admin/editor)
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import { getCurrentUser } from '@/lib/auth'

// Dominios permitidos en iframes (embeds de redes sociales y video)
const ALLOWED_IFRAME_HOSTS = [
  'www.facebook.com', 'facebook.com',
  'www.youtube.com', 'youtube.com', 'youtu.be',
  'www.instagram.com', 'instagram.com',
  'www.tiktok.com', 'tiktok.com',
  'www.google.com', 'maps.google.com',
  'player.vimeo.com', 'vimeo.com',
]

function sanitizeContent(html) {
  // Eliminar scripts y event handlers — siempre
  let clean = (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')

  // Iframes: permitir solo dominios de confianza; eliminar el resto
  clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, (match) => {
    const srcMatch = match.match(/src=["']([^"']+)["']/i)
    if (!srcMatch) return ''
    try {
      const host = new URL(srcMatch[1]).hostname
      if (ALLOWED_IFRAME_HOSTS.some((allowed) => host === allowed || host.endsWith('.' + allowed))) {
        return match
      }
    } catch {}
    return ''
  })

  return clean
}

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const all = url.searchParams.get('all') === '1'

    const filter = all ? {} : { published: true }
    const posts = await Post.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean()

    return NextResponse.json({ posts: JSON.parse(JSON.stringify(posts)) })
  } catch (err) {
    console.error('GET /api/posts', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Título y slug son requeridos' }, { status: 400 })
    }

    await dbConnect()

    // Si se publica ahora y no tiene publishedAt, asignarlo
    if (body.published && !body.publishedAt) {
      body.publishedAt = new Date()
    }

    if (body.content) body.content = sanitizeContent(body.content)

    const post = await Post.create(body)
    return NextResponse.json({ post: JSON.parse(JSON.stringify(post)) }, { status: 201 })
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 })
    }
    console.error('POST /api/posts', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
