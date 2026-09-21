// ============================================================
// src/models/Product.js
// Modelo de Producto con soporte para:
//   - Variantes (ej. tamaño / color) con stock, precio e imagen propios
//   - Soft delete (papelera): deleted + deletedAt
//   - Historial de cambios embebido (editHistory)
//   - Contadores (views, whatsappClicks, salesCount) para métricas
//   - Galería + imagen principal
// ============================================================
import mongoose from 'mongoose'

// Variantes embebidas — MODELO SIMÉTRICO.
//
// Regla de oro: si un producto tiene variantes, TODAS las opciones vendibles
// viven aquí dentro. El producto padre NO representa una variante; es sólo el
// contenedor con la info común (nombre, descripción, reglas de precio).
//
// Ejemplo correcto:
//   product.name = "Hielera 48 QTS Nordic"
//   product.color = ""                       ← el padre no tiene color
//   product.variants = [
//     { label:"Color", value:"Azul", sku:"HIE48-AZ", pkgWeight:4.1, ... },
//     { label:"Color", value:"Rojo", sku:"HIE48-RJ", pkgWeight:4.1, ... },
//   ]
//
// Cada variante es una unidad vendible real: tiene su propio SKU, su stock,
// su peso y sus medidas de caja. Eso es lo que permite cobrar con Mercado Pago
// y cotizar envíos automáticamente sin intervención humana.
const VariantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 }, // "Tamaño", "Color"
    value: { type: String, required: true, trim: true, maxlength: 60 }, // "10L", "Rojo"
    sku: { type: String, trim: true, uppercase: true, maxlength: 40 },
    price: { type: Number, min: 0 },       // null → hereda del producto padre
    comparePrice: { type: Number, min: 0 }, // null → hereda
    // Precios de mayoreo y por-ciento por variante (opcionales).
    // null = hereda del producto padre.
    wholesalePrice:  { type: Number, min: 0, default: null },
    wholesaleMinQty: { type: Number, min: 1, default: null },
    // Tercer nivel ("precio por ciento") — típicamente desde 100 piezas.
    hundredPrice:    { type: Number, min: 0, default: null },
    hundredMinQty:   { type: Number, min: 1, default: null },
    // ---- Disponibilidad ----
    // available: bandera simple "se puede comprar o no". Es lo que consulta el
    //   front para habilitar el botón. Siempre confiable, incluso si no llevas
    //   conteo exacto de piezas.
    // stock: conteo real (opcional). null = no se lleva inventario de esta variante.
    //   Cuando es un número, el checkout lo descuenta al confirmarse el pago.
    available: { type: Boolean, default: true },
    stock: { type: Number, min: 0, default: null },

    // ---- Logística por variante (REQUERIDO para cotizar envíos) ----
    // Peso y medidas de la PIEZA suelta. Se muestran al cliente.
    weight: { type: Number, min: 0, default: null }, // kg
    // Caja lista para embarcar (pieza + embalaje). USO INTERNO.
    // Si el producto se vende por múltiplos (qtyStep), estas medidas son las
    // del paquete completo que sale del almacén, no las de una pieza.
    pkgWeight: { type: Number, min: 0, default: null }, // kg
    pkgLength: { type: Number, min: 0, default: null }, // cm
    pkgWidth:  { type: Number, min: 0, default: null }, // cm
    pkgHeight: { type: Number, min: 0, default: null }, // cm

    // Código de barras (EAN/UPC). Google Merchant lo pide como GTIN.
    barcode: { type: String, trim: true, default: '' },

    image: { type: String, trim: true, default: '' },   // thumbnail (primera foto)
    images: { type: [String], default: [] },             // galería completa de la variante
  },
  { _id: true }
)

const EditLogSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, trim: true },
    action: { type: String, enum: ['create', 'update', 'delete', 'restore', 'duplicate', 'import', 'import-update', 'bulk-update', 'publish', 'unpublish'], required: true },
    changes: { type: String }, // resumen legible (fallback para entradas antiguas)
    // Diff estructurado sin truncar: cada campo cambiado con su valor anterior y nuevo
    diff: { type: [{ field: String, from: String, to: String }], default: undefined },
    source: { type: String, default: 'manual' }, // 'manual' | 'bulk' | 'import' | 'duplicate'
  },
  { _id: false }
)

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    // description NO es required a nivel de schema: los drafts pueden
    // arrancar sin descripción (se completa después). La validación de
    // publicación se hace en validateProductPayload() para published.
    description: { type: String, default: '', trim: true, maxlength: 800 },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0, default: null },
    // Precio mayoreo (opcional). Si se define, requiere wholesaleMinQty.
    // Cuando un cliente añade qty >= wholesaleMinQty al carrito, se aplica
    // automáticamente el wholesalePrice por unidad.
    wholesalePrice: { type: Number, min: 0, default: null },
    wholesaleMinQty: { type: Number, min: 1, default: null },
    // Tercer precio ("precio por ciento"). Se activa cuando el cliente compra
    // una cantidad ≥ hundredMinQty (por lo general 100 piezas).
    // Sin funcionalidad activa aún — solo se almacena para uso futuro.
    hundredPrice:    { type: Number, min: 0, default: null },
    hundredMinQty:   { type: Number, min: 1, default: null },
    // Los borradores pueden no tener categorías (el admin las asigna al
    // publicar). Validación de "al menos una categoría" se hace en
    // validateProductPayload() sólo para productos publicados.
    categories: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    ],
    image: { type: String, default: '', trim: true },
    gallery: { type: [String], default: [] },
    // URL de video (YouTube, TikTok o enlace directo .mp4). Se muestra como
    // primer elemento de la galería si está definido.
    videoUrl: { type: String, default: '', trim: true },
    // Variantes opcionales. Si el array está vacío, el producto no tiene variantes.
    variants: { type: [VariantSchema], default: [] },


    featured: { type: Boolean, default: false, index: true },
    stock: { type: Number, default: null, min: 0 }, // null = sin límite / no se sabe
    active: { type: Boolean, default: true, index: true },
    sku: { type: String, trim: true, uppercase: true, sparse: true, unique: true },

    // Estado del producto:
    //   draft     → sólo visible en admin
    //   published → visible públicamente (si active = true)
    // Si publishAt está en el futuro, se considera draft hasta esa fecha.
    status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
    publishAt: { type: Date, default: null },

    // Cantidad mínima de compra y múltiplo de venta.
    // Ej: qtyStep=3 → el cliente solo puede pedir 3, 6, 9, 12...
    // Ej: qtyStep=6 → el cliente solo puede pedir 6, 12, 18...
    // null o 1 = de uno en uno (comportamiento normal).
    qtyStep: { type: Number, min: 1, default: null },

    // ---- Capacidad (visible al cliente, opcional) ----
    // Para productos que se miden por volumen/capacidad (termos, vasos, botellitas…).
    // capacityUnit: 'L' | 'mL' | 'oz' | 'fl oz' | 'gal' | 'cl' | 'cc'
    capacity:     { type: Number, min: 0, default: null },
    capacityUnit: { type: String, trim: true, default: '' },

    // ---- Dimensiones del PRODUCTO (visibles al cliente en la ficha) ----
    // Miden el producto real sin embalaje. Se muestran públicamente.
    // Unidades: peso en kg, dimensiones en cm.
    weight: { type: Number, min: 0, default: null },   // kg
    length: { type: Number, min: 0, default: null },   // cm — largo
    width:  { type: Number, min: 0, default: null },   // cm — ancho
    height: { type: Number, min: 0, default: null },   // cm — alto

    // ---- Caja para envío / logística (USO INTERNO — NO se muestran al cliente) ----
    // Dimensiones de la caja lista para embarcar (producto + embalaje).
    // Para productos que se venden a granel (qtyStep=3, 6, etc.) estas medidas
    // deben corresponder al paquete completo que sale del almacén.
    // Se usan exclusivamente para cotizar envíos en envia.com / carriers.
    pkgWeight: { type: Number, min: 0, default: null }, // kg — peso bruto con embalaje
    pkgLength: { type: Number, min: 0, default: null }, // cm — largo de la caja
    pkgWidth:  { type: Number, min: 0, default: null }, // cm — ancho de la caja
    pkgHeight: { type: Number, min: 0, default: null }, // cm — alto de la caja
    pkgNote: { type: String, trim: true, default: '' },  // ej: "caja de 6 piezas", "rollo de 3"


    // Marca opcional (ref a la colección Brand)
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },

    // Materiales (puede tener varios: plástico, vidrio, acero…)
    materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],

    // Resistencia del producto (baja / media / alta)
    resistencia: { type: String, enum: ['', 'baja', 'media', 'alta'], default: '' },

    // Color del producto — SÓLO para productos SIN variantes de color.
    // Si el producto tiene variantes con label "Color", este campo debe ir
    // vacío: el color vive en cada variante. Mantenerlo lleno en un producto
    // con variantes genera el bug de "elijo azul pero se agrega rojo".
    color: { type: String, trim: true, default: '' },

    // Etiquetas libres (eco, navidad, restaurante, etc.). Independientes de
    // las categorías. Usadas para filtros cruzados y landings estacionales.
    tags: { type: [String], default: [], index: true },

    // "También compraron": contador por producto co-pedido en el mismo carrito.
    // Se incrementa al registrar la intención de pedido (Order pending).
    coOrders: { type: Map, of: Number, default: {} },

    // ---- Soft delete (papelera) ----
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    // ---- Métricas ----
    viewsCount: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 }, // se incrementa manualmente al marcar pedido completado

    // ---- Reseñas (caché desnormalizado para no agregar en cada request) ----
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },

    // ---- Orden manual en catálogo ----
    // El admin puede arrastrar productos para reordenarlos en la lista.
    // Los valores menores aparecen primero. Los productos nuevos
    // arrancan en 0; el primer guardado del admin les asigna 0,1,2,3...
    sortOrder: { type: Number, default: 0, index: true },

    // ---- Auditoría ----
    editHistory: { type: [EditLogSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

ProductSchema.index({ name: 'text', description: 'text', color: 'text' })
ProductSchema.index({ deleted: 1, active: 1, featured: 1 })

if (process.env.NODE_ENV !== 'production' && mongoose.models.Product) {
  delete mongoose.models.Product
}

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
