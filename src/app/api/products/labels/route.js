// ============================================================
// POST /api/products/labels
// Genera un PDF imprimible (carta o A4) con etiquetas de precio:
// nombre, precio, mayoreo (si aplica) y QR que apunta a la URL
// del producto. Diseño tipo grilla 3×8 (24 por hoja) por defecto.
// Body: { ids: [<ObjectId>], layout?: { cols, rows, paper } }
// ============================================================
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function isObjectId(s) {
  return typeof s === 'string' && /^[a-f0-9]{24}$/i.test(s)
}

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await request.json().catch(() => ({}))
  const ids = Array.isArray(body?.ids) ? body.ids.filter(isObjectId) : []
  if (!ids.length) {
    return new Response(JSON.stringify({ error: 'Falta selección' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Layout: por defecto 3 columnas × 8 filas (24 etiquetas) en hoja Letter.
  const layout = {
    cols: Math.max(1, Math.min(5, Number(body?.layout?.cols) || 3)),
    rows: Math.max(1, Math.min(12, Number(body?.layout?.rows) || 8)),
    paper: body?.layout?.paper === 'A4' ? 'A4' : 'LETTER',
  }
  const repeat = Math.max(1, Math.min(50, Number(body?.repeat) || 1))

  await dbConnect()
  const products = await Product.find({ _id: { $in: ids }, deleted: { $ne: true } })
    .select('name price wholesalePrice wholesaleMinQty sku image')
    .lean()

  if (!products.length) {
    return new Response(JSON.stringify({ error: 'Sin productos' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Importamos las dependencias dinámicamente (sólo en runtime nodejs).
  // Tanto pdfkit como qrcode son CommonJS, por eso usamos el patrón
  // "default ?? namespace" para soportar ambos modos de interop.
  const pdfMod = await import('pdfkit')
  const PDFDocument = pdfMod.default || pdfMod
  const qrMod = await import('qrcode')
  const QRCode = qrMod.default || qrMod

  // Pre-generamos los QR como data URL PNG.
  const qrFor = async (productId) => {
    const url = `${SITE_URL}/productos/${productId}`
    return await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220,
    })
  }

  // Construimos lista repetida (para que un producto aparezca N veces).
  const list = []
  for (const p of products) {
    for (let i = 0; i < repeat; i++) list.push(p)
  }

  // Pre-generamos todos los QR (paralelo)
  const qrBuffers = await Promise.all(list.map((p) => qrFor(p._id)))

  // pdfkit: dimensiones LETTER 612×792 pt; A4 595×842 pt
  const PAGE = layout.paper === 'A4' ? { w: 595, h: 842 } : { w: 612, h: 792 }
  const margin = 24
  const contentW = PAGE.w - margin * 2
  const contentH = PAGE.h - margin * 2
  const cellW = contentW / layout.cols
  const cellH = contentH / layout.rows
  const perPage = layout.cols * layout.rows

  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: layout.paper === 'A4' ? 'A4' : 'LETTER',
      margin: 0,
      info: { Title: 'Etiquetas CRISTASUR', Author: 'CRISTASUR' },
    })

    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => {
      const buf = Buffer.concat(chunks)
      resolve(
        new Response(buf, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition':
              `attachment; filename="etiquetas-cristasur-${new Date().toISOString().slice(0, 10)}.pdf"`,
            'Cache-Control': 'no-store',
          },
        })
      )
    })

    list.forEach((p, idx) => {
      const onPage = idx % perPage
      if (idx > 0 && onPage === 0) doc.addPage()
      const col = onPage % layout.cols
      const row = Math.floor(onPage / layout.cols)
      const x = margin + col * cellW
      const y = margin + row * cellH

      // Card
      doc
        .roundedRect(x + 4, y + 4, cellW - 8, cellH - 8, 8)
        .lineWidth(0.6)
        .strokeColor('#cbd5e1')
        .stroke()

      // QR (cuadrado a la izquierda)
      const qrSize = Math.min(cellW * 0.42, cellH * 0.7)
      const qrX = x + 12
      const qrY = y + (cellH - qrSize) / 2
      try {
        doc.image(qrBuffers[idx], qrX, qrY, { width: qrSize, height: qrSize })
      } catch {}

      // Texto a la derecha
      const textX = qrX + qrSize + 12
      const textW = cellW - (qrSize + 24 + 12)
      const textY = y + 18

      doc
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('CRISTASUR', textX, textY, { width: textW })
      doc
        .moveDown(0.2)
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(String(p.name || '').slice(0, 60), { width: textW, ellipsis: true })

      doc
        .moveDown(0.4)
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(formatMXN(p.price), { width: textW })

      if (p.wholesalePrice && p.wholesaleMinQty) {
        doc
          .moveDown(0.2)
          .fillColor('#b45309')
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text(
            `Mayoreo ${formatMXN(p.wholesalePrice)} desde ${p.wholesaleMinQty} pzs`,
            { width: textW }
          )
      }

      if (p.sku) {
        doc
          .moveDown(0.4)
          .fillColor('#475569')
          .font('Helvetica')
          .fontSize(7.5)
          .text(`SKU ${p.sku}`, { width: textW })
      }

      doc
        .fillColor('#64748b')
        .font('Helvetica')
        .fontSize(6.5)
        .text('Escanéa el QR para ver fotos y reseñas',
          textX, y + cellH - 22, { width: textW })
    })

    doc.end()
  })
}
