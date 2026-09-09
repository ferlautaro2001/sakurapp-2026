import { Injectable, computed, inject, signal } from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import {
  aplicarDescuentoJuego,
  confirmarPedido,
  connectorConfig,
  EstadoSector as DcEstadoSector,
  listPedidoItems,
  listPedidosActivos,
  registrarIntentoJuego,
} from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { sectorDe } from '../modelos/enums';
import { Pedido, Usuario } from '../modelos/modelos';
import { FirestoreService } from './firestore.service';
import { NotificacionesService } from './notificaciones.service';
import { UsuariosService } from './usuarios.service';

/** Confirmación, seguimiento y premio no acumulativo de pedidos. */
@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly firestore = inject(FirestoreService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly usuarios = inject(UsuariosService);
  private dejarDeEscuchar: (() => void) | null = null;
  private readonly pedidosFirestore = signal<Pedido[]>([]);
  private readonly pedidosSql = signal<Pedido[]>([]);

  readonly todos = computed(() => {
    const porId = new Map(this.pedidosSql().map((pedido) => [pedido.id, pedido]));
    for (const pedido of this.pedidosFirestore()) porId.set(pedido.id, pedido);
    return [...porId.values()].sort((a, b) => b.timestampCreacion.localeCompare(a.timestampCreacion));
  });
  readonly pendientesConfirmacion = computed(() =>
    this.todos().filter((pedido) => pedido.estadoGlobal === 'PENDIENTE_CONFIRMACION'),
  );

  iniciar(): void {
    if (this.dejarDeEscuchar) return;
    this.dejarDeEscuchar = this.firestore.escucharPedidos((pedidos) => this.pedidosFirestore.set(pedidos));
    void this.cargarDesdeSql();
  }

  porId(id: string): Pedido | undefined {
    return this.todos().find((pedido) => pedido.id === id);
  }

  activoDe(cliente: Usuario | null | undefined): Pedido | undefined {
    if (!cliente) return undefined;
    return this.todos().find(
      (pedido) =>
        (pedido.clienteId === cliente.id ||
          pedido.clienteUid === cliente.uid ||
          pedido.clienteUid === cliente.id) &&
        pedido.estadoGlobal !== 'CERRADO' &&
        pedido.estadoGlobal !== 'RECHAZADO',
    );
  }

  /** Deriva los ítems por tipo, confirma y avisa sólo al personal necesario. */
  async confirmar(pedido: Pedido, confirmador: Usuario): Promise<void> {
    if (pedido.estadoGlobal !== 'PENDIENTE_CONFIRMACION') {
      throw new Error('Este pedido ya fue procesado.');
    }
    if (!pedido.items.length) {
      throw new Error('El pedido no tiene productos para confirmar.');
    }

    const itemsSectorizados = pedido.items.map((item) => ({ ...item, sector: sectorDe(item.tipo) }));
    const sectores = new Set(itemsSectorizados.map((item) => item.sector));
    const hayCocina = sectores.has('COCINA');
    const hayBar = sectores.has('BAR');

    await this.confirmarEnSql(pedido.id, confirmador.id, hayCocina, hayBar);

    await this.firestore.confirmarPedido({
      ...pedido,
      estadoGlobal: 'CONFIRMADO',
      estadoCocina: hayCocina ? 'PENDIENTE' : 'NO_APLICA',
      estadoBar: hayBar ? 'PENDIENTE' : 'NO_APLICA',
      confirmadoPorId: confirmador.id,
      items: itemsSectorizados,
    });

    const mensaje = `Mesa ${pedido.mesaNumero}: ${pedido.items.length} producto${pedido.items.length === 1 ? '' : 's'} para preparar.`;
    if (hayCocina) {
      await this.notificaciones.enviar(
        this.destinatarios('COCINERO'),
        'Nueva comanda de Cocina',
        mensaje,
        ['/carta'],
      );
    }
    if (hayBar) {
      await this.notificaciones.enviar(
        this.destinatarios('CANTINERO'),
        'Nueva comanda de Bar',
        mensaje,
        ['/carta'],
      );
    }

    void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
  }

  /** Resuelve el único intento del cliente: puede obtener 0, 10, 15 o 20 %. */
  async jugar(pedido: Pedido, cliente: Usuario): Promise<number> {
    if (!this.juegosHabilitados(pedido)) {
      throw new Error('El juego no está habilitado para este pedido.');
    }
    if (pedido.juegoIntentado) {
      throw new Error('Ya usaste el único intento de este pedido.');
    }

    const premios = [0, 10, 15, 20] as const;
    const numero = new Uint32Array(1);
    crypto.getRandomValues(numero);
    const descuento = premios[numero[0] % premios.length];
    const resultado = await this.firestore.registrarIntentoJuego(pedido.id, cliente.id, descuento);
    if (!resultado.aplicado) throw new Error('Ya usaste el único intento de este pedido.');
    await this.registrarJuegoEnSql(pedido, cliente, descuento, resultado.totalFinal);
    return descuento;
  }

  juegosHabilitados(pedido: Pedido | undefined): boolean {
    if (!pedido) return false;
    return !['SELECCIONANDO', 'PENDIENTE_CONFIRMACION', 'RECHAZADO', 'CERRADO'].includes(
      pedido.estadoGlobal,
    );
  }

  private destinatarios(perfil: 'COCINERO' | 'CANTINERO'): string[] {
    return this.usuarios
      .todos()
      .filter((usuario) => usuario.perfil === perfil && usuario.estado === 'APROBADO' && usuario.activo)
      .map((usuario) => usuario.uid || usuario.id);
  }

  private async cargarDesdeSql(): Promise<void> {
    try {
      const dc = this.dataConnect();
      const [pedidosRes, itemsRes] = await Promise.all([listPedidosActivos(dc), listPedidoItems(dc)]);
      const pedidosSql = pedidosRes?.data?.pedidos ?? [];
      const itemsSql = itemsRes?.data?.pedidoItems ?? [];

      const activos: Pedido[] = [];
      for (const pedido of pedidosSql) {
        if (pedido.estadoGlobal === 'CERRADO' || pedido.estadoGlobal === 'RECHAZADO') continue;
        const items = itemsSql
          .filter((item) => item.pedido.id === pedido.id)
          .map((item) => ({
            id: item.id,
            productoId: item.producto.id,
            productoNombre: item.producto.nombre,
            tipo: item.producto.tipo as Pedido['items'][number]['tipo'],
            sector: sectorDe(item.producto.tipo as Pedido['items'][number]['tipo']),
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
          }));
        const totalBruto = redondearImporte(items.reduce((total, item) => total + item.subtotal, 0));

        activos.push({
          id: pedido.id,
          mesaId: pedido.mesa.id,
          mesaNumero: pedido.mesa.numero,
          clienteId: pedido.cliente.id,
          clienteUid: pedido.cliente.uid,
          clienteNombre: [pedido.cliente.nombre, pedido.cliente.apellido ?? ''].join(' ').trim(),
          estadoGlobal: pedido.estadoGlobal as Pedido['estadoGlobal'],
          estadoCocina: pedido.estadoCocina as Pedido['estadoCocina'],
          estadoBar: pedido.estadoBar as Pedido['estadoBar'],
          tiempoEstimado: pedido.tiempoEstimado,
          totalBruto,
          descuentoJuego: 0,
          montoDescuentoJuego: 0,
          totalFinal: pedido.totalFinal,
          confirmadoPorId: null,
          juegoIntentado: false,
          timestampCreacion: pedido.timestampCreacion,
          items,
        });
      }
      this.pedidosSql.set(activos);
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar pedidos de Cloud SQL; continúa la escucha Firestore:', error);
    }
  }

  private async confirmarEnSql(
    pedidoId: string,
    confirmadorId: string,
    hayCocina: boolean,
    hayBar: boolean,
  ): Promise<void> {
    if (!esUuid(pedidoId) || !esUuid(confirmadorId)) return;
    try {
      const dc = this.dataConnect();
      await confirmarPedido(dc, {
        id: pedidoId,
        estadoCocina: hayCocina ? DcEstadoSector.PENDIENTE : DcEstadoSector.NO_APLICA,
        estadoBar: hayBar ? DcEstadoSector.PENDIENTE : DcEstadoSector.NO_APLICA,
        confirmadoPorId: confirmadorId,
      });
    } catch (error) {
      console.warn('⚠️ No se pudo confirmar el pedido en Cloud SQL; se sincronizará por Firestore:', error);
    }
  }

  private async registrarJuegoEnSql(
    pedido: Pedido,
    cliente: Usuario,
    descuento: number,
    totalFinal: number,
  ): Promise<void> {
    if (!esUuid(pedido.id) || !esUuid(cliente.id)) return;
    try {
      const dc = this.dataConnect();
      await registrarIntentoJuego(dc, {
        pedidoId: pedido.id,
        clienteId: cliente.id,
        gano: descuento > 0,
        descuentoOtorgado: descuento,
      });
      await aplicarDescuentoJuego(dc, {
        id: pedido.id,
        descuentoJuego: descuento,
        montoDescuentoJuego: redondearImporte((pedido.totalBruto * descuento) / 100),
        totalFinal,
      });
    } catch (error) {
      console.warn('⚠️ No se pudo guardar el intento en Cloud SQL; quedó registrado en Firestore:', error);
    }
  }

  private dataConnect() {
    const app = getApps().length ? getApp() : initializeApp(environment.firebase);
    return getDataConnect(app, connectorConfig);
  }
}

function esUuid(valor: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
}

function redondearImporte(valor: number): number {
  return Math.round(valor * 100) / 100;
}
