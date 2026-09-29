// ============================================================
// /admin/mensajes — lo que llega por el formulario de /contacto.
// ============================================================
import dbConnect from '@/lib/mongodb'
import ContactMessage from '@/models/ContactMessage'
import MensajesLista from './MensajesLista'

export const dynamic = 'force-dynamic'

export default async function MensajesPage() {
  await dbConnect()
  const mensajes = await ContactMessage.find({}).sort({ createdAt: -1 }).limit(300).lean()
  const pendientes = mensajes.filter((m) => !m.atendido).length
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900">Mensajes de contacto</h1>
      <p className="text-slate-500 text-sm mt-1 mb-6">
        Lo que la gente envía desde la página Contacto. {pendientes ? `${pendientes} sin atender.` : 'Todo atendido.'}
      </p>
      <MensajesLista inicial={JSON.parse(JSON.stringify(mensajes))} />
    </div>
  )
}
