// ============================================================
// POST /api/admin/borradores?action=publish-all
// Publica en masa todos los borradores (o los que coincidan con q).
// Requiere rol admin o editor.
// ============================================================
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'publish-all') {
      const body = await request.json().catch(() => ({}))
      const q = String(body?.q || '').trim()

      await dbConnect()

      const filter = { status: 'draft', deleted: { $ne: true } }
      if (q) {
        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        filter.$or = [
          { name: { $regex: safe, $options: 'i' } },
          { sku: { $regex: safe, $options: 'i' } },
        ]
      }

      const result = await Product.updateMany(filter, {
        $set: {
          status: 'published',
          active: true,
          updatedBy: user?.sub,
        },
      })

      try {
        revalidatePath('/')
        revalidatePath('/productos')
      } catch {}

      return NextResponse.json({ ok: true, modifiedCount: result.modifiedCount })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/admin/borradores', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
