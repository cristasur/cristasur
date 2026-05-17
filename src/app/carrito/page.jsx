// ============================================================
// /carrito  → Recibe un link compartido con el contenido del
// carrito codificado y lo carga al cliente.
// La URL es: /carrito?items=<base64url(JSON.stringify(items))>
// El componente cliente (CartHydrate) carga el snapshot al
// CartProvider, abre el drawer, y reemplaza la URL para no
// dejar el blob en la barra.
// ============================================================
import CartHydrate from '@/components/CartHydrate'

export const metadata = {
  title: 'Tu carrito · CRISTASUR',
  description: 'Revisa los productos seleccionados y termina tu pedido por WhatsApp.',
}

export default function CarritoPage({ searchParams }) {
  const items = searchParams?.items || ''
  return <CartHydrate encoded={items} />
}
