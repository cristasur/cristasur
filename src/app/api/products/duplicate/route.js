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
    // Solo quien administra el catálogo puede crear copias.
    const quien = await getCurrentUser()
    if (!quien || !['admin', 'editor'].includes(quien.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
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

    // Variantes de la copia: solo los campos del modelo, sin SKU (son
    // de la original) y en formato simétrico. Si la original es del
    // formato viejo (color "Azul" arriba + variante "Rojo"), el color de
    // arriba se vuelve la primera variante en vez de copiarse mal.
    const limpias = (rest.variants || []).map((v) => ({
      label: v.label || 'Color', value: v.value || '', barcode: '',
      available: v.available !== false, stock: v.stock ?? null,
      image: v.image || '', images: Array.isArray(v.images) ? v.images : [],
    })).filter((v) => v.value)
    const base = String(rest.color || '').trim()
    const hayColor = limpias.some((v) => /color/i.test(v.label))
    if (base && hayColor && !limpias.some((v) => v.value.trim().toLowerCase() === base.toLowerCase())) {
      const fotos = [rest.image, ...(rest.gallery || [])].filter(Boolean).slice(0, 10)
      limpias.unshift({ label: 'Color', value: base, barcode: '', available: true, stock: null, image: fotos[0] || '', images: fotos })
    }

    const copy = await Product.create({
      ...rest,
      variants: limpias,
      color: hayColor ? '' : rest.color,
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
