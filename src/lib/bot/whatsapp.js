// ============================================================
// Enviar mensajes por la API oficial de WhatsApp (Cloud API).
// Variables: WA_TOKEN, WA_PHONE_ID, WA_API_VERSION (opcional).
// ============================================================
import crypto from 'crypto'

const version = () => process.env.WA_API_VERSION || 'v25.0'

/**
 * Los celulares de México llegan como 521XXXXXXXXXX (con el "1" viejo),
 * pero Meta solo acepta mandar a 52XXXXXXXXXX. Se quita ese "1".
 */
export const normalizarNumero = (n) => {
  const d = String(n || '').replace(/\D/g, '')
  return /^521\d{10}$/.test(d) ? `52${d.slice(3)}` : d
}

/** El otro formato de un celular de México (con o sin el "1"). */
const otroFormato = (d) => /^521\d{10}$/.test(d) ? `52${d.slice(3)}` : /^52\d{10}$/.test(d) ? `521${d.slice(2)}` : null

async function graph(cuerpo) {
  if (!cuerpo.to) return llamar(cuerpo)
  const to = normalizarNumero(cuerpo.to)
  try {
    return await llamar({ ...cuerpo, to })
  } catch (e) {
    // 131030 = "no está en la lista permitida": se prueba el otro formato.
    const alt = otroFormato(to)
    if (e.codigo !== 131030 || !alt) throw e
    console.error('WhatsApp: reintento con', alt.slice(0, 5) + '…')
    return llamar({ ...cuerpo, to: alt })
  }
}

async function llamar(cuerpo) {
  const res = await fetch(`https://graph.facebook.com/${version()}/${process.env.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...cuerpo }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('WhatsApp API', res.status, JSON.stringify(data?.error || data))
    const err = new Error(data?.error?.message || `WhatsApp respondió ${res.status}`)
    err.codigo = data?.error?.code
    throw err
  }
  return data
}

/** WhatsApp corta en 4096 caracteres; se parte en pedazos si hace falta. */
export async function enviarTexto(para, texto) {
  const t = String(texto || '').trim()
  if (!t) return
  for (let i = 0; i < t.length; i += 3800) {
    const r = await graph({ to: para, type: 'text', text: { body: t.slice(i, i + 3800), preview_url: true } })
    console.log('WhatsApp: texto aceptado por Meta', r?.messages?.[0]?.id || '')
  }
}

export async function enviarImagen(para, url, pie = '') {
  return graph({ to: para, type: 'image', image: { link: url, caption: String(pie).slice(0, 1000) } })
}

/** Palomitas azules + "escribiendo…" mientras el bot piensa. */
export async function marcarLeido(mensajeId) {
  try {
    await graph({ status: 'read', message_id: mensajeId, typing_indicator: { type: 'text' } })
  } catch { /* no es grave */ }
}

/** Revisa que el aviso venga de Meta (X-Hub-Signature-256 con el App Secret). */
export function firmaMetaValida(cuerpoCrudo, firma) {
  const secreto = process.env.WA_APP_SECRET
  if (!secreto) return true // prototipo sin App Secret configurado
  if (!firma?.startsWith('sha256=')) return false
  const esperado = 'sha256=' + crypto.createHmac('sha256', secreto).update(cuerpoCrudo).digest('hex')
  const a = Buffer.from(esperado), b = Buffer.from(firma)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
