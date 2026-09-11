import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificacionesService } from './notificaciones.service';
import { FirestoreService } from './firestore.service';

const listeners: Record<string, Function> = {};

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(true),
  },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    notification: vi.fn().mockResolvedValue(undefined),
  },
  NotificationType: {
    Success: 'SUCCESS',
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    createChannel: vi.fn().mockResolvedValue(undefined),
    schedule: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: vi.fn().mockResolvedValue({ receive: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ receive: 'granted' }),
    addListener: vi.fn().mockImplementation((event: string, handler: Function) => {
      listeners[event] = handler;
      return Promise.resolve({ remove: vi.fn() });
    }),
    register: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('NotificacionesService - Despacho filtrado por Rol y Sesión', () => {
  let service: NotificacionesService;
  let mockFirestore: {
    registrarFcmToken: ReturnType<typeof vi.fn>;
    encolarNotificacion: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFirestore = {
      registrarFcmToken: vi.fn().mockResolvedValue(undefined),
      encolarNotificacion: vi.fn().mockResolvedValue('notif-id-1'),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificacionesService,
        { provide: FirestoreService, useValue: mockFirestore },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(NotificacionesService);
    await service.iniciar();
  });

  it('debe registrar sesión con ID y Rol correspondiente', () => {
    service.registrarSesion('usr-mozo-1', 'MOZO');
    // Verificar que no arroja error y guarda la sesión
    expect(service.pendientesDe('usr-mozo-1')).toEqual([]);
  });

  it('debe encolar notificación sólo para el rol correspondiente usando enviarPorRol', async () => {
    service.registrarSesion('usr-cocinero-1', 'COCINERO');

    await service.enviarPorRol('COCINERO', 'Nueva comanda de cocina', 'Mesa 1 pidió comida', ['/carta']);

    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith({
      destinatarioRol: 'COCINERO',
      titulo: 'Nueva comanda de cocina',
      cuerpo: 'Mesa 1 pidió comida',
      ruta: '/carta',
    });

    // El cocinero debe ver el aviso en su estado reactivo
    expect(service.ultimoAviso()?.titulo).toBe('Nueva comanda de cocina');
  });

  it('no debe actualizar ultimoAviso si el rol destinatario no concierne a la sesión activa', async () => {
    service.registrarSesion('usr-mozo-1', 'MOZO');

    await service.enviarPorRol('CANTINERO', 'Nueva comanda de bar', 'Mesa 1 pidió bebidas', ['/carta']);

    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith({
      destinatarioRol: 'CANTINERO',
      titulo: 'Nueva comanda de bar',
      cuerpo: 'Mesa 1 pidió bebidas',
      ruta: '/carta',
    });

    // El mozo no debe ver el aviso destinado a cantinero
    expect(service.ultimoAviso()).toBeNull();
  });

  it('no debe mostrar alerta local en el dispositivo del remitente cuando el destinatario es otro usuario', async () => {
    service.registrarSesion('cliente-123', 'CLIENTE_REGISTRADO');

    // El cliente envía aviso a los mozos
    await service.enviar(['mozo-1', 'mozo-2'], 'Consulta en Mesa 1', '¿Nos traés agua?', ['/mesas/1/chat']);

    // El cliente remitente NO debe ver ultimoAviso en su pantalla porque él no está en destinatarios
    expect(service.ultimoAviso()).toBeNull();
  });

  it('debe descartar la push en primer plano si no hay ninguna sesión activa en el dispositivo', () => {
    service.registrarSesion(null, null);

    const onPush = listeners['pushNotificationReceived'];
    expect(onPush).toBeDefined();

    onPush({
      title: '🌸 Nuevo pedido pendiente',
      body: 'La mesa 2 envió un pedido',
      data: { destinatarioRol: 'MOZO' },
    });

    expect(service.ultimoAviso()).toBeNull();
  });

  it('debe aceptar la push si el destinatarioRol coincide con el rol de la sesión activa', () => {
    service.registrarSesion('usr-mozo-1', 'MOZO');

    const onPush = listeners['pushNotificationReceived'];
    expect(onPush).toBeDefined();

    onPush({
      title: '🌸 Nuevo pedido pendiente',
      body: 'La mesa 2 envió un pedido',
      data: { destinatarioRol: 'MOZO' },
    });

    expect(service.ultimoAviso()?.titulo).toBe('🌸 Nuevo pedido pendiente');
  });

  it('debe descartar la push si el destinatarioRol concierne a otro rol (ej: aviso a MOZO recibido por CLIENTE)', () => {
    service.registrarSesion('usr-cli-1', 'CLIENTE_REGISTRADO');

    const onPush = listeners['pushNotificationReceived'];
    onPush({
      title: '🌸 Nuevo pedido pendiente',
      body: 'La mesa 2 envió un pedido',
      data: { destinatarioRol: 'MOZO' },
    });

    expect(service.ultimoAviso()).toBeNull();
  });

  it('debe aceptar push genérica con destinatarioRol CLIENTE cuando la sesión es CLIENTE_ANONIMO', () => {
    service.registrarSesion('usr-cli-anon', 'CLIENTE_ANONIMO');

    const onPush = listeners['pushNotificationReceived'];
    onPush({
      title: 'Tu mesa está lista',
      body: 'Acercate a la mesa 3',
      data: { destinatarioRol: 'CLIENTE' },
    });

    expect(service.ultimoAviso()?.titulo).toBe('Tu mesa está lista');
  });

  it('debe descartar push si destinatarioUid no coincide con el usuario en sesión', () => {
    service.registrarSesion('usr-mozo-1', 'MOZO');

    const onPush = listeners['pushNotificationReceived'];
    onPush({
      title: 'Mensaje privado',
      body: 'Solo para otro mozo',
      data: { destinatarioUid: 'usr-mozo-2' },
    });

    expect(service.ultimoAviso()).toBeNull();
  });

  it('debe aceptar push si destinatarioUid coincide con el usuario en sesión', () => {
    service.registrarSesion('usr-mozo-1', 'MOZO');

    const onPush = listeners['pushNotificationReceived'];
    onPush({
      title: 'Mensaje directo',
      body: 'Hola mozo 1',
      data: { destinatarioUid: 'usr-mozo-1' },
    });

    expect(service.ultimoAviso()?.titulo).toBe('Mensaje directo');
  });
});
