# Despliegue de CRISTASUR

## Preparar el entorno

1. Usa Node.js 24 LTS y npm ci para instalar exactamente package-lock.json.
2. Configura las variables de README.md y .env.example por separado para Preview y Production. Usa una base aislada en Preview.
3. MongoDB debe soportar transacciones (replica set / Atlas). Verifica acceso de red desde el hosting.
4. Vincula Vercel Blob para imágenes y Cloudflare R2 para respaldos. No uses public/uploads para nuevas subidas en producción.
5. Establece NEXT_PUBLIC_SITE_URL y el callback de Google: /api/auth/google/callback.
6. Configura Envia en modo producción antes de aceptar tarifas definitivas.

## Validar y desplegar

    npm test
    npm run lint
    npm run build

Despliega primero un Preview mediante la integración Git o Vercel CLI. No ejecutes seed contra una base existente como parte del build. No incluyas secretos en logs, archivos versionados ni variables NEXT_PUBLIC_*.

Prueba permisos con cuentas de administrador, editor y cliente. Verifica que un visitante no pueda listar usuarios, cupones privados ni exportar el catálogo. Comprueba los escenarios de pedido descritos en LANZAMIENTO.md.

## Operación

- vercel.json programa respaldo a las 09:00 UTC y recordatorios de carrito a las 15:00 UTC.
- Configura CRON_SECRET; una respuesta HTTP 500 del respaldo requiere atención.
- No borres el último respaldo bueno al solucionar una falla. Comprueba también los objetos de Blob.
- Revisa Sentry y los logs después del deploy.
- Para rollback de código utiliza el despliegue anterior; no restaures MongoDB salvo que una incidencia de datos lo justifique.

Actualizar el código local no publica automáticamente esta revisión.
