'use client'
// ============================================================
// Preguntas frecuentes de la ficha de producto.
//
// Son las mismas para todo el catálogo, así que viven aquí y no
// en la base de datos: si algún día cambian las políticas, se
// edita este archivo y se actualizan las 7,580 fichas de golpe.
// ============================================================
import { useState } from 'react'

const FAQS = [
  {
    q: '¿Cómo funcionan los precios de mayoreo?',
    a: 'El precio por pieza baja automáticamente según la cantidad que pidas. En la tabla de cada producto ves desde cuántas unidades aplica cada nivel. No necesitas cuenta especial ni pedir autorización: el sistema lo aplica solo al llegar a la cantidad.',
  },
  {
    q: '¿Por qué algunos productos se venden de 6 en 6?',
    a: 'Varios productos vienen empacados de fábrica por caja y los vendemos por ese formato. Cuando es el caso, la ficha lo indica en «Formato de venta» y el selector de cantidad sube de esa cantidad en esa cantidad.',
  },
  {
    q: '¿Hacen envíos a todo México?',
    a: 'Sí. Tu pedido sale de Mérida. Escríbenos por WhatsApp con tu código postal y la cantidad que necesitas para cotizarte el envío antes de que pagues.',
  },
  {
    q: '¿Puedo recoger en sucursal?',
    a: 'Claro. Tenemos tres: Mérida Matriz, Tanil y Bacalar. Avísanos por WhatsApp en cuál te queda mejor y te lo separamos.',
  },
  {
    q: '¿Manejan factura?',
    a: 'Sí, facturamos. Pide tu factura al momento de cerrar el pedido y te la enviamos con tus datos fiscales.',
  },
  {
    q: '¿Cómo hago mi pedido?',
    a: 'Agrega lo que necesites al carrito y envíanos la lista por WhatsApp desde ahí. Te confirmamos disponibilidad, total y forma de pago en el mismo chat.',
  },
]

export default function ProductFaq() {
  const [open, setOpen] = useState(null)

  return (
    <section className="rounded-2xl border border-slate-200 p-5 md:p-6">
      <h2 className="text-lg font-bold text-slate-900">Preguntas frecuentes</h2>
      <p className="text-[13px] text-slate-500 mt-1 mb-4">
        Resolvemos las dudas más comunes antes de comprar.
      </p>

      <div className="space-y-2">
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-[14px] font-medium text-slate-800">{item.q}</span>
                <span
                  className="shrink-0 w-5 h-5 grid place-items-center rounded-full border border-slate-300 text-slate-500 text-sm leading-none"
                  style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(45deg)' : 'none' }}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 -mt-0.5">
                  <p className="text-[13.5px] text-slate-600 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
