import { beforeEach, it, expect, vi } from 'vitest'

const mock = vi.hoisted(() => ({ read: vi.fn(), upload: vi.fn(), list: vi.fn(), remove: vi.fn() }))
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }))
vi.mock('mongoose', () => ({ default: { connection: { db: { collection: (name) => ({ find: () => ({ toArray: () => mock.read(name) }) }) } } } }))
vi.mock('@/lib/r2', () => ({ r2Upload: mock.upload, r2List: mock.list, r2Delete: mock.remove }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ role: 'admin' }) }))
import { generateBackup } from '@/lib/backup-generator'
import { GET } from '@/app/api/cron/backup/route'

beforeEach(() => {
  mock.read.mockReset().mockResolvedValue([])
  mock.upload.mockReset().mockResolvedValue(undefined)
  mock.list.mockReset().mockResolvedValue([])
  mock.remove.mockReset()
})
it('incluye todos los datos de portada, contacto y analítica', async () => {
  const backup = await generateBackup()
  expect(backup.files.map((x) => x.name)).toEqual(expect.arrayContaining(['orders.json', 'homesections.json', 'pageimages.json', 'contactmessages.json', 'pageviews.json']))
})
it('falla ante una colección ilegible', async () => {
  mock.read.mockImplementation(async (name) => { if (name === 'orders') throw new Error('read failed'); return [] })
  await expect(generateBackup()).rejects.toThrow('orders')
})
it('no sube ni elimina respaldos si falta una colección', async () => {
  mock.read.mockRejectedValue(new Error('read failed'))
  const response = await GET(new Request('https://example.test/api/cron/backup'))
  expect(response.status).toBe(500)
  expect(mock.upload).not.toHaveBeenCalled()
  expect(mock.list).not.toHaveBeenCalled()
  expect(mock.remove).not.toHaveBeenCalled()
})
it('no limpia respaldos si una subida falla', async () => {
  mock.upload.mockRejectedValueOnce(new Error('upload failed'))
  const response = await GET(new Request('https://example.test/api/cron/backup'))
  expect(response.status).toBe(500)
  expect(mock.list).not.toHaveBeenCalled()
})
