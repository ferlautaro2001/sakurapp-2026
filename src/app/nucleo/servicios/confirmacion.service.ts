import { Injectable, signal } from '@angular/core';

export interface PedidoConfirmacion {
  titulo: string;
  mensaje: string;
  /** Rótulo del botón que confirma. Siempre dice qué va a pasar, nunca "Aceptar". */
  confirmar: string;
  cancelar?: string;
  /** Tiñe el botón de confirmación: verde para aceptar, rojo para lo destructivo. */
  tono?: 'exito' | 'peligro' | 'primario';
  icono?: string;
  /** Datos que se muestran en la ficha del modal, para saber qué se está tocando. */
  detalle?: { rotulo: string; valor: string }[];
  /**
   * Fotografía de la persona sobre la que se decide.
   *
   * Cuando la decisión es sobre alguien, la cara reemplaza al ícono: es lo
   * último que se mira antes de aprobar o rechazar un registro.
   */
  foto?: string | null;
}

/** Ficha para mirar: el rótulo del único botón es opcional, por defecto "Cerrar". */
export type PedidoFicha = Omit<PedidoConfirmacion, 'confirmar'> & { confirmar?: string };

interface ConfirmacionAbierta extends PedidoConfirmacion {
  /** Una ficha para mirar no ofrece decisión: lleva un solo botón. */
  soloCerrar?: boolean;
  resolver: (respuesta: boolean) => void;
}

/**
 * Confirmación modal.
 *
 * Ninguna acción que acepte, rechace, modifique o dé de baja algo se ejecuta
 * de un solo toque: siempre pasa por acá. El modal lo dibuja la cáscara de la
 * aplicación una sola vez, así que las pantallas sólo tienen que preguntar.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  readonly abierta = signal<ConfirmacionAbierta | null>(null);

  /** Devuelve `true` si la persona confirmó. */
  pedir(pedido: PedidoConfirmacion): Promise<boolean> {
    // Si ya había una abierta, se cancela: nunca se apilan dos preguntas.
    this.abierta()?.resolver(false);

    return new Promise<boolean>((resolver) => {
      this.abierta.set({ tono: 'primario', cancelar: 'Cancelar', ...pedido, resolver });
    });
  }

  /**
   * Ficha ampliada: el mismo modal, pero para mirar en detalle a una persona.
   * Sin decisión que tomar, así que lleva un único botón para cerrar.
   */
  mostrar(pedido: PedidoFicha): Promise<boolean> {
    this.abierta()?.resolver(false);

    return new Promise<boolean>((resolver) => {
      this.abierta.set({
        tono: 'primario',
        ...pedido,
        confirmar: pedido.confirmar ?? 'Cerrar',
        soloCerrar: true,
        resolver,
      });
    });
  }

  responder(respuesta: boolean): void {
    const actual = this.abierta();
    if (!actual) return;
    this.abierta.set(null);
    actual.resolver(respuesta);
  }
}
