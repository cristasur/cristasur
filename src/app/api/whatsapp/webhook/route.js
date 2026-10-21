// ============================================================
// /api/whatsapp/webhook — el asesor de CRISTASUR en WhatsApp.
//
// GET  → Meta verifica el webhook (hub.challenge) con WA_VERIFY_TOKEN.
// POST → llega un mensaje. Se responde 200 de inmediato y el bot
//        contesta "después" (after), para que Meta no reintente.
//
// Variables: WA_TOKEN, WA_PHONE_ID, WA_VERIFY_TOKEN, WA_APP_SECRET,
//            ANTHROPIC_API_KEY, WA_AVISO_NUMERO (celular que recibe
//            el aviso cuando el bot pasa con una persona),
//            BOT_MAX_DIA (respuestas por número al día, def. 80).
// ============================================================
import { NextResponse, after } from 'next/server'
import dbConnect from '@/lib/mongodb'
import BotConversacion from '@/models/BotConversacion'
import { enviarTexto, marcarLeido, firmaMetaValida } from '@/lib/bot/whatsapp'
import { responder } from '@/lib/bot/cerebro'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request) {
  const u = new URL(request.url)
  if (u.searchParams.get('hub.mode') === 'subscribe' && u.searchParams.get('hub.verify_token') === process.env.WA_VERIFY_TOKEN) {
    return new Response(u.searchParams.get('hub.challenge') || '', { status: 200 })
  }
  return new Response('No autorizado', { status: 403 })
}

const hoyMx = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Merida' })

async function atender({ telefono, nombre, mensajeId, texto }) {
  await dbConnect()
  let conv = await BotConversacion.findOne({ telefono })
  if (!conv) conv = await BotConversacion.create({ telefono, nombre })
  if (conv.atendidos.includes(mensajeId)) return // aviso repetido de Meta
  console.log('WhatsApp: mensaje recibido', JSON.stringify(texto.slice(0, 60)))
  conv.atendidos = [...conv.atendidos.slice(-50), mensajeId]
  if (nombre) conv.nombre = nombre

  // Comando para pruebas: empieza la plática de cero.
  if (/^\s*reiniciar\s*$/i.test(texto)) {
    conv.mensajes = []; conv.humanoHasta = null; conv.motivoHumano = ''
    await conv.save()
    await enviarTexto(telefono, 'Listo, empezamos de nuevo. ¿En qué te ayudo?')
    return
  }

  conv.mensajes.push({ rol: 'cliente', texto })

  // Lo está atendiendo una persona: el bot no se mete.
  if (conv.humanoHasta && conv.humanoHasta > new Date()) {
    console.log('WhatsApp: lo atiende una persona hasta', conv.humanoHasta.toISOString(), '(manda "reiniciar")')
    await conv.save(); return
  }

  // Tope diario por número (control de gasto).
  const dia = hoyMx()
  if (conv.hoy !== dia) { conv.hoy = dia; conv.respuestasHoy = 0 }
  if (conv.respuestasHoy >= Number(process.env.BOT_MAX_DIA || 80)) {
    console.log('WhatsApp: llegó al tope diario de respuestas')
    await conv.save(); return
  }

  await conv.save()
  await marcarLeido(mensajeId)

  let r
  try {
    r = await responder({ historial: conv.mensajes.slice(-30), telefono })
  } catch (e) {
    console.error('Bot WhatsApp', e.message)
    r = { texto: 'Perdón, tuve un problema para revisar eso. Un asesor te escribe en breve.', humano: { motivo: 'Error del bot', resumen: e.message } }
  }

  if (r.texto) await enviarTexto(telefono, r.texto)
  conv.mensajes.push({ rol: 'bot', texto: r.texto || '' })
  conv.mensajes = conv.mensajes.slice(-60)
  conv.respuestasHoy += 1

  if (r.humano) {
    conv.humanoHasta = new Date(Date.now() + 12 * 3600 * 1000)
    conv.motivoHumano = r.humano.motivo
    const aviso = process.env.WA_AVISO_NUMERO
    if (aviso) {
      await enviarTexto(aviso, `🔔 *Cliente para atender*\n${conv.nombre || ''} +${telefono}\nMotivo: ${r.humano.motivo}\n${r.humano.resumen}\n\nhttps://wa.me/${telefono}`).catch(() => {})
    }
  }
  await conv.save()
}

export async function POST(request) {
  const crudo = await request.text()
  if (!firmaMetaValida(crudo, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }
  let body = {}
  try { body = JSON.parse(crudo) } catch { return NextResponse.json({ ok: true }) }

  const trabajos = []
  for (const entry of body.entry || []) {
    for (const ch of entry.changes || []) {
      const v = ch.value || {}
      // Avisos de entrega de lo que mandó el bot (enviado, entregado, falló).
      for (const s of v.statuses || []) {
        if (s.status === 'failed') console.error('WhatsApp entrega falló', JSON.stringify(s.errors || []))
        else console.log('WhatsApp estado', s.status)
      }
      const nombres = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile?.name || '']))
      for (const m of v.messages || []) {
        let texto = ''
        if (m.type === 'text') texto = m.text?.body || ''
        else if (m.type === 'interactive') texto = m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || ''
        else if (m.type === 'button') texto = m.button?.text || ''
        else texto = '[El cliente mandó un archivo, audio o foto que no puedo ver. Pídele que lo escriba.]'
        if (!texto.trim()) continue
        trabajos.push({ telefono: m.from, nombre: nombres[m.from] || '', mensajeId: m.id, texto: texto.slice(0, 1500) })
      }
    }
  }

  // Se contesta a Meta ya; el bot trabaja después.
  if (trabajos.length) {
    after(async () => {
      for (const t of trabajos) {
        try { await atender(t) } catch (e) { console.error('Atender WhatsApp', e.message) }
      }
    })
  }
  return NextResponse.json({ ok: true })
}
