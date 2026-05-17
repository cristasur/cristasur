'use client'
import { useCart } from './CartProvider'
import Icon from './Icon'

export default function CartButton({ className = '' }) {
  const { count, setOpen } = useCart()
  return (
    <button
      onClick={() => setOpen(true)}
      className={
        'relative inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 ' +
        className
      }
      aria-label={`Ver carrito (${count} productos)`}
    >
      <Icon name="cart" className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">Carrito</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full w-5 h-5 grid place-items-center shadow">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
