// /admin/pedidos — Lista de pedidos con cambio rápido de estado.
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import OrdersClient from './OrdersClient'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pedidos · CRISTASUR Admin' }

async function loadOrders(searchParams) {
  await dbConnect()
  const status = searchParams?.status || ''
  const filter = {}
  if (status) filter.status = status
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()
  return JSON.parse(JSON.stringify(orders))
}

export default async function PedidosPage({ searchParams }) {
  const [orders, user] = await Promise.all([loadOrders(searchParams), getCurrentUser()])
  return (
    <OrdersClient
      initialOrders={orders}
      initialStatus={searchParams?.status || ''}
      isAdmin={user?.role === 'admin'}
    />
  )
}
