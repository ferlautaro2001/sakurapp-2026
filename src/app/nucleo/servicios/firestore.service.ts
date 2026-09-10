import { Injectable, inject } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { Mesa, Pedido, PedidoItem, Producto, Usuario } from '../modelos/modelos';
import {
  EstadoMesa,
  EstadoPedido,
  EstadoSector,
  EstadoUsuario,
  Perfil,
  Sector,
  TipoMesa,
  TipoProducto,
} from '../modelos/enums';

export interface NotificacionCola {
  id?: string;
  destinatarioRol?: Perfil;
  destinatarioUid?: string;
  destinatarioEmail?: string;
  titulo: string;
  cuerpo: string;
  ruta?: string;
  estado: 'PENDIENTE' | 'ENVIADO' | 'SIN_TOKENS' | 'ERROR';
  creadoEn: string;
  procesadoEn?: string;
}

/**
 * Servicio central de Cloud Firestore conectado a la base de datos 'sakurapp'.
 * Proporciona sincronización en tiempo real (onSnapshot), persistencia de tokens FCM
 * y encolado de notificaciones para despacho serverless 24/7.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private db: Firestore | null = null;

  constructor() {
    this.obtenerDb();
  }

  obtenerDb(): Firestore {
    if (this.db) return this.db;
    const app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.db = getFirestore(app, 'sakurapp');
    return this.db;
  }

  /**
   * Escucha en tiempo real la colección de usuarios.
   * Cualquier cambio (aprobación, nuevo registro, actualización de token) se recibe de inmediato.
   */
  escucharUsuarios(callback: (usuarios: Usuario[]) => void): Unsubscribe {
    const db = this.obtenerDb();
    const colRef = collection(db, 'usuarios');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const lista: Usuario[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            uid: data['uid'] || docSnap.id,
            nombre: data['nombre'] || '',
            apellido: data['apellido'] || null,
            dni: data['dni'] || null,
            cuil: data['cuil'] || null,
            email: data['email'] || null,
            perfil: (data['perfil'] as Perfil) || 'CLIENTE_REGISTRADO',
            fotoUrl: data['fotoUrl'] || 'assets/icon/sushis/sushi-7.png',
            estado: (data['estado'] as EstadoUsuario) || 'PENDIENTE',
            activo: data['activo'] !== false,
            clave: null,
            fcmToken: data['fcmToken'] || null,
            createdAt: data['createdAt'] || new Date().toISOString(),
          });
        });
        callback(lista);
      },
      (error) => {
        console.warn('⚠️ Error en listener en tiempo real de Firestore (sakurapp):', error);
      }
    );
  }

  /**
   * Guarda o actualiza un usuario en la colección 'usuarios' de Firestore.
   */
  async guardarUsuario(usuario: Usuario): Promise<void> {
    try {
      const db = this.obtenerDb();
      const userRef = doc(db, 'usuarios', usuario.uid || usuario.id);
      await setDoc(
        userRef,
        {
          id: usuario.id,
          uid: usuario.uid,
          nombre: usuario.nombre,
          apellido: usuario.apellido ?? null,
          dni: usuario.dni ?? null,
          cuil: usuario.cuil ?? null,
          email: usuario.email ?? null,
          perfil: usuario.perfil,
          fotoUrl: usuario.fotoUrl,
          estado: usuario.estado,
          activo: usuario.activo,
          updatedAt: new Date().toISOString(),
          createdAt: usuario.createdAt,
        },
        { merge: true }
      );
      console.log(`✅ Usuario ${usuario.email || usuario.nombre} sincronizado en Firestore (sakurapp)`);
    } catch (err) {
      console.warn('⚠️ Error al sincronizar usuario en Firestore:', err);
    }
  }

  /**
   * Registra el token FCM del dispositivo en el documento del usuario.
   */
  async registrarFcmToken(uid: string, token: string): Promise<void> {
    try {
      const db = this.obtenerDb();
      const userRef = doc(db, 'usuarios', uid);
      await setDoc(
        userRef,
        {
          fcmToken: token,
          pushToken: token,
          fcmActualizadoEn: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`📲 Token FCM registrado en Firestore para UID ${uid}: ${token.substring(0, 15)}...`);
    } catch (err) {
      console.warn('⚠️ Error al registrar token FCM en Firestore:', err);
    }
  }

  /**
   * Actualiza el estado (APROBADO / RECHAZADO) de un usuario en Firestore en tiempo real.
   */
  async actualizarEstadoUsuario(usuarioIdOrUid: string, estado: EstadoUsuario): Promise<void> {
    try {
      const db = this.obtenerDb();
      const userRef = doc(db, 'usuarios', usuarioIdOrUid);
      await updateDoc(userRef, {
        estado,
        estadoActualizadoEn: new Date().toISOString(),
      });
      console.log(`✅ Estado de ${usuarioIdOrUid} actualizado a ${estado} en Firestore (sakurapp)`);
    } catch (err) {
      console.warn('⚠️ Error actualizando estado en Firestore:', err);
    }
  }

  /**
   * Encola una notificación push en 'notificaciones_cola'.
   * La Cloud Function en Google Cloud la detecta y la envía a FCM en milisegundos.
   */
  async encolarNotificacion(datos: Omit<NotificacionCola, 'estado' | 'creadoEn'>): Promise<string | null> {
    try {
      const db = this.obtenerDb();
      const colaRef = collection(db, 'notificaciones_cola');
      const docRef = await addDoc(colaRef, {
        ...datos,
        estado: 'PENDIENTE',
        creadoEn: new Date().toISOString(),
      });
      console.log(`🚀 Notificación encolada exitosamente para despacho: ${datos.titulo} (ID: ${docRef.id})`);
      return docRef.id;
    } catch (err) {
      console.warn('⚠️ Error encolando notificación en Firestore:', err);
      return null;
    }
  }

  /**
   * Escucha en tiempo real la colección de mesas ('sakurapp').
   * Cualquier cambio (alta de mesa, cambio de disponibilidad) se refleja inmediatamente en los clientes.
   */
  escucharMesas(callback: (mesas: Mesa[]) => void): Unsubscribe {
    const db = this.obtenerDb();
    const colRef = collection(db, 'mesas');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const lista: Mesa[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            numero: Number(data['numero']) || 0,
            cantidadComensales: Number(data['cantidadComensales']) || 2,
            tipo: (data['tipo'] as TipoMesa) || 'ESTANDAR',
            estado: (data['estado'] as EstadoMesa) || 'VACIA',
            fotoUrl: data['fotoUrl'] || undefined,
            qrCodeUrl: data['qrCodeUrl'] || undefined,
          });
        });
        callback(lista);
      },
      (error) => {
        console.warn('⚠️ Error en listener en tiempo real de mesas Firestore:', error);
      }
    );
  }

  /**
   * Guarda o actualiza una mesa en Firestore (sakurapp).
   */
  async guardarMesa(mesa: Mesa): Promise<void> {
    try {
      const db = this.obtenerDb();
      const mesaRef = doc(db, 'mesas', mesa.id);
      await setDoc(
        mesaRef,
        {
          id: mesa.id,
          numero: mesa.numero,
          cantidadComensales: mesa.cantidadComensales,
          tipo: mesa.tipo,
          estado: mesa.estado,
          fotoUrl: mesa.fotoUrl ?? null,
          qrCodeUrl: mesa.qrCodeUrl ?? null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`✅ Mesa ${mesa.numero} sincronizada en Firestore`);
    } catch (err) {
      console.warn('⚠️ Error al sincronizar mesa en Firestore:', err);
    }
  }

  /**
   * Actualiza el estado de una mesa en Firestore en tiempo real.
   */
  async actualizarEstadoMesa(mesaId: string, estado: EstadoMesa): Promise<void> {
    try {
      const db = this.obtenerDb();
      const mesaRef = doc(db, 'mesas', mesaId);
      await updateDoc(mesaRef, {
        estado,
        estadoActualizadoEn: new Date().toISOString(),
      });
      console.log(`✅ Estado de mesa ${mesaId} actualizado a ${estado} en Firestore`);
    } catch (err) {
      console.warn('⚠️ Error actualizando estado de mesa en Firestore:', err);
    }
  }

  /**
   * Asigna una mesa a un comensal con bloqueo de concurrencia transaccional (AC-5.3.1 / TC-023).
   * Si la mesa ya no está VACIA o ya fue asignada por otro metre, la transacción falla y aborta.
   */
  async asignarMesaTransaccional(
    esperaId: string,
    mesaId: string,
    clienteUid: string,
    clienteId: string,
    mesaNumero: number
  ): Promise<void> {
    const db = this.obtenerDb();
    await runTransaction(db, async (transaction) => {
      const mesaRef = doc(db, 'mesas', mesaId);
      const esperaRef = doc(db, 'listaEspera', esperaId);

      const mesaDoc = await transaction.get(mesaRef);
      if (mesaDoc.exists()) {
        const mesaData = mesaDoc.data();
        if (mesaData['estado'] !== 'VACIA' || mesaData['clienteActualId']) {
          throw new Error(`La mesa ${mesaNumero} ya no se encuentra libre.`);
        }
      }

      const esperaDoc = await transaction.get(esperaRef);
      if (esperaDoc.exists()) {
        const esperaData = esperaDoc.data();
        if (esperaData['estado'] !== 'ESPERANDO') {
          throw new Error(`El comensal ya no está en lista de espera.`);
        }
      }

      transaction.update(mesaRef, {
        clienteActualId: clienteId,
        clienteActualUid: clienteUid,
        asignadaEn: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      transaction.set(
        esperaRef,
        {
          estado: 'ASIGNADO',
          mesaAsignadaId: mesaId,
          mesaAsignadaNumero: mesaNumero,
          asignadaEn: new Date().toISOString(),
        },
        { merge: true }
      );
    });
  }


  /**
   * Escucha en tiempo real la colección de productos ('sakurapp').
   * Permite que la carta refleje altas, bajas y modificaciones al instante.
   */
  escucharProductos(callback: (productos: Producto[]) => void): Unsubscribe {
    const db = this.obtenerDb();
    const colRef = collection(db, 'productos');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const lista: Producto[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            nombre: String(data['nombre'] || ''),
            descripcion: String(data['descripcion'] || ''),
            tiempoElaboracion: Number(data['tiempoElaboracion']) || 0,
            precio: Number(data['precio']) || 0,
            tipo: (data['tipo'] as TipoProducto) || 'COMIDA',
            sector: (data['sector'] as Sector) || 'COCINA',
            fotos: Array.isArray(data['fotos']) ? data['fotos'] : [],
            activo: data['activo'] !== false,
            disponible: data['disponible'] !== false,
          });
        });
        callback(lista);
      },
      (error) => {
        console.warn('⚠️ Error en listener en tiempo real de productos Firestore:', error);
      }
    );
  }

  /**
   * Guarda o actualiza un producto en Firestore ('sakurapp').
   */
  async guardarProducto(producto: Producto): Promise<void> {
    try {
      const db = this.obtenerDb();
      const prodRef = doc(db, 'productos', producto.id);
      await setDoc(
        prodRef,
        {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          tiempoElaboracion: producto.tiempoElaboracion,
          precio: producto.precio,
          tipo: producto.tipo,
          sector: producto.sector,
          fotos: producto.fotos,
          activo: producto.activo,
          disponible: producto.disponible,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`✅ Producto "${producto.nombre}" sincronizado en Firestore`);
    } catch (err) {
      console.warn('⚠️ Error al sincronizar producto en Firestore:', err);
    }
  }

  /**
   * Actualiza campos parciales de un producto en Firestore en tiempo real.
   */
  async actualizarProducto(productoId: string, cambios: Partial<Producto>): Promise<void> {
    try {
      const db = this.obtenerDb();
      const prodRef = doc(db, 'productos', productoId);
      await updateDoc(prodRef, {
        ...cambios,
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Producto ${productoId} actualizado en Firestore`);
    } catch (err) {
      console.warn('⚠️ Error actualizando producto en Firestore:', err);
    }
  }

  /** Mantiene sincronizados en tiempo real los pedidos operativos del salón. */
  escucharPedidos(callback: (pedidos: Pedido[]) => void): Unsubscribe {
    const colRef = collection(this.obtenerDb(), 'pedidos');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const pedidos = snapshot.docs
          .map((docSnap) => pedidoDesdeFirestore(docSnap.id, docSnap.data()))
          .sort((a, b) => b.timestampCreacion.localeCompare(a.timestampCreacion));
        callback(pedidos);
      },
      (error) => console.warn('⚠️ Error en listener de pedidos Firestore:', error),
    );
  }

  /** Publica el pedido completo y sus sectores al momento de confirmarlo. */
  async confirmarPedido(pedido: Pedido): Promise<void> {
    await setDoc(
      doc(this.obtenerDb(), 'pedidos', pedido.id),
      { ...pedido, confirmadoEn: new Date().toISOString() },
      { merge: true },
    );
  }

  /**
   * Registra el único intento permitido y aplica su descuento de forma atómica.
   * La transacción evita dos premios si el usuario toca el botón dos veces.
   */
  async registrarIntentoJuego(
    pedidoId: string,
    clienteId: string,
    descuento: number,
  ): Promise<{ aplicado: boolean; totalFinal: number }> {
    const db = this.obtenerDb();
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const intentoRef = doc(db, 'intentosJuego', `${pedidoId}-${clienteId}`);

    return runTransaction(db, async (transaccion) => {
      const snapshot = await transaccion.get(pedidoRef);
      if (!snapshot.exists()) throw new Error('El pedido ya no existe.');

      const datos = snapshot.data();
      if (datos['juegoIntentado'] === true) {
        return { aplicado: false, totalFinal: Number(datos['totalFinal']) || 0 };
      }

      const totalBruto = Number(datos['totalBruto']) || Number(datos['totalFinal']) || 0;
      const montoDescuentoJuego = redondearImporte((totalBruto * descuento) / 100);
      const totalFinal = redondearImporte(Math.max(0, totalBruto - montoDescuentoJuego));
      const timestamp = new Date().toISOString();

      transaccion.update(pedidoRef, {
        juegoIntentado: true,
        descuentoJuego: descuento,
        montoDescuentoJuego,
        totalFinal,
        juegoIntentadoEn: timestamp,
      });
      transaccion.set(intentoRef, {
        pedidoId,
        clienteId,
        tipoJuego: 'SAKURA',
        numeroIntento: 1,
        gano: descuento > 0,
        descuentoOtorgado: descuento,
        timestamp,
      });

      return { aplicado: true, totalFinal };
    });
  }
}

function pedidoDesdeFirestore(id: string, datos: Record<string, unknown>): Pedido {
  const items = Array.isArray(datos['items'])
    ? datos['items'].map((item, indice) => itemDesdeFirestore(item, `${id}-${indice}`))
    : [];

  return {
    id,
    mesaId: String(datos['mesaId'] ?? ''),
    mesaNumero: Number(datos['mesaNumero']) || 0,
    clienteId: String(datos['clienteId'] ?? ''),
    clienteUid: String(datos['clienteUid'] ?? datos['clienteId'] ?? ''),
    clienteNombre: String(datos['clienteNombre'] ?? 'Comensal'),
    estadoGlobal: (datos['estadoGlobal'] as EstadoPedido) || 'SELECCIONANDO',
    estadoCocina: (datos['estadoCocina'] as EstadoSector) || 'NO_APLICA',
    estadoBar: (datos['estadoBar'] as EstadoSector) || 'NO_APLICA',
    tiempoEstimado: Number(datos['tiempoEstimado']) || 0,
    totalBruto: Number(datos['totalBruto']) || 0,
    descuentoJuego: Number(datos['descuentoJuego']) || 0,
    montoDescuentoJuego: Number(datos['montoDescuentoJuego']) || 0,
    totalFinal: Number(datos['totalFinal']) || Number(datos['totalBruto']) || 0,
    confirmadoPorId: datos['confirmadoPorId'] ? String(datos['confirmadoPorId']) : null,
    juegoIntentado: datos['juegoIntentado'] === true,
    timestampCreacion: String(datos['timestampCreacion'] ?? new Date(0).toISOString()),
    items,
  };
}

function itemDesdeFirestore(valor: unknown, idAlternativo: string): PedidoItem {
  const item = (valor && typeof valor === 'object' ? valor : {}) as Record<string, unknown>;
  const tipo = (item['tipo'] as TipoProducto) || 'COMIDA';
  return {
    id: String(item['id'] ?? idAlternativo),
    productoId: String(item['productoId'] ?? ''),
    productoNombre: String(item['productoNombre'] ?? item['nombre'] ?? 'Producto'),
    tipo,
    sector: (item['sector'] as Sector) || (tipo === 'BEBIDA' ? 'BAR' : 'COCINA'),
    cantidad: Math.max(1, Number(item['cantidad']) || 1),
    precioUnitario: Number(item['precioUnitario']) || 0,
    subtotal: Number(item['subtotal']) || 0,
  };
}

function redondearImporte(valor: number): number {
  return Math.round(valor * 100) / 100;
}

