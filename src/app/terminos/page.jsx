// /terminos — Términos y condiciones de uso
export const metadata = {
  title: 'Términos y condiciones · CRISTASUR',
  description: 'Términos de uso del catálogo de CRISTASUR y condiciones de pedidos.',
}

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-black text-slate-900">Términos y condiciones</h1>
      <p className="text-sm text-slate-500 mt-1">
        Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="space-y-5 mt-8 text-slate-800 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mt-6">1. Quiénes somos</h2>
          <p>
            CRISTASUR es un negocio dedicado a la venta de plásticos y artículos para hogar
            y negocio, con sucursales físicas en <b>Mérida, Yucatán</b> y{' '}
            <b>Bacalar, Quintana Roo</b>. El sitio web cristasur.mx funciona como catálogo
            digital. Las ventas se concretan vía WhatsApp, en sucursal o por arreglo directo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">2. Catálogo y precios</h2>
          <p>
            Los precios mostrados están en pesos mexicanos (MXN) e incluyen IVA cuando
            aplique. CRISTASUR se reserva el derecho de modificar precios sin previo aviso.
            En caso de error tipográfico, el precio será corregido y se notificará al
            cliente antes de procesar el pedido.
          </p>
          <p>
            La disponibilidad de productos es indicativa y puede variar. Cuando un producto
            aparece "sin stock", invitamos a contactarnos para confirmar tiempo de
            reposición.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">3. Mayoreo</h2>
          <p>
            Algunos productos cuentan con <b>precio de mayoreo</b> que se aplica
            automáticamente al alcanzar la cantidad mínima indicada en cada ficha. Para
            volúmenes mayores o cotizaciones especiales, contáctanos directamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">4. Proceso de pedido</h2>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Agrega productos al carrito y revisa el subtotal.</li>
            <li>Da clic en "Pedir por WhatsApp": se abrirá un mensaje pre-rellenado.</li>
            <li>Envía el mensaje. Te responderemos con disponibilidad, costo de envío y forma de pago.</li>
            <li>El pedido queda confirmado al acordar pago y entrega.</li>
          </ol>
          <p className="mt-2">
            <b>El sitio no procesa pagos en línea.</b> Los pagos se acuerdan por WhatsApp.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">5. Envíos y entrega</h2>
          <p>
            Cobertura habitual: Mérida y zona metropolitana, Bacalar y alrededores.
            Otros destinos se evalúan caso por caso. Costos y tiempos se confirman al
            cotizar el pedido.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">6. Devoluciones y garantías</h2>
          <p>
            Aceptamos devolución de producto en mal estado o que no corresponda con lo
            pedido, dentro de los <b>7 días naturales</b> posteriores a la entrega,
            presentando el producto en su estado original. Productos perecederos o de
            higiene no son sujetos de devolución.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">7. Reseñas</h2>
          <p>
            Las reseñas pasan por moderación antes de publicarse. Nos reservamos el
            derecho de no publicar contenido ofensivo, fuera de tema, con datos personales
            de terceros o que constituya promoción de productos ajenos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">8. Propiedad intelectual</h2>
          <p>
            Las fotografías, textos y marca CRISTASUR son propiedad de sus titulares.
            Está prohibida su reproducción comercial sin autorización por escrito.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">9. Limitación de responsabilidad</h2>
          <p>
            CRISTASUR no es responsable por daños indirectos derivados del uso del
            catálogo. Hacemos esfuerzos razonables para mantener el sitio operativo
            pero no garantizamos disponibilidad continua.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">10. Jurisdicción</h2>
          <p>
            Cualquier controversia se resolverá conforme a las leyes mexicanas y se
            someterá a la jurisdicción de los tribunales competentes de Mérida, Yucatán.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">11. Contacto</h2>
          <p>
            WhatsApp: <a href="https://wa.me/529994731919" className="text-brand-700 underline">+52 999 473 1919</a>
          </p>
        </section>
      </div>
    </article>
  )
}
