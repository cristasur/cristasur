// ============================================================
// GET    /api/posts/:id  – detalle
// PUT    /api/posts/:id  – editar (admin/editor)
// DELETE /api/posts/:id  – soft delete: published=false (admin)
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Post from '@/lib/models/Post'
import { getCurrentUser } from '@/lib/auth'

const ALLOWED_IFRAME_HOSTS = [
  'www.facebook.com', 'facebook.com',
  'www.youtube.com', 'youtube.com', 'youtu.be',
  'www.instagram.com', 'instagram.com',
  'www.tiktok.com', 'tiktok.com',
  'www.google.com', 'maps.google.com',
  'player.vimeo.com', 'vimeo.com',
]

function sanitizeContent(html) {
  let clean = (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')

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

export async function GET(_request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    const post = await Post.findById(params.id).lean()
    if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ post: JSON.parse(JSON.stringify(post)) })
  } catch (err) {
    console.error('GET /api/posts/[id]', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))

    await dbConnect()

    // Si se publica y no tenía publishedAt, asignarlo
    const existing = await Post.findById(params.id).lean()
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    if (body.published && !existing.publishedAt && !body.publishedAt) {
      body.publishedAt = new Date()
    }

    if (body.content) body.content = sanitizeContent(body.content)

    const post = await Post.findByIdAndUpdate(params.id, body, { new: true, runValidators: true }).lean()
    return NextResponse.json({ post: JSON.parse(JSON.stringify(post)) })
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 })
    }
    console.error('PUT /api/posts/[id]', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    await dbConnect()
    if (action === 'view') {
      await Post.findByIdAndUpdate(params.id, { $inc: { viewsCount: 1 } })
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (err) {
    console.error('PATCH /api/posts/[id]', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await dbConnect()
    const permanent = new URL(request.url).searchParams.get('permanent') === '1'

    if (permanent) {
      // Hard delete: eliminar definitivamente
      const post = await Post.findByIdAndDelete(params.id).lean()
      if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
      return NextResponse.json({ ok: true, deleted: true })
    } else {
      // Soft delete: desactivar publicación
      const post = await Post.findByIdAndUpdate(params.id, { published: false }, { new: true }).lean()
      if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
      return NextResponse.json({ ok: true, post: JSON.parse(JSON.stringify(post)) })
    }
  } catch (err) {
    console.error('DELETE /api/posts/[id]', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
