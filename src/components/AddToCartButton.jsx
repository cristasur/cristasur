'use client'
// Botón reutilizable para añadir al carrito. Recibe el producto
// (y opcionalmente una variante ya seleccionada).
import { useState } from 'react'
import { useCart } from './CartProvider'
import { availableUnits, defaultEffectiveVariant } from '@/lib/pricing'
import Icon from './Icon'

// La lógica de "variante por defecto" vive en @/lib/pricing para que la
// tarjeta del catálogo muestre la foto y el SKU de la MISMA variante que
// este botón manda al carrito. Se re-exporta por compatibilidad.
export { defaultEffectiveVariant }

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
    // Variante efectiva: la que pasaron por prop o, si no, la default del producto
    // (que respeta el color base si existe → así "Azul" base no se vuelve "Rojo" variante).
    const effectiveVariant = variant || defaultEffectiveVariant(product)
    // Precio: SIEMPRE del producto padre. La variante solo aporta su valor
    // identificador (color/talla) — no debe cambiar precios.
    const price = Number(product.price) || 0
    const image =
      effectiveVariant?.image ||
      (Array.isArray(effectiveVariant?.images) && effectiveVariant.images[0]) ||
      product.image ||
      ''
    const categoryIds = Array.isArray(product.categories)
      ? product.categories.map((c) => String(c?._id || c))
      : []
    // Mayoreo: SIEMPRE del producto padre.
    const rawWp = product.wholesalePrice
    const rawWq = product.wholesaleMinQty
    const wholesalePrice =
      Number.isFinite(Number(rawWp)) && Number(rawWp) > 0
        ? Number(rawWp)
        : null
    const wholesaleMinQty =
      Number.isFinite(Number(rawWq)) && Number(rawWq) >= 2
        ? Number(rawWq)
        : null

    // Tercer nivel: precio por ciento. También del producto padre.
    const rawHp = product.hundredPrice
    const rawHq = product.hundredMinQty
    const hundredPrice =
      Number.isFinite(Number(rawHp)) && Number(rawHp) > 0 ? Number(rawHp) : null
    const hundredMinQty =
      Number.isFinite(Number(rawHq)) && Number(rawHq) >= 2 ? Number(rawHq) : null

    // Múltiplo de venta del producto (qtyStep). Si el cliente pulsó "Comprar"
    // desde el home/card y `qty` es 1, ascendemos automáticamente al step.
    const qtyStep = Number(product.qtyStep) >= 1 ? Math.floor(Number(product.qtyStep)) : 1
    // SKU efectivo: si la variante tiene SKU propio, lo usamos; si no, el del padre.
    const sku = String(effectiveVariant?.sku || product?.sku || '').trim()
    addItem(
      {
        productId: String(product._id),
        name: product.name,
        price,
        wholesalePrice,
        wholesaleMinQty,
        hundredPrice,
        hundredMinQty,
        qtyStep,
        sku,
        image,
        variantLabel: effectiveVariant?.label || '',
        variantValue: effectiveVariant?.value || '',
        categoryIds,
        // Tope de existencias de ESTA línea, para que el carrito no
        // deje subir la cantidad por encima de lo que hay en bodega.
        maxStock: availableUnits(
          product,
          effectiveVariant?.label,
          effectiveVariant?.value
        ),
      },
      qty
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  // Etiqueta: la del prop, o "¡Añadido!" justo después de añadirse.
  const visibleLabel = added
    ? (compact ? '¡Añadido!' : '¡Añadido al carrito!')
    : label

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
        aria-label={visibleLabel}
      >
        <Icon name="cart" className="w-4 h-4" />
        {visibleLabel}
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
      {visibleLabel}
    </button>
  )
}
