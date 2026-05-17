# CRISTASUR — Plan de lanzamiento a producción

Documento operacional para llevar `cristasur.mx` (o `cristasur.com`) a producción
con seguridad, alta disponibilidad, sin lag y resistente a ataques básicos.

---

## 0. Resumen ejecutivo

**Stack recomendado para lanzar**

| Pieza | Recomendado | Por qué |
|---|---|---|
| Hosting | **Vercel** (Hobby gratis o Pro $20/mes) | Hecho para Next.js; cache global; CI/CD automático |
| Base de datos | **MongoDB Atlas** M0 (gratis) → M10 si crece | Backups, replicación, escalado sin migración |
| Imágenes | **Cloudflare R2** o **Vercel Blob** | Persistente entre deploys (no se pierden) |
| DNS + CDN + DDoS | **Cloudflare** (gratis) | DDoS protection automático, WAF básico, SSL incluido |
| Email | **Resend** (3k/mes gratis) | Notificaciones operacionales |
| Monitoreo | **Vercel Analytics** + **Sentry** (gratis hasta 5k events) | Errores y métricas |

**Costo aproximado para empezar**: $0–20 USD/mes hasta tener tráfico decente.

---

## 1. Pre-flight — pulir antes de lanzar

Lista corta de cosas concretas a hacer en el código y datos antes del lanzamiento. No son perfectas, son las que mueven la aguja.

### 1.1 Imágenes y rendimiento

- [ ] **Copiar las 3 fotos de sucursales** a `public/locations/matriz.jpg`, `tanil.jpg`, `bacalar.jpg` (cada una < 300 KB).
- [ ] **Revisar fotos de productos**: las de `public/uploads/` que pesan > 500 KB conviene comprimirlas. Pasa por https://squoosh.app o re-súbelas desde admin (sharp las convierte a WebP automáticamente).
- [ ] **Migrar a `next/image`**: en `ProductCard` y `ProductGallery` reemplazar `<img>` por `<Image>` para obtener lazy-load nativo y srcset.
  > Si no lo haces ya, no rompe nada — Vercel ofrece optimización automática igual.

### 1.2 SEO

- [ ] **Verificar el sitio en Google Search Console** (`https://search.google.com/search-console`). Sube ownership con meta tag o DNS.
- [ ] **Subir sitemap**: en Search Console → Sitemaps → enviar `https://cristasur.mx/sitemap.xml`.
- [ ] **Llenar `seoText` y `seoTitle` de cada categoría** desde `/admin/categorias`. Apunta a 200-500 palabras por categoría. Es el activo SEO con mayor ROI.
- [ ] **Open Graph / WhatsApp preview**: probar que el link de un producto se ve bien al compartirlo. Tu `generateMetadata` ya lo hace pero verifica.
- [ ] **Google Business Profile** para las 3 sucursales. Es gratis y trae tráfico local.

### 1.3 Seguridad final

