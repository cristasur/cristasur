// ============================================================
// GET  /api/home-sections        — público, solo bloques activos
//                                  (?all=1 con sesión de admin/editor: todos)
// POST /api/home-sections        — admin/editor: crear un bloque
//                                  body { seed: true } → crea la portada
//                                  sugerida (solo si no hay ningún bloque)
// PUT  /api/home-sections        — admin/editor: reordenar
//                                  body { order: [id1, id2, ...] }
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import dbConnect from '@/lib/mongodb'
import HomeSection from '@/models/HomeSection'
import Category from '@/models/Category' // registra el modelo para populate
import { getCurrentUser } from '@/lib/auth'
import { limpiarSeccion } from './limpiar'

export const dynamic = 'force-dynamic'

void Category

async function puedeEditar() {
  const user = await getCurrentUser()
  return !!(user && ['admin', 'editor'].includes(user.role))
}

function refrescarPortada() {
  try { revalidatePath('/') } catch {}
}

export async function GET(request) {
  try {
    await dbConnect()
    // ?all=1 lo usa el panel: ahí se necesitan también los inactivos.
    let filtro = { active: true }
    if (new URL(request.url).searchParams.get('all') === '1') {
      if (await puedeEditar()) filtro = {}
    }
    const sections = await HomeSection.find(filtro)
      .sort({ order: 1, createdAt: 1 })
      .populate('category', 'name slug')
      .populate('items.category', 'name slug')
      .lean()
    return NextResponse.json({ sections: JSON.parse(JSON.stringify(sections)) })
  } catch (err) {
    console.error('GET /api/home-sections', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// Portada sugerida: los bloques que necesitan fotos se crean apagados
// para que la tienda no muestre cuadros vacíos mientras se suben.
function portadaSugerida() {
  return [
    {
      type: 'carrusel', title: 'Más vendidos', source: 'masVendidos',
      limit: 12, active: true, href: '/productos',
    },
    {
      type: 'reels', title: 'Contenido reciente',
      href: 'https://www.instagram.com/cristasurmx/', active: false, items: [],
    },
    {
      type: 'colecciones', title: 'Colecciones destacadas', active: false,
      items: [
        { title: 'Para restaurante', text: 'Vasos, platos y charolas resistentes para el servicio diario.' },
        { title: 'Temporada de playa', text: 'Hieleras, vasos de plástico y todo para disfrutar la costa.' },
        { title: 'Limpieza y botes', text: 'Cubetas, botes de basura y artículos para mantener todo en orden.' },
      ],
    },
    {
      type: 'mosaico', title: '', active: false,
      items: [
        {
          title: 'Cristalería', subtitle: 'Restaurantes, banquetes y hoteles',
          text: 'Vasos, jarras y tazas para transformar cada servicio.',
          href: '/productos?q=vaso',
        },
        { title: 'Vasos', href: '/productos?q=vaso' },
        { title: 'Jarras', href: '/productos?q=jarra' },
        { title: 'Tazas', href: '/productos?q=taza' },
        { title: 'Tequileros', href: '/productos?q=tequilero' },
      ],
    },
    {
      type: 'promos', title: '', active: false,
      items: [
        { title: 'Vasos HB Rombus', badge: '15%', badgeLabel: 'Ahora' },
        { title: 'Temporada de hieleras', badge: '10%', badgeLabel: 'Ahora' },
      ],
      data: {
        textoTitulo: 'Equipa tu negocio con CRISTASUR',
        texto: 'Somos proveedores de plásticos, loza y artículos para restaurantes, hoteles y hogares en Yucatán y Quintana Roo, con envíos a todo México y precios de mayoreo.',
        boton: 'Conócenos',
        botonHref: '/quienes-somos',
      },
    },
    {
      type: 'porque', title: '¿Por qué elegir CRISTASUR?', subtitle: 'Nuestra promesa', active: true,
      items: [
        { title: 'Precios de mayoreo', text: 'Precios especiales al comprar por volumen para tu negocio.' },
        { title: '3 sucursales', text: 'Visítanos en nuestras sucursales de Yucatán y Quintana Roo.' },
        { title: 'Surtido amplio', text: 'Miles de artículos de plástico, loza, cristalería y limpieza.' },
        { title: 'Envíos a todo México', text: 'Te lo mandamos a donde estés, bien empacado.' },
        { title: 'Atención directa por WhatsApp', text: 'Resolvemos tus dudas y cotizaciones al momento.' },
        { title: 'Facturamos tus compras', text: 'Solicita tu factura fácil y rápido.' },
      ],
    },
    {
      type: 'resenas', title: 'Lo que dicen nuestros clientes', active: true,
      data: { rating: 4.8, reviewsUrl: '', writeUrl: '', ejemplo: true },
      items: [
        { author: 'Cliente', place: 'Mérida', stars: 5, text: 'Encontré todo lo que necesitaba para mi restaurante a muy buen precio.' },
        { author: 'Cliente', place: 'Progreso', stars: 5, text: 'Excelente atención por WhatsApp y el pedido llegó completo.' },
        { author: 'Cliente', place: 'Bacalar', stars: 5, text: 'Buen surtido y precios de mayoreo, muy recomendables.' },
      ],
    },
  ]
}

export async function POST(request) {
  try {
    if (!(await puedeEditar())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    await dbConnect()
    const body = await request.json().catch(() => ({}))

    if (body.seed === true) {
      const total = await HomeSection.countDocuments()
      if (total > 0) {
        return NextResponse.json({ error: 'La portada ya tiene bloques' }, { status: 409 })
      }
      const docs = portadaSugerida().map((s, i) => ({ ...s, order: i }))
      const creados = await HomeSection.insertMany(docs)
      refrescarPortada()
      return NextResponse.json({ sections: JSON.parse(JSON.stringify(creados)) }, { status: 201 })
    }

    const { value, error } = limpiarSeccion(body, { nuevo: true })
    if (error) return NextResponse.json({ error }, { status: 400 })

    if (value.order === undefined) {
      const ultimo = await HomeSection.findOne().sort({ order: -1 }).select('order').lean()
      value.order = ultimo ? (ultimo.order || 0) + 1 : 0
    }
    const section = await HomeSection.create(value)
    refrescarPortada()
    return NextResponse.json({ section: JSON.parse(JSON.stringify(section)) }, { status: 201 })
  } catch (err) {
    console.error('POST /api/home-sections', err)
    if (err?.name === 'ValidationError') {
      return NextResponse.json({ error: 'Datos inválidos: ' + err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    if (!(await puedeEditar())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    await dbConnect()
    const body = await request.json().catch(() => ({}))
    const ids = Array.isArray(body.order) ? body.order : null
    if (!ids || ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return NextResponse.json({ error: 'Orden inválido' }, { status: 400 })
    }
    if (ids.length) {
      await HomeSection.bulkWrite(
        ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } }))
      )
    }
    refrescarPortada()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/home-sections', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
