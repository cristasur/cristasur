// ============================================================
// POST /api/upload/video
// Permiso para subir un video directo del navegador a Vercel Blob
// (los videos pesan más de lo que aguanta una función de Vercel,
// así que no pasan por aquí: esta ruta solo firma el permiso).
// Solo admin/editor, solo mp4/mov/webm, máx 150 MB.
// ============================================================
import { NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user || !['admin', 'editor'].includes(user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^portada\/videos\/[\w.-]+$/.test(pathname)) throw new Error('Ruta no permitida')
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
          maximumSizeInBytes: 150 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e.message || 'No se pudo subir el video' }, { status: 400 })
  }
}