- [ ] **Cambiar `JWT_SECRET`** por uno nuevo de 64+ chars en producción. Genera con:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
  ```
- [ ] **Cambiar password del usuario admin inicial** desde `/admin/usuarios` o `npm run seed` con env vars distintas.
- [ ] **Crear un editor adicional** para los empleados que NO deben tener acceso a `/admin/usuarios` y borrado duro.
- [ ] **Atlas Network Access**: en producción permitir SOLO las IPs de Vercel (ver sección 3.3). En desarrollo `0.0.0.0/0` está bien.
- [ ] **Verificar `.env.local` NO está en git**: `cat .gitignore` debe listarlo.

### 1.4 Contenido

- [ ] **Datos reales**: borrar productos de prueba, crear las 5-10 categorías reales con sus fotos.
- [ ] **Reseñas iniciales**: pide a 3-5 clientes leales que dejen reseña real para arrancar con tracción.
- [ ] **Aviso de privacidad y términos**: revisar que la dirección física, RFC (si aplica) y datos legales sean correctos antes de publicar.

### 1.5 Legal

- [ ] **LFPDPPP**: tu Aviso de Privacidad ya cumple lo básico. Si vas a hacer marketing por email, añade un checkbox de opt-in explícito.
- [ ] **Considera RFC y régimen fiscal**: si quieres emitir facturas digitales por las ventas, eso se gestiona aparte (PAC, Facturama o SW Sapien). No es bloqueante para lanzar.

---

## 2. Dominio: `cristasur.com` (o `.mx`)

### 2.1 Comprar el dominio

- **`.com` internacional**: Cloudflare Registrar ($9 USD/año, sin markup), Namecheap, Google Domains.
- **`.mx` (recomendado para SEO local)**: registry.mx (~$700 MXN/año), o resellers locales como NIC México.
- Si compras los dos (`cristasur.com` + `cristasur.mx`), uno se redirige al otro vía DNS (Cloudflare lo hace en 30 seg).

### 2.2 Conectar a Cloudflare (recomendado)

Cloudflare te da:
- **SSL automático** (sin tocar nada).
- **CDN global**: tu sitio carga rápido desde cualquier país.
- **DDoS protection** gratis hasta volúmenes altos.
- **WAF (Web Application Firewall)** con reglas básicas en plan gratis.
- **Analytics** sin cookies invasivas.

Pasos:
1. Crea cuenta en https://cloudflare.com.
2. "Add a Site" → escribe `cristasur.mx`.
3. Cloudflare detecta tus DNS actuales. Copia los nameservers que te da (algo como `nina.ns.cloudflare.com`).
4. En tu registrador (donde compraste el dominio), cambia los nameservers a los de Cloudflare. Tarda 1-24 horas en propagar.
5. Verifica que el dominio aparezca "active" en Cloudflare.

### 2.3 SSL forzado

En Cloudflare → SSL/TLS:
- Modo: **Full (strict)**.
- Edge Certificates → Always Use HTTPS: ON.
- HSTS: ON (max-age 6 meses como mínimo). Tu app ya envía HSTS pero esto agrega capa CDN.

---

## 3. Despliegue en Vercel

### 3.1 Subir el código a GitHub

```bash
cd CRISTASSUR/cristasur
git init   # si aún no es repo
git add .
git commit -m "Lanzamiento inicial"
# Crear repo en github.com (privado), después:
git remote add origin git@github.com:tu-user/cristasur.git
git push -u origin main
```

Confirma que `.env.local`, `node_modules` y `backups/` están en `.gitignore`. Si no, agrégalos:

```
node_modules
.next
.env*.local
backups/
public/uploads/
```

> **Nota sobre `public/uploads/`**: en Vercel ese folder NO persiste entre deploys. Las imágenes que subas desde admin se pierden cada vez que rebuildeas. Solución obligatoria si vas a producir: pasar a Cloudflare R2 o Vercel Blob (ver sección 5.2). Mientras tanto, puedes commitear las primeras fotos para que persistan con el código.

### 3.2 Crear el proyecto en Vercel

1. https://vercel.com → New Project → importar el repo de GitHub.
2. Framework Preset: Next.js (auto-detectado).
3. Root Directory: deja `./` (o `cristasur/` si tu repo tiene la carpeta exterior).
4. Build & Output Settings: deja default.

### 3.3 Variables de entorno

En Vercel → Project → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@cluster.mongodb.net/cristasur?retryWrites=true&w=majority
JWT_SECRET=<64 chars aleatorios>
SEED_ADMIN_EMAIL=admin@cristasur.mx
SEED_ADMIN_PASSWORD=<password fuerte>
NEXT_PUBLIC_SITE_URL=https://cristasur.mx
```

Aplica a Production, Preview y Development.

### 3.4 Dominio en Vercel

1. Vercel → Project → Settings → Domains → Add `cristasur.mx` (y `www.cristasur.mx`).
2. Vercel te muestra los registros DNS que tienes que crear en Cloudflare. Algo así:

