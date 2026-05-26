// ============================================================
// POST /api/products/duplicate
// Body: { id: "<productId>" }
// Copia un producto existente (sin _id, sin SKU, sin deleted,
// sin métricas). Agrega " (copia)" al nombre, lo marca como
// inactivo para que el admin lo revise antes de publicar, y
// registra una entrada 'duplicate' en el historial.
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || '').trim()
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await dbConnect()
    const original = await Product.findById(id).lean()
    if (!original) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const user = await getCurrentUser()

    // Limpiamos campos que no deben copiarse
    const {
      _id, __v, createdAt, updatedAt,
      sku, deleted, deletedAt,
      viewsCount, whatsappClicks, salesCount,
      coOrders, editHistory, createdBy, updatedBy,
      ...rest
    } = original

    const copy = await Product.create({
      ...rest,
      name: `${rest.name} (copia)`,
      active: false, // requiere revisión
      sku: undefined, // el admin asignará uno nuevo si quiere
      deleted: false,
      deletedAt: null,
      viewsCount: 0,
      whatsappClicks: 0,
      salesCount: 0,
      createdBy: user?.sub,
      updatedBy: user?.sub,
      editHistory: [
        {
          userId: user?.sub,
          userEmail: user?.email,
          action: 'duplicate',
          changes: `Duplicado desde ${id}`,
        },
      ],
    })

    await copy.populate('categories', 'name slug icon')
    return NextResponse.json({ product: copy }, { status: 201 })
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'SKU duplicado en la copia' }, { status: 409 })
    }
    console.error('POST /api/products/duplicate', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
