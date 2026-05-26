// GET /api/products/tags — devuelve todas las etiquetas únicas usadas en productos activos.
// Se usa para el autocomplete del campo de familia en el formulario de admin.
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await dbConnect()
    const tags = await Product.distinct('tags', {
      active: true,
      deleted: { $ne: true },
    })
    // Filtrar vacíos y ordenar alfabéticamente
    const clean = tags
      .filter((t) => typeof t === 'string' && t.trim().length > 0)
      .sort((a, b) => a.localeCompare(b, 'es'))
    return NextResponse.json({ tags: clean })
  } catch {
    return NextResponse.json({ tags: [] })
  }
}
