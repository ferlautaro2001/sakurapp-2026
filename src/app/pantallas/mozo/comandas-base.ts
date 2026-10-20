import { inject } from '@angular/core';
import { PaginaConSesion } from '../pagina-base';
import { Pedido } from '../../nucleo/modelos/modelos';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';
import { AccionPedido } from '../../ui';

/**
 * Base de las pantallas del mozo que operan sobre comandas (listado y detalle).
 */
export abstract class PaginaDeComandas extends PaginaConSesion {
  protected readonly pedidos = inject(PedidosService);
  protected readonly mesas = inject(MesasService);
  protected readonly usuarios = inject(UsuariosService);
  protected readonly notificaciones = inject(NotificacionesService);

  /** El paso que le toca al mozo con el pedido, o ninguno si está en manos de otro. */
  protected accionDe(pedido: Pedido): AccionPedido | null {
    if (pedido.estadoGlobal === 'LISTO') return { rotulo: 'Entregar', icono: 'room_service' };
    return null;
  }

  /** Hace el paso que le toca; devuelve si se hizo. */
  protected accionar(pedido: Pedido): Promise<boolean> {
    if (pedido.estadoGlobal === 'LISTO') return this.entregarPedido(pedido);
    return Promise.resolve(false);
  }

  private cuantos(cantidad: number): string {
    if (!cantidad) return 'nada';
    return `${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`;
  }

  protected numeroMesa(pedido: Pedido): number | string {
    return pedido.mesaNumero || this.mesas.porId(pedido.mesaId)?.numero || '—';
  }

  protected comensal(pedido: Pedido): string {
    return pedido.clienteNombre || 'Comensal';
  }

  protected unidades(pedido: Pedido): number {
    return pedido.items.reduce((suma, i) => suma + i.cantidad, 0);
  }

  protected async confirmarPedido(pedido: Pedido): Promise<boolean> {
    const mozo = this.usuario();
    if (!mozo) return false;

    const itemsCocina = pedido.items.filter((i) => i.sector === 'COCINA');
    const itemsBar = pedido.items.filter((i) => i.sector === 'BAR');

    const seguro = await this.preguntar({
      titulo: '¿Confirmás el pedido?',
      mensaje: '',
      confirmar: 'Confirmar',
      tono: 'exito',
      icono: 'thumb_up',
      detalle: [
        { rotulo: 'Mesa', valor: `${this.numeroMesa(pedido)}` },
        { rotulo: 'Cliente', valor: this.comensal(pedido) },
        { rotulo: 'A la cocina', valor: this.cuantos(itemsCocina.length) },
        { rotulo: 'A la barra', valor: this.cuantos(itemsBar.length) },
        { rotulo: 'Total', valor: `$ ${pedido.totalFinal.toLocaleString('es-AR')}` },
        { rotulo: 'Demora estimada', valor: `${pedido.tiempoEstimado} minutos` },
      ],
    });
    if (!seguro) return false;

    await this.cargando.conEsperaMinima('Derivando el pedido…', () =>
      this.pedidos.confirmar(
        pedido,
        mozo,
      ),
    );

    this.avisos.exito(`Mesa ${this.numeroMesa(pedido)} confirmada`);
    return true;
  }

  /**
   * Punto 19 · el mozo lleva el pedido completo a la mesa. Sólo se puede con
   * todos los sectores listos; después, el comensal confirma que lo recibió.
   */
  protected async entregarPedido(pedido: Pedido): Promise<boolean> {
    if (pedido.estadoGlobal !== 'LISTO') return false;

    const seguro = await this.preguntar({
      titulo: '¿Entregaste el pedido?',
      mensaje: '',
      confirmar: 'Entregar',
      tono: 'exito',
      icono: 'room_service',
      detalle: [
        { rotulo: 'Mesa', valor: `${this.numeroMesa(pedido)}` },
        { rotulo: 'Cliente', valor: this.comensal(pedido) },
        { rotulo: 'Productos', valor: this.cuantos(this.unidades(pedido)) },
      ],
    });
    if (!seguro) return false;

    await this.cargando.conEsperaMinima('Marcando la entrega…', () =>
      this.pedidos.actualizarEstadoGlobal(pedido.id, 'ENTREGADO'),
    );

    this.avisos.exito(`Mesa ${this.numeroMesa(pedido)} entregada`, 'Falta que el comensal confirme la recepción.');
    return true;
  }
}
