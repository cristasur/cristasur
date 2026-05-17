'use client'
// ============================================================
// Botón de pedido por WhatsApp con selector de cantidad.
// Construye un mensaje pre-rellenado con nombre, cantidad,
// precio, subtotal y link del producto (para que WhatsApp
// muestre la imagen como preview via Open Graph).
// ============================================================
import { useState } from 'react'
import Icon from './Icon'

// Número de WhatsApp de CRISTASUR en formato internacional (sin + ni espacios)
const WHATSAPP_PHONE = '529994731919'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n)
}

export default function WhatsAppOrder({ product, productUrl }) {
  const [qty, setQty] = useState(1)
  const subtotal = product.price * qty

  const dec = () => setQty((q) => Math.max(1, q - 1))
  const inc = () => setQty((q) => q + 1)
  const onInput = (e) => {
    const v = parseInt(e.target.value, 10)
    setQty(Number.isFinite(v) && v > 0 ? v : 1)
  }

  // Mensaje en WhatsApp. Los asteriscos dan negritas en el chat.
  const lines = [
    'Hola CRISTASUR, me interesa este producto:',
    '',
    `*Producto:* ${product.name}`,
    `*Cantidad:* ${qty}`,
    `*Precio unitario:* ${formatPrice(product.price)}`,
    `*Subtotal estimado:* ${formatPrice(subtotal)}`,
  ]
  if (product.sku) lines.push(`*SKU:* ${product.sku}`)
  if (productUrl) {
    lines.push('')
    lines.push(`Ver producto: ${productUrl}`)
  }
  const message = lines.join('\n')
  const href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            Cantidad
          </div>
          <div className="mt-2 inline-flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden">
            <button
              type="button"
              onClick={dec}
              aria-label="Disminuir cantidad"
              className="w-10 h-10 grid place-items-center text-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              disabled={qty <= 1}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={onInput}
              className="w-16 text-center font-semibold text-slate-900 border-x border-slate-200 py-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={inc}
              aria-label="Aumentar cantidad"
              className="w-10 h-10 grid place-items-center text-lg text-slate-700 hover:bg-slate-100"
            >
              +
            </button>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            Subtotal
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {formatPrice(subtotal)}
          </div>
        </div>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm"
      >
        <Icon name="whatsapp" className="w-5 h-5" />
        Pedir por WhatsApp
      </a>
      <p className="mt-2 text-[11px] text-slate-500 text-center">
        Te responderemos con disponibilidad, envío y forma de pago.
      </p>
    </div>
  )
}
