# CRISTASUR — Catálogo web

Aplicación web moderna y escalable para **CRISTASUR** (plásticos y artículos económicos para hogar y negocios), construida con Next.js 14, MongoDB y Tailwind CSS.

Permite:

- Mostrar productos organizados por categorías dinámicas
- Buscar y filtrar productos
- Administrar todo desde un panel protegido (login + JWT)
- Subir imágenes localmente
- Escalar a e-commerce sin reescribir

---

## Stack

- **Frontend + Backend:** Next.js 14 (App Router) — React Server Components + API routes
- **Base de datos:** MongoDB + Mongoose
- **Estilo:** Tailwind CSS con paleta personalizada
- **Autenticación:** JWT firmado con `jose` + cookies httpOnly
- **Contraseñas:** bcrypt (hash con salt 12)
- **Subida de archivos:** FormData nativo de Next.js (equivalente moderno a Multer)

---

## Requisitos

- Node.js ≥ 18.17
- MongoDB local (`mongod`) o una URI de Atlas
- npm 9+

---

## Puesta en marcha

### 1. Instalar dependencias

```bash
cd cristasur
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` y define al menos:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/cristasur
JWT_SECRET=genera-una-cadena-de-al-menos-32-caracteres-segura
SEED_ADMIN_EMAIL=admin@cristasur.mx
SEED_ADMIN_PASSWORD=Cristasur2026!
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> 💡 Puedes generar un `JWT_SECRET` fuerte con: `openssl rand -base64 48`

### 3. Cargar datos iniciales

```bash
npm run seed
```

Esto crea:

- 6 categorías iniciales (Hogar, Restaurante, Juguetes, Plásticos, Mesas y sillas, Desechables)
- 17 productos de ejemplo (con algunos marcados como destacados y con descuento)
- Un usuario administrador con las credenciales de tu `.env.local`

Puedes re-ejecutarlo con `npm run seed -- --reset` si quieres borrar productos y categorías antes (no borra usuarios).

### 4. Arrancar en desarrollo

```bash
npm run dev
```

Abre:

- Tienda: http://localhost:3000
- Panel admin: http://localhost:3000/admin
- Login: http://localhost:3000/admin/login

### 5. Producción

```bash
npm run build
npm start
```

---

## Estructura de carpetas

