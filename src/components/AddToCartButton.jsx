'use client'
// Botón reutilizable para añadir al carrito. Recibe el producto
// (y opcionalmente una variante ya seleccionada).
import { useState } from 'react'
import { useCart } from './CartProvider'
import Icon from './Icon'

export default function AddToCartButton({
  product,
  variant,
  qty = 1,
  className = '',
  label = 'Añadir al carrito',
  compact = false,
  disabled = false,
}) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function onClick(e) {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (disabled) return
    // Usar el precio de la variante SOLO si tiene un valor propio positivo.
    // Number(null) === 0 es finito — hay que excluir null/vacío explícitamente.
    const vp = variant?.price
    const variantHasPrice =
      vp !== null && vp !== undefined && vp !== '' &&
      Number.isFinite(Number(vp)) && Number(vp) > 0
    const price = variantHasPrice ? Number(vp) : Number(product.price) || 0
    const image = variant?.image || (Array.isArray(variant?.images) && variant.images[0]) || product.image || ''
    const categoryIds = Array.isArray(product.categories)
      ? product.categories.map((c) => String(c?._id || c))
      : []
    // Mayoreo: usar de la variante si tiene, si no heredar del producto.
    const rawWp = variant?.wholesalePrice ?? product.wholesalePrice
    const rawWq = variant?.wholesaleMinQty ?? product.wholesaleMinQty
    const wholesalePrice =
      Number.isFinite(Number(rawWp)) && Number(rawWp) > 0
        ? Number(rawWp)
        : null
    const wholesaleMinQty =
      Number.isFinite(Number(rawWq)) && Number(rawWq) >= 2
        ? Number(rawWq)
        : null

    // Múltiplo de venta del producto (qtyStep). Si el cliente pulsó "Comprar"
    // desde el home/card y `qty` es 1, ascendemos automáticamente al step.
    const qtyStep = Number(product.qtyStep) >= 1 ? Math.floor(Number(product.qtyStep)) : 1
    addItem(
      {
        productId: String(product._id),
        name: product.name,
        price,
        wholesalePrice,
        wholesaleMinQty,
        qtyStep,
        image,
        variantLabel: variant?.label || '',
        variantValue: variant?.value || '',
        categoryIds,
      },
      qty
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={
          'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ' +
          (disabled
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-slate-900 hover:bg-black text-white') +
          ' ' +
          className
        }
        aria-label={label}
      >
        <Icon name="cart" className="w-4 h-4" />
        {added ? '¡Añadido!' : label}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold ' +
        (disabled
          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
          : 'bg-slate-900 hover:bg-black text-white') +
        ' ' +
        className
      }
    >
      <Icon name="cart" className="w-5 h-5" />
      {added ? '¡Añadido al carrito!' : label}
    </button>
  )
}
