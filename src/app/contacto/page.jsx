// /contacto - Información de contacto
import Icon from '@/components/Icon'

export const metadata = { title: 'Contacto — CRISTASUR' }

export default function ContactoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl md:text-5xl font-black text-slate-900">Hablemos</h1>
      <p className="text-lg text-slate-600 mt-3 max-w-2xl">
        Estamos para ayudarte a encontrar lo que necesitas. Escríbenos por el medio
        que te quede más cómodo y te respondemos en el día.
      </p>

      <div className="mt-10 grid md:grid-cols-2 gap-4">
        <a
          href="https://www.instagram.com/cristasurmx/"
          target="_blank"
          rel="noopener noreferrer"
          className="card-hover block bg-white rounded-2xl p-6 shadow-card border border-slate-100"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center mb-3">
            <Icon name="instagram" className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-900">Instagram</div>
          <div className="text-slate-500 text-sm mt-1">@cristasurmx</div>
        </a>
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="card-hover block bg-white rounded-2xl p-6 shadow-card border border-slate-100"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center mb-3">
            <Icon name="whatsapp" className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-900">WhatsApp</div>
          <div className="text-slate-500 text-sm mt-1">Respuesta inmediata en horario</div>
        </a>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 grid place-items-center mb-3">
            <Icon name="clock" className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-900">Horario</div>
          <div className="text-slate-500 text-sm mt-1">Lunes a sábado, de 9am a 7pm</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 grid place-items-center mb-3">
            <Icon name="truck" className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-900">Envíos</div>
          <div className="text-slate-500 text-sm mt-1">A toda la república mexicana</div>
        </div>
      </div>
    </div>
  )
}
