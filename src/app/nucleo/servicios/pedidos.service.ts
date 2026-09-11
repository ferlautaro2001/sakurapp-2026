import { Injectable, computed, inject, signal } from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import { doc, getDoc } from 'firebase/firestore';
import {
  aplicarDescuentoJuego,
  confirmarPedido,
  connectorConfig,
  EstadoSector as DcEstadoSector,
  listPedidoItems,
  listPedidosActivos,
  registrarIntentoJuego,
  createPedido,
  createPedidoItem,
  borrarItemsPedido,
  rechazarPedido,
  reenviarPedido,
  createUsuario,
  listUsuarios,
  listMesas,
  Perfil as DcPerfil,
  EstadoUsuario as DcEstado,
  EstadoPedido as DcEstadoPedido,
  Sector as DcSector,
} from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { MarcaRechazo, sectorDe } from '../modelos/enums';
import { Mesa, ObservacionItem, Pedido, Usuario } from '../modelos/modelos';
import {
  alcanceDe,
  itemsACambiar,
  itemsSinBajar,
  marcaDe,
  trabaParaReenviar,
} from '../modelos/rechazo';
import { nuevoId } from '../datos/semilla';
import { AlmacenService } from '../datos/almacen.service';
import { ItemCarrito } from './carrito.service';
import { FirestoreService } from './firestore.service';
import { NotificacionesService } from './notificaciones.service';
import { UsuariosService } from './usuarios.service';

