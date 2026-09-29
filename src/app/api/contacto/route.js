// ============================================================
// POST /api/contacto — formulario de la página de contacto.
// Guarda el mensaje y avisa por correo a la tienda (si Resend
// está configurado). Público, con límite por IP y trampa anti-bots.
// ============================================================
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import dbConnect from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const DESTINO = process.env.CONTACT_EMAIL || 'cristasur@live.com.mx'
const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const txt = (v, max) => String(v ?? '').trim().slice(0, max)

export async function POST(request) {
  try {
    const ip = clientIp(request)
    const rl = rateLimit(`contacto:${ip}`, 5, 30 * 60 * 1000)
    if (!rl.ok) return NextResponse.json({ error: 'Ya enviaste varios mensajes. Intenta en un rato o escríbenos por WhatsApp.' }, { status: 429 })

    const b = await request.json().catch(() => ({}))
    // Trampa: los humanos no ven ni llenan este campo.
    if (b.empresa) return NextResponse.json({ ok: true })

    const nombre = txt(b.nombre, 120)
    const correo = txt(b.correo, 160).toLowerCase()
    const telefono = txt(b.telefono, 40)
    const motivo = txt(b.motivo, 60)
    const mensaje = txt(b.mensaje, 3000)

    if (nombre.length < 2) return NextResponse.json({ error: 'Escribe tu nombre.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return NextResponse.json({ error: 'Revisa tu correo electrónico.' }, { status: 400 })
    if (!motivo) return NextResponse.json({ error: 'Elige en qué te podemos ayudar.' }, { status: 400 })
    if (mensaje.length < 5) return NextResponse.json({ error: 'Escribe tu mensaje.' }, { status: 400 })

    await dbConnect()
    await ContactMessage.create({ nombre, correo, telefono, motivo, mensaje, ip })

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'CRISTASUR <noreply@cristasur.com>',
          to: DESTINO,
          replyTo: correo,
          subject: `Contacto web: ${motivo} — ${nombre}`,
          html: `<div style="font-family:sans-serif;max-width:560px">
            <h2 style="color:#0f172a">Nuevo mensaje desde cristasur.com</h2>
            <p><b>Nombre:</b> ${esc(nombre)}<br/><b>Correo:</b> ${esc(correo)}<br/>
            <b>Teléfono:</b> ${esc(telefono || '—')}<br/><b>Motivo:</b> ${esc(motivo)}</p>
            <p style="white-space:pre-line;background:#f1f5f9;padding:12px;border-radius:8px">${esc(mensaje)}</p>
            <p style="color:#64748b;font-size:13px">Responde a este correo para contestarle directamente.</p></div>`,
        })
      } catch (e) {
        console.error('contacto: no se pudo enviar el correo', e?.message)
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'No se pudo enviar. Escríbenos por WhatsApp.' }, { status: 500 })
  }
}
