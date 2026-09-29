export async function requestOrder(body, { fetcher = fetch, timeoutMs = 15000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetcher('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      signal: controller.signal, body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.ok || !data.pedido?.items?.length) {
      throw new Error(data.error || 'No se pudo validar el pedido. Intenta nuevamente.')
    }
    return data
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) {
      throw new Error('No pudimos confirmar el pedido. Revisa tu conexión e intenta nuevamente.')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
