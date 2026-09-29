# CRISTASUR

Catálogo y panel de administración para menudeo y mayoreo, con pedidos por WhatsApp.
Next.js 15 (App Router), React 19, MongoDB/Mongoose y Tailwind CSS.

## Desarrollo

Requiere Node.js 22.12 o posterior (recomendado Node.js 24 LTS) y MongoDB con replica set, como Atlas. Las transacciones de pedidos no funcionan en un MongoDB standalone.

    npm ci
    npm run dev

Copia .env.example a .env.local y configura las variables. Nunca versiones credenciales.

- MONGODB_URI: conexión a la base del entorno.
- JWT_SECRET: secreto aleatorio de al menos 32 caracteres; firma sesiones y cotizaciones.
- NEXT_PUBLIC_SITE_URL: URL pública del entorno, sin barra final.
- BLOB_READ_WRITE_TOKEN: almacenamiento de imágenes y videos en Vercel Blob.
- CRON_SECRET: autenticación de tareas programadas.
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET: respaldos externos.
- RESEND_API_KEY y las variables de remitente: correo transaccional.
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: acceso con Google para clientes sin TOTP.
- ENVIA_TOKEN, ENVIA_ENV y ENVIA_ORIGIN_*: cotización de envíos. Consulta src/lib/envia.js para las opciones completas.
- NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT y SENTRY_AUTH_TOKEN: monitoreo y mapas de código opcionales.

Para crear las categorías iniciales y el primer administrador, configura SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD y ejecuta npm run seed una sola vez en la base elegida. El seed escribe datos.

## Verificación

    npm test
    npm run lint
    npm run build

Las pruebas usan servicios simulados: no contactan la base real, paqueterías ni correo. Incluyen permisos, errores del checkout, tarifas firmadas, integridad de respaldos y cambios de estado de pedidos. El build no debe requerir conectarse a MongoDB: la navegación y las páginas que consultan el catálogo se renderizan al recibir peticiones.

Para servir el build: npm start. CI ejecuta las mismas comprobaciones.

## Catálogo y administración

- /productos y /categoria/[slug]: filtros, variantes y precios por volumen.
- /admin/login: inicio de sesión del equipo; /admin: panel.
- Los administradores gestionan cuentas y borrados permanentes; los editores administran el catálogo y los pedidos según permisos de cada endpoint.
- Los clientes solo pueden modificar su perfil, carrito y opciones de su cuenta.
- Las rutas de escritura de productos validan el rol dentro del handler además del middleware.
- El formulario de productos separa precios, dimensiones, medios y variantes en src/app/admin/productos/form/.
- El blog está retirado de la navegación pública y sus URLs redirigen al inicio.

## Imágenes y CSV

Las subidas desde el panel se procesan con sharp y se almacenan en **Vercel Blob**. Sus URLs persistentes se guardan en MongoDB. No se guardan las nuevas subidas en public/uploads.

public/uploads solo admite archivos heredados presentes en el deploy. Está excluida de Git salvo .gitkeep: copiar archivos ahí en una computadora no los publica automáticamente. Para producción usa el panel o el script de migración de imágenes, revisando su modo y sus requisitos antes de ejecutarlo.

Al importar CSV, image es una URL de imagen y gallery admite varias URLs separadas por |. Conserva _id o SKU para actualizar sin duplicados. Las categorías deben existir. Usa la vista previa antes de importar. La exportación y la importación requieren una cuenta del equipo.

Los precios, variantes y reglas de stock se validan en src/lib/validation.js y src/lib/pricing.js. El formato de columnas y aliases vive en src/lib/csv.js; descarga el ejemplo desde /admin/productos/import para usar el formato vigente.

## Pedidos, cupones y envíos

El botón de WhatsApp espera una respuesta válida de /api/orders. Si la solicitud falla o el servidor rechaza el carrito, se muestra el error y no se envía el pedido original. Solo se aceptan productos publicados y cantidades válidas; sus precios se leen de la base y el cupón se recalcula en el servidor.

Las tarifas de envío se firman por diez minutos y quedan vinculadas a los productos y cantidades cotizados. El servidor no acepta un precio de envío arbitrario del navegador. Si el carrito cambia, la cotización vence o proviene del entorno de pruebas, hay que cotizar nuevamente en producción o pedir sin tarifa para acordar el envío con la tienda.

Un pedido intent es una intención, no una venta ni una reserva de inventario. Al pasar por primera vez a confirmed, shipped o delivered, el estado y el uso del cupón se actualizan en una única transacción. Se verifica vigencia y límite de usos al confirmar. Los reintentos no duplican el contador; cancelar un pedido ya contabilizado no devuelve automáticamente el uso.

## Respaldos

/api/cron/backup genera JSON de las colecciones del negocio, CSV de productos y metadata, y los sube a Cloudflare R2. Vercel lo programa a las 09:00 UTC; revisa vercel.json.

Cualquier fallo al leer una colección, generar el CSV o subir un archivo invalida el respaldo. Solo después de subir el respaldo completo se permite borrar copias con más de 30 días. La respuesta debe ser exitosa y el manifiesto contener todas las colecciones esperadas.

Los JSON conservan las URLs de Blob; **no incluyen los binarios de imágenes y videos**. La conservación o copia de esos objetos se administra por separado. No se presupone que el plan de Atlas incluya snapshots: verifica las prestaciones y retención de tu cuenta.

npm run backup genera una copia local de las mismas colecciones, CSV y archivos heredados de public/uploads. También falla sin limpiar copias anteriores si una exportación falla. La carpeta backups está excluida de Git. Para una recuperación completa usa los JSON de R2 y convierte los identificadores y fechas a sus tipos BSON según los modelos. Valida la restauración en una base aislada antes de reemplazar datos de producción.

## Despliegue

Consulta DEPLOY.md y LANZAMIENTO.md. Desplegar requiere variables de entorno para el destino, verificar las transacciones de MongoDB y probar el checkout y el respaldo en un entorno aislado.
