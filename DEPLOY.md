# 🚀 Guía de Deploy — CRISTASUR en Vercel

## Opción A — Script automático (recomendado)

Doble clic en `deploy.bat` o corre en CMD desde la carpeta del proyecto:

```cmd
deploy.bat
```

El script te guía paso a paso: verifica Node, instala Vercel CLI, hace el build y sube a producción.

---

## Opción B — Comandos manuales (CMD paso a paso)

### 1. Instalar Vercel CLI

```cmd
npm install -g vercel
```

### 2. Iniciar sesión en Vercel

```cmd
vercel login
```

Se abre el browser. Inicia sesión con tu cuenta de Vercel (o GitHub).

### 3. Vincular el proyecto (solo la primera vez)

```cmd
cd C:\Users\Amirh\Desktop\CRISTASSUR\cristasur
vercel link
```

Te preguntará:
- **Set up and deploy?** → Y
- **Which scope?** → tu cuenta personal
- **Link to existing project?** → N (primera vez) o Y si ya existe
- **What's your project's name?** → `cristasur`
- **In which directory is your code?** → `.` (punto = carpeta actual)

### 4. Configurar variables de entorno

Agrega **una por una** las variables críticas. El CLI te pedirá el valor y el entorno (production/preview/development):

```cmd
vercel env add MONGODB_URI
```
→ Pega la cadena de conexión de MongoDB Atlas:
`mongodb+srv://USUARIO:PASSWORD@cluster0.xxxxx.mongodb.net/cristasur?retryWrites=true&w=majority`
→ Selecciona: **Production** + **Preview**

```cmd
vercel env add JWT_SECRET
```
→ Pega un secreto largo y aleatorio. Genera uno nuevo con:
```cmd
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```
→ Selecciona: **Production** + **Preview**

```cmd
vercel env add RESEND_API_KEY
```
→ Tu API key de Resend (https://resend.com/api-keys)
→ Selecciona: **Production** + **Preview**

```cmd
vercel env add NEXT_PUBLIC_SITE_URL
```
→ `https://cristasur.com` (o el dominio que uses en Vercel)
→ Selecciona: **Production**

```cmd
vercel env add ADMIN_NOTIFY_EMAILS
```
→ `tuEmail@gmail.com,otroEmail@gmail.com`
→ Selecciona: **Production** + **Preview**

> ⚠️ **NUNCA agregues la variable con el valor que ya estaba en `.env.local`.**
> Genera valores nuevos para producción.

### 5. Instalar dependencias

```cmd
npm install
```

### 6. Verificar build local (opcional pero recomendado)

```cmd
npm run build
```

Si hay errores de TypeScript o de compilación los verás aquí antes de fallar en Vercel.

### 7. Deploy a producción

```cmd
vercel --prod
```

Vercel construye el proyecto en la nube y te da la URL de producción.

---

## Conectar dominio propio (`cristasur.com`)

```cmd
vercel domains add cristasur.com
```

Sigue las instrucciones para agregar los registros DNS en tu proveedor de dominio (Namecheap, GoDaddy, Google Domains, etc.). Vercel configura HTTPS automáticamente con Let's Encrypt.

---

## Re-deploy (actualizaciones futuras)

Cada vez que hagas cambios en el código:

```cmd
cd C:\Users\Amirh\Desktop\CRISTASSUR\cristasur
vercel --prod
```

O conecta el repositorio de GitHub a Vercel y cada `git push` a `main` hace deploy automático.

---

## Sembrar datos iniciales en producción

Solo la primera vez, para crear el usuario administrador:

```cmd
vercel env pull .env.production.local
node scripts/seed.js
```

Esto crea el usuario `admin@cristasur.mx` con la contraseña que defines en `SEED_ADMIN_PASSWORD`.

---

## Variables de entorno — resumen

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MONGODB_URI` | ✅ | Cadena de conexión MongoDB Atlas |
| `JWT_SECRET` | ✅ | Secreto para firmar cookies. Mínimo 32 chars. Usa `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | URL del sitio, ej: `https://cristasur.com` |
| `RESEND_API_KEY` | ✅ | API key de Resend para emails |
| `ADMIN_NOTIFY_EMAILS` | ✅ | Emails de admin separados por coma |
| `BLOB_READ_WRITE_TOKEN` | Solo scripts locales | Token de Vercel Blob para `add-blog` y `add-product` |
| `SEED_ADMIN_EMAIL` | Solo seed | Email del admin inicial |
| `SEED_ADMIN_PASSWORD` | Solo seed | Contraseña del admin inicial |

---

## Checklist post-deploy

- [ ] El sitio carga en la URL de Vercel
- [ ] `/admin/login` funciona con las credenciales del seed
- [ ] La subida de imágenes funciona (prueba agregar un producto)
- [ ] El checkout de WhatsApp abre correctamente
- [ ] Los correos de verificación llegan (registra una cuenta de prueba)
- [ ] El dominio propio apunta correctamente y HTTPS está activo

---

## Comandos útiles en producción

```cmd
:: Ver logs en tiempo real
vercel logs --follow

:: Ver variables de entorno configuradas
vercel env ls

:: Pull de variables de entorno a local
vercel env pull .env.local

:: Ver el estado del proyecto
vercel inspect

:: Listar todos los deploys
vercel ls
```
