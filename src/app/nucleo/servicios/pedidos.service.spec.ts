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
    actualizarSectorPedido: ReturnType<typeof vi.fn>;
    actualizarEstadoPedido: ReturnType<typeof vi.fn>;
    actualizarPedido: ReturnType<typeof vi.fn>;
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
      actualizarSectorPedido: vi.fn().mockResolvedValue(undefined),
      actualizarEstadoPedido: vi.fn().mockResolvedValue(undefined),
      actualizarPedido: vi.fn().mockResolvedValue(undefined),
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
      ['/sector/pedidos'],
    );
    expect(mockNotificaciones.enviarPorRol).toHaveBeenCalledWith(
      'CANTINERO',
      'Nueva comanda de Bar',
      expect.stringContaining('Mesa 1: 2 productos para preparar.'),
      ['/sector/pedidos'],
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

  describe('avanzarSector', () => {
    it('debe avanzar un sector a EN_PREPARACION y actualizar el estado global', async () => {
      const pedidoMock: Pedido = {
        id: 'ped-test-1',
        mesaId: mesaMock.id,
        mesaNumero: 1,
        clienteId: facundoAranaConUuid.id,
        clienteUid: facundoAranaConUuid.uid,
        clienteNombre: 'Facundo Arana',
        estadoGlobal: 'CONFIRMADO',
        estadoCocina: 'PENDIENTE',
        estadoBar: 'PENDIENTE',
        motivoRechazo: null,
        rechazadoPorNombre: null,
        alcanceRechazo: null,
        observaciones: [],
        tiempoEstimado: 25,
        totalBruto: 20000,
        descuentoJuego: 0,
        montoDescuentoJuego: 0,
        totalFinal: 20000,
        confirmadoPorId: 'usr-mozo-1',
        juegoIntentado: false,
        timestampCreacion: new Date().toISOString(),
        items: [],
      };

      // Inyectar el pedido en el estado interno a través de escucharPedidos
      let callbackPedidos!: (pedidos: Pedido[]) => void;
      mockFirestore.escucharPedidos.mockImplementation((cb) => {
        callbackPedidos = cb;
        return () => undefined;
      });
      service.iniciar();
      callbackPedidos([pedidoMock]);

      await service.avanzarSector('ped-test-1', 'COCINA', 'EN_PREPARACION');

      expect(mockFirestore.actualizarSectorPedido).toHaveBeenCalledWith(
        'ped-test-1',
        'EN_PREPARACION',
        'PENDIENTE',
        'EN_PREPARACION',
      );
      expect(mockNotificaciones.enviar).toHaveBeenCalledWith(
        [facundoAranaConUuid.uid],
        '🌸 Cocina · Pedido',
        'Lo de cocina está en preparación.',
        ['/cliente/pedido'],
      );
    });

    it('debe marcar LISTO cuando todos los sectores aplicables finalizaron y notificar a los mozos', async () => {
      const pedidoMock: Pedido = {
        id: 'ped-test-2',
        mesaId: mesaMock.id,
        mesaNumero: 1,
        clienteId: facundoAranaConUuid.id,
        clienteUid: facundoAranaConUuid.uid,
        clienteNombre: 'Facundo Arana',
        estadoGlobal: 'EN_PREPARACION',
        estadoCocina: 'LISTO',
        estadoBar: 'EN_PREPARACION',
        motivoRechazo: null,
        rechazadoPorNombre: null,
        alcanceRechazo: null,
        observaciones: [],
        tiempoEstimado: 25,
        totalBruto: 20000,
        descuentoJuego: 0,
        montoDescuentoJuego: 0,
        totalFinal: 20000,
        confirmadoPorId: 'usr-mozo-1',
        juegoIntentado: false,
        timestampCreacion: new Date().toISOString(),
        items: [],
      };

      let callbackPedidos!: (pedidos: Pedido[]) => void;
      mockFirestore.escucharPedidos.mockImplementation((cb) => {
        callbackPedidos = cb;
        return () => undefined;
      });
      service.iniciar();
      callbackPedidos([pedidoMock]);

      await service.avanzarSector('ped-test-2', 'BAR', 'LISTO');

      expect(mockFirestore.actualizarSectorPedido).toHaveBeenCalledWith(
        'ped-test-2',
        'LISTO',
        'LISTO',
        'LISTO',
      );
      expect(mockNotificaciones.enviarPorRol).toHaveBeenCalledWith(
        'MOZO',
        '🌸 ¡Pedido listo! Mesa 1',
        expect.stringContaining('Mesa 1'),
        ['/mozo/pedidos'],
      );
    });

    it('debe rechazar avanzar el sector si el pedido no fue confirmado por el mozo', async () => {
      const pedidoNoConfirmado: Pedido = {
        id: 'ped-test-3',
        mesaId: mesaMock.id,
        mesaNumero: 1,
        clienteId: facundoAranaConUuid.id,
        clienteUid: facundoAranaConUuid.uid,
        clienteNombre: 'Facundo Arana',
        estadoGlobal: 'PENDIENTE_CONFIRMACION',
        estadoCocina: 'NO_APLICA',
        estadoBar: 'NO_APLICA',
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
        items: [],
      };

      let callbackPedidos!: (pedidos: Pedido[]) => void;
      mockFirestore.escucharPedidos.mockImplementation((cb) => {
        callbackPedidos = cb;
        return () => undefined;
      });
      service.iniciar();
      callbackPedidos([pedidoNoConfirmado]);

      await expect(service.avanzarSector('ped-test-3', 'COCINA', 'EN_PREPARACION')).rejects.toThrow(
        'El pedido aún no fue confirmado por el mozo.',
      );
    });

    it('debe rechazar transiciones que sean regresiones inválidas', async () => {
      const pedidoListo: Pedido = {
        id: 'ped-test-4',
        mesaId: mesaMock.id,
        mesaNumero: 1,
        clienteId: facundoAranaConUuid.id,
        clienteUid: facundoAranaConUuid.uid,
        clienteNombre: 'Facundo Arana',
        estadoGlobal: 'LISTO',
        estadoCocina: 'LISTO',
        estadoBar: 'NO_APLICA',
        motivoRechazo: null,
        rechazadoPorNombre: null,
        alcanceRechazo: null,
        observaciones: [],
        tiempoEstimado: 25,
        totalBruto: 20000,
        descuentoJuego: 0,
        montoDescuentoJuego: 0,
        totalFinal: 20000,
        confirmadoPorId: 'usr-mozo-1',
        juegoIntentado: false,
        timestampCreacion: new Date().toISOString(),
        items: [],
      };

      let callbackPedidos!: (pedidos: Pedido[]) => void;
      mockFirestore.escucharPedidos.mockImplementation((cb) => {
        callbackPedidos = cb;
        return () => undefined;
      });
      service.iniciar();
      callbackPedidos([pedidoListo]);

      await expect(service.avanzarSector('ped-test-4', 'COCINA', 'EN_PREPARACION')).rejects.toThrow(
        'Transición inválida',
      );
    });
  });

  describe('actualizarEstadoGlobal', () => {
    it('debe actualizar estado global y notificar al mozo cuando se solicita la cuenta', async () => {
      const pedidoMock: Pedido = {
        id: 'ped-test-5',
        mesaId: mesaMock.id,
        mesaNumero: 3,
        clienteId: facundoAranaConUuid.id,
        clienteUid: facundoAranaConUuid.uid,
        clienteNombre: 'Facundo Arana',
        estadoGlobal: 'RECIBIDO',
        estadoCocina: 'LISTO',
        estadoBar: 'LISTO',
        motivoRechazo: null,
        rechazadoPorNombre: null,
        alcanceRechazo: null,
        observaciones: [],
        tiempoEstimado: 25,
        totalBruto: 20000,
        descuentoJuego: 0,
        montoDescuentoJuego: 0,
        totalFinal: 20000,
        confirmadoPorId: 'usr-mozo-1',
        juegoIntentado: false,
        timestampCreacion: new Date().toISOString(),
        items: [],
      };

      let callbackPedidos!: (pedidos: Pedido[]) => void;
      mockFirestore.escucharPedidos.mockImplementation((cb) => {
        callbackPedidos = cb;
        return () => undefined;
      });
      service.iniciar();
      callbackPedidos([pedidoMock]);

      await service.actualizarEstadoGlobal('ped-test-5', 'CUENTA_SOLICITADA');

      expect(mockFirestore.actualizarEstadoPedido).toHaveBeenCalledWith(
        'ped-test-5',
        'CUENTA_SOLICITADA',
      );
      expect(mockNotificaciones.enviarPorRol).toHaveBeenCalledWith(
        'MOZO',
        '🌸 Cuenta solicitada · Mesa 3',
        'La mesa 3 solicitó la cuenta al mozo.',
        ['/mozo/pedidos'],
      );
    });

    /** Un pedido de la mesa 3 en el estado que se pida, ya cargado en el servicio. */
    function cargarPedido(estadoGlobal: Pedido['estadoGlobal']): void {
      const pedidoMock: Pedido = {
        id: 'ped-entrega',
        mesaId: mesaMock.id,
        mesaNumero: 3,
        clienteId: facundoAranaConUuid.id,
        clienteUid: facundoAranaConUuid.uid,
        clienteNombre: 'Facundo Arana',
        estadoGlobal,
        estadoCocina: 'LISTO',
        estadoBar: 'LISTO',
        motivoRechazo: null,
        rechazadoPorNombre: null,
        alcanceRechazo: null,
        observaciones: [],
        tiempoEstimado: 25,
        totalBruto: 20000,
        descuentoJuego: 0,
        montoDescuentoJuego: 0,
        totalFinal: 20000,
        confirmadoPorId: 'usr-mozo-1',
        juegoIntentado: false,
        timestampCreacion: new Date().toISOString(),
        items: [],
      };
      let callbackPedidos!: (pedidos: Pedido[]) => void;
      mockFirestore.escucharPedidos.mockImplementation((cb) => {
        callbackPedidos = cb;
        return () => undefined;
      });
      service.iniciar();
      callbackPedidos([pedidoMock]);
    }

    it('al entregar, avisa al comensal de esa mesa y no a los mozos', async () => {
      cargarPedido('LISTO');

      await service.actualizarEstadoGlobal('ped-entrega', 'ENTREGADO');

      expect(mockFirestore.actualizarEstadoPedido).toHaveBeenCalledWith('ped-entrega', 'ENTREGADO');
      expect(service.porId('ped-entrega')?.estadoGlobal).toBe('ENTREGADO');
      expect(mockNotificaciones.enviar).toHaveBeenCalledWith(
        ['uid-cliente-reg'],
        '🌸 Tu pedido llegó a la mesa 3',
        expect.stringContaining('confirmá la recepción'),
        ['/cliente/pedido'],
      );
      expect(mockNotificaciones.enviarPorRol).not.toHaveBeenCalled();
    });

    it('al confirmar la recepción, cambia el estado sin mandar avisos', async () => {
      cargarPedido('ENTREGADO');

      await service.actualizarEstadoGlobal('ped-entrega', 'RECIBIDO');

      expect(service.porId('ped-entrega')?.estadoGlobal).toBe('RECIBIDO');
      expect(mockNotificaciones.enviar).not.toHaveBeenCalled();
      expect(mockNotificaciones.enviarPorRol).not.toHaveBeenCalled();
    });
  });

  describe('La cuenta, la propina y el pago (puntos 21 y 22)', () => {
    /** Un pedido de la mesa 3 por $ 20.000, ya con el 10 % de descuento del juego. */
    function cargar(cambios: Partial<Pedido>): void {
      const pedidoMock: Pedido = {
        id: 'ped-cuenta',
        mesaId: mesaMock.id,
        mesaNumero: 3,
        clienteId: facundoAranaConUuid.id,
        clienteUid: facundoAranaConUuid.uid,
        clienteNombre: 'Facundo Arana',
        estadoGlobal: 'CUENTA_SOLICITADA',
        estadoCocina: 'LISTO',
        estadoBar: 'LISTO',
        motivoRechazo: null,
        rechazadoPorNombre: null,
        alcanceRechazo: null,
        observaciones: [],
        tiempoEstimado: 25,
        totalBruto: 20000,
        descuentoJuego: 10,
        montoDescuentoJuego: 2000,
        totalFinal: 18000,
        confirmadoPorId: 'usr-mozo-1',
        juegoIntentado: true,
        timestampCreacion: new Date().toISOString(),
        items: [],
        cuentaHabilitada: false,
        porcentajePropina: null,
        montoPropina: 0,
        pago: null,
        ...cambios,
      };
      let callbackPedidos!: (pedidos: Pedido[]) => void;
      mockFirestore.escucharPedidos.mockImplementation((cb) => {
        callbackPedidos = cb;
        return () => undefined;
      });
      service.iniciar();
      callbackPedidos([pedidoMock]);
    }

    it('el mozo habilita la cuenta y le avisa al comensal', async () => {
      cargar({});
      await service.habilitarCuenta('ped-cuenta');

      expect(service.porId('ped-cuenta')?.cuentaHabilitada).toBe(true);
      expect(mockFirestore.actualizarPedido).toHaveBeenCalledWith('ped-cuenta', { cuentaHabilitada: true });
      expect(mockNotificaciones.enviar).toHaveBeenCalledWith(
        ['uid-cliente-reg'],
        '🌸 Tu cuenta está lista',
        expect.stringContaining('código de propina'),
        ['/cliente/pedido'],
      );
    });

    it('no se habilita una cuenta que el comensal no pidió', async () => {
      cargar({ estadoGlobal: 'RECIBIDO' });
      await expect(service.habilitarCuenta('ped-cuenta')).rejects.toThrow('todavía no pidió la cuenta');
    });

    it('la propina se calcula sobre lo pedido ya con el descuento del juego', async () => {
      cargar({ cuentaHabilitada: true });
      await service.elegirPropina('ped-cuenta', 15);

      const p = service.porId('ped-cuenta')!;
      expect(p.porcentajePropina).toBe(15);
      expect(p.montoPropina).toBe(2700);
      expect(service.totalAPagar(p)).toBe(20700);
    });

    it('la propina del cero por ciento también vale', async () => {
      cargar({ cuentaHabilitada: true });
      await service.elegirPropina('ped-cuenta', 0);
      expect(service.porId('ped-cuenta')).toMatchObject({ porcentajePropina: 0, montoPropina: 0 });
    });

    it('sin la cuenta habilitada no se puede dejar propina ni pagar', async () => {
      cargar({ cuentaHabilitada: false });
      await expect(service.elegirPropina('ped-cuenta', 10)).rejects.toThrow('no habilitó la cuenta');
      await expect(service.pagar('ped-cuenta', 'DEBITO')).rejects.toThrow('no habilitó la cuenta');
    });

    it('sin propina no se puede pagar', async () => {
      cargar({ cuentaHabilitada: true, porcentajePropina: null });
      await expect(service.pagar('ped-cuenta', 'DEBITO')).rejects.toThrow('código de propina');
      expect(mockFirestore.actualizarEstadoPedido).not.toHaveBeenCalled();
    });

    it('al pagar queda esperando al mozo y se enteran el mozo, el dueño y el supervisor', async () => {
      cargar({ cuentaHabilitada: true, porcentajePropina: 20, montoPropina: 3600 });
      await service.pagar('ped-cuenta', 'CREDITO');

      const p = service.porId('ped-cuenta')!;
      expect(p.estadoGlobal).toBe('PAGO_PENDIENTE');
      expect(p.pago).toMatchObject({ medio: 'CREDITO', total: 21600 });
      expect(p.pago!.operacion).toMatch(/^\d{10}$/);
      const roles = mockNotificaciones.enviarPorRol.mock.calls.map((c) => c[0]);
      expect(roles).toEqual(['MOZO', 'DUENO', 'SUPERVISOR']);
      expect(mockNotificaciones.enviarPorRol.mock.calls[0][1]).toBe('💳 Mesa 3 pagó $ 21.600');
    });

    it('el mozo confirma el pago: el pedido se cierra y se enteran el dueño, el supervisor y el comensal', async () => {
      cargar({
        estadoGlobal: 'PAGO_PENDIENTE',
        cuentaHabilitada: true,
        porcentajePropina: 20,
        montoPropina: 3600,
        pago: { medio: 'DEBITO', operacion: '1234567890', total: 21600, pagadoEn: new Date().toISOString() },
      });
      await service.confirmarPago('ped-cuenta');

      expect(service.porId('ped-cuenta')?.estadoGlobal).toBe('CERRADO');
      expect(service.activoDe(facundoAranaConUuid)).toBeUndefined();
      expect(service.ultimoDe(facundoAranaConUuid)?.estadoGlobal).toBe('CERRADO');
      expect(mockNotificaciones.enviarPorRol.mock.calls.map((c) => c[0])).toEqual(['DUENO', 'SUPERVISOR']);
      expect(mockNotificaciones.enviarPorRol.mock.calls[0][2]).toContain('$ 21.600');
      expect(mockNotificaciones.enviar).toHaveBeenCalledWith(['uid-cliente-reg'], '🌸 ¡Gracias por tu visita!', expect.any(String));
    });

    it('no se confirma un pago que no se hizo', async () => {
      cargar({ estadoGlobal: 'CUENTA_SOLICITADA', cuentaHabilitada: true });
      await expect(service.confirmarPago('ped-cuenta')).rejects.toThrow('no tiene un pago');
    });
  });
});
