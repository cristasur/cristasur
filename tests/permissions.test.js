import { it, expect, vi } from 'vitest'
vi.mock('@/lib/auth', () => ({ AUTH_COOKIE_NAME: 'token', verifyToken: async (role) => role ? { role } : null }))
import { middleware } from '@/middleware'

it.each([
  ['GET', '/api/users', null, 401], ['GET', '/api/users', 'customer', 403],
  ['GET', '/api/users', 'editor', 403], ['GET', '/api/users', 'admin', 200],
  ['GET', '/api/coupons', null, 401], ['GET', '/api/products/export', null, 401],
  ['POST', '/api/products', 'customer', 403], ['POST', '/api/categories', 'customer', 403],
  ['PATCH', '/api/orders/aaaaaaaaaaaaaaaaaaaaaaaa', 'customer', 403],
  ['PATCH', '/api/users/me', 'customer', 200], ['POST', '/api/analytics/track', null, 200],
])('%s %s rol %s => %s', async (method, path, role, status) => {
  const url = `https://example.test${path}`
  const result = await middleware({ method, nextUrl: new URL(url), url,
    headers: new Headers({ host: 'example.test', origin: 'https://example.test' }),
    cookies: { get: () => role ? { value: role } : undefined },
  })
  expect(result.status).toBe(status)
})
