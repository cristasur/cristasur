// ============================================================
// src/lib/colores.js
// Catálogo único de colores de la tienda.
//
// Lo usan: el filtro de color del catálogo (muestras y conteos),
// la fila "Variante de color" de la ficha y el script que ordena
// las variantes (scripts/estructurar-variantes.js).
//
// Cada color tiene:
//   nombre     cómo se muestra ("Blanco")
//   css        el fondo de la muestra (color, degradado o patrón)
//   sinonimos  cómo puede venir escrito en los productos
//
// normalizarColor("blanca") → "Blanco"; si no se reconoce, regresa
// el texto con mayúscula inicial para no perder colores raros.
// ============================================================

// Los datos (nombres, muestras y sinónimos) viven en colores-datos.json
// para que también los pueda leer el script estructurar-variantes.js.
import DATOS from './colores-datos.json'

export const COLORES = DATOS.colores

export const quitarAcentos = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const clave = (s) => quitarAcentos(s).toLowerCase().replace(/\s+/g, ' ').trim()

const POR_SINONIMO = new Map()
for (const c of COLORES) {
  POR_SINONIMO.set(clave(c.nombre), c)
  for (const s of c.sinonimos) POR_SINONIMO.set(clave(s), c)
}

/** El color de la lista que corresponde a un texto, o null. */
export function buscarColor(texto) {
  const k = clave(texto)
  if (!k) return null
  // Exacto ("azul marino") o por la primera palabra ("verde menta" → Verde)
  return POR_SINONIMO.get(k) || POR_SINONIMO.get(k.split(' ')[0]) || null
}

/** "blanca" → "Blanco". Si no se reconoce, respeta el texto. */
export function normalizarColor(texto) {
  const c = buscarColor(texto)
  if (c) return c.nombre
  const t = String(texto || '').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : ''
}

/** Fondo CSS para la muestra de un color (gris neutro si no se conoce). */
export function cssColor(texto) {
  return buscarColor(texto)?.css || '#cbd5e1'
}

/** ¿Es un color claro? (para ponerle borde a la muestra) */
export function esColorClaro(texto) {
  const n = buscarColor(texto)?.nombre
  return ['Blanco', 'Hueso', 'Beige', 'Transparente', 'Plata', 'Talavera', 'Amarillo'].includes(n)
}

/**
 * Expresión regular (texto) que atrapa todas las formas de escribir
 * un color: sirve para filtrar en Mongo. "Blanco" → ^\s*(blanco|blanca|…)\s*$
 */
export function regexColor(nombre) {
  const c = buscarColor(nombre)
  const formas = c ? [c.nombre, ...c.sinonimos] : [String(nombre || '')]
  const conAcentos = (f) =>
    f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/a/gi, '[aá]').replace(/e/gi, '[eé]').replace(/i/gi, '[ií]').replace(/o/gi, '[oó]').replace(/u/gi, '[uúü]')
  const partes = [...new Set(formas.map((f) => quitarAcentos(f).toLowerCase()))].map(conAcentos)
  // Acepta palabras después ("Verde menta" entra en Verde).
  return `^\\s*(${partes.join('|')})(\\s.*)?$`
}

/**
 * Busca un color escrito dentro de un nombre de producto.
 * "Plato trinche blanco Monet 27 cm" → { nombre: 'Blanco', texto: 'blanco' }
 * Prueba primero los sinónimos de dos palabras ("azul marino").
 */
// Palabras que en un NOMBRE de producto casi nunca son el color
// ("copa para vino", "olla de acero inoxidable", "jarra para agua").
const NO_EN_NOMBRE = new Set(DATOS.noEnNombre)

export function colorEnTexto(texto) {
  const limpio = ' ' + clave(texto).replace(/[^a-z0-9ñ ]+/g, ' ') + ' '
  const formas = []
  for (const c of COLORES) for (const f of [c.nombre, ...c.sinonimos]) formas.push([clave(f), c])
  formas.sort((a, b) => b[0].length - a[0].length)
  for (const [f, c] of formas) {
    if (f.length < 3 || NO_EN_NOMBRE.has(f)) continue
    if (limpio.includes(` ${f} `)) return { nombre: c.nombre, texto: f }
  }
  return null
}

/** ¿La etiqueta de una variante es de color? ("Color", "Colores", "Tono") */
export const esEtiquetaColor = (label) => /colou?r|tono/i.test(String(label || ''))
