// /aviso-de-privacidad — Cumplimiento LFPDPPP México
export const metadata = {
  title: 'Aviso de privacidad · CRISTASUR',
  description:
    'Cómo CRISTASUR recolecta, usa y protege los datos personales de sus clientes. Cumple LFPDPPP.',
}

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose-slate">
      <h1 className="text-3xl md:text-4xl font-black text-slate-900">Aviso de privacidad</h1>
      <p className="text-sm text-slate-500 mt-1">
        Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="space-y-5 mt-8 text-slate-800 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mt-6">1. Identidad y domicilio del responsable</h2>
          <p>
            <b>CRISTASUR</b> (en adelante "el Responsable"), con domicilio en
            Periférico de Mérida Lic. Manuel Berzunza, Leandro Valle, Mérida, Yucatán, México,
            es responsable del uso y protección de tus datos personales en términos de la
            Ley Federal de Protección de Datos Personales en Posesión de los Particulares
            (LFPDPPP) y demás normatividad aplicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">2. Datos personales que recabamos</h2>
          <p>Para cumplir con las finalidades descritas, recabamos:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Datos de identificación: nombre, apellidos.</li>
            <li>Datos de contacto: número telefónico (WhatsApp), correo electrónico.</li>
            <li>Datos de la operación: productos solicitados, montos, dirección de entrega.</li>
            <li>
              Datos técnicos automáticos: dirección IP, tipo de navegador, páginas visitadas,
              cookies de sesión y carrito.
            </li>
          </ul>
          <p className="mt-2">
            <b>No</b> recabamos datos personales sensibles ni información financiera (no
            procesamos pagos en línea; los acuerdos de pago se hacen directamente vía WhatsApp).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">3. Finalidades del tratamiento</h2>
          <p>Tus datos se usarán para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Procesar y dar seguimiento a tus pedidos.</li>
            <li>Coordinar entregas y pagos.</li>
            <li>Atender consultas, reclamos y devoluciones.</li>
            <li>Mejorar nuestro catálogo y experiencia de usuario.</li>
          </ul>
          <p className="mt-2">
            Finalidades secundarias (requieren tu consentimiento expreso): envío de
            promociones y catálogo nuevo. Si no deseas que tus datos se utilicen para
            estas finalidades, escríbenos a través de los medios listados en la sección 8.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">4. Transferencias</h2>
          <p>
            No transferimos tus datos personales a terceros sin tu consentimiento, salvo
            en los supuestos previstos en el artículo 37 de la LFPDPPP (autoridades,
            obligaciones legales). Utilizamos servicios de hospedaje (MongoDB Atlas) y
            envío que pueden tener acceso técnico a la información estrictamente necesaria
            para operar el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">5. Cookies y tecnologías similares</h2>
          <p>
            Usamos cookies y almacenamiento local del navegador (localStorage) para
            recordar tu carrito, productos vistos recientemente y favoritos. Estas
            tecnologías no acceden a información personal almacenada en tu equipo.
            Puedes desactivarlas desde tu navegador en cualquier momento, asumiendo que
            partes del sitio dejarán de funcionar correctamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">6. Derechos ARCO</h2>
          <p>
            Tienes derecho a <b>Acceder</b>, <b>Rectificar</b>, <b>Cancelar</b> u{' '}
            <b>Oponerte</b> al tratamiento de tus datos personales, así como a revocar
            el consentimiento que para tal fin nos hayas otorgado. Para ejercer estos
            derechos, escríbenos al correo o WhatsApp listados en la sección 8 indicando:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nombre completo y medio para recibir respuesta.</li>
            <li>Documentos que acrediten tu identidad.</li>
            <li>Descripción clara de los datos y el derecho que deseas ejercer.</li>
          </ul>
          <p className="mt-2">
            Te responderemos en un plazo máximo de 20 días hábiles conforme al artículo
            32 de la LFPDPPP.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">7. Cambios al aviso</h2>
          <p>
            Cualquier modificación a este aviso será publicada en esta misma página
            indicando la fecha de actualización. Te recomendamos revisarlo periódicamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mt-6">8. Contacto</h2>
          <p>
            Para cualquier asunto relacionado con tus datos personales:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>WhatsApp: <a href="https://wa.me/529994731919" className="text-brand-700 underline">+52 999 473 1919</a></li>
            <li>Domicilio: Periférico de Mérida Lic. Manuel Berzunza, Leandro Valle, Mérida, Yucatán.</li>
          </ul>
        </section>
      </div>
    </article>
  )
}
