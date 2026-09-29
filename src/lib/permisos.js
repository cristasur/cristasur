// ============================================================
// Candados de rol para usar DENTRO de cada ruta de la API.
// El middleware ya filtra, pero cada ruta sensible se protege sola
// también (si algún día cambia el middleware, no queda abierta).
//
//   const bloqueo = await soloStaff(); if (bloqueo) return bloqueo
// ============================================================
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function soloStaff() {
  const u = await getCurrentUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['admin', 'editor'].includes(u.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  return null
}

export async function soloAdmin() {
  const u = await getCurrentUser()
  if (!u) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (u.role !== 'admin') return NextResponse.json({ error: 'Acción sólo permitida para administradores' }, { status: 403 })
  return null
}
