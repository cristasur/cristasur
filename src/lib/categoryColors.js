// ============================================================
// Paleta para el banner de las landings de categoría.
//
// Son tonos claros pensados para llevar texto oscuro encima y
// convivir con la foto del producto sin competirle. El admin
// elige uno por categoría en /admin/categorias.
// ============================================================
export const CATEGORY_COLORS = {
  lavanda:  { label: 'Lavanda',  bg: '#DEDCFB', ink: '#1E1B4B' },
  cielo:    { label: 'Cielo',    bg: '#D7E9FB', ink: '#0E2A5C' },
  menta:    { label: 'Menta',    bg: '#D6EFE2', ink: '#12402C' },
  arena:    { label: 'Arena',    bg: '#F1E7D7', ink: '#42301A' },
  durazno:  { label: 'Durazno',  bg: '#FBE0CE', ink: '#5A2A0C' },
  rosa:     { label: 'Rosa',     bg: '#F8DDE4', ink: '#4D1526' },
  piedra:   { label: 'Piedra',   bg: '#E4E7EC', ink: '#1F2937' },
  carbon:   { label: 'Carbón',   bg: '#22303F', ink: '#FFFFFF' },
}

export const DEFAULT_CATEGORY_COLOR = 'cielo'

/** Devuelve { bg, ink } para una categoría, con respaldo seguro. */
export function categoryColor(key) {
  return CATEGORY_COLORS[key] || CATEGORY_COLORS[DEFAULT_CATEGORY_COLOR]
}
