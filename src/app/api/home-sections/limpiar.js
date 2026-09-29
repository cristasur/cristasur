// ============================================================
// Limpieza de los datos de un bloque de portada (HomeSection).
// Solo deja pasar los campos del modelo; lo demás se ignora.
// Lo usan POST /api/home-sections y PUT /api/home-sections/:id.
// (No es una ruta: Next solo toma route.js como endpoint.)
// ============================================================
import mongoose from 'mongoose'
import { normalizarEncuadre } from '@/lib/encuadre'

export const TIPOS = ['carrusel', 'reels', 'colecciones', 'mosaico', 'promos', 'porque', 'resenas']
const FUENTES = ['categoria', 'masVendidos', 'destacados', 'nuevos']
const TEXTOS = ['title', 'subtitle', 'image', 'href']
const TEXTOS_ITEM = ['title', 'subtitle', 'text', 'image', 'href', 'videoUrl', 'badge', 'badgeLabel', 'author', 'place', 'bg']

const txt = (v) => (v === null || v === undefined ? '' : String(v).trim())

function idOrNull(v) {
  if (v && typeof v === 'object' && v._id) v = v._id // viene poblado
  return v && mongoose.Types.ObjectId.isValid(v) ? String(v) : null
}

function limpiarItem(it = {}) {
  const out = {}
  for (const k of TEXTOS_ITEM) out[k] = txt(it[k])
  out.category = idOrNull(it.category)
  const s = Math.round(Number(it.stars))
  out.stars = Number.isFinite(s) ? Math.min(5, Math.max(1, s)) : 5
  out.pos = it.pos && typeof it.pos === 'object' ? normalizarEncuadre(it.pos) : null
  out.bgPos = it.bgPos && typeof it.bgPos === 'object' ? normalizarEncuadre(it.bgPos) : null
  if (it._id && mongoose.Types.ObjectId.isValid(it._id)) out._id = it._id
  return out
}

/**
 * @param {object} body
 * @param {{ nuevo?: boolean }} opts  nuevo=true exige `type`
 * @returns {{ value?: object, error?: string }}
 */
export function limpiarSeccion(body = {}, { nuevo = false } = {}) {
  const value = {}
  if (nuevo || body.type !== undefined) {
    if (!TIPOS.includes(body.type)) return { error: 'Tipo de bloque inválido' }
    value.type = body.type
  }
  for (const k of TEXTOS) if (body[k] !== undefined) value[k] = txt(body[k])
  if (body.active !== undefined) value.active = !!body.active
  if (body.order !== undefined && Number.isFinite(Number(body.order))) value.order = Number(body.order)
  if (body.source !== undefined) {
    if (!FUENTES.includes(body.source)) return { error: 'Fuente de productos inválida' }
    value.source = body.source
  }
  if (body.category !== undefined) value.category = idOrNull(body.category)
  if (body.limit !== undefined) {
    const n = Math.round(Number(body.limit))
    value.limit = Number.isFinite(n) ? Math.min(24, Math.max(4, n)) : 12
  }
  if (body.items !== undefined) {
    if (!Array.isArray(body.items)) return { error: 'items debe ser una lista' }
    value.items = body.items.slice(0, 50).map(limpiarItem)
  }
  if (body.data !== undefined) {
    value.data = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {}
  }
  return { value }
}
