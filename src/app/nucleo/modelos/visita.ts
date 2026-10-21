import { Pedido } from './modelos';

/**
 * Punto 22 · ¿el mozo ya cobró la visita en curso?
 *
 * Sólo cuenta un pedido cerrado de esta mesa que se haya hecho después de que
 * el comensal se sentó: si vuelve a la mesa de una visita anterior, el pedido
 * cerrado de aquella vez no lo tiene que sacar de la mesa apenas llega.
 * `sentadoDesde` vacío es una sesión de antes de guardar la hora: vale
 * cualquier pedido de la mesa.
 */
export function visitaCobrada(ultimo: Pedido | undefined, mesaId: string | null, sentadoDesde: string | null): boolean {
  if (!ultimo || !mesaId || sentadoDesde === null) return false;
  if (ultimo.estadoGlobal !== 'CERRADO' || ultimo.mesaId !== mesaId) return false;
  return ultimo.timestampCreacion >= sentadoDesde;
}
