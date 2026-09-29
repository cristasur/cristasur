import { SignJWT, jwtVerify } from 'jose'

function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET inválida')
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

// Agrupar por producto permite comparar el cotizador con las líneas por variante.
export function shippingCartKey(items) {
  const quantities = new Map()
  for (const item of items) {
    const id = String(item.productId || item.product || '')
    if (!/^[a-f0-9]{24}$/i.test(id) || !Number.isSafeInteger(item.qty) || item.qty < 1) {
      throw new Error('Carrito inválido para cotizar')
    }
    quantities.set(id, (quantities.get(id) || 0) + item.qty)
  }
  return JSON.stringify([...quantities].sort(([a], [b]) => a.localeCompare(b)))
}

export async function signShippingQuote(option, postalCode, items, test = false) {
  if (!Number.isFinite(option.price) || option.price < 0) throw new Error('Tarifa inválida')
  return new SignJWT({
    cart: shippingCartKey(items), price: option.price, postalCode, test,
    label: `${option.carrier} ${option.serviceName || option.service}, CP ${postalCode}`,
  }).setProtectedHeader({ alg: 'HS256' }).setIssuer('cristasur-shipping')
    .setAudience('order').setIssuedAt().setExpirationTime('10m').sign(secret())
}

export async function verifyShippingQuote(token, items) {
  const { payload } = await jwtVerify(token, secret(), {
    algorithms: ['HS256'], issuer: 'cristasur-shipping', audience: 'order',
  })
  if (payload.cart !== shippingCartKey(items) ||
      !Number.isFinite(payload.price) || payload.price < 0 || typeof payload.label !== 'string') {
    throw new Error('La cotización no corresponde a este pedido')
  }
  // Mientras Envia esté en modo prueba (ENVIA_ENV distinto de production)
  // el pedido NO se bloquea: se acepta, pero la etiqueta avisa que la
  // tarifa es de prueba para que la tienda la confirme por WhatsApp.
  return { price: payload.price, label: payload.test ? `${payload.label} (tarifa de prueba, por confirmar)` : payload.label }
}