```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

3. En Cloudflare → DNS → añade esos registros. **Importante**: en Cloudflare cambia el proxy a "DNS Only" (nube gris) inicialmente para que Vercel pueda verificar; cuando verifique, puedes volver a activar el proxy (nube naranja) para tener CDN.

### 3.5 Network Access en Atlas

Ahora que tu app vive en Vercel, restringe el acceso a Mongo:

1. Atlas → Network Access → IP Access List → eliminar `0.0.0.0/0`.
2. Añadir las IPs de Vercel (Vercel publica una lista, búscala en su docs; suelen ser rangos de AWS de Virginia/Oregón).
3. **Alternativa más simple**: dejar `0.0.0.0/0` y forzar la seguridad con el usuario+password de Mongo (que ya tienes). Funciona bien si el password es fuerte (≥ 24 chars random).

---

## 4. Hardening contra ataques

Lo que ya tienes implementado vs. lo que se agrega a nivel infraestructura:

### En el código (ya implementado)
- Rate limiting en login (10/IP por 15 min, 5/email por 15 min).
- CSP estricto, HSTS, X-Frame-Options DENY, COOP, Permissions-Policy.
- Cookies httpOnly + sameSite=lax + secure (en producción).
- Validación de magic-number en uploads (bloquea archivos disfrazados).
- CSRF defense (Origin/Referer check).
- Seed endpoint bloqueado en producción.
- Admin oculto en `/admincr` con `noindex/nofollow`.

### En Cloudflare (gratis, configurable en minutos)
- **WAF managed rules**: bloquea automaticamente OWASP top 10, SQL injection, XSS conocidos.
- **Bot Fight Mode**: bloquea bots maliciosos (scrapers, content thieves).
- **Rate Limiting Rules** (en plan Pro $20/mes): puedes definir reglas tipo "máx 30 requests por IP a `/api/*` por minuto".
- **Country block** (opcional): si toda tu base es México, bloquea tráfico de países donde no operas.
- **Page Rules**: cachear estáticos agresivamente, /api/* en bypass.

### Vercel
- DDoS protection a nivel infraestructura (incluido en Hobby).
- Aislamiento automático: cada request es un Lambda; un atacante no puede tumbar todo el server.

### Cosas a NO hacer
- ❌ Exponer `JWT_SECRET` o `MONGODB_URI` en cliente (Next ya impide vars sin `NEXT_PUBLIC_`).
- ❌ Commitear `.env.local`.
- ❌ Usar el password admin en desarrollo en producción.
- ❌ Permitir registro abierto + escalada de rol. (El registro siempre crea `role: customer`).

---

## 5. Performance: lanzar sin lag

### 5.1 Caché y CDN

- Vercel cachea HTML estático y assets automáticamente.
- Cloudflare encima cachea los HTML por TTL si configuras Page Rules. Setea: `cristasur.mx/*` → Cache Level: Standard, Edge Cache TTL: 1 hour. Para `/api/*` y `/admin/*` → Cache Bypass.
- Las imágenes de `public/uploads/` van por CDN automáticamente.

### 5.2 Imágenes fuera del filesystem

**El problema**: Vercel borra `public/uploads/` en cada deploy. Si subes una foto desde admin, sobrevive hasta el próximo `git push`. Soluciones:

**Opción A — Cloudflare R2** (recomendada, gratis hasta 10 GB):
- Crea bucket en Cloudflare R2 (consola de Cloudflare).
- Adapta `src/app/api/upload/route.js` para subir a R2 con S3 SDK (`@aws-sdk/client-s3`).
- Las URLs quedan como `https://r2.cristasur.mx/<archivo>.webp`.
- Costo: $0 hasta 10 GB, $0.015/GB después.

**Opción B — Vercel Blob** (más simple, $0 hasta 1 GB):
- Instala `@vercel/blob`.
- Cambia el upload para usar `put()` del SDK.
- Ventaja: cero config. Desventaja: 1 GB sólo en plan gratis.

**Opción C (temporal, suficiente para empezar)**:
- Commitea las imágenes principales al repo. Hasta que tengas ~200 productos, no es un problema.

### 5.3 Cold starts

Las API routes de Next.js son serverless (Lambdas) y tienen "cold start" si nadie las ha llamado en X minutos. Mitigación:

- Vercel Pro ($20/mes) ofrece **Edge Functions** que son más rápidas.
- O usa **Vercel Cron** para hacer ping a `/api/products` cada 5 minutos manteniendo warm el endpoint.
- Para `/api/products/labels` (PDF) el cold start no importa porque el usuario espera el PDF.

### 5.4 Lighthouse target

Antes de lanzar, mide con https://pagespeed.web.dev/. Objetivos:
- LCP < 2.5s (Largest Contentful Paint)
- CLS < 0.1 (Cumulative Layout Shift)
- INP < 200ms (Interaction to Next Paint)

Si LCP > 2.5s, lo más común es:
- Imagen del Hero demasiado pesada → comprimirla.
- Fuente bloqueante → ya usas system fonts, OK.

---

## 6. Backups

Tu backup automático ya existe (`npm run backup`). Para producción:

### 6.1 Atlas snapshots
- En plan M0 (gratis), Atlas no hace snapshots automáticos. En M10+ ($57/mes), sí.
- Para M0, programa tu script `backup.js` para que corra diario en un servicio externo (GitHub Actions con un cron, o una VPS de DigitalOcean a $4/mes).

### 6.2 Backup a Drive (cron diario en GitHub Actions)

`.github/workflows/backup.yml`:
```yaml
name: Backup diario
on:
  schedule:
    - cron: '0 7 * * *'  # 2 AM CST
  workflow_dispatch:
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run backup
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
      - uses: actions/upload-artifact@v4
        with:
          name: backup-${{ github.run_id }}
          path: backups/
          retention-days: 30
```

GitHub guarda los artifacts 30 días. Te llega notificación si falla.

---

## 7. Monitoreo

### 7.1 Errores (Sentry)
- Crear cuenta en https://sentry.io.
- Instalar `@sentry/nextjs`.
- Te llegan emails cuando algo explota en producción.

### 7.2 Analytics privacy-friendly
- **Vercel Analytics** (gratis hasta 100k events/mes): habilita desde el dashboard de Vercel.
- O **Plausible** ($9/mes): no usa cookies, cumple GDPR/LFPDPPP automáticamente.

---

## 8. Plan de lanzamiento — orden cronológico

Llevarlo paso a paso, hora aproximada:

1. **Hoy (1-2 h)**:
   - Comprar dominio `cristasur.mx` (o `.com`).
   - Crear cuenta Cloudflare, transferir nameservers.
   - Crear cuenta Vercel y conectar al repo de GitHub.
2. **Hoy (1 h)**:
   - Configurar Atlas: usuario fuerte, password seguro, IP whitelist correcta.
   - Generar nuevo `JWT_SECRET` para producción.
   - Subir env vars a Vercel.
3. **Mañana (2-3 h)**:
   - Cargar el catálogo real (CSV o uno por uno).
   - Llenar `seoText` de cada categoría.
   - Subir fotos de sucursales a `public/locations/`.
   - Crear admin definitivo y borrar el de prueba.
4. **Mañana (1 h)**:
   - Pruebas E2E manualmente: registro de cuenta, agregar al carrito, hacer un pedido por WhatsApp, verificar que llegue a `/admin/pedidos`, otorgar acceso mayoreo a una cuenta y probar `/mayoreo`.
   - Generar un PDF de etiquetas e imprimir una de prueba.
5. **Día del lanzamiento**:
   - Apuntar DNS al sitio de Vercel.
   - Verificar HTTPS funcional, sitemap, robots.txt.
   - Verificar en Search Console.
   - Compartir el link en redes y WhatsApp del negocio.

---

## 9. Después del lanzamiento

Mediciones que debes mirar la primera semana:

- **Visitas únicas/día** (Vercel Analytics).
- **Productos más vistos** (`/admin` dashboard).
- **Click WhatsApp / visita** (señal de interés).
- **Pedidos creados vs. confirmados** (tasa de conversión real).
- **Errores en Sentry**.

Si todo esto se ve sano (sin errores, tráfico subiendo, conversión ≥ 5%), ya tienes una operación. Si conversión < 2%, revisa fotos y mensajes de los productos peor performers.

---

## 10. Costo mensual estimado

| Servicio | Plan | Costo |
|---|---|---|
| Dominio .mx | anual | ~$60 MXN/mes prorrateado |
| Vercel | Hobby | $0 |
| MongoDB Atlas | M0 | $0 (limitaciones de 512 MB) |
| Cloudflare | Free | $0 |
| Resend | Free | $0 (3k emails) |
| Sentry | Free | $0 (5k events) |
| Cloudflare R2 | Free | $0 hasta 10 GB |

**Total inicial: ~$60 MXN/mes**. Muy bajo riesgo financiero para validar el negocio digital.

Cuando tengas tracción (10k visitas/mes o BD > 500 MB), considera:
- Vercel Pro $20 USD/mes para mejor performance.
- Atlas M10 $57 USD/mes con backups automáticos.

---

CRISTASUR · 2026
