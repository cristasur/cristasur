// ============================================================
// GET /api/shipping/diagnostico   (solo admin)
//
// Muestra en crudo qué está pasando con Envia.com: qué
// configuración ve el servidor, qué paqueterías reporta la
// Queries API, y la respuesta completa de una cotización de
// prueba con cada una.
//
// Existe porque cuando la cotización sale vacía, el cliente solo
// ve "no encontramos servicio" y eso no alcanza para arreglarlo.
// Aquí se ve el JSON tal cual lo devuelve Envia.
//
// Parámetros opcionales:
//   ?cp=77500   código postal destino (default 77500)
// ============================================================
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  enviaConfig, originAddress, originIsComplete,
  fetchAvailableCarriers, resolveCarriers,
} from '@/lib/envia'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Paquete de prueba: una hielera típica.
const TEST_PACKAGE = {
  type: 'box',
  content: 'Articulos para el hogar',
  amount: 1,
  declaredValue: 600,
  lengthUnit: 'CM',
  weightUnit: 'KG',
  weight: 8,
  dimensions: { length: 47.5, width: 33.5, height: 56 },
}

export async function GET(request) {
  const user = await getCurrentUser()
  if (!user || !['admin', 'editor'].includes(user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const cfg = enviaConfig()
  const origin = originAddress()
  const cp = (new URL(request.url).searchParams.get('cp') || '77500').replace(/\D/g, '')

  const out = {
    configuracion: {
      tokenPresente: Boolean(cfg.token),
      tokenLargo: cfg.token ? cfg.token.length : 0,
      ambiente: cfg.isProd ? 'PRODUCCION' : 'pruebas',
      apiUrl: cfg.baseUrl,
      queriesUrl: cfg.queriesUrl,
      carriersForzados: cfg.carriers,
    },
    origen: {
      ...origin,
      // No exponemos nada sensible: es la dirección de la tienda.
      completo: originIsComplete(),
      faltan: [
        !origin.postalCode && 'ENVIA_ORIGIN_CP',
        !origin.street && 'ENVIA_ORIGIN_STREET',
        !origin.phone && 'ENVIA_ORIGIN_PHONE',
      ].filter(Boolean),
    },
  }

  if (!cfg.configured) {
    out.conclusion = 'Falta ENVIA_TOKEN. Agrégalo en Vercel y redespliega.'
    return NextResponse.json(out)
  }

  // ── 1. Qué paqueterías reporta la Queries API ──
  try {
    const res = await fetch(`${cfg.queriesUrl}/carrier?country_code=MX`, {
      headers: { Authorization: `Bearer ${cfg.token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    const texto = await res.text()
    out.queriesCarrier = {
      status: res.status,
      // Recortado: la lista completa puede ser larguísima.
      respuesta: texto.slice(0, 2500),
    }
  } catch (e) {
    out.queriesCarrier = { error: e?.message || String(e) }
  }

  out.carriersDetectados = await fetchAvailableCarriers()
  out.carriersQueSeVanACotizar = await resolveCarriers()

  // ── 2. Cotización cruda con cada paquetería ──
  const destination = {
    name: 'Cliente',
    street: 'Por confirmar',
    city: '',
    state: '',
    country: 'MX',
    postalCode: cp,
    phone: origin.phone,
  }

  const cuerpoBase = { origin, destination, packages: [TEST_PACKAGE] }
  out.cuerpoEnviado = cuerpoBase

  const pruebas = await Promise.all(
    out.carriersQueSeVanACotizar.map(async (carrier) => {
      try {
        const res = await fetch(`${cfg.baseUrl}/ship/rate/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...cuerpoBase, shipment: { type: 1, carrier } }),
          signal: AbortSignal.timeout(8000),
        })
        const texto = await res.text()
        return { carrier, status: res.status, respuesta: texto.slice(0, 1200) }
      } catch (e) {
        return { carrier, error: e?.message || String(e) }
      }
    })
  )

  out.cotizacionesCrudas = pruebas

  return NextResponse.json(out)
}
