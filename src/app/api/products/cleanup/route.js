// ============================================================
// GET /api/products/cleanup
// Endpoint de API protegido para eliminar de forma permanente
// todos los productos que no tengan una imagen principal.
// Solo accesible por administradores autenticados.
// ============================================================
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request) {
  try {
    // 1. Verificar autenticación y rol de administrador
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión como administrador.' },
        { status: 401 }
      )
    }

    // 2. Conectar a la base de datos
    await dbConnect()

    // 3. Definir consulta para productos sin imagen
    const query = {
      $or: [
        { image: { $exists: false } },
        { image: null },
        { image: '' },
        { image: /^\s*$/ } // Solo espacios en blanco
      ]
    }

    // Contar cuántos hay antes de borrar
    const countBefore = await Product.countDocuments(query)

    if (countBefore === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No se encontraron productos sin imagen principal para eliminar.',
        deletedCount: 0
      })
    }

    // 4. Eliminar de forma permanente
    const result = await Product.deleteMany(query)

    // 5. Revalidar el caché de la web
    try {
      revalidatePath('/')
      revalidatePath('/productos')
    } catch {}

    return NextResponse.json({
      ok: true,
      message: `Limpieza exitosa. Se eliminaron permanentemente ${result.deletedCount} productos sin imagen principal de la base de datos.`,
      deletedCount: result.deletedCount,
      remainingCount: await Product.countDocuments({})
    })
  } catch (err) {
    console.error('Error en /api/products/cleanup:', err)
    return NextResponse.json({ error: 'Error del servidor: ' + err.message }, { status: 500 })
  }
}