/** Confirmación, seguimiento y premio no acumulativo de pedidos. */
@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly firestore = inject(FirestoreService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly usuarios = inject(UsuariosService);
  private readonly almacen = inject(AlmacenService);
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
          pedido.clienteUid === cliente.id ||
          (cliente.uid && pedido.clienteId === cliente.uid)) &&
        pedido.estadoGlobal !== 'CERRADO',
    );
  }

  async crearPendiente(
    mesa: Mesa,
    cliente: Usuario,
    items: ItemCarrito[],
    tiempoEstimado: number,
    total: number,
  ): Promise<Pedido> {
    if (!items.length) {
      throw new Error('El carrito está vacío.');
    }

    // 1. Asegurar sincronización con Cloud SQL para cliente y mesa
    if (!esUuid(cliente.id)) {
      await this.asegurarClienteSql(cliente);
    }
    if (!esUuid(mesa.id)) {
      await this.asegurarMesaSql(mesa);
    }

    const creadoEn = new Date().toISOString();
    let pedidoId = nuevoId();
    let pedidoItems: Pedido['items'] = [];

    // 2. Persistencia en Cloud SQL PostgreSQL (Data Connect) si ambos IDs son UUID
    if (esUuid(mesa.id) && esUuid(cliente.id)) {
      try {
        const dc = this.dataConnect();
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

        if (respuesta?.data?.pedido_insert?.id) {
          pedidoId = respuesta.data.pedido_insert.id;
        }

        for (const item of items) {
          const sector = sectorDe(item.producto.tipo);
          let itemId = nuevoId();

          if (esUuid(item.producto.id)) {
            try {
              const respuestaItem = await createPedidoItem(dc, {
                pedidoId,
                productoId: item.producto.id,
                cantidad: item.cantidad,
                precioUnitario: item.producto.precio,
                subtotal: item.producto.precio * item.cantidad,
                sector: sector as DcSector,
              });
              if (respuestaItem?.data?.pedidoItem_insert?.id) {
                itemId = respuestaItem.data.pedidoItem_insert.id;
              }
            } catch (itemErr) {
              console.warn('⚠️ No se pudo registrar item en Cloud SQL:', itemErr);
            }
          }

          pedidoItems.push({
            id: itemId,
            productoId: item.producto.id,
            productoNombre: item.producto.nombre,
            tipo: item.producto.tipo,
            sector,
            cantidad: item.cantidad,
            precioUnitario: item.producto.precio,
            subtotal: item.producto.precio * item.cantidad,
          });
        }
      } catch (errorSql) {
        console.warn('⚠️ No se pudo persistir el pedido en Cloud SQL Data Connect; se sincronizará por Firestore:', errorSql);
      }
    }

    // 3. Si no se cargaron items vía SQL, armar la lista para Firestore
    if (!pedidoItems.length) {
      pedidoItems = items.map((item) => ({
        id: nuevoId(),
        productoId: item.producto.id,
        productoNombre: item.producto.nombre,
        tipo: item.producto.tipo,
        sector: sectorDe(item.producto.tipo),
        cantidad: item.cantidad,
        precioUnitario: item.producto.precio,
        subtotal: item.producto.precio * item.cantidad,
      }));
    }

    const pedido: Pedido = {
      id: pedidoId,
      mesaId: mesa.id,
      mesaNumero: mesa.numero,
      clienteId: cliente.id,
      clienteUid: cliente.uid || cliente.id,
      clienteNombre: [cliente.nombre, cliente.apellido ?? ''].join(' ').trim(),
      estadoGlobal: 'PENDIENTE_CONFIRMACION',
      estadoCocina: 'NO_APLICA',
      estadoBar: 'NO_APLICA',
      motivoRechazo: null,
      rechazadoPorNombre: null,
      alcanceRechazo: null,
      observaciones: [],
      tiempoEstimado,
      totalBruto: total,
      descuentoJuego: 0,
      montoDescuentoJuego: 0,
      totalFinal: total,
      confirmadoPorId: null,
      juegoIntentado: false,
      timestampCreacion: creadoEn,
      items: pedidoItems,
    };

    // 4. Guardar en Firestore para seguimiento en tiempo real de salón, cocina y bar
    await this.firestore.guardarPedidoPendiente(pedido);

    this.pedidosSql.update((actuales) => [
      pedido,
      ...actuales.filter((actual) => actual.id !== pedido.id),
    ]);

    // 5. Notificación push al personal mozo en servicio (US-3.2)
    await this.firestore.encolarNotificacion({
      destinatarioRol: 'MOZO',
      titulo: '🌸 Nuevo pedido pendiente',
      cuerpo: `La mesa ${mesa.numero} envió un pedido y espera confirmación.`,
      ruta: '/mozo/pedidos',
    });

    return pedido;
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
      await this.notificaciones.enviarPorRol(
        'COCINERO',
        'Nueva comanda de Cocina',
        mensaje,
        ['/carta'],
      );
    }
    if (hayBar) {
      await this.notificaciones.enviarPorRol(
        'CANTINERO',
        'Nueva comanda de Bar',
        mensaje,
        ['/carta'],
      );
    }

    void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
  }

  /**
   * US-7.2 · AC-7.2.1 · el mozo devuelve la comanda con un motivo.
   *
   * El motivo es obligatorio —lo valida el formulario del modal— y viaja tal
   * cual al teléfono del comensal: es lo único que le dice qué tiene que
   * cambiar. La comanda no llega a ningún sector: se devuelve antes.
   */
  async rechazar(
    pedido: Pedido,
    mozo: Usuario,
    motivo: string,
    observaciones: ObservacionItem[] = [],
  ): Promise<void> {
    if (pedido.estadoGlobal !== 'PENDIENTE_CONFIRMACION') {
      throw new Error('Este pedido ya fue procesado.');
    }

    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) {
      throw new Error('No se puede devolver un pedido sin decir qué hay que cambiar.');
    }

    const mozoNombre = [mozo.nombre, mozo.apellido ?? ''].join(' ').trim() || 'el mozo';

    const alcance = alcanceDe(observaciones, pedido.items.length);

    // El esquema de Cloud SQL guarda el motivo; las marcas por producto viven
    // en Firestore, que es lo que miran en vivo las dos pantallas.
    await this.rechazarEnSql(pedido.id, motivoLimpio);
    await this.firestore.rechazarPedido(pedido.id, motivoLimpio, mozoNombre, alcance, observaciones);

    // El aviso lleva el motivo en el cuerpo: el comensal lo lee sin abrir nada.
    await this.notificaciones.enviar(
      [pedido.clienteUid || pedido.clienteId],
      'Tu pedido necesita cambios',
      motivoLimpio,
      ['/cliente/estado-pedido', pedido.id],
    );
    await this.firestore.encolarNotificacion({
      destinatarioUid: pedido.clienteUid || pedido.clienteId,
      titulo: '🌸 Tu pedido necesita cambios',
      cuerpo: motivoLimpio,
      ruta: '/cliente/estado-pedido',
    });

    void Haptics.notification({ type: NotificationType.Warning }).catch(() => undefined);
  }

  /**
   * US-7.2 · AC-7.2.2 · el comensal corrigió la comanda y la manda de nuevo.
   *
   * Es el mismo pedido, no uno nuevo: conserva su identificador y su hora de
   * creación, así el mozo ve que es la comanda que él devolvió. Los renglones
   * se reescriben enteros, porque el comensal pudo agregar, sacar y cambiar
   * cantidades libremente.
   */
  async reenviar(
    pedido: Pedido,
    items: ItemCarrito[],
    tiempoEstimado: number,
    total: number,
  ): Promise<Pedido> {
    if (pedido.estadoGlobal !== 'RECHAZADO') {
      throw new Error('Este pedido no está esperando correcciones.');
    }
    if (!items.length) {
      throw new Error('Agregá al menos un producto antes de reenviar el pedido.');
    }

    const itemsCorregidos = await this.reescribirItemsEnSql(pedido.id, items);

    const corregido: Pedido = {
      ...pedido,
      estadoGlobal: 'PENDIENTE_CONFIRMACION',
      estadoCocina: 'NO_APLICA',
      estadoBar: 'NO_APLICA',
      motivoRechazo: null,
      rechazadoPorNombre: null,
      alcanceRechazo: null,
      observaciones: [],
      tiempoEstimado,
      totalBruto: total,
      totalFinal: total,
      items: itemsCorregidos,
    };

    await this.reenviarEnSql(corregido);
    await this.firestore.reenviarPedido(corregido);

    this.pedidosSql.update((actuales) => [
      corregido,
      ...actuales.filter((actual) => actual.id !== corregido.id),
    ]);

    await this.firestore.encolarNotificacion({
      destinatarioRol: 'MOZO',
      titulo: '🌸 Pedido corregido',
      cuerpo: `La mesa ${pedido.mesaNumero} corrigió su pedido y espera confirmación.`,
      ruta: '/mozo/pedidos',
    });

    void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
    return corregido;
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
    if (!esUuid(cliente.id)) {
      await this.asegurarClienteSql(cliente);
    }
    await this.registrarJuegoEnSql(pedido, cliente, descuento, resultado.totalFinal);
    return descuento;
  }

  /**
   * Las reglas de la comanda devuelta viven en `modelos/rechazo`, que no
   * depende de nada: acá sólo se las acerca a las pantallas.
   */
  marcaDe(pedido: Pedido | undefined, productoId: string): MarcaRechazo | null {
    return marcaDe(pedido, productoId);
  }

  itemsACambiar(pedido: Pedido | undefined, items: ItemCarrito[]): ItemCarrito[] {
    return itemsACambiar(pedido, items);
  }

  itemsSinBajar(pedido: Pedido | undefined, items: ItemCarrito[]): ItemCarrito[] {
    return itemsSinBajar(pedido, items);
  }

  trabaParaReenviar(pedido: Pedido | undefined, items: ItemCarrito[]): string | null {
    return trabaParaReenviar(pedido, items);
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
          motivoRechazo: null,
          rechazadoPorNombre: null,
          alcanceRechazo: null,
          observaciones: [],
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

  private async rechazarEnSql(pedidoId: string, motivo: string): Promise<void> {
    if (!esUuid(pedidoId)) return;
    try {
      await rechazarPedido(this.dataConnect(), { id: pedidoId, motivoRechazo: motivo });
    } catch (error) {
      console.warn('⚠️ No se pudo devolver el pedido en Cloud SQL; se sincronizará por Firestore:', error);
    }
  }

  /**
   * Borra los renglones viejos y escribe los que quedaron.
   *
   * Si Cloud SQL no responde, el pedido corregido igual viaja por Firestore,
   * que es lo que miran las pantallas; devuelve los renglones con el
   * identificador que corresponda en cada caso.
   */
  private async reescribirItemsEnSql(pedidoId: string, items: ItemCarrito[]): Promise<Pedido['items']> {
    const enLocal = (item: ItemCarrito, id: string): Pedido['items'][number] => ({
      id,
      productoId: item.producto.id,
      productoNombre: item.producto.nombre,
      tipo: item.producto.tipo,
      sector: sectorDe(item.producto.tipo),
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      subtotal: redondearImporte(item.producto.precio * item.cantidad),
    });

    if (!esUuid(pedidoId) || items.some((item) => !esUuid(item.producto.id))) {
      return items.map((item, indice) => enLocal(item, `${pedidoId}-${indice}`));
    }

    try {
      const dc = this.dataConnect();
      await borrarItemsPedido(dc, { pedidoId });

      const corregidos: Pedido['items'] = [];
      for (const item of items) {
        const respuesta = await createPedidoItem(dc, {
          pedidoId,
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
          subtotal: redondearImporte(item.producto.precio * item.cantidad),
          sector: sectorDe(item.producto.tipo) as DcSector,
        });
        corregidos.push(enLocal(item, respuesta.data.pedidoItem_insert.id));
      }
      return corregidos;
    } catch (error) {
      console.warn('⚠️ No se pudieron reescribir los productos en Cloud SQL; se sincronizarán por Firestore:', error);
      return items.map((item, indice) => enLocal(item, `${pedidoId}-${indice}`));
    }
  }

  private async reenviarEnSql(pedido: Pedido): Promise<void> {
    if (!esUuid(pedido.id)) return;
    try {
      await reenviarPedido(this.dataConnect(), {
        id: pedido.id,
        tiempoEstimado: pedido.tiempoEstimado,
        totalBruto: pedido.totalBruto,
        totalFinal: pedido.totalFinal,
      });
    } catch (error) {
      console.warn('⚠️ No se pudo reenviar el pedido en Cloud SQL; se sincronizará por Firestore:', error);
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

  private async asegurarClienteSql(cliente: Usuario): Promise<string> {
    if (esUuid(cliente.id)) return cliente.id;

    // A. Buscar en almacén local si algún usuario con mismo uid/email ya tiene UUID válido
    const coincidencia = this.almacen.usuarios().find(
      (u) =>
        esUuid(u.id) &&
        ((cliente.uid && u.uid === cliente.uid) ||
          (cliente.email && u.email && u.email.toLowerCase() === cliente.email.toLowerCase())),
    );
    if (coincidencia) {
      cliente.id = coincidencia.id;
      void this.almacen.guardarSesion(cliente);
      return coincidencia.id;
    }

    // B. Buscar directamente en Firestore si el documento del usuario contiene su UUID de Cloud SQL
    try {
      const db = this.firestore.obtenerDb();
      const docRef = doc(db, 'usuarios', cliente.uid || cliente.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        const rawId = d?.['id'];
        if (rawId && typeof rawId === 'string' && esUuid(rawId)) {
          cliente.id = rawId;
          void this.almacen.guardarSesion(cliente);
          return rawId;
        }
      }
    } catch {
      // Continuar con resolución vía Data Connect
    }

    // C. Buscar o registrar en Cloud SQL PostgreSQL (Data Connect)
    try {
      const dc = this.dataConnect();
      const res = await listUsuarios(dc);
      const enSql = res?.data?.users?.find(
        (u) =>
          (cliente.uid && u.uid === cliente.uid) ||
          (cliente.email && u.email && u.email.toLowerCase() === cliente.email.toLowerCase()),
      );

      if (enSql) {
        cliente.id = enSql.id;
        await this.almacen.guardarUsuarios(
          this.almacen
            .usuarios()
            .map((u) =>
              (cliente.uid && u.uid === cliente.uid) ||
              (cliente.email && u.email && u.email.toLowerCase() === cliente.email.toLowerCase())
                ? { ...u, id: enSql.id }
                : u,
            ),
        );
        void this.almacen.guardarSesion(cliente);
        await this.firestore.guardarUsuario({ ...cliente, id: enSql.id });
        return enSql.id;
      }

      // Si no existe en Cloud SQL, darlo de alta de forma transparente
      const resAlta = await createUsuario(dc, {
        uid: cliente.uid || cliente.id,
        nombre: cliente.nombre || 'Cliente',
        apellido: cliente.apellido ?? null,
        dni: cliente.dni ?? null,
        cuil: cliente.cuil ?? null,
        email: cliente.email ?? null,
        perfil: cliente.perfil === 'CLIENTE_ANONIMO' ? DcPerfil.CLIENTE_ANONIMO : DcPerfil.CLIENTE_REGISTRADO,
        fotoUrl: cliente.fotoUrl || 'assets/icon/sushis/sushi-7.png',
        estado: cliente.estado === 'APROBADO' ? DcEstado.APROBADO : DcEstado.PENDIENTE,
      });

      if (resAlta?.data?.user_insert?.id) {
        const nuevoUuid = resAlta.data.user_insert.id;
        cliente.id = nuevoUuid;
        await this.almacen.guardarUsuarios(
          this.almacen
            .usuarios()
            .map((u) =>
              (cliente.uid && u.uid === cliente.uid) ||
              (cliente.email && u.email && u.email.toLowerCase() === cliente.email.toLowerCase())
                ? { ...u, id: nuevoUuid }
                : u,
            ),
        );
        void this.almacen.guardarSesion(cliente);
        await this.firestore.guardarUsuario({ ...cliente, id: nuevoUuid });
        return nuevoUuid;
      }
    } catch (err) {
      console.warn('⚠️ No se pudo sincronizar el cliente con Cloud SQL Data Connect:', err);
    }

    return cliente.id;
  }

  private async asegurarMesaSql(mesa: Mesa): Promise<string> {
    if (esUuid(mesa.id)) return mesa.id;
    const enAlmacen = this.almacen.mesas().find((m) => m.numero === mesa.numero && esUuid(m.id));
    if (enAlmacen) {
      mesa.id = enAlmacen.id;
      return enAlmacen.id;
    }
    try {
      const dc = this.dataConnect();
      const res = await listMesas(dc);
      const enSql = res?.data?.mesas?.find((m) => m.numero === mesa.numero);
      if (enSql) {
        mesa.id = enSql.id;
        return enSql.id;
      }
    } catch {
      //
    }
    return mesa.id;
  }

  private dataConnect() {
    const app = getApps().length ? getApp() : initializeApp(environment.firebase);
    return getDataConnect(app, connectorConfig);
  }
}

function esUuid(valor: string | null | undefined): boolean {
  if (!valor || typeof valor !== 'string') return false;
  const compacto = valor.replaceAll('-', '');
  return /^[0-9a-f]{32}$/i.test(compacto);
}

function redondearImporte(valor: number): number {
  return Math.round(valor * 100) / 100;
}
