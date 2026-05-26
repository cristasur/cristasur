import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { sendAbandonedCartEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Vercel cron calls this with Authorization: Bearer CRON_SECRET
export async function GET(req) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await dbConnect()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
  // Find users with non-empty cart, updated > 24h ago, reminder not sent in last 7 days
  const users = await User.find({
    'cart.0': { $exists: true },
    cartUpdatedAt: { $lt: cutoff, $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    $or: [
      { cartReminderSentAt: null },
      { cartReminderSentAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ],
    role: 'customer',
    emailVerified: true,
  }).limit(50)

  let sent = 0
  for (const user of users) {
    try {
      const total = user.cart.reduce((sum, x) => sum + (x.price * x.qty), 0)
      await sendAbandonedCartEmail(user.email, user.name, user.cart, total)
      user.cartReminderSentAt = new Date()
      await user.save()
      sent++
    } catch {}
  }
  return NextResponse.json({ ok: true, sent })
}
