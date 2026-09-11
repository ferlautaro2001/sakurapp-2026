import { AlcanceRechazo, MarcaRechazo } from './enums';
import { ObservacionItem, Pedido } from './modelos';

/**
 * US-7.2 · las reglas de la comanda devuelta, sin nada alrededor.
 *
 * Viven fuera del servicio porque no necesitan ni Firestore ni Data Connect:
 * son la lógica que decide qué le falta corregir al comensal antes de poder
 * volver a mandar el pedido. `PedidosService` las expone a las pantallas.
 */

/** Un renglón del carrito, mirado sólo por su producto y su cantidad. */
export interface RenglonCorregible {
  producto: { id: string; nombre: string };
  cantidad: number;
}

/**
 * Qué tan a fondo hay que rehacer la comanda. No se elige a mano: es total
 * cuando el mozo marcó todos los renglones y parcial cuando marcó algunos.
 */
export function alcanceDe(observaciones: ObservacionItem[], renglones: number): AlcanceRechazo | null {
  if (!observaciones.length) return null;
  return observaciones.length >= renglones ? 'TOTAL' : 'PARCIAL';
}

/** La marca que le puso el mozo a ese producto, si le puso alguna. */
export function marcaDe(pedido: Pedido | undefined, productoId: string): MarcaRechazo | null {
  return pedido?.observaciones?.find((o) => o.productoId === productoId)?.marca ?? null;
}

/**
 * Los renglones marcados en rojo que siguen en el carrito.
 *
 * No se pueden pedir igual: son los que la cocina o la barra directamente no
 * pueden preparar. Se comparan contra el carrito y no contra la comanda
 * original, porque es sobre el carrito donde el comensal está corrigiendo.
 */
export function itemsACambiar<T extends RenglonCorregible>(
  pedido: Pedido | undefined,
  items: T[],
): T[] {
  if (!pedido) return [];
  return items.filter((item) => marcaDe(pedido, item.producto.id) === 'CAMBIAR');
}

/**
 * Los amarillos a los que todavía no les bajaron la cantidad. Se compara
 * contra la cantidad que tenían cuando el mozo los marcó: bajar de tres a dos
 * alcanza; dejarlos igual, no.
 */
export function itemsSinBajar<T extends RenglonCorregible>(
  pedido: Pedido | undefined,
  items: T[],
): T[] {
  if (!pedido) return [];
  return items.filter((item) => {
    const observacion = pedido.observaciones?.find((o) => o.productoId === item.producto.id);
    return observacion?.marca === 'CANTIDAD' && item.cantidad >= observacion.cantidadAlMarcar;
  });
}

/**
 * Si la comanda corregida se puede volver a mandar. Devuelve el motivo cuando
 * no, para poder decírselo al comensal con sus propias palabras.
 */
export function trabaParaReenviar(
  pedido: Pedido | undefined,
  items: RenglonCorregible[],
): string | null {
  if (!pedido) return null;
  if (!items.length) return 'Tu pedido quedó vacío: elegí algo de la carta antes de mandarlo.';

  const cambiar = itemsACambiar(pedido, items);
  if (cambiar.length) {
    return cambiar.length === 1
      ? `Todavía está ${cambiar[0].producto.nombre}, que el mozo marcó en rojo. Sacalo o cambialo por otra cosa.`
      : `Todavía quedan ${cambiar.length} productos marcados en rojo. Sacalos o cambialos por otra cosa.`;
  }

  const sinBajar = itemsSinBajar(pedido, items);
  if (sinBajar.length) {
    return sinBajar.length === 1
      ? `De ${sinBajar[0].producto.nombre} hay menos de lo que pediste: bajá la cantidad antes de mandarlo.`
      : `Hay ${sinBajar.length} productos marcados en amarillo: bajales la cantidad antes de mandarlo.`;
  }

  return null;
}