```
cristasur/
├── public/
│   └── uploads/                # Imágenes subidas localmente
├── scripts/
│   └── seed.js                 # Poblador offline de la DB
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── page.jsx            # Home
│   │   ├── layout.jsx          # Layout raíz (Navbar + Footer)
│   │   ├── globals.css         # Estilos globales
│   │   ├── productos/          # Catálogo y detalle
│   │   ├── categoria/[slug]/   # Redirige a catálogo filtrado
│   │   ├── contacto/
│   │   ├── admin/              # Panel (protegido por middleware)
│   │   │   ├── layout.jsx
│   │   │   ├── page.jsx        # Dashboard
│   │   │   ├── login/
│   │   │   ├── productos/      # CRUD productos
│   │   │   └── categorias/     # CRUD categorías
│   │   └── api/                # API REST
│   │       ├── auth/{login,logout,me}/
│   │       ├── products/[id]/
│   │       ├── categories/[id]/
│   │       ├── upload/
│   │       └── seed/
│   ├── components/             # Navbar, Footer, ProductCard, Hero, etc.
│   ├── lib/                    # mongodb, auth, validation, seed-data
│   ├── models/                 # Mongoose: Product, Category, User
│   └── middleware.js           # Protege /admin y escritura de /api
├── .env.example
├── .gitignore
├── jsconfig.json               # Alias @/ → src/
├── next.config.js
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

---

## Modelos de datos

### Category

| Campo        | Tipo    | Notas |
|--------------|---------|-------|
| name         | String  | único, 2–60 chars |
| slug         | String  | generado automáticamente |
| description  | String  | 0–300 chars |
| icon         | String  | emoji (máx 10 chars) |
| order        | Number  | para ordenar la navegación |
| active       | Boolean | si aparece en la tienda |

### Product

| Campo         | Tipo              | Notas |
|---------------|-------------------|-------|
| name          | String            | 2–120 chars |
| description   | String            | 5–2000 chars |
| price         | Number            | MXN, ≥ 0 |
| comparePrice  | Number (nullable) | precio anterior (muestra descuento) |
| category      | ObjectId → Category | obligatorio |
| image         | String            | URL o /uploads/... |
| gallery       | [String]          | para escalar a galería |
| featured      | Boolean           | aparece en la home |
| stock         | Number            | inventario |
| active        | Boolean           | publicado |
| sku           | String (único)    | opcional |

### User

| Campo        | Tipo   | Notas |
|--------------|--------|-------|
| email        | String | único, lowercase |
| passwordHash | String | bcrypt salt 12 |
| role         | String | `admin` \| `editor` |

---

## Endpoints API

Todas las rutas de escritura (`POST`, `PUT`, `DELETE`) están protegidas por el middleware y requieren cookie de sesión.

| Método | Ruta                          | Descripción |
|--------|-------------------------------|-------------|
| GET    | `/api/categories`             | Listar categorías activas (`?all=1` incluye inactivas) |
| POST   | `/api/categories`             | Crear categoría |
| GET    | `/api/categories/:id`         | Detalle (acepta id o slug) |
| PUT    | `/api/categories/:id`         | Editar |
| DELETE | `/api/categories/:id`         | Eliminar (falla si hay productos) |
| GET    | `/api/products`               | Listar. Filtros: `?q`, `?category`, `?featured=1`, `?limit`, `?skip`, `?all=1` |
| POST   | `/api/products`               | Crear |
| GET    | `/api/products/:id`           | Detalle |
| PUT    | `/api/products/:id`           | Editar |
| DELETE | `/api/products/:id`           | Eliminar |
| POST   | `/api/upload`                 | Subir imagen (JPG/PNG/WebP/GIF, ≤ 5MB) |
| POST   | `/api/auth/login`             | Login (devuelve cookie) |
| POST   | `/api/auth/logout`            | Logout |
| GET    | `/api/auth/me`                | Usuario actual |
| POST   | `/api/seed`                   | Seed remoto (requiere header `x-seed-key: <JWT_SECRET>`) |

---

## Seguridad implementada

- **Contraseñas:** hashes `bcrypt` con salt 12. Nunca se guarda el texto plano.
- **JWT:** firmado con `HS256` y `JWT_SECRET`; expira a los 7 días. Emitido por `jose` (compatible Edge runtime).
- **Cookies:** `httpOnly` + `secure` en prod + `sameSite=lax` (mitiga la mayor parte de CSRF).
- **Middleware Edge:** protege `/admin/**` y toda escritura a `/api/**`.
- **Validación:**
  - Mongoose valida longitud, formato, rangos.
  - `src/lib/validation.js` añade sanitización y `validator.escape()` para mitigar XSS.
  - Búsquedas escapan regex (evita NoSQL injection).
- **Uploads:** whitelist de MIME + tamaño máx 5MB + nombre aleatorio (evita path traversal).
- **Cabeceras de seguridad:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (ver `next.config.js`).
- **Mensajes de login genéricos** para no revelar si un email existe.

### Protección CSRF adicional recomendada

Next.js con `sameSite=lax` ya mitiga la mayoría. Si quieres CSRF-token explícito, añade un header custom (ej. `x-csrf-token`) en cada request de escritura y verifícalo en el middleware.

---

## ¿Cómo administrar?

1. Entra a `/admin/login` con el email/contraseña del seed (por defecto `admin@cristasur.mx` / `Cristasur2026!`).
2. Desde el sidebar accedes a:
   - **Dashboard:** métricas y productos con stock bajo.
   - **Productos:** lista, creación, edición, eliminación, marcar como destacado, subir imagen, activar/desactivar.
   - **Categorías:** CRUD completo inline con vista de cuántos productos tiene cada una.
3. Todo se guarda en MongoDB; la tienda se actualiza al instante (server components sin caché).

---

## Sugerencias de mejoras futuras

1. **Roles más granulares** (ej. `editor` solo puede editar productos, no usuarios).
2. **Carrito + checkout** con Stripe o Mercado Pago.
3. **Soft delete** con campo `deletedAt` para recuperar datos borrados.
4. **Galería multi-imagen** (ya está el campo `gallery` en el modelo).
5. **Integración con Cloudinary** para servir imágenes optimizadas con CDN.
6. **Pagebuilder / CMS** para banners de la home administrables.
7. **Pedidos por WhatsApp** con un botón que arme el mensaje desde el carrito.
8. **i18n** (español / inglés).
9. **Reseñas** de clientes con moderación.
10. **Analytics** (Umami o Plausible) + eventos de producto.
11. **Exportar catálogo a PDF** para mandar a clientes mayoristas.
12. **Búsqueda full-text** con MongoDB Atlas Search o Algolia (ya hay índice de texto listo).
13. **Notificaciones de stock bajo** por email al admin.
14. **Tests** con Vitest/Playwright.
15. **CI/CD** en Vercel (el proyecto ya está listo para desplegar).

---

## Comandos disponibles

```bash
npm run dev     # Arranca en desarrollo (localhost:3000)
npm run build   # Compila para producción
npm start       # Sirve la versión compilada
npm run lint    # Linter de Next
npm run seed    # Puebla la base de datos (idempotente)
npm run seed -- --reset   # Borra productos y categorías y las vuelve a crear
```

---

## Notas finales

- **Todo el catálogo se administra sin tocar código** desde `/admin`.
- **Las categorías son 100% dinámicas** y aparecen en la navbar automáticamente.
- Los productos cuentan con `featured`, `active`, `comparePrice`, `stock` y `sku` — todas las bases para escalar a e-commerce en cuanto decidas sumar pagos.
- Las imágenes locales viven en `public/uploads/` y son servidas por Next.js.

¿Dudas? Revisa los comentarios en el código — todas las utilidades importantes están documentadas dentro de los propios archivos.
