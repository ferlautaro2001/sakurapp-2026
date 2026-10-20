import { inject } from '@angular/core';
import { PaginaConSesion } from '../pagina-base';
import { Pedido } from '../../nucleo/modelos/modelos';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { AccionPedido } from '../../ui';

/**
 * Base de las pantallas del mozo que operan sobre comandas (listado y detalle).
 */
export abstract class PaginaDeComandas extends PaginaConSesion {
  protected readonly pedidos = inject(PedidosService);
  protected readonly mesas = inject(MesasService);
  protected readonly usuarios = inject(UsuariosService);
  protected readonly notificaciones = inject(NotificacionesService);
  private readonly espera = inject(EsperaService);

  /** El paso que le toca al mozo con el pedido, o ninguno si está en manos de otro. */
  protected accionDe(pedido: Pedido): AccionPedido | null {
    if (pedido.estadoGlobal === 'LISTO') return { rotulo: 'Entregar', icono: 'room_service' };
    if (pedido.estadoGlobal === 'CUENTA_SOLICITADA' && !pedido.cuentaHabilitada) {
      return { rotulo: 'Habilitar cuenta', icono: 'receipt_long' };
    }
    if (pedido.estadoGlobal === 'PAGO_PENDIENTE') return { rotulo: 'Confirmar pago', icono: 'price_check' };
    return null;
  }

  /** Hace el paso que le toca; devuelve si se hizo. */
  protected accionar(pedido: Pedido): Promise<boolean> {
    if (pedido.estadoGlobal === 'LISTO') return this.entregarPedido(pedido);
    if (pedido.estadoGlobal === 'CUENTA_SOLICITADA') return this.habilitarCuentaPedido(pedido);
    if (pedido.estadoGlobal === 'PAGO_PENDIENTE') return this.confirmarPagoPedido(pedido);
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

  /** Punto 21 · el mozo le habilita la cuenta al comensal que la pidió. */
  protected async habilitarCuentaPedido(pedido: Pedido): Promise<boolean> {
    const seguro = await this.preguntar({
      titulo: '¿Habilitás la cuenta?',
      mensaje: '',
      confirmar: 'Habilitar cuenta',
      tono: 'exito',
      icono: 'receipt_long',
      detalle: [
        { rotulo: 'Mesa', valor: `${this.numeroMesa(pedido)}` },
        { rotulo: 'Cliente', valor: this.comensal(pedido) },
        { rotulo: 'Consumo', valor: `$ ${pedido.totalFinal.toLocaleString('es-AR')}` },
      ],
    });
    if (!seguro) return false;

    await this.cargando.conEsperaMinima('Habilitando la cuenta…', () => this.pedidos.habilitarCuenta(pedido.id));
    this.avisos.exito(`Cuenta de la mesa ${this.numeroMesa(pedido)} habilitada`, 'El comensal ya puede pagar.');
    return true;
  }

  /**
   * Punto 22 · el mozo confirma el pago: el pedido se cierra, la mesa queda
   * libre y la visita del comensal termina, así para volver a sentarse tiene
   * que anotarse de nuevo en la puerta.
   */
  protected async confirmarPagoPedido(pedido: Pedido): Promise<boolean> {
    const pago = pedido.pago;
    const seguro = await this.preguntar({
      titulo: '¿Confirmás el pago?',
      mensaje: 'Se cierra la cuenta y la mesa queda libre.',
      confirmar: 'Confirmar pago',
      tono: 'exito',
      icono: 'price_check',
      detalle: [
        { rotulo: 'Mesa', valor: `${this.numeroMesa(pedido)}` },
        { rotulo: 'Cliente', valor: this.comensal(pedido) },
        { rotulo: 'Pagó', valor: `$ ${(pago?.total ?? this.pedidos.totalAPagar(pedido)).toLocaleString('es-AR')}` },
        ...(pago ? [{ rotulo: 'Operación', valor: `#${pago.operacion}` }] : []),
      ],
    });
    if (!seguro) return false;

    // El pedido se cierra al final: cuando el teléfono del comensal se entera
    // del cierre, la fila ya lo soltó y la mesa ya está libre.
    await this.cargando.conEsperaMinima('Confirmando el pago…', async () => {
      await this.espera.iniciar();
      await this.espera.cerrarVisita(pedido.clienteId, pedido.clienteUid);
      await this.mesas.liberar(pedido.mesaId);
      await this.pedidos.confirmarPago(pedido.id);
    });
    this.avisos.exito(`Mesa ${this.numeroMesa(pedido)} libre`, 'El pago quedó confirmado.');
    return true;
  }
}
