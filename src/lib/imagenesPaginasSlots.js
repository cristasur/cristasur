// ============================================================
// Fotos editables de las páginas informativas (Conócenos, Contacto).
// Cada "lugar" tiene su foto de respaldo y la proporción con la que
// se ve en la página (la vista previa del panel usa la misma).
// ============================================================
export const SLOTS_IMAGENES = [
  { slot: 'conocenos.hero',   pagina: 'Conócenos', nombre: 'Foto de portada (arriba, ancha)', aspecto: 3.2, porDefecto: '/locations/matriz.jpg', medida: '2400 × 750 px' },
  { slot: 'conocenos.tienda', pagina: 'Conócenos', nombre: 'Foto de la tienda (centro)',       aspecto: 0.9, porDefecto: '/locations/matriz.jpg', medida: '1080 × 1200 px' },
  { slot: 'contacto.hero',    pagina: 'Contacto',  nombre: 'Foto del encabezado (derecha)',    aspecto: 2.2, porDefecto: '/locations/tanil.jpg',  medida: '1800 × 820 px' },
  { slot: 'contacto.tienda',  pagina: 'Contacto',  nombre: 'Foto de la tienda (derecha)',      aspecto: 1.55, porDefecto: '/locations/matriz.jpg', medida: '1200 × 780 px' },
]

export const SLOT_POR_ID = Object.fromEntries(SLOTS_IMAGENES.map((s) => [s.slot, s]))
