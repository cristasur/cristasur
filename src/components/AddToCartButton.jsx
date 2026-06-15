'use client'
// Botón reutilizable para añadir al carrito. Recibe el producto
// (y opcionalmente una variante ya seleccionada).
import { useState } from 'react'
import { useCart } from './CartProvider'
import Icon from './Icon'

// Decide qué variante mandar al carrito cuando el cliente NO eligió ninguna
// explícitamente (caso típico: clic desde una card del catálogo).
// Orden de preferencia:
//   1) Si el producto tiene un `color` base → crear una variante virtual con
//      ese color (representa al producto "tal como sale en la foto principal").
//   2) Si no hay color base pero hay variantes reales → primera con stock.
//   3) Sin variantes → null (producto sencillo).
function defaultEffectiveVariant(p) {
  if (!p) return null
  const baseColor = String(p?.color || '').trim()
  if (baseColor) {
    return {
      label: 'Color',
      value: baseColor,
      image: p.image || '',
      // No tiene sku/stock/precio propios — heredan del padre.
      sku: '',
      stock: null,
      price: null,
    }
  }
  if (!Array.isArray(p?.variants) || p.variants.length === 0) return null
  const withStock = p.variants.find((v) => {
    const s = Number(v?.stock)
    return Number.isFinite(s) && s > 0
  })
  return withStock || p.variants[0]
}

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
        qtyStep,
        sku,
        image,
        variantLabel: effectiveVariant?.label || '',
        variantValue: effectiveVariant?.value || '',
        categoryIds,
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
