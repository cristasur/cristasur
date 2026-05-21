'use client'
// Mini carrito flotante que aparece en móvil al hacer scroll.
// Solo visible en pantallas < md cuando el usuario baja más de 80px.
import { useEffect, useState } from 'react'
import { useCart } from './CartProvider'
import Icon from './Icon'

export default function StickyCartMobile() {
  const { count, setOpen } = useCart()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 80)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label={`Ver carrito (${count} productos)`}
      className="fixed top-3 right-3 z-[45] md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-white border border-slate-200 shadow-lg active:scale-95 transition-transform"
    >
      <Icon name="cart" className="w-5 h-5 text-slate-700" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full w-5 h-5 grid place-items-center shadow">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
