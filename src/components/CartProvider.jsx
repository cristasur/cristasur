'use client'
// ============================================================
// Contexto del carrito. Persiste en localStorage.
// Exporta useCart() para leer/modificar y <CartProvider>.
// El checkout abre WhatsApp con el pedido pre-escrito.
//
// Soporta precio mayoreo: si el item trae wholesalePrice y
// wholesaleMinQty, y la cantidad alcanza el mínimo, se aplica
// el precio mayoreo automáticamente al subtotal y al mensaje de
// WhatsApp.
// ============================================================
import { toStock } from '@/lib/pricing'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'cristasur:cart:v1'
const LAST_ORDER_KEY = 'cristasur:lastOrder:v1'
const COOKIE_TOKEN_KEY = 'cristasur:cookieToken:v1'
const WHATSAPP_PHONE = '529994731919'

function genToken() {
  // Token corto, no usado para auth — sólo para enlazar pedidos al cliente
  // anónimo y permitir "reorden con un clic".
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const CartContext = createContext(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}

// Clave de línea de carrito.
// Distingue por (productId + variantLabel + variantValue). Si no hay variante
// se cae a productId. Normalizamos a lowercase/trim para que "Rojo" y " rojo "
// se traten igual y no se dupliquen.
function norm(s) {
  return String(s || '').toLowerCase().trim()
}
// Tope de existencias de una línea. null = sin control de inventario.
// Se guarda en la línea para que los botones +/− del carrito no puedan
// subir por encima de lo que realmente hay en bodega.
function capQty(qty, step, maxStock) {
  const min = Math.max(step, 1)
  // null/undefined = sin control de inventario → sin tope.
  if (maxStock == null) return Math.max(min, qty)
  const n = Number(maxStock)
  if (!Number.isFinite(n)) return Math.max(min, qty)
  const tope = Math.floor(n / min) * min
  if (tope < min) return 0
  return Math.min(Math.max(min, qty), tope)
}

function lineKey(productId, variantValue, variantLabel) {
  const v = norm(variantValue)
  if (!v) return String(productId)
  const l = norm(variantLabel) || 'var'
  return `${productId}::${l}::${v}`
}

// Calcula el precio efectivo de una línea según el nivel que alcance la
// cantidad: menudeo → mayoreo → por ciento. Gana el nivel más barato que
// el cliente ya haya alcanzado, igual que muestra la tarjeta del catálogo.
export function effectiveUnitPrice(item) {
  const base = Number(item?.price) || 0
  const qty = Number(item?.qty) || 0
  let price = base

  const wp = Number(item?.wholesalePrice)
  const wq = Number(item?.wholesaleMinQty)
  if (Number.isFinite(wp) && wp > 0 && Number.isFinite(wq) && wq >= 2 && qty >= wq) {
    price = wp
  }

  const hp = Number(item?.hundredPrice)
  const hq = Number(item?.hundredMinQty)
  if (Number.isFinite(hp) && hp > 0 && Number.isFinite(hq) && hq >= 2 && qty >= hq && hp < price) {
    price = hp
  }

  return price
}

export function isWholesaleActive(item) {
  return effectiveUnitPrice(item) !== (Number(item?.price) || 0)
}

function mergeCarts(local, server) {
  // Estrategia: el servidor es la fuente de verdad para items que ya existen
  // en ambos lados (evita duplicar al recargar la página).
  // Solo se agregan los items que están ÚNICAMENTE en local (añadidos offline
  // o antes de iniciar sesión y que el servidor no conoce).
  const serverList = (server || []).filter((x) => x?.productId)
  const localList  = (local  || []).filter((x) => x?.productId)

  const serverKeys = new Set(
    serverList.map((x) => lineKey(x.productId, x.variantValue, x.variantLabel))
  )
  const localOnly  = localList.filter(
    (x) => !serverKeys.has(lineKey(x.productId, x.variantValue, x.variantLabel))
  )

  return [...serverList, ...localOnly]
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [user, setUser] = useState(null) // session info {id, role, wholesaleAccess}

  // Cargar del localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Detecta sesión + sincroniza con servidor. Si el usuario está logueado,
  // hace merge entre lo que tenía local y lo que está guardado en BD,
  // y persiste el resultado.
  useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    async function syncOnLogin() {
      try {
        const r = await fetch('/api/auth/me', { credentials: 'include' })
        const j = await r.json().catch(() => ({}))
        if (cancelled) return
        const u = j?.user || null
        setUser(u)
        if (!u) return
        // Cargamos el carrito guardado y lo mergeamos con el local
        const cr = await fetch('/api/cart', { credentials: 'include' })
        if (!cr.ok) return
        const cj = await cr.json().catch(() => ({}))
        const serverItems = Array.isArray(cj?.items) ? cj.items : []
        if (cancelled) return
        setItems((local) => {
          const merged = mergeCarts(local, serverItems)
          // Persistir el merge al servidor
          fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items: merged }),
          }).catch(() => {})
          return merged
        })
      } catch {}
    }
    syncOnLogin()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  // Guardar en localStorage + (si hay user logueado) push al servidor
  // con un debounce simple.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
    if (!user) return
    const t = setTimeout(() => {
      fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items }),
      }).catch(() => {})
    }, 700)
    return () => clearTimeout(t)
  }, [items, hydrated, user])

  const addItem = useCallback((item, qty) => {
    setItems((xs) => {
      const key = lineKey(item.productId, item.variantValue, item.variantLabel)
      const idx = xs.findIndex(
        (x) => lineKey(x.productId, x.variantValue, x.variantLabel) === key
      )
      // Múltiplo de venta: si el producto se vende de N en N, qty siempre
      // se redondea hacia arriba al múltiplo. qty=undefined → step.
      const step = Number(item.qtyStep) >= 1 ? Math.floor(Number(item.qtyStep)) : 1
      const requested = Number(qty)
      const finalQty = Number.isFinite(requested) && requested > 0
        ? Math.max(step, Math.ceil(requested / step) * step)
        : step
      const maxStock = toStock(item.maxStock)

      if (idx >= 0) {
        const next = [...xs]
        const tope = next[idx].maxStock ?? maxStock
        const sumada = capQty(next[idx].qty + finalQty, step, tope)
        next[idx] = { ...next[idx], qty: sumada || next[idx].qty, maxStock: tope }
        return next
      }
      return [
        ...xs,
        {
          productId: String(item.productId),
          name: item.name,
          price: Number(item.price) || 0,
          // Mayoreo (opcional): si vienen, se persisten en la línea para que
          // el cálculo siempre tenga la info al cambiar la cantidad.
          hundredPrice:
            Number.isFinite(Number(item.hundredPrice)) && Number(item.hundredPrice) > 0
              ? Number(item.hundredPrice)
              : null,
          hundredMinQty:
            Number.isFinite(Number(item.hundredMinQty)) && Number(item.hundredMinQty) >= 2
              ? Number(item.hundredMinQty)
              : null,
          wholesalePrice:
            Number.isFinite(Number(item.wholesalePrice)) && Number(item.wholesalePrice) > 0
              ? Number(item.wholesalePrice)
              : null,
          wholesaleMinQty:
            Number.isFinite(Number(item.wholesaleMinQty)) && Number(item.wholesaleMinQty) >= 2
              ? Number(item.wholesaleMinQty)
              : null,
          // Múltiplo: persistido en la línea para respetarlo en +/− del drawer.
          qtyStep: step > 1 ? step : null,
          // SKU efectivo (variante o producto base). Útil para WhatsApp y pedidos.
          sku: String(item.sku || '').trim(),
          image: item.image || '',
          variantLabel: item.variantLabel || '',
          variantValue: item.variantValue || '',
          categoryIds: Array.isArray(item.categoryIds) ? item.categoryIds : [],
          maxStock,
          qty: capQty(finalQty, step, maxStock) || finalQty,
        },
      ]
    })
    setOpen(true)
  }, [])

  const removeItem = useCallback((productId, variantValue, variantLabel) => {
    const key = lineKey(productId, variantValue, variantLabel)
    setItems((xs) =>
      xs.filter((x) => lineKey(x.productId, x.variantValue, x.variantLabel) !== key)
    )
  }, [])

  // Cambia cantidad respetando el qtyStep del item. Si la nueva qty queda < step,
  // se elimina la línea.
  const updateQty = useCallback((productId, variantValue, qty, variantLabel) => {
    const key = lineKey(productId, variantValue, variantLabel)
    setItems((xs) =>
      xs
        .map((x) => {
          if (lineKey(x.productId, x.variantValue, x.variantLabel) !== key) return x
          const step = Number(x.qtyStep) >= 1 ? x.qtyStep : 1
          if (qty < step) return { ...x, qty: 0 }
          // Snap al múltiplo más cercano
          const snapped = Math.max(step, Math.round(qty / step) * step)
          return { ...x, qty: capQty(snapped, step, x.maxStock) }
        })
        .filter((x) => x.qty > 0)
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const { count, subtotal, savings } = useMemo(() => {
    let count = 0
    let subtotal = 0
    let savings = 0
    for (const x of items) {
      count += x.qty
      const base = Number(x.price) || 0
      const eff = effectiveUnitPrice(x)
      subtotal += eff * x.qty
      if (eff < base) savings += (base - eff) * x.qty
    }
    return { count, subtotal, savings }
  }, [items])

  // Recupera el "último pedido" si existe, para mostrar "Repetir pedido del X de Y".
  const [lastOrder, setLastOrder] = useState(null)
  useEffect(() => {
    if (!hydrated) return
    try {
      const raw = localStorage.getItem(LAST_ORDER_KEY)
      if (raw) setLastOrder(JSON.parse(raw))
    } catch {}
  }, [hydrated])

  // `shipping` es la opción de paquetería que el cliente eligió en el
  // cotizador del carrito. Opcional: si no cotizó, el flujo es el de antes.
  const checkoutViaWhatsApp = useCallback(
    async (couponInfo, shipping) => {
      if (!items.length) return
      const lines = items.map((x) => {
        const variant = x.variantValue ? ` (${x.variantLabel || 'Variante'}: ${x.variantValue})` : ''
        const eff = effectiveUnitPrice(x)
        const lineTotal = eff * x.qty
        const wholesale = isWholesaleActive(x) ? ' ⭐ Mayoreo' : ''
        const skuStr = String(x.sku || '').trim()
        const skuPart = skuStr ? `\n  SKU: ${skuStr}` : ''
        return `▸ *${x.name}*${variant}${skuPart}\n  Cant: ${x.qty} × $${eff.toFixed(2)}${wholesale}\n  Subtotal: $${lineTotal.toFixed(2)}`
      })
      let summary = ''
      if (savings > 0) summary += `💚 Ahorro mayoreo: -$${savings.toFixed(2)}\n`
      if (couponInfo?.code) {
        summary += `🏷️ Cupón ${couponInfo.code}: -$${Number(couponInfo.discount || 0).toFixed(2)}\n`
      }
      const productsTotal = couponInfo?.total ?? subtotal
      const shipCost = Number(shipping?.price) || 0
      const finalTotal = productsTotal + shipCost

      if (shipping) {
        summary += `📦 Envío (${shipping.carrier} ${shipping.serviceName || shipping.service}`
        summary += shipping.postalCode ? `, CP ${shipping.postalCode}` : ''
        summary += `): $${shipCost.toFixed(2)}\n`
      }
      summary += `💰 *TOTAL: $${finalTotal.toFixed(2)}*\n`

      const cierre = shipping
        ? '¿Me confirman disponibilidad para cerrar el pedido? 🙏'
        : '¿Me pueden confirmar disponibilidad y datos de envío? 🙏'
      const msg = `¡Hola CRISTASUR! 👋 Quisiera hacer el siguiente pedido:\n\n🛒 *DETALLE DEL PEDIDO*\n──────────────────────\n${lines.join('\n')}\n──────────────────────\n${summary}${cierre}`
      const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`

      // Cookie token persistente (no-auth) para enlazar este pedido al cliente.
      let token = ''
      try {
        token = localStorage.getItem(COOKIE_TOKEN_KEY) || ''
        if (!token) {
          token = genToken()
          localStorage.setItem(COOKIE_TOKEN_KEY, token)
        }
      } catch {}

      // Registra el intent del lado del servidor (no bloquea el salto a wa.me).
      try {
        const total = (couponInfo?.total ?? subtotal) + (Number(shipping?.price) || 0)
        const discount = Number(couponInfo?.discount) || 0
        // No await — fire & forget. WhatsApp se abre de inmediato.
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((x) => ({
              productId: x.productId,
              name: x.name,
              image: x.image,
              sku: x.sku || '',
              variantLabel: x.variantLabel,
              variantValue: x.variantValue,
              qty: x.qty,
              unitPrice: effectiveUnitPrice(x),
              wholesaleApplied: isWholesaleActive(x),
            })),
            discount,
            couponCode: couponInfo?.code || '',
            cookieToken: token,
          }),
        }).catch(() => {})
      } catch {}

      // Guarda copia local para "repetir pedido"
      try {
        const snapshot = {
          at: new Date().toISOString(),
          items: items.map((x) => ({
            productId: x.productId,
            name: x.name,
            image: x.image,
            variantLabel: x.variantLabel,
            variantValue: x.variantValue,
            qty: x.qty,
            price: x.price,
            wholesalePrice: x.wholesalePrice ?? null,
            hundredPrice: x.hundredPrice ?? null,
            hundredMinQty: x.hundredMinQty ?? null,
            wholesaleMinQty: x.wholesaleMinQty ?? null,
            categoryIds: x.categoryIds || [],
          })),
        }
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(snapshot))
        setLastOrder(snapshot)
      } catch {}

      window.open(url, '_blank', 'noopener,noreferrer')
    },
    [items, subtotal, savings]
  )

  // Reordenar desde un snapshot (último pedido o link compartido)
  const reorderFromSnapshot = useCallback((snapshot) => {
    if (!snapshot?.items?.length) return
    setItems(snapshot.items.map((x) => ({ ...x, qty: x.qty || 1 })))
    setOpen(true)
  }, [])

  // Borrar el último pedido guardado (cuando ya no tiene productos válidos)
  const dismissLastOrder = useCallback(() => {
    try { localStorage.removeItem(LAST_ORDER_KEY) } catch {}
    setLastOrder(null)
  }, [])

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      savings,
      open,
      setOpen,
      addItem,
      removeItem,
      updateQty,
      clear,
      checkoutViaWhatsApp,
      lastOrder,
      reorderFromSnapshot,
      dismissLastOrder,
      user, // {id, email, name, role, wholesaleAccess, ...}
    }),
    [
      items,
      count,
      subtotal,
      savings,
      open,
      addItem,
      removeItem,
      updateQty,
      clear,
      checkoutViaWhatsApp,
      lastOrder,
      reorderFromSnapshot,
      dismissLastOrder,
      user,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
