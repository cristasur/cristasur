// ============================================================
// POST /api/products/import
// Acepta:
//   - multipart/form-data con file=<archivo.csv>
//   - o JSON { csv: "<texto csv>" }
//   - ?dryRun=1            sólo valida, no toca la BD
//   - ?mode=upsert|create|update
//        upsert  (default): si _id/SKU existen → actualiza; si no → crea.
//                           Esto evita duplicados cuando re-importas un
//                           CSV exportado al que añadiste filas.
//        create           : sólo crea. Si _id/SKU existen → skip.
//        update           : sólo actualiza lo que ya existe. No crea nada.
// Resuelve categorías por nombre (case/accent-insensitive) o por slug.
// Devuelve un reporte detallado por fila: created/updated/skipped/error.
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { fromCSV, rowToProduct } from '@/lib/csv'
import { validateProductPayload } from '@/lib/validation'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_MODES = new Set(['upsert', 'create', 'update'])

// Campos que SÍ se sobreescriben al actualizar desde CSV.
// Intencionalmente NO tocamos: variants, editHistory, viewsCount,
// whatsappClicks, salesCount, createdAt, createdBy, deleted, deletedAt.
const UPDATABLE_FIELDS = [
  'name',
  'description',
  'price',
  'comparePrice',
  'wholesalePrice',
  'wholesaleMinQty',
  'bulkPrice',
  'bulkMinQty',
  'status',
  'stock',
  'sku',
  'featured',
  'active',
  'image',
  'gallery',
  'categories',
]

