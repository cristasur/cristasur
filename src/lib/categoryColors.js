// ============================================================
// Paleta para el banner de las landings de categoría.
//
// Tonos profundos y saturados, en la familia de la marca: el
// producto de CRISTASUR es plástico de colores vivos, y sobre
// fondo oscuro revienta. Es lo contrario al pastel apagado de
// las tiendas de vajilla premium.
//
// Todos llevan texto blanco, así que el contraste nunca falla.
// El admin elige uno por categoría en /admin/categorias.
// ============================================================
export const CATEGORY_COLORS = {
  marino:    { label: 'Marino',    bg: '#0E2A5C' },
  azul:      { label: 'Azul',      bg: '#1D5BD6' },
  petroleo:  { label: 'Petróleo',  bg: '#0D4A4F' },
  olivo:     { label: 'Olivo',     bg: '#334D2C' },
  terracota: { label: 'Terracota', bg: '#A03D18' },
  vino:      { label: 'Vino',      bg: '#6B1E3C' },
  ciruela:   { label: 'Ciruela',   bg: '#43265E' },
  carbon:    { label: 'Carbón',    bg: '#1F2937' },
}

export const DEFAULT_CATEGORY_COLOR = 'marino'

/** Devuelve { label, bg } para una categoría, con respaldo seguro. */
export function categoryColor(key) {
  return CATEGORY_COLORS[key] || CATEGORY_COLORS[DEFAULT_CATEGORY_COLOR]
}
