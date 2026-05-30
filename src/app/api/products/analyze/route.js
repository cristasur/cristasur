// ============================================================
// GET /api/products/analyze
// Endpoint de diagnóstico para analizar la base de datos de producción.
// Solo accesible por administradores.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()

    // 1. Total general
    const total = await Product.countDocuments({ deleted: { $ne: true } })

    // 2. Productos con imagen principal
    const withImage = await Product.find({
      deleted: { $ne: true },
      image: { $exists: true, $ne: null, $regex: /\S/ }
    }).select('name status active sku image').lean()

    // 3. Buscar duplicados
    const skuCounts = {}
    const nameCounts = {}
    for (const p of withImage) {
      if (p.sku) skuCounts[p.sku] = (skuCounts[p.sku] || 0) + 1
      nameCounts[p.name] = (nameCounts[p.name] || 0) + 1
    }

    const dupSkus = Object.entries(skuCounts)
      .filter(([_, count]) => count > 1)
      .map(([sku, count]) => ({ sku, count }))

    const dupNames = Object.entries(nameCounts)
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({ name, count }))

    // 4. Qué productos están actualmente visibles al público
    const now = new Date()
    const publicMatch = {
      active: true,
      deleted: { $ne: true },
      $and: [
        { $or: [{ status: { $exists: false } }, { status: 'published' }] },
        { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
      ],
    }
    const publicProds = await Product.find(publicMatch).select('name price status active image').lean()

    // 5. Detalles de productos con imagen
    const productsDetails = withImage.map(p => ({
      id: String(p._id),
      name: p.name,
      sku: p.sku || 'SIN SKU',
      status: p.status,
      active: p.active,
      hasImage: !!p.image
    }))

    return NextResponse.json({
      ok: true,
      summary: {
        totalProductsNotDeleted: total,
        totalWithImage: withImage.length,
        totalVisiblePublicly: publicProds.length,
      },
      duplicates: {
        dupSkus,
        dupNames,
      },
      publicProductsList: publicProds.map(p => ({ id: String(p._id), name: p.name, status: p.status, active: p.active })),
      productsWithImageList: productsDetails
    })
  } catch (err) {
    console.error('Error en GET /api/products/analyze:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
