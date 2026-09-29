# Comprobaciones antes de publicar

Lista operacional para el estado actual del proyecto. Las pruebas locales no certifican las credenciales ni los servicios de producción.

- [ ] npm ci, npm test, npm run lint y npm run build pasan.
- [ ] Preview utiliza base y servicios de prueba aislados.
- [ ] Un cliente puede editar su perfil pero no modificar catálogo, cupones ni pedidos ajenos.
- [ ] Visitantes anónimos no acceden a usuarios, exportaciones ni cupones privados.
- [ ] Google no inicia sesión de administradores, editores o cuentas con TOTP.
- [ ] Pedidos válidos llegan a WhatsApp con los mismos importes del registro.
- [ ] Errores HTTP, falta de existencias y desconexión muestran error sin enviar el carrito original.
- [ ] Una tarifa manipulada, vencida o de otro carrito se rechaza.
- [ ] Confirmar y entregar no contabiliza dos veces un cupón; el último uso se respeta ante concurrencia.
- [ ] MongoDB admite transacciones y el cambio de estado revierte si falla la operación.
- [ ] Las imágenes subidas siguen disponibles después de otro despliegue.
- [ ] El respaldo contiene todas las colecciones y los fallos no activan la limpieza.
- [ ] Se ha ensayado una restauración en una base aislada y se conserva una copia de los objetos de Blob.
- [ ] Canonical, sitemap, fotos, formularios y navegación se revisaron en móvil y escritorio.
- [ ] Dominio, correo, Google, Envia, cron y Sentry tienen la configuración del entorno correcto.

Los precios y límites comerciales de los proveedores deben confirmarse directamente en sus cuentas; esta lista no presupone prestaciones de un plan gratuito.