function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export async function POST(request) {
  try {
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dryRun') === '1'
    const modeParam = (url.searchParams.get('mode') || 'upsert').toLowerCase()
    const mode = VALID_MODES.has(modeParam) ? modeParam : 'upsert'

    const contentType = request.headers.get('content-type') || ''
    let csvText = ''

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'Falta el archivo CSV' }, { status: 400 })
      }
      csvText = await file.text()
    } else {
      const body = await request.json().catch(() => ({}))
      csvText = String(body?.csv || '')
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: 'CSV vacío' }, { status: 400 })
    }

    const rows = fromCSV(csvText)
    if (!rows.length) {
      return NextResponse.json({ error: 'No se pudieron leer filas del CSV' }, { status: 400 })
    }

    await dbConnect()
    const user = await getCurrentUser()

    // Índice de categorías por nombre/slug normalizados
    const cats = await Category.find({}).select('_id name slug').lean()
    const categoryIdByName = {}
    for (const c of cats) {
      categoryIdByName[normalize(c.name)] = String(c._id)
      if (c.slug) categoryIdByName[normalize(c.slug)] = String(c._id)
    }

    // ---------- Paso 1: parsear y validar todas las filas ----------
    const parsedRows = [] // { lineNo, parsed, value, errors }
    const report = {
      total: rows.length,
      mode,
      dryRun,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [],
    }

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i]
      const lineNo = i + 2 // +1 header, +1 base-1
      const parsed = rowToProduct(rawRow, categoryIdByName)

      if (!parsed.ok) {
        const unknownCats = parsed.rawCategoryNames.filter(
          (n) => !categoryIdByName[normalize(n)]
        )
        report.errors++
        report.details.push({
          line: lineNo,
          status: 'error',
          name: parsed.data.name || '(sin nombre)',
          missing: parsed.missing,
          unknownCategories: unknownCats,
        })
        continue
      }

      const { errors, value } = validateProductPayload(parsed.data)
      if (errors.length) {
        report.errors++
        report.details.push({
          line: lineNo,
          status: 'error',
          name: parsed.data.name,
          errors,
        })
        continue
      }

      parsedRows.push({
        lineNo,
        _id: parsed.data._id || '',
        sku: parsed.data.sku || '',
        value,
      })
    }

    // ---------- Paso 2: buscar existentes por _id y por SKU ----------
    const ids = parsedRows
      .map((p) => p._id)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    const skus = parsedRows.map((p) => p.sku).filter(Boolean)

    const existingDocs = ids.length || skus.length
      ? await Product.find({
          $or: [
            ids.length ? { _id: { $in: ids } } : null,
            skus.length ? { sku: { $in: skus } } : null,
          ].filter(Boolean),
        })
          .select('_id sku')
          .lean()
      : []

    const existingById = new Map()
    const existingBySku = new Map()
    for (const d of existingDocs) {
      existingById.set(String(d._id), d)
      if (d.sku) existingBySku.set(d.sku, d)
    }

    // ---------- Paso 3: planear create vs update para cada fila ----------
    const plan = [] // { lineNo, op: 'create'|'update'|'skip', existingId?, value, note? }
    for (const p of parsedRows) {
      const existing =
        (p._id && existingById.get(p._id)) ||
        (p.sku && existingBySku.get(p.sku)) ||
        null

      if (existing) {
        // Producto ya existe en la BD
        if (mode === 'create') {
          plan.push({
            lineNo: p.lineNo,
            op: 'skip',
            value: p.value,
            note: 'Ya existe (skip por modo "crear")',
          })
        } else {
          // upsert o update → actualizamos
          plan.push({
            lineNo: p.lineNo,
            op: 'update',
            existingId: String(existing._id),
            value: p.value,
          })
        }
      } else {
        // No existe en la BD
        if (mode === 'update') {
          plan.push({
            lineNo: p.lineNo,
            op: 'skip',
            value: p.value,
            note: 'No existe (skip por modo "sólo actualizar")',
          })
        } else {
          // upsert o create → crear nuevo
          plan.push({
            lineNo: p.lineNo,
            op: 'create',
            value: p.value,
          })
        }
      }
    }

    // ---------- Paso 4: dryRun termina aquí ----------
    if (dryRun) {
      for (const step of plan) {
        if (step.op === 'create') {
          report.details.push({ line: step.lineNo, status: 'create', name: step.value.name })
        } else if (step.op === 'update') {
          report.details.push({
            line: step.lineNo,
            status: 'update',
            name: step.value.name,
          })
        } else {
          report.details.push({
            line: step.lineNo,
            status: 'skip',
            name: step.value.name,
            note: step.note,
          })
          report.skipped++
        }
      }
      return NextResponse.json(report)
    }

    // ---------- Paso 5: ejecutar ----------
    // Creaciones en bulk con ordered:false
    const toCreate = plan.filter((s) => s.op === 'create')
    if (toCreate.length) {
      const docs = toCreate.map((s) => ({
        ...s.value,
        createdBy: user?.sub,
        updatedBy: user?.sub,
        editHistory: [
          {
            userId: user?.sub,
            userEmail: user?.email,
            action: 'import',
            changes: `Importado desde CSV (línea ${s.lineNo})`,
          },
        ],
      }))
      try {
        const inserted = await Product.insertMany(docs, { ordered: false })
        for (let i = 0; i < inserted.length; i++) {
          report.created++
          report.details.push({
            line: toCreate[i].lineNo,
            status: 'created',
            name: inserted[i].name,
          })
        }
      } catch (bulkErr) {
        // Algunos docs pueden haberse insertado, otros fallaron (p.ej. SKU duplicado)
        const insertedDocs = bulkErr?.insertedDocs || []
        const inserted = new Set(insertedDocs.map((d, i) => i))
        const writeErrors = bulkErr?.writeErrors || []
        const errorByIdx = new Map()
        for (const we of writeErrors) errorByIdx.set(we.index, we)

        for (let i = 0; i < toCreate.length; i++) {
          if (errorByIdx.has(i)) {
            report.errors++
            const we = errorByIdx.get(i)
            report.details.push({
              line: toCreate[i].lineNo,
              status: 'error',
              name: toCreate[i].value.name,
              errors: [we?.errmsg || we?.err?.errmsg || 'Error al crear'],
            })
          } else if (inserted.has(i)) {
            report.created++
            report.details.push({
              line: toCreate[i].lineNo,
              status: 'created',
              name: toCreate[i].value.name,
            })
          }
        }
      }
    }

    // Actualizaciones una por una (necesitamos diferenciar éxito/error por fila)
    const toUpdate = plan.filter((s) => s.op === 'update')
    for (const step of toUpdate) {
      const $set = {}
      for (const k of UPDATABLE_FIELDS) {
        const v = step.value[k]
        if (v === undefined) continue
        // NO sobreescribir con vacíos. Si el CSV viene con string vacío,
        // array vacío o null, dejamos el valor existente en BD intacto.
        // (Esto protege fotos, descripciones, categorías que ya están en
        // productos previamente cargados al importar listas-esqueleto.)
        if (v === '' || v === null) continue
        if (Array.isArray(v) && v.length === 0) continue
        $set[k] = v
      }
      $set.updatedBy = user?.sub
      try {
        await Product.updateOne(
          { _id: step.existingId },
          {
            $set,
            $push: {
              editHistory: {
                $each: [
                  {
                    userId: user?.sub,
                    userEmail: user?.email,
                    action: 'import-update',
                    changes: `Actualizado desde CSV (línea ${step.lineNo})`,
                  },
                ],
                $slice: -50, // mantener los últimos 50 cambios
              },
            },
          }
        )
        report.updated++
        report.details.push({
          line: step.lineNo,
          status: 'updated',
          name: step.value.name,
        })
      } catch (e) {
        report.errors++
        report.details.push({
          line: step.lineNo,
          status: 'error',
          name: step.value.name,
          errors: [e?.message || 'Error al actualizar'],
        })
      }
    }

    // Skips (modo create sobre existente, o modo update sobre inexistente)
    const toSkip = plan.filter((s) => s.op === 'skip')
    for (const step of toSkip) {
      report.skipped++
      report.details.push({
        line: step.lineNo,
        status: 'skipped',
        name: step.value.name,
        note: step.note,
      })
    }

    // Ordenamos el detalle por número de línea para que el reporte sea legible
    report.details.sort((a, b) => (a.line || 0) - (b.line || 0))

    return NextResponse.json(report)
  } catch (err) {
    console.error('POST /api/products/import', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
