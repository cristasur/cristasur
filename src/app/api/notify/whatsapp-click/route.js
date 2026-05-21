// ============================================================
// POST /api/notify/whatsapp-click
// Manda un correo a los administradores cada vez que alguien
// hace clic en "Pedir por WhatsApp" en la ficha de un producto.
// ============================================================
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAILS = [
  'Amirhernandezfarah06@gmail.com',
  'Cristasur03@gmail.com',
]

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const { productName, productId, sku, price, qty, variant, productUrl } = body

    const now = new Date().toLocaleString('es-MX', {
      timeZone: 'America/Merida',
      dateStyle: 'full',
      timeStyle: 'short',
    })

    const variantLine = variant ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px">Variante</td><td style="padding:6px 0;font-weight:600;font-size:14px">${variant}</td></tr>` : ''
    const skuLine = sku ? `<tr><td style="padding:6px 0;color:#64748b;font-size:14px">SKU</td><td style="padding:6px 0;font-size:14px;color:#94a3b8">${sku}</td></tr>` : ''
    const urlLine = productUrl ? `<p style="margin-top:20px"><a href="${productUrl}" style="background:#1e40af;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Ver producto →</a></p>` : ''

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden">
        <div style="background:#1e3a5f;padding:24px 28px">
          <p style="color:#93c5fd;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">CRISTASUR · Notificación de lead</p>
          <h1 style="color:white;margin:0;font-size:22px">📲 Nuevo interés por WhatsApp</h1>
        </div>
        <div style="padding:24px 28px;background:white">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px;width:40%">Producto</td><td style="padding:6px 0;font-weight:700;font-size:15px;color:#0f172a">${productName || 'Sin nombre'}</td></tr>
            ${skuLine}
            ${variantLine}
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px">Cantidad</td><td style="padding:6px 0;font-weight:600;font-size:14px">${qty || 1} pieza${(qty || 1) > 1 ? 's' : ''}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px">Precio unitario</td><td style="padding:6px 0;font-weight:700;font-size:16px;color:#16a34a">${price || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:14px">Hora (Mérida)</td><td style="padding:6px 0;font-size:13px;color:#64748b">${now}</td></tr>
          </table>
          ${urlLine}
          <p style="margin-top:24px;font-size:12px;color:#94a3b8">El cliente ya abrió WhatsApp — revisa tu teléfono para responder.</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: 'CRISTASUR Leads <notificaciones@cristasur.com>',
      to: ADMIN_EMAILS,
      subject: `📲 Lead WhatsApp: ${productName || 'Producto'}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // No bloqueamos al cliente si falla el correo
    console.error('[notify/whatsapp-click]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
