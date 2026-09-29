// Solo servidor: trae las fotos de las páginas con su encuadre.
import dbConnect from '@/lib/mongodb'
import PageImage from '@/models/PageImage'
import { SLOTS_IMAGENES } from '@/lib/imagenesPaginasSlots'

/** { 'contacto.hero': { url, pos }, … } con la foto de respaldo si no hay. */
export async function imagenesPaginas() {
  const base = Object.fromEntries(SLOTS_IMAGENES.map((s) => [s.slot, { url: s.porDefecto, pos: null }]))
  try {
    await dbConnect()
    const docs = await PageImage.find({}).lean()
    for (const d of docs) if (base[d.slot] && d.url) base[d.slot] = { url: d.url, pos: d.pos || null }
  } catch (e) {
    console.error('imagenesPaginas:', e?.message)
  }
  return base
}
