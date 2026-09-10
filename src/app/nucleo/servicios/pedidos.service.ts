import { Injectable, inject, signal } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import {
  connectorConfig,
  createPedido,
  createPedidoItem,
  listPedidosActivos,
  EstadoPedido as DcEstadoPedido,
  Sector as DcSector,
} from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { ItemCarrito } from './carrito.service';
import { FirestoreService } from './firestore.service';
import { Mesa, Usuario } from '../modelos/modelos';

export interface PedidoCreado {
  id: string;
  mesaId: string;
  mesaNumero: number;
  clienteId: string;
  estado: 'PENDIENTE_CONFIRMACION';
  tiempoEstimado: number;
  total: number;
  creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly firestore = inject(FirestoreService);

  readonly ultimoPedido = signal<PedidoCreado | null>(null);

  async crearPendiente(
    mesa: Mesa,
    cliente: Usuario,
    items: ItemCarrito[],
    tiempoEstimado: number,
    total: number,
  ): Promise<PedidoCreado> {
    if (!items.length) {
      throw new Error('El carrito está vacío.');
    }

    if (!esUuid(mesa.id)) {
      throw new Error(
        'La mesa todavía no está sincronizada con Cloud SQL.',
      );
    }

    if (!esUuid(cliente.id)) {
      throw new Error(
        'El cliente todavía no está sincronizado con Cloud SQL.',
      );
    }

    const productoSinSincronizar = items.find(
      (item) => !esUuid(item.producto.id),
    );

    if (productoSinSincronizar) {
      throw new Error(
        `${productoSinSincronizar.producto.nombre} todavía no está sincronizado con Cloud SQL.`,
      );
    }

    const app = getApps().length
      ? getApp()
      : initializeApp(environment.firebase);

    const dc = getDataConnect(app, connectorConfig);
    const creadoEn = new Date().toISOString();

    // El pedido queda esperando que lo confirme el mozo.
    // Cocina y Bar permanecen en NO_APLICA por defecto.
    const respuesta = await createPedido(dc, {
      mesaId: mesa.id,
      clienteId: cliente.id,
      estadoGlobal: DcEstadoPedido.PENDIENTE_CONFIRMACION,
      tiempoEstimado,
      totalBruto: total,
      descuentoJuego: 0,
      montoDescuentoJuego: 0,
      porcentajePropina: 0,
      montoPropina: 0,
      totalFinal: total,
      timestampCreacion: creadoEn,
    });

    const pedidoId = respuesta.data.pedido_insert.id;

    // Guardar todos los productos y sus cantidades.
    for (const item of items) {
      await createPedidoItem(dc, {
        pedidoId,
        productoId: item.producto.id,
        cantidad: item.cantidad,
        precioUnitario: item.producto.precio,
        subtotal:
          item.producto.precio * item.cantidad,
        sector: item.producto.sector as DcSector,
      });
    }

    const pedido: PedidoCreado = {
      id: pedidoId,
      mesaId: mesa.id,
      mesaNumero: mesa.numero,
      clienteId: cliente.id,
      estado: 'PENDIENTE_CONFIRMACION',
      tiempoEstimado,
      total,
      creadoEn,
    };

    this.ultimoPedido.set(pedido);

    // El modelo actual todavía no relaciona una mesa con un mozo
    // específico. Por eso la notificación se dirige al rol MOZO.
    await this.firestore.encolarNotificacion({
      destinatarioRol: 'MOZO',
      titulo: '🌸 Nuevo pedido pendiente',
      cuerpo: `La mesa ${mesa.numero} envió un pedido y espera confirmación.`,
      ruta: '/mesas',
    });

    return pedido;
  }

  async buscarPorId(
    pedidoId: string,
  ): Promise<PedidoCreado | null> {
    const guardado = this.ultimoPedido();

    if (guardado?.id === pedidoId) {
      return guardado;
    }

    const app = getApps().length
      ? getApp()
      : initializeApp(environment.firebase);

    const dc = getDataConnect(app, connectorConfig);
    const respuesta = await listPedidosActivos(dc);

    const encontrado = respuesta.data.pedidos.find(
      (pedido) => pedido.id === pedidoId,
    );

    if (!encontrado) {
      return null;
    }

    return {
      id: encontrado.id,
      mesaId: '',
      mesaNumero: encontrado.mesa.numero,
      clienteId: '',
      estado: 'PENDIENTE_CONFIRMACION',
      tiempoEstimado: encontrado.tiempoEstimado,
      total: encontrado.totalFinal,
      creadoEn: encontrado.timestampCreacion,
    };
  }
}

    function esUuid(valor: string): boolean {
    const compacto = valor.replaceAll('-', '');

    return /^[0-9a-f]{32}$/i.test(compacto);
    }