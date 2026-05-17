# CRISTASUR — Catálogo web

Sitio web y panel de administración para **CRISTASUR Mérida** (plásticos y artículos económicos para hogar y negocios).
Stack: **Next.js 14 (App Router)** + **MongoDB Atlas** + **Tailwind CSS** + **JWT** para auth.

Pedidos por **WhatsApp** al `+52 999 473 1919`.

---

## 1. Arrancar el proyecto

> **OJO con la ruta.** El proyecto está dentro de `CRISTASSUR/cristasur/`.
> Todos los comandos `npm` se corren ahí, **no** en la carpeta externa.

```bash
cd CRISTASSUR/cristasur
npm install            # instala dependencias
cp .env.example .env.local
# (edita .env.local con tu URI de Mongo, JWT_SECRET, etc.)
npm run seed           # crea categorías base + usuario admin (sólo la primera vez)
npm run dev            # arranca en http://localhost:3000
```

Cuando arranque correctamente verás:

```
▲ Next.js 14.2.15
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in 2.3s
```

### Variables de entorno (`.env.local`)

```env
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@cluster.mongodb.net/cristasur?retryWrites=true&w=majority
JWT_SECRET=cadena-larga-y-aleatoria-de-al-menos-32-caracteres
SEED_ADMIN_EMAIL=admin@cristasur.mx
SEED_ADMIN_PASSWORD=Cristasur2026!
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Si cambias cualquiera de éstas, **reinicia** el servidor (`Ctrl+C` y de nuevo `npm run dev`).
Next.js no recarga `.env` en caliente.

### Acceso al admin

El admin **NO está enlazado desde ninguna página pública**. Para entrar usa:

```
http://localhost:3000/admincr
```

con las credenciales que pusiste en `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`.
Esta URL no aparece en el HTML del sitio, no aparece en `robots.txt`, y todas las páginas administrativas envían `noindex/nofollow/noarchive` para no quedar en buscadores.

Si ya hay sesión iniciada, `/admincr` te lleva directo al dashboard. Si no, te lleva al login.

---

## 2. Base de datos (MongoDB Atlas)

La base se llama `cristasur` (o lo que pongas al final del URI).
Está alojada en **MongoDB Atlas** (free tier funciona perfecto para empezar).

### Configuración inicial de Atlas

1. https://cloud.mongodb.com/ → crea proyecto y un cluster M0 (gratis).
2. **Database Access** → crea un usuario con permisos `readWrite` sobre `cristasur`.
3. **Network Access** → añade tu IP actual (botón **Add Current IP Address**) o, en desarrollo, `0.0.0.0/0` para permitir desde cualquier lado.
4. Cluster → **Connect** → **Drivers** → copia el URI y pégalo en `.env.local`.

> Si ves el error **"Could not connect to any servers in your MongoDB Atlas cluster"**, casi siempre es:
> - tu IP actual no está en Network Access (cambias de red, cambia tu IP)
> - el cluster está pausado (Atlas pausa los free tras 7 días de inactividad — botón **Resume**)
> - usuario/password incorrectos en el URI

### Colecciones (`src/models/`)

- **`products`** — productos. Soporta:
  - imagen principal + galería (hasta 10 imágenes)
  - **variantes** embebidas (talla / color / etc.) con su propio precio, stock e imagen
  - **soft delete** (`deleted: true` los manda a la papelera; quedan recuperables)
  - métricas (`viewsCount`, `whatsappClicks`, `salesCount`)
  - historial de ediciones (`editHistory`) con quién hizo qué
  - SKU único opcional
- **`categories`** — categorías; cada producto puede pertenecer a varias.
- **`users`** — usuarios del admin. Roles: `admin` (todo) y `editor` (todo menos gestionar usuarios).
- **`reviews`** — reseñas con moderación (`pending` / `approved` / `rejected`).
- **`coupons`** — cupones de descuento (porcentaje o fijo, con fecha de vigencia, mínimo de compra, límite de usos, restricciones por categoría/producto).

### Backups

- Atlas (free tier) hace snapshots automáticos. Para backup manual usa **Exportar CSV** desde el admin (ver más abajo).
- La info **fuera** de la BD que necesitas respaldar también: la carpeta `public/uploads/` con las imágenes.

---

## 3. Imágenes — dónde dejarlas para que las "vea" el CSV

Esta es la parte que más confunde, así que va con detalle.

### Carpeta de imágenes

Todas las imágenes de productos viven en:

```
cristasur/public/uploads/
```

**Cualquier archivo que pongas ahí queda servido automáticamente** en la URL `/uploads/<nombre-del-archivo>`.
Por ejemplo, si copias `paellera.jpg` a `public/uploads/`, queda disponible en:

```
http://localhost:3000/uploads/paellera.jpg
```

### Cómo conectarlas con el CSV

En el CSV, la columna **`image`** acepta un path relativo. Sólo escribe la **ruta** (no subes el archivo en el CSV, sólo el nombre):

```csv
name,description,price,stock,image,gallery,categories
Paellera 30cm,Paellera de aluminio anodizado,450,12,/uploads/paellera.jpg,,Cocina
Olla express 6L,Olla de presión de acero,890,5,/uploads/olla.jpg,/uploads/olla-2.jpg|/uploads/olla-3.jpg,Cocina
Trastes plásticos,Set de 12 piezas,180,30,/uploads/traste.jpg,,Cocina|Hogar
```

**Flujo recomendado**:

1. Junta todas las fotos con nombres limpios (sin espacios, sin acentos): `paellera.jpg`, `olla.jpg`, `traste.jpg`.
2. **Cópialas todas** a `cristasur/public/uploads/`.
3. En tu CSV escribe en la columna `image` el path `/uploads/paellera.jpg` (etc.).
4. Importa el CSV desde el admin.

Listo. No hace falta subir cada foto manualmente desde el formulario — ya quedan servidas en cuanto el archivo está en la carpeta.

### Galería (varias fotos por producto)

La columna **`gallery`** acepta varios paths separados por `|` (pipe):

```csv
image,gallery
/uploads/olla.jpg,/uploads/olla-2.jpg|/uploads/olla-3.jpg|/uploads/olla-4.jpg
```

### Buenas prácticas para los nombres de archivo

- **Sin espacios**: usa `-` o `_` (`olla-grande.jpg` ✅, `Olla Grande.jpg` ❌).
- **Sin acentos ni ñ**: `paellera.jpg` ✅, `paellería.jpg` ❌. (Funciona en local pero falla en producción Linux.)
- **Minúsculas**: `paellera.jpg` ✅, `Paellera.JPG` ❌. Linux distingue mayúsculas/minúsculas.
- **Formatos**: `.jpg`, `.jpeg`, `.png`, `.webp`. WebP pesa la mitad que JPG con la misma calidad.

### Tamaño y peso

Cuando subes desde el formulario admin, el sistema **redimensiona y comprime** automáticamente a WebP (vía `sharp`). Pero cuando copias manualmente al folder `public/uploads/`, **no se procesan**. Recomendaciones:

- Reduce a **máximo ~1200px** del lado largo antes de copiar.
- Comprime con https://squoosh.app o https://tinypng.com — apunta a ~150-300 KB por imagen.
- Si tienes muchas, conviene un script que las procese antes de copiarlas. Pídelo si lo necesitas.

### Subida desde el formulario admin (alternativa)

Si prefieres subirlas una por una desde el admin:

1. **Admin → Productos → Editar producto**
2. Click en el área de imagen → selecciona archivo
3. El backend lo redimensiona, lo convierte a WebP, le pone un nombre con timestamp + hash, y lo guarda en `public/uploads/`. Te devuelve el path para guardarlo en el documento.

Esto es lo más cómodo cuando tienes pocas fotos. Para cargas masivas, **el flujo de copiar-a-carpeta + CSV es muchísimo más rápido**.

---

## 4. Importar / Exportar CSV

El sistema tiene un flujo robusto de **import/export** con tres modos para que **exportar → editar → re-importar no duplique productos**.

### Exportar

`Admin → Productos → Exportar CSV`

Descarga un `.csv` UTF-8 (con BOM para que Excel lo abra correctamente) con todos los productos activos.
Las columnas exportadas son:

```
_id, name, description, price, comparePrice, stock, sku,
featured, active, image, gallery, categories, createdAt, updatedAt
```

> **No borres la columna `_id`.** Es la "huella digital" de cada producto y permite re-importar sin duplicar.

Parámetros opcionales en la URL:

- `?includeDeleted=1` — incluye productos en la papelera.
- `?category=<slug>` — sólo los de una categoría.
- `?active=true|false` — sólo activos / sólo inactivos.

### Importar

`Admin → Productos → Importar CSV` (o `/admin/productos/import`)

#### Modos de importación

| Modo | Qué hace | Cuándo usarlo |
|---|---|---|
| **Actualizar y crear** *(default)* | Si la fila trae `_id` o `sku` que ya existe → **actualiza** ese producto. Si no existe → **crea** uno nuevo. | El caso más común. Exporta, edita en Excel, añade filas nuevas (con `_id` vacío), re-importa. |
| **Sólo crear nuevos** | Crea sólo las filas que NO existen en la BD. Las que ya existen se **saltan**. | Cuando quieres añadir productos sin tocar los existentes. |
| **Sólo actualizar** | Actualiza los que ya existen. **No** crea nada nuevo. | Para sincronizar precios/stock en bloque. |

Siempre puedes hacer **Vista previa (sin importar)** antes — te dice qué se crearía, qué se actualizaría, qué se saltaría, y qué tiene errores.

#### Flujo recomendado para una carga masiva

1. Junta tus fotos en `public/uploads/` con nombres limpios.
2. **Descarga el ejemplo** desde el admin (botón "Descargar ejemplo") — trae las columnas correctas.
3. Llena el CSV en Excel / Google Sheets:
   - **Deja vacía la columna `_id`** para productos nuevos.
   - En `image` escribe `/uploads/<nombre>.jpg`.
   - En `categories` los nombres de tus categorías separados por `|` (ej. `Cocina|Hogar`).
4. Guarda como **CSV (delimitado por comas)** UTF-8.
5. En el admin: modo **Actualizar y crear** → **Vista previa** → revisa que no haya errores → **Importar ahora**.

#### Columnas aceptadas

El parser acepta nombres en español también (con o sin acentos):

| Columna oficial | Aliases aceptados |
|---|---|
| `_id` | `id` |
| `name` | `nombre`, `producto` |
| `description` | `descripcion`, `descripción` |
| `price` | `precio` |
| `comparePrice` | `precioAnterior`, `precio_anterior` |
| `wholesalePrice` | `precioMayoreo`, `precio_mayoreo`, `mayoreo` |
| `wholesaleMinQty` | `cantidadMayoreo`, `cantidad_mayoreo`, `minMayoreo`, `min_mayoreo` |
| `stock` | `inventario` |
| `sku` | — |
| `featured` | `destacado` |
| `active` | `publicado`, `activo` |
| `image` | `imagen` |
| `gallery` | `galeria`, `galería` |
| `categories` | `categorias`, `categorías`, `category`, `categoria` |

Para `featured` / `active` valen: `true`/`false`, `1`/`0`, `si`/`sí`/`yes`.

#### Errores comunes en el reporte

- **"Faltan: name, description, …"** — esa fila quedó incompleta. Las 4 obligatorias son `name`, `description`, `price`, `categories`.
- **"Categorías no existen: …"** — el nombre de categoría no coincide con ninguna en la BD. Créala primero en `Admin → Categorías`. Es **case/accent-insensitive** ("cocina" hace match con "Cocina").
- **"E11000 duplicate key … sku"** — dos filas tienen el mismo SKU. Los SKU son únicos.

### Qué NO se sobreescribe al actualizar

Cuando importas con modo "Actualizar", **estos campos se preservan** (no se tocan):

- `variants` — las variantes que tenga el producto.
- `viewsCount`, `whatsappClicks`, `salesCount` — contadores de métricas.
- `editHistory` — sólo se le **añade** una entrada `import-update`.
- `createdAt`, `createdBy` — quedan como estaban.

Los campos que sí se sobreescriben son: `name`, `description`, `price`, `comparePrice`, `stock`, `sku`, `featured`, `active`, `image`, `gallery`, `categories`.

---

## 5. Panel de administración

```
/admin                           Login
/admin (con sesión)              Dashboard
/admin/productos                 Lista, búsqueda, filtros
/admin/productos/nuevo           Crear producto
/admin/productos/[id]            Editar producto
/admin/productos/import          Importar CSV
/admin/productos/papelera        Productos eliminados (recuperables)
/admin/categorias                Categorías
/admin/cupones                   Cupones de descuento
/admin/resenas                   Moderar reseñas (pending/approved/rejected)
/admin/usuarios                  Sólo admin: gestionar usuarios y roles
```

**Roles**:
- `admin` — todo, incluido gestionar usuarios.
- `editor` — todo excepto `/admin/usuarios` y borrado permanente.

---

## 6. Estructura del proyecto

```
cristasur/
├── public/
│   ├── logo.png
│   └── uploads/             ← AQUÍ van todas las imágenes
├── scripts/
│   └── seed.js              ← npm run seed
├── src/
│   ├── app/
│   │   ├── layout.jsx       ← layout raíz (CartProvider, Navbar, Footer)
│   │   ├── page.jsx         ← home
│   │   ├── productos/
│   │   │   ├── page.jsx     ← catálogo con filtros
│   │   │   └── [id]/page.jsx← detalle de producto
│   │   ├── categoria/[slug]/page.jsx
│   │   ├── admin/           ← panel administrativo
│   │   └── api/             ← endpoints REST
│   ├── components/          ← Componentes React
│   ├── lib/                 ← mongodb.js, auth.js, csv.js, validation.js
│   ├── models/              ← Esquemas Mongoose
│   └── middleware.js        ← Auth/role guards de API y rutas admin
├── .env.local               ← variables de entorno (NO subir a git)
├── package.json
└── README.md                ← este archivo
```

---

## 7. Troubleshooting

| Problema | Solución |
|---|---|
| `localhost:3000` no abre nada | Estás corriendo `npm run dev` desde la carpeta externa. Entra a `cristasur/` primero (`cd cristasur`). |
| "Could not connect to any servers in your MongoDB Atlas cluster" | Tu IP no está en Network Access de Atlas, o el cluster está pausado. Ver sección 2. |
| `Port 3000 is in use` | `npm run dev -- -p 3001` y abre `localhost:3001`. |
| `Module not found: 'sharp'` o `'papaparse'` | Corre `npm install` dentro de `cristasur/`. |
| Las imágenes del CSV no aparecen | El path en `image` debe empezar con `/uploads/...` y el archivo tiene que existir **exactamente** con ese nombre en `public/uploads/`. Linux distingue mayúsculas/minúsculas. |
| Cambios en `.env.local` no toman efecto | Reinicia el servidor (`Ctrl+C` y `npm run dev` de nuevo). |
| Subo el CSV y se duplicaron los productos | Estás en modo "Sólo crear nuevos" sin `_id` en las filas. Usa modo **Actualizar y crear** y mantén la columna `_id` que vino del export. |

---

## 8. Comandos útiles

```bash
npm run dev            # desarrollo
npm run build          # build de producción
npm start              # servir el build
npm run seed           # crear admin + categorías base
npm run backup         # backup local (JSON + CSV + tar.gz de uploads en /backups/)
npm run lint           # linter
```

> **Backup automático**: programá `npm run backup` con cron a las 2 AM diarias. Borra automáticamente backups de más de 30 días. Los archivos quedan en `/backups/<YYYY-MM-DDTHHMM>/`. Para subirlos fuera del servidor (Drive/S3/R2), encadená un comando de upload tras `npm run backup`.

## 9. Etiquetas PDF con QR

`/admin/etiquetas` genera un PDF imprimible con etiquetas (QR + nombre + precio + mayoreo). El QR apunta a la ficha pública del producto. Cliente escanea → ve fotos y reseñas → te pide por WhatsApp. Configurable: papel (Carta/A4), columnas, filas, copias por producto.

## 10. Pedidos (Orders)

Cuando un cliente da clic en **"Pedir por WhatsApp"**, registramos automáticamente un pedido en `intent`. El admin lo confirma/cancela manualmente desde `/admin/pedidos`. Esto te da:

- Histórico real de qué iba a pedir cada cliente.
- Métricas de conversión (intent → confirmed → delivered).
- Datos para "También compraron" — el sistema cuenta co-ocurrencias de productos en el mismo intent y los muestra en la ficha de detalle.

## 11. Bulk edit (edición masiva)

`/admin/productos/bulk` te deja seleccionar muchos productos a la vez y aplicarles operaciones en una sola pasada: subir/bajar precio en %, cambiar stock, publicar/ocultar, añadir tags, setear mayoreo, reasignar categorías, etc. Cada cambio queda en el `editHistory` de cada producto.

---

## 9. Despliegue (resumen)

Para producción la opción más simple es **Vercel** + **MongoDB Atlas**:

1. Sube el repo a GitHub.
2. Importa el repo en Vercel.
3. En Vercel → Settings → Environment Variables, copia las de `.env.local`. Cambia `NEXT_PUBLIC_SITE_URL` por tu dominio real.
4. En Atlas → Network Access → añade `0.0.0.0/0` (o las IPs de Vercel).
5. Deploy.

> **Nota sobre imágenes en Vercel**: la carpeta `public/uploads/` se sirve desde el deploy, pero no es persistente entre deploys (cada deploy reemplaza el filesystem). Para producción seria conviene mover las imágenes a un bucket (S3, Cloudflare R2, Cloudinary). Para empezar y para tu volumen, `public/uploads/` está bien.

---

CRISTASUR · 2026
