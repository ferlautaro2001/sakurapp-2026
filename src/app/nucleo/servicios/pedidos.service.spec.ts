import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PedidosService } from './pedidos.service';
import { FirestoreService } from './firestore.service';
import { NotificacionesService } from './notificaciones.service';
import { UsuariosService } from './usuarios.service';
import { AlmacenService } from '../datos/almacen.service';
import { Mesa, Usuario, Producto, Pedido } from '../modelos/modelos';
import { ItemCarrito } from './carrito.service';


describe('PedidosService - Envío de pedidos y sincronización Cloud SQL / Firestore', () => {
  let service: PedidosService;
  let mockFirestore: {
    obtenerDb: ReturnType<typeof vi.fn>;
    guardarPedidoPendiente: ReturnType<typeof vi.fn>;
    confirmarPedido: ReturnType<typeof vi.fn>;
    encolarNotificacion: ReturnType<typeof vi.fn>;
    escucharPedidos: ReturnType<typeof vi.fn>;
    guardarUsuario: ReturnType<typeof vi.fn>;
  };
  let mockNotificaciones: {
    enviar: ReturnType<typeof vi.fn>;
    enviarPorRol: ReturnType<typeof vi.fn>;
  };
  let mockAlmacen: {
    usuarios: ReturnType<typeof signal<Usuario[]>>;
    mesas: ReturnType<typeof signal<Mesa[]>>;
    guardarUsuarios: ReturnType<typeof vi.fn>;
    guardarSesion: ReturnType<typeof vi.fn>;
  };

  const facundoAranaConUuid: Usuario = {
    id: '417c73c05bc240e6b0cf0db60514750d',
    uid: 'uid-cliente-reg',
    nombre: 'Facundo',
    apellido: 'Arana',
    dni: '38123456',
    cuil: '20-38123456-1',
    email: 'cliente@sakurapp.com',
    perfil: 'CLIENTE_REGISTRADO',
    fotoUrl: '',
    estado: 'APROBADO',
    activo: true,
    clave: null,
    createdAt: new Date().toISOString(),
  };

  const facundoAranaConUidSolo: Usuario = {
    id: 'uid-cliente-reg',
    uid: 'uid-cliente-reg',
    nombre: 'Facundo',
    apellido: 'Arana',
    dni: '38123456',
    cuil: '20-38123456-1',
    email: 'cliente@sakurapp.com',
    perfil: 'CLIENTE_REGISTRADO',
    fotoUrl: '',
    estado: 'APROBADO',
    activo: true,
    clave: null,
    createdAt: new Date().toISOString(),
  };

  const mesaMock: Mesa = {
    id: '5789beaababa4871915f0a6daaab091f',
    numero: 1,
    cantidadComensales: 4,
    tipo: 'ESTANDAR',
    estado: 'OCUPADA',
    fotoUrl: '',
    qrCodeUrl: '',
  };

  const itemProducto: ItemCarrito = {
    producto: {
      id: '09243110dd604dc68b612d9353adfc64',
      nombre: 'Roll SakurApp Especial',
      descripcion: 'Sushi roll',
      precio: 12000,
      tiempoElaboracion: 20,
      tipo: 'COMIDA',
      sector: 'COCINA',
      fotos: [],
      activo: true,
      disponible: true,
    },
    cantidad: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFirestore = {
      obtenerDb: vi.fn().mockReturnValue({}),
      guardarPedidoPendiente: vi.fn().mockResolvedValue(undefined),
      confirmarPedido: vi.fn().mockResolvedValue(undefined),
      encolarNotificacion: vi.fn().mockResolvedValue(undefined),
      escucharPedidos: vi.fn().mockReturnValue(() => undefined),
      guardarUsuario: vi.fn().mockResolvedValue(undefined),
    };

    mockNotificaciones = {
      enviar: vi.fn().mockResolvedValue(undefined),
      enviarPorRol: vi.fn().mockResolvedValue(undefined),
    };

    mockAlmacen = {
      usuarios: signal<Usuario[]>([facundoAranaConUuid]),
      mesas: signal<Mesa[]>([mesaMock]),
      guardarUsuarios: vi.fn().mockResolvedValue(undefined),
      guardarSesion: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        PedidosService,
        { provide: FirestoreService, useValue: mockFirestore },
        { provide: NotificacionesService, useValue: mockNotificaciones },
        { provide: AlmacenService, useValue: mockAlmacen },
        {
          provide: UsuariosService,
          useValue: {
            todos: signal<Usuario[]>([facundoAranaConUuid]),
            nombreCompleto: vi.fn().mockReturnValue('Facundo Arana'),
          },
        },
      ],
    });

    service = TestBed.inject(PedidosService);
  });

  it('debe permitir a Facundo Arana enviar un pedido cuando su ID es el UUID de Cloud SQL', async () => {
    const pedido = await service.crearPendiente(mesaMock, facundoAranaConUuid, [itemProducto], 20, 24000);

    expect(pedido).toBeDefined();
    expect(pedido.clienteId).toBe('417c73c05bc240e6b0cf0db60514750d');
    expect(pedido.estadoGlobal).toBe('PENDIENTE_CONFIRMACION');
    expect(mockFirestore.guardarPedidoPendiente).toHaveBeenCalled();
    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioRol: 'MOZO',
        titulo: '🌸 Nuevo pedido pendiente',
      }),
    );
  });

  it('debe resolver automáticamente el UUID de Cloud SQL cuando un cliente tiene ID de Firestore (caso Facundo Arana o general)', async () => {
    const pedido = await service.crearPendiente(mesaMock, { ...facundoAranaConUidSolo }, [itemProducto], 20, 24000);

    expect(pedido).toBeDefined();
    expect(pedido.clienteId).toBe('417c73c05bc240e6b0cf0db60514750d');
    expect(mockFirestore.guardarPedidoPendiente).toHaveBeenCalled();
    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioRol: 'MOZO',
      }),
    );
  });

  it('debe encolar la notificación sólo para el rol MOZO y no para otros roles', async () => {
    await service.crearPendiente(mesaMock, facundoAranaConUuid, [itemProducto], 20, 24000);

    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioRol: 'MOZO',
      }),
    );
    expect(mockFirestore.encolarNotificacion).not.toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioRol: 'CLIENTE_REGISTRADO',
      }),
    );
  });

  it('debe aprovisionar automáticamente en Cloud SQL con UUID a un cliente nuevo cuando Data Connect está disponible', async () => {
    const clienteNuevo: Usuario = {
      id: 'usr-nuevo-sin-sql',
      uid: 'uid-nuevo-' + Date.now(),
      nombre: 'Nuevo',
      apellido: 'Comensal',
      dni: null,
      cuil: null,
      email: 'nuevo.' + Date.now() + '@comensal.com',
      perfil: 'CLIENTE_ANONIMO',
      fotoUrl: '',
      estado: 'APROBADO',
      activo: true,
      clave: null,
      createdAt: new Date().toISOString(),
    };

    const pedido = await service.crearPendiente(mesaMock, clienteNuevo, [itemProducto], 15, 12000);

    expect(pedido).toBeDefined();
    // Debe haber obtenido un UUID válido de Cloud SQL
    expect(clienteNuevo.id).toMatch(/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i);
    expect(pedido.clienteId).toBe(clienteNuevo.id);
    expect(mockFirestore.guardarPedidoPendiente).toHaveBeenCalled();
    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioRol: 'MOZO',
      }),
    );
  });

  it('debe persistir en Firestore y notificar al mozo sin arrojar error cuando Data Connect está desconectado (fallback resiliente)', async () => {
    vi.spyOn(service as any, 'dataConnect').mockImplementation(() => {
      throw new Error('Data Connect offline');
    });

    const clienteSinConexion: Usuario = {
      id: 'usr-offline-123',
      uid: 'uid-offline-123',
      nombre: 'Cliente',
      apellido: 'Offline',
      dni: null,
      cuil: null,
      email: 'offline@correo.com',
      perfil: 'CLIENTE_ANONIMO',
      fotoUrl: '',
      estado: 'APROBADO',
      activo: true,
      clave: null,
      createdAt: new Date().toISOString(),
    };

    const pedido = await service.crearPendiente(mesaMock, clienteSinConexion, [itemProducto], 15, 12000);

    expect(pedido).toBeDefined();
    expect(pedido.clienteId).toBe('usr-offline-123');
    expect(mockFirestore.guardarPedidoPendiente).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteId: 'usr-offline-123',
        estadoGlobal: 'PENDIENTE_CONFIRMACION',
      }),
    );
    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioRol: 'MOZO',
      }),
    );
  });

  it('debe notificar exclusivamente a COCINERO y CANTINERO al confirmar pedido con comida y bebida', async () => {
    const mozoMock: Usuario = {
      id: 'usr-mozo-1',
      uid: 'uid-mozo-1',
      nombre: 'Carlos',
      apellido: 'Mozo',
      dni: '12345678',
      cuil: '20-12345678-9',
      email: 'mozo@sakurapp.com',
      perfil: 'MOZO',
      fotoUrl: '',
      estado: 'APROBADO',
      activo: true,
      clave: null,
      createdAt: new Date().toISOString(),
    };

    const pedidoAConfirmar: Pedido = {
      id: 'pedido-123',
      mesaId: 'mesa-1-uuid',
      mesaNumero: 1,
      clienteId: 'cliente-1-uuid',
      clienteUid: 'cliente-1-uid',
      clienteNombre: 'Facundo Arana',
      estadoGlobal: 'PENDIENTE_CONFIRMACION',
      estadoCocina: 'NO_APLICA',
      estadoBar: 'NO_APLICA',
      // US-7.2 · una comanda que todavía nadie devolvió: sin motivo, sin
      // alcance y sin ningún renglón marcado.
      motivoRechazo: null,
      rechazadoPorNombre: null,
      alcanceRechazo: null,
      observaciones: [],
      tiempoEstimado: 25,
      totalBruto: 20000,
      descuentoJuego: 0,
      montoDescuentoJuego: 0,
      totalFinal: 20000,
      confirmadoPorId: null,
      juegoIntentado: false,
      timestampCreacion: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          productoId: 'prod-1',
          productoNombre: 'Sushi',
          tipo: 'COMIDA',
          sector: 'COCINA',
          cantidad: 1,
          precioUnitario: 12000,
          subtotal: 12000,
        },
        {
          id: 'item-2',
          productoId: 'prod-2',
          productoNombre: 'Sake',
          tipo: 'BEBIDA',
          sector: 'BAR',
          cantidad: 1,
          precioUnitario: 8000,
          subtotal: 8000,
        },
      ],
    };

    await service.confirmar(pedidoAConfirmar, mozoMock);

    expect(mockNotificaciones.enviarPorRol).toHaveBeenCalledWith(
      'COCINERO',
      'Nueva comanda de Cocina',
      expect.stringContaining('Mesa 1: 2 productos para preparar.'),
      ['/carta'],
    );
    expect(mockNotificaciones.enviarPorRol).toHaveBeenCalledWith(
      'CANTINERO',
      'Nueva comanda de Bar',
      expect.stringContaining('Mesa 1: 2 productos para preparar.'),
      ['/carta'],
    );
    expect(mockFirestore.confirmarPedido).toHaveBeenCalledWith(
      expect.objectContaining({
        estadoGlobal: 'CONFIRMADO',
        estadoCocina: 'PENDIENTE',
        estadoBar: 'PENDIENTE',
        confirmadoPorId: 'usr-mozo-1',
      }),
    );
  });
});
