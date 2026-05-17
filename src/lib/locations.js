// ============================================================
// src/lib/locations.js
// Sucursales físicas de CRISTASUR. Usadas en /contacto, footer,
// sitemap, JSON-LD LocalBusiness, etc.
//
// El campo `image` apunta a una imagen local (idealmente en
// public/locations/<id>.jpg). Si la imagen no existe aún, el
// componente cae al iframe del mapa.
// ============================================================
export const LOCATIONS = [
  {
    id: 'matriz-merida',
    name: 'CRISTASUR Matriz · Mérida',
    address:
      'Av. Calle 33 / Periférico de Mérida Lic. Manuel Berzunza, Leandro Valle, Mérida, Yucatán',
    city: 'Mérida',
    state: 'Yucatán',
    country: 'MX',
    phone: '+52 999 473 1919',
    whatsapp: '529994731919',
    lat: 20.9934688,
    lng: -89.5617146,
    mapsUrl:
      'https://www.google.com/maps/place/CRISTASUR+MATRIZ,+Periférico+de+Mérida+Licenciado+Manuel+Berzunza,+Leandro+Valle,+Mérida,+Yucatán/@21.0108416,-89.5844352,14z/data=!4m5!3m4!1s0x8f5670b3b6888a6f:0xea27646b57fb805b!8m2!3d20.9934688!4d-89.5617146',
    embedSrc:
      'https://www.google.com/maps?q=20.9934688,-89.5617146&hl=es&z=16&output=embed',
    image: '/locations/matriz.jpg',
    hours: 'Lun–Sáb 8:00–19:00 · Dom 9:00–14:00',
    primary: true,
  },
  {
    id: 'tanil-merida',
    name: 'CRISTASUR Sucursal Tanil',
    address:
      'Carretera Mérida–Campeche (Carr. 180), Tanil, Mérida, Yucatán',
    city: 'Mérida',
    state: 'Yucatán',
    country: 'MX',
    phone: '+52 999 473 1919',
    whatsapp: '529994731919',
    lat: 20.8865835,
    lng: -89.7019281,
    mapsUrl:
      'https://www.google.com/maps/place/CRISTASUR+SUCURSAL+TANIL/@20.8865835,-89.704503,17z/data=!3m2!4b1!5s0x8f5612b313eaf167:0xca4af62228bd20fe!4m6!3m5!1s0x8f56138bda1c1b7f:0x4e56a2c2f3693c22!8m2!3d20.8865835!4d-89.7019281!16s%2Fg%2F11nmgpt3dr',
    embedSrc:
      'https://www.google.com/maps?q=20.8865835,-89.7019281&hl=es&z=16&output=embed',
    image: '/locations/tanil.jpg',
    hours: 'Lun–Sáb 8:00–18:00',
    primary: false,
  },
  {
    id: 'bacalar',
    name: 'CRISTASUR Bacalar',
    address: 'Bacalar, Quintana Roo',
    city: 'Bacalar',
    state: 'Quintana Roo',
    country: 'MX',
    phone: '+52 999 473 1919',
    whatsapp: '529994731919',
    lat: 18.6771469,
    lng: -88.3992115,
    mapsUrl:
      'https://www.google.com/maps/place/Cristasur+Bacalar/@18.6771469,-88.4017864,17z/data=!3m1!4b1!4m6!3m5!1s0x8f5bb16cad034d3b:0xf98b945065d3887!8m2!3d18.6771469!4d-88.3992115!16s%2Fg%2F11vsv76kb7',
    embedSrc:
      'https://www.google.com/maps?q=18.6771469,-88.3992115&hl=es&z=16&output=embed',
    image: '/locations/bacalar.jpg',
    hours: 'Lun–Sáb 9:00–18:00',
    primary: false,
  },
]

export function primaryLocation() {
  return LOCATIONS.find((l) => l.primary) || LOCATIONS[0]
}
