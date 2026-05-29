// ============================================================
// GET    /api/products/:id   - detalle (público)
// PUT    /api/products/:id   - editar (admin/editor) + historial
// DELETE /api/products/:id   - soft delete (admin); ?hard=1 = borrado duro
// PATCH  /api/products/:id   - acciones: restore, view, whatsapp-click
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { validateProductPayload, diffSummary, diffFields } from '@/lib/validation'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  try {
    await dbConnect()
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const product = await Product.findById(params.id)
      .populate('categories', 'name slug icon')
      .populate('brand', 'name slug')
      .lean()
    if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ product })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateProductPayload(body)
    if (errors.length)
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })

    await dbConnect()
    const categoriesCount = await Category.countDocuments({
      _id: { $in: value.categories },
    })
    if (categoriesCount !== value.categories.length)
      return NextResponse.json({ error: 'Categoría no existe' }, { status: 400 })

    const user = await getCurrentUser()
    const before = await Product.findById(params.id).lean()
    if (!before) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const DIFF_FIELDS = [
      'name', 'description', 'price', 'comparePrice', 'wholesalePrice',
      'wholesaleMinQty', 'stock', 'featured', 'active', 'sku', 'image',
      'gallery', 'variants', 'categories', 'brand', 'color',
      'weight', 'length', 'width', 'height', 'status', 'publishAt',
      'qtyStep', 'materials', 'materialText', 'tags',
    ]
    const summary = diffSummary(before, value, DIFF_FIELDS) || 'sin cambios relevantes'
    const diff = diffFields(before, value, DIFF_FIELDS)

    const product = await Product.findByIdAndUpdate(
      params.id,
      {
        ...value,
        updatedBy: user?.sub,
        $push: {
          editHistory: {
            $each: [{
              userId: user?.sub,
              userEmail: user?.email,
              action: 'update',
              changes: summary,
              diff,
              source: 'manual',
            }],
            $slice: -100,
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('categories', 'name slug icon')

    return NextResponse.json({ product })
  } catch (err) {
    if (err?.code === 11000)
      return NextResponse.json({ error: 'SKU duplicado' }, { status: 409 })
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    const hard = new URL(request.url).searchParams.get('hard') === '1'
    const user = await getCurrentUser()
    if (user?.role === 'editor')
      return NextResponse.json({ error: 'Editor no puede eliminar' }, { status: 403 })

    if (hard) {
      const res = await Product.findByIdAndDelete(params.id)
      if (!res) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
      return NextResponse.json({ ok: true, mode: 'hard' })
    }

    const product = await Product.findByIdAndUpdate(
      params.id,
      {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: user?.sub,
        $push: {
          editHistory: {
            $each: [{
              userId: user?.sub,
              userEmail: user?.email,
              action: 'delete',
              changes: 'Enviado a papelera',
            }],
            $slice: -50,
          },
        },
      },
      { new: true }
    )
    if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, mode: 'soft' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// PATCH con ?action=restore | ?action=view | ?action=whatsapp
export async function PATCH(request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || ''
    await dbConnect()

    if (action === 'view') {
      await Product.updateOne({ _id: params.id }, { $inc: { viewsCount: 1 } })
      return NextResponse.json({ ok: true })
    }
    if (action === 'whatsapp') {
      await Product.updateOne({ _id: params.id }, { $inc: { whatsappClicks: 1 } })
      return NextResponse.json({ ok: true })
    }

    // Las acciones admin requieren auth (middleware ya la obliga en PATCH)
    const user = await getCurrentUser()

    if (action === 'flag') {
      const product = await Product.findById(params.id).select('flagged').lean()
      if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
      const next = !product.flagged
      await Product.updateOne({ _id: params.id }, { flagged: next })
      return NextResponse.json({ ok: true, flagged: next })
    }

    if (action === 'restore') {
      const product = await Product.findByIdAndUpdate(
        params.id,
        {
          deleted: false,
          deletedAt: null,
          updatedBy: user?.sub,
          $push: {
            editHistory: {
              $each: [{
                userId: user?.sub,
                userEmail: user?.email,
                action: 'restore',
                changes: 'Restaurado desde la papelera',
              }],
              $slice: -50,
            },
          },
        },
        { new: true }
      )
      if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
      return NextResponse.json({ ok: true, product })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
