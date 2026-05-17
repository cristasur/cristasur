'use client'
// Componente cliente que toma items codificados de la URL y los
// reinsta en el carrito. Usado por /carrito?items=...
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from './CartProvider'

function decodeItems(encoded) {
  if (!encoded) return null
  try {
    // base64url → base64 → JSON
    const b64 = String(encoded).replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(b64)))
    const data = JSON.parse(json)
    if (!Array.isArray(data?.items)) return null
    return data.items
  } catch {
    return null
  }
}

export default function CartHydrate({ encoded }) {
  const { reorderFromSnapshot, setOpen } = useCart()
  const router = useRouter()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const items = decodeItems(encoded)
    if (!items?.length) {
      setStatus('empty')
      return
    }
    reorderFromSnapshot({ items, at: new Date().toISOString() })
    setOpen(true)
    setStatus('ok')
    // Limpia la URL para no dejar el blob expuesto
    router.replace('/')
  }, [encoded, reorderFromSnapshot, setOpen, router])

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      {status === 'loading' && (
        <p className="text-slate-500">Cargando carrito compartido…</p>
      )}
      {status === 'empty' && (
        <>
          <h1 className="text-2xl font-black text-slate-900">
            Este enlace no contiene productos
          </h1>
          <p className="text-slate-500 mt-2">
            Pide a quien te lo compartió que lo genere de nuevo desde su carrito.
          </p>
        </>
      )}
      {status === 'ok' && (
        <>
          <h1 className="text-2xl font-black text-slate-900">¡Carrito cargado!</h1>
          <p className="text-slate-500 mt-2">
            Se abrirá el carrito a la derecha. Puedes ajustar cantidades y enviar
            por WhatsApp.
          </p>
        </>
      )}
    </div>
  )
}
