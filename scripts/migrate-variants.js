#!/usr/bin/env node
// ============================================================
// scripts/migrate-variants.js
//
// Migra del modelo de variantes ASIMÉTRICO al SIMÉTRICO.
//
//   ANTES:  product.color = "Azul"          ← el padre ERA una variante
//           product.variants = [ {Rojo} ]
//
//   DESPUÉS: product.color = ""              ← el padre es sólo contenedor
//            product.variants = [ {Azul}, {Rojo} ]
//
// Además limpia precios de variante que contradicen al padre (origen del bug
// "6 piezas en azul, 2 en rojo"), ya que la app ahora siempre usa el precio
// del producto padre.
//
// USO:
//   node scripts/migrate-variants.js            → simulación (no escribe nada)
//   node scripts/migrate-variants.js --apply    → aplica los cambios
// ============================================================
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const APPLY = process.argv.includes('--apply')

function short(s, n = 42) {
  s = String(s || '')
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Falta MONGODB_URI en .env.local')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const col = mongoose.connection.db.collection('products')

  // Productos que tienen color base Y variantes → modelo asimétrico
  const candidates = await col
    .find({
      color: { $nin: ['', null] },
      'variants.0': { $exists: true },
      deleted: { $ne: true },
    })
    .toArray()

  console.log(`\n${APPLY ? '>>> MODO APLICAR' : '>>> MODO SIMULACIÓN (usa --apply para escribir)'}`)
  console.log(`Productos con modelo asimétrico: ${candidates.length}\n`)

  if (!candidates.length) {
    console.log('Nada que migrar.')
    await mongoose.disconnect()
    return
  }

  let migrated = 0
  const priceCleanups = []

  for (const p of candidates) {
    const baseColor = String(p.color).trim()
    const variants = Array.isArray(p.variants) ? p.variants : []

    // ¿Ya existe una variante con ese color? (idempotencia: no duplicar)
    const alreadyThere = variants.some(
      (v) => String(v.value || '').trim().toLowerCase() === baseColor.toLowerCase()
    )

    // Galería de la variante base = imagen principal + galería del producto
    const baseImages = [p.image, ...(Array.isArray(p.gallery) ? p.gallery : [])]
      .filter(Boolean)

    const baseVariant = {
      _id: new mongoose.Types.ObjectId(),
      label: 'Color',
      value: baseColor,
      // Hereda SKU del padre: es la variante "original" del catálogo.
      sku: p.sku || undefined,
      barcode: '',
      // Precios en null = hereda del padre (que es la fuente de verdad)
      price: null,
      comparePrice: null,
      wholesalePrice: null,
      wholesaleMinQty: null,
      hundredPrice: null,
      hundredMinQty: null,
      available: true,
      stock: null,
      // Logística: se copia del padre si la tiene; si no, queda pendiente de capturar
      weight: p.weight ?? null,
      pkgWeight: p.pkgWeight ?? null,
      pkgLength: p.pkgLength ?? null,
      pkgWidth: p.pkgWidth ?? null,
      pkgHeight: p.pkgHeight ?? null,
      image: baseImages[0] || '',
      images: baseImages.slice(0, 10),
    }

    // Normaliza las variantes existentes: quita precios que contradicen al padre
    const normalized = variants.map((v) => {
      const hadOverride =
        v.price != null || v.wholesalePrice != null ||
        v.wholesaleMinQty != null || v.hundredPrice != null
      if (hadOverride) {
        priceCleanups.push(
          `  ${short(p.name, 34)} → ${v.value}: ` +
          `precio=${v.price ?? '–'} mayoreo=${v.wholesalePrice ?? '–'}@${v.wholesaleMinQty ?? '–'} ` +
          `(padre: ${p.price} / ${p.wholesalePrice}@${p.wholesaleMinQty})`
        )
      }
      return {
        ...v,
        // El precio SIEMPRE viene del padre ahora
        price: null,
        comparePrice: null,
        wholesalePrice: null,
        wholesaleMinQty: null,
        hundredPrice: null,
        hundredMinQty: null,
        available: v.available === false ? false : true,
        barcode: v.barcode || '',
        weight: v.weight ?? p.weight ?? null,
        pkgWeight: v.pkgWeight ?? p.pkgWeight ?? null,
        pkgLength: v.pkgLength ?? p.pkgLength ?? null,
        pkgWidth: v.pkgWidth ?? p.pkgWidth ?? null,
        pkgHeight: v.pkgHeight ?? p.pkgHeight ?? null,
      }
    })

    const newVariants = alreadyThere ? normalized : [baseVariant, ...normalized]

    console.log(
      `${String(migrated + 1).padStart(2)}. ${short(p.name)}\n` +
      `    color base "${baseColor}" → variante${alreadyThere ? ' (ya existía, sólo normalizo)' : ''}\n` +
      `    variantes: ${variants.length} → ${newVariants.length}  [${newVariants.map(v => v.value).join(', ')}]`
    )

    if (APPLY) {
      await col.updateOne(
        { _id: p._id },
        {
          $set: {
            color: '',              // el padre ya no representa un color
            variants: newVariants,
            updatedAt: new Date(),
          },
          $push: {
            editHistory: {
              $each: [{
                at: new Date(),
                action: 'update',
                changes: `Migración a variantes simétricas: color base "${baseColor}" convertido en variante`,
                source: 'migration',
              }],
              $slice: -100,
            },
          },
        }
      )
    }
    migrated++
  }

  if (priceCleanups.length) {
    console.log(`\n--- Precios de variante limpiados (ahora heredan del padre) ---`)
    priceCleanups.forEach((l) => console.log(l))
  }

  console.log(`\n${APPLY ? 'MIGRADOS' : 'SE MIGRARÍAN'}: ${migrated} productos`)
  if (!APPLY) console.log('\nPara aplicar de verdad:  node scripts/migrate-variants.js --apply')
  else console.log('\nListo. Revisa /admin/productos y la ficha pública de una hielera.')

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error('Migración falló:', e)
  process.exit(1)
})
