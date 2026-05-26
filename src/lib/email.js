import { Resend } from 'resend'

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'CRISTASUR <noreply@cristasur.com>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://cristasur.com'

export async function sendPasswordResetEmail(to, token) {
  const link = `${SITE}/cuenta/nueva-contrasena?token=${token}`
  await resend.emails.send({
    from: FROM, to,
    subject: 'Recupera tu contraseña — CRISTASUR',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px">
      <img src="${SITE}/logo.png" alt="CRISTASUR" style="height:48px;margin-bottom:24px"/>
      <h2 style="color:#1e293b">Recupera tu contraseña</h2>
      <p style="color:#475569">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Restablecer contraseña</a>
      <p style="color:#94a3b8;font-size:13px">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
    </div>`,
  })
}

export async function sendVerificationEmail(to, token) {
  const link = `${SITE}/api/auth/verify-email?token=${token}`
  await resend.emails.send({
    from: FROM, to,
    subject: 'Confirma tu correo — CRISTASUR',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px">
      <img src="${SITE}/logo.png" alt="CRISTASUR" style="height:48px;margin-bottom:24px"/>
      <h2 style="color:#1e293b">Confirma tu correo</h2>
      <p style="color:#475569">Gracias por registrarte en CRISTASUR. Confirma tu correo para activar tu cuenta.</p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Confirmar correo</a>
      <p style="color:#94a3b8;font-size:13px">Si no te registraste en CRISTASUR, ignora este correo.</p>
    </div>`,
  })
}

export async function sendAbandonedCartEmail(to, name, items, total) {
  const itemsHtml = items.slice(0, 3).map(x =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9">
      <strong>${escapeHtml(x.name)}</strong>${x.variantValue ? ` — ${escapeHtml(x.variantValue)}` : ''} x${x.qty}
    </td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right">
      $${(x.price * x.qty).toFixed(2)}
    </td></tr>`
  ).join('')
  await resend.emails.send({
    from: FROM, to,
    subject: '¿Olvidaste algo? Tu carrito te espera 🛒',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px">
      <img src="${SITE}/logo.png" alt="CRISTASUR" style="height:48px;margin-bottom:24px"/>
      <h2 style="color:#1e293b">Hola ${escapeHtml(name)}, dejaste productos en tu carrito</h2>
      <p style="color:#475569">Estos artículos te están esperando:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">${itemsHtml}</table>
      <p style="font-weight:700;color:#1e293b">Total: $${Number(total).toFixed(2)} MXN</p>
      <a href="${SITE}/carrito" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Ver mi carrito</a>
    </div>`,
  })
}
