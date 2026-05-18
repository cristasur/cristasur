// ============================================================
// GET /api/search/suggest?q=<texto>
// Autocompletar de búsqueda: devuelve hasta 8 productos y 4
// categorías que coinciden con el texto (case-insensitive).
// Público. Optimizado con .select() para no mandar campos
// pesados.
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    if (q.length < 2) {
      return NextResponse.json({ products: [], categories: [] })
    }

    await dbConnect()
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(safe, 'i')

    const [products, categories] = await Promise.all([
      Product.find({
        deleted: { $ne: true },
        active: true,
        $or: [{ name: rx }, { description: rx }, { sku: rx }],
      })
        .select('name slug price image stock')
        .sort({ featured: -1, salesCount: -1, whatsappClicks: -1 })
        .limit(8)
        .lean(),
      Category.find({ active: true, name: rx })
        .select('name slug icon')
        .sort({ order: 1 })
        .limit(4)
        .lean(),
    ])

    return NextResponse.json({ products, categories })
  } catch (err) {
    console.error('GET /api/search/suggest', err)
    return NextResponse.json({ products: [], categories: [] })
  }
}
