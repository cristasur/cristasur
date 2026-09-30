import { describe, it, expect, vi } from 'vitest'
import { requestOrder } from '@/lib/checkout-request'
import { signShippingQuote, verifyShippingQuote } from '@/lib/shipping-token'
import { SignJWT } from 'jose'

describe('validación antes de abrir WhatsApp', () => {
  it.each([400, 409, 429, 500])('rechaza HTTP %s sin usar el carrito local', async (status) => {
    await expect(requestOrder({}, { fetcher: async () => new Response(JSON.stringify({ error: 'Pedido rechazado' }), { status }) }))
      .rejects.toThrow('Pedido rechazado')
  })
  it('rechaza una respuesta incompleta', async () => {
    await expect(requestOrder({}, { fetcher: async () => Response.json({ ok: true }) })).rejects.toThrow()
  })
  it('devuelve exclusivamente el pedido validado', async () => {
    const data = { ok: true, pedido: { items: [{ qty: 2, unitPrice: 10 }], total: 20 } }
    expect(await requestOrder({}, { fetcher: async () => Response.json(data) })).toEqual(data)
  })
  it('interrumpe una conexión que no responde', async () => {
    vi.useFakeTimers()
    const fetcher = (_, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })
    const assertion = expect(requestOrder({}, { fetcher, timeoutMs: 100 })).rejects.toThrow('conexión')
    await vi.advanceTimersByTimeAsync(100)
    await assertion
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })
})

describe('tarifas firmadas', () => {
  const items = [{ productId: 'a'.repeat(24), qty: 2 }]
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters'
  const option = { price: 120, carrier: 'carrier', service: 'standard' }
  it('recupera la tarifa emitida por el servidor', async () => {
    const token = await signShippingQuote(option, '97000', items)
    expect(await verifyShippingQuote(token, items)).toEqual({ price: 120, label: 'carrier standard, CP 97000' })
  })
  it('rechaza un token manipulado', async () => {
    const token = await signShippingQuote(option, '97000', items)
    const [head, body, signature] = token.split('.')
    const payload = JSON.parse(Buffer.from(body, 'base64url'))
    payload.price = 0
    await expect(verifyShippingQuote(`${head}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`, items)).rejects.toThrow()
  })
  it('rechaza otra cantidad; acepta la de prueba marcándola', async () => {
    const token = await signShippingQuote(option, '97000', items)
    await expect(verifyShippingQuote(token, [{ ...items[0], qty: 3 }])).rejects.toThrow()
    const testToken = await signShippingQuote(option, '97000', items, true)
    const quote = await verifyShippingQuote(testToken, items)
    expect(quote).toMatchObject({ test: true, price: 120 })
  })
  it('rechaza tarifas vencidas', async () => {
    const token = await new SignJWT({ price: 120 }).setProtectedHeader({ alg: 'HS256' })
      .setIssuer('cristasur-shipping').setAudience('order').setExpirationTime(1)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))
    await expect(verifyShippingQuote(token, items)).rejects.toThrow()
  })
})
