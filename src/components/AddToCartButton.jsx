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
    const price =
      variant && Number.isFinite(Number(variant.price))
        ? Number(variant.price)
        : Number(product.price) || 0
    const image = variant?.image || product.image || ''
    const categoryIds = Array.isArray(product.categories)
      ? product.categories.map((c) => String(c?._id || c))
      : []
    // Mayoreo a nivel de producto (no aplica a variantes — si una variante
    // tiene su propio precio, ese precio gana sobre el mayoreo del padre).
    const wholesalePrice =
      !variant && Number.isFinite(Number(product.wholesalePrice))
        ? Number(product.wholesalePrice)
        : null
    const wholesaleMinQty =
      !variant && Number.isFinite(Number(product.wholesaleMinQty))
        ? Number(product.wholesaleMinQty)
        : null

    addItem(
      {
        productId: String(product._id),
        name: product.name,
        price,
        wholesalePrice,
        wholesaleMinQty,
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
