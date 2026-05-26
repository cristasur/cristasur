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

function lineKey(productId, variantValue) {
  return variantValue ? `${productId}::${variantValue}` : String(productId)
}

// Calcula el precio efectivo de una línea según si activa mayoreo o no.
export function effectiveUnitPrice(item) {
  const base = Number(item?.price) || 0
  const wp = Number(item?.wholesalePrice)
  const minQ = Number(item?.wholesaleMinQty)
  if (Number.isFinite(wp) && wp > 0 && Number.isFinite(minQ) && minQ >= 2 && item?.qty >= minQ) {
    return wp
  }
  return base
}

export function isWholesaleActive(item) {
  return effectiveUnitPrice(item) !== (Number(item?.price) || 0)
}

function mergeCarts(local, server) {
  // Combina por (productId + variantValue): si el item existe en ambos, suma
  // las cantidades. Si sólo está en uno, se conserva.
  const map = new Map()
  for (const x of [...(server || []), ...(local || [])]) {
    if (!x?.productId) continue
    const k = lineKey(x.productId, x.variantValue)
    if (map.has(k)) {
      const a = map.get(k)
      map.set(k, { ...a, qty: (a.qty || 0) + (x.qty || 0) })
    } else {
      map.set(k, { ...x })
    }
  }
  return Array.from(map.values())
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

  const addItem = useCallback((item, qty = 1) => {
    setItems((xs) => {
      const key = lineKey(item.productId, item.variantValue)
      const idx = xs.findIndex((x) => lineKey(x.productId, x.variantValue) === key)
      if (idx >= 0) {
        const next = [...xs]
        next[idx] = { ...next[idx], qty: next[idx].qty + qty }
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
          wholesalePrice:
            Number.isFinite(Number(item.wholesalePrice)) && Number(item.wholesalePrice) > 0
              ? Number(item.wholesalePrice)
              : null,
          wholesaleMinQty:
            Number.isFinite(Number(item.wholesaleMinQty)) && Number(item.wholesaleMinQty) >= 2
              ? Number(item.wholesaleMinQty)
              : null,
          image: item.image || '',
          variantLabel: item.variantLabel || '',
          variantValue: item.variantValue || '',
          categoryIds: Array.isArray(item.categoryIds) ? item.categoryIds : [],
          qty,
        },
      ]
    })
    setOpen(true)
  }, [])

  const removeItem = useCallback((productId, variantValue) => {
    const key = lineKey(productId, variantValue)
    setItems((xs) => xs.filter((x) => lineKey(x.productId, x.variantValue) !== key))
  }, [])

  const updateQty = useCallback((productId, variantValue, qty) => {
    const key = lineKey(productId, variantValue)
    setItems((xs) =>
      xs
        .map((x) => (lineKey(x.productId, x.variantValue) === key ? { ...x, qty } : x))
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

  const checkoutViaWhatsApp = useCallback(
    async (couponInfo) => {
      if (!items.length) return
      const lines = items.map((x) => {
        const variant = x.variantValue ? ` (${x.variantLabel || 'Variante'}: ${x.variantValue})` : ''
        const eff = effectiveUnitPrice(x)
        const lineTotal = eff * x.qty
        const wholesale = isWholesaleActive(x) ? ' ⭐ Mayoreo' : ''
        return `▸ *${x.name}*${variant}\n  Cant: ${x.qty} × $${eff.toFixed(2)}${wholesale}\n  Subtotal: $${lineTotal.toFixed(2)}`
      })
      let summary = ''
      if (savings > 0) summary += `💚 Ahorro mayoreo: -$${savings.toFixed(2)}\n`
      if (couponInfo?.code) {
        summary += `🏷️ Cupón ${couponInfo.code}: -$${Number(couponInfo.discount || 0).toFixed(2)}\n`
      }
      const finalTotal = couponInfo?.total ?? subtotal
      summary += `💰 *TOTAL: $${finalTotal.toFixed(2)}*\n`
      const msg = `¡Hola CRISTASUR! 👋 Quisiera hacer el siguiente pedido:\n\n🛒 *DETALLE DEL PEDIDO*\n──────────────────────\n${lines.join('\n')}\n──────────────────────\n${summary}¿Me pueden confirmar disponibilidad y datos de envío? 🙏`
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
        const total = couponInfo?.total ?? subtotal
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
      user,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
