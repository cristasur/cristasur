// ============================================================
// POST /api/products/labels
// Genera un PDF imprimible con etiquetas de precio + QR.
//
// Modos:
//   mode: 'grid'   → grilla NxM, varias etiquetas por hoja (default)
//   mode: 'poster' → 1 producto por hoja, QR grande para tienda física
//
// Body: { ids, mode?, repeat?, layout?: { cols, rows, paper } }
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

  const mode = body?.mode === 'poster' ? 'poster' : 'grid'
  const repeat = Math.max(1, Math.min(50, Number(body?.repeat) || 1))

  const layout = {
    cols: Math.max(1, Math.min(5, Number(body?.layout?.cols) || 2)),
    rows: Math.max(1, Math.min(12, Number(body?.layout?.rows) || 4)),
    paper: body?.layout?.paper === 'A4' ? 'A4' : 'LETTER',
  }

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

  const pdfMod = await import('pdfkit')
  const PDFDocument = pdfMod.default || pdfMod
  const qrMod = await import('qrcode')
  const QRCode = qrMod.default || qrMod

  const qrFor = async (productId, size) => {
    const url = `${SITE_URL}/productos/${productId}`
    return await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
    })
  }

  // Lista repetida (repeat copias de cada producto)
  const list = []
  for (const p of products) {
    for (let i = 0; i < repeat; i++) list.push(p)
  }

  const PAGE = layout.paper === 'A4' ? { w: 595, h: 842 } : { w: 612, h: 792 }

  return new Promise(async (resolve) => {
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
            'Content-Disposition': `attachment; filename="etiquetas-cristasur-${new Date().toISOString().slice(0, 10)}.pdf"`,
            'Cache-Control': 'no-store',
          },
        })
      )
    })

    // ============================================================
    // MODO PÓSTER — 1 producto por página, QR grande
    // ============================================================
    if (mode === 'poster') {
      for (let idx = 0; idx < list.length; idx++) {
        const p = list[idx]
        if (idx > 0) doc.addPage()

        const W = PAGE.w
        const H = PAGE.h
        const mx = 36 // margen

        // Fondo blanco completo (PDFKit ya lo hace, pero lo dejamos explícito)
        doc.rect(0, 0, W, H).fill('#ffffff')

        // Borde decorativo
        doc
          .roundedRect(mx, mx, W - mx * 2, H - mx * 2, 12)
          .lineWidth(1.5)
          .strokeColor('#e2e8f0')
          .stroke()

        // ---- Encabezado ----
        const qrBuf = await qrFor(p._id, 400)
        const qrSize = 260
        const qrX = (W - qrSize) / 2
        let y = mx + 28

        doc
          .fillColor('#0f172a')
          .font('Helvetica-Bold')
          .fontSize(13)
          .text('CRISTASUR', mx + 8, y, { width: W - mx * 2 - 16, align: 'center' })

        y += 20

        // Línea separadora
        doc.moveTo(mx + 20, y).lineTo(W - mx - 20, y).lineWidth(0.5).strokeColor('#cbd5e1').stroke()
        y += 16

        // QR centrado
        try {
          doc.image(qrBuf, qrX, y, { width: qrSize, height: qrSize })
        } catch {}

        y += qrSize + 16

        // Línea separadora
        doc.moveTo(mx + 20, y).lineTo(W - mx - 20, y).lineWidth(0.5).strokeColor('#cbd5e1').stroke()
        y += 18

        // Nombre del producto
        const nameLines = String(p.name || '')
        doc
          .fillColor('#0f172a')
          .font('Helvetica-Bold')
          .fontSize(20)
          .text(nameLines, mx + 16, y, {
            width: W - mx * 2 - 32,
            align: 'center',
            lineGap: 2,
          })

        y += doc.heightOfString(nameLines, { width: W - mx * 2 - 32, fontSize: 20 }) + 14

        // Precio
        doc
          .fillColor('#0f172a')
          .font('Helvetica-Bold')
          .fontSize(48)
          .text(formatMXN(p.price), mx + 16, y, {
            width: W - mx * 2 - 32,
            align: 'center',
          })

        y += 62

        // Precio mayoreo
        if (p.wholesalePrice && p.wholesaleMinQty) {
          doc
            .fillColor('#b45309')
            .font('Helvetica-Bold')
            .fontSize(14)
            .text(
              `Mayoreo: ${formatMXN(p.wholesalePrice)} desde ${p.wholesaleMinQty} pzs`,
              mx + 16,
              y,
              { width: W - mx * 2 - 32, align: 'center' }
            )
          y += 22
        }

        // SKU
        if (p.sku) {
          doc
            .fillColor('#64748b')
            .font('Helvetica')
            .fontSize(10)
            .text(`SKU: ${p.sku}`, mx + 16, y, {
              width: W - mx * 2 - 32,
              align: 'center',
            })
          y += 16
        }

        // Pie
        const footerY = H - mx - 28
        doc
          .moveTo(mx + 20, footerY - 10)
          .lineTo(W - mx - 20, footerY - 10)
          .lineWidth(0.5)
          .strokeColor('#cbd5e1')
          .stroke()

        doc
          .fillColor('#94a3b8')
          .font('Helvetica')
          .fontSize(9)
          .text('Escanea el código QR para ver fotos, detalles y comprar en línea', mx + 16, footerY, {
            width: W - mx * 2 - 32,
            align: 'center',
          })
      }

    // ============================================================
    // MODO GRILLA — varias etiquetas por hoja
    // ============================================================
    } else {
      const margin = 20
      const contentW = PAGE.w - margin * 2
      const contentH = PAGE.h - margin * 2
      const cellW = contentW / layout.cols
      const cellH = contentH / layout.rows
      const perPage = layout.cols * layout.rows

      // QR más grande: 55% del ancho de celda o 65% del alto
      const qrSize = Math.min(cellW * 0.55, cellH * 0.65)

      const qrBuffers = await Promise.all(
        list.map((p) => qrFor(p._id, Math.round(qrSize * 3))) // 3x resolución para calidad
      )

      list.forEach((p, idx) => {
        const onPage = idx % perPage
        if (idx > 0 && onPage === 0) doc.addPage()
        const col = onPage % layout.cols
        const row = Math.floor(onPage / layout.cols)
        const x = margin + col * cellW
        const y = margin + row * cellH

        // Card
        doc
          .roundedRect(x + 3, y + 3, cellW - 6, cellH - 6, 6)
          .lineWidth(0.5)
          .strokeColor('#cbd5e1')
          .stroke()

        const pad = 8
        const qrX = x + pad
        const qrY = y + (cellH - qrSize) / 2

        try {
          doc.image(qrBuffers[idx], qrX, qrY, { width: qrSize, height: qrSize })
        } catch {}

        // Área de texto
        const textX = qrX + qrSize + pad
        const textW = cellW - qrSize - pad * 3
        let ty = y + pad

        // CRISTASUR
        doc
          .fillColor('#64748b')
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .text('CRISTASUR', textX, ty, { width: textW })
        ty += 10

        // Nombre
        const maxNameFontSize = Math.max(7, Math.min(10, cellH / 10))
        doc
          .fillColor('#0f172a')
          .font('Helvetica-Bold')
          .fontSize(maxNameFontSize)
          .text(String(p.name || '').slice(0, 55), textX, ty, {
            width: textW,
            ellipsis: true,
            lineGap: 1,
          })
        ty += Math.min(cellH * 0.3, 30)

        // Precio
        const priceFontSize = Math.max(12, Math.min(18, cellH / 5.5))
        doc
          .fillColor('#0f172a')
          .font('Helvetica-Bold')
          .fontSize(priceFontSize)
          .text(formatMXN(p.price), textX, ty, { width: textW })
        ty += priceFontSize + 4

        // Mayoreo
        if (p.wholesalePrice && p.wholesaleMinQty) {
          doc
            .fillColor('#b45309')
            .font('Helvetica-Bold')
            .fontSize(Math.max(6, Math.min(8.5, cellH / 12)))
            .text(
              `Mayoreo ${formatMXN(p.wholesalePrice)} desde ${p.wholesaleMinQty} pzs`,
              textX,
              ty,
              { width: textW }
            )
          ty += 12
        }

        // SKU
        if (p.sku) {
          doc
            .fillColor('#94a3b8')
            .font('Helvetica')
            .fontSize(6)
            .text(`SKU ${p.sku}`, textX, ty, { width: textW })
        }

        // Pie de celda
        doc
          .fillColor('#94a3b8')
          .font('Helvetica')
          .fontSize(5.5)
          .text('Escanéa el QR para ver fotos', textX, y + cellH - 14, { width: textW })
      })
    }

    doc.end()
  })
}
