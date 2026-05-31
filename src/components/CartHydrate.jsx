'use client'
// Componente cliente que toma items codificados de la URL y los
// reinsta en el carrito. Usado por /carrito?items=...
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useCart } from './CartProvider'

function b64ToUtf8(b64) {
  try {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

function decodeItems(encoded) {
  if (!encoded) return null
  try {
    // base64url → base64 → JSON
    const b64 = String(encoded).replace(/-/g, '+').replace(/_/g, '/')
    const json = b64ToUtf8(b64)
    if (!json) return null
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
  const pathname = usePathname()
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
    // Limpia el query param ?cart=... de la URL sin redirigir al usuario a otra página
    router.replace(pathname)
  }, [encoded, reorderFromSnapshot, setOpen, router, pathname])

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
