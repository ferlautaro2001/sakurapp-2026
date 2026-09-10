import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ChatService } from './chat.service';
import { FirestoreService } from './firestore.service';
import { NotificacionesService } from './notificaciones.service';
import { UsuariosService } from './usuarios.service';
import { EsperaService } from './espera.service';
import { Mesa, Usuario, Espera } from '../modelos/modelos';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((...args: any[]) => ({ id: args[args.length - 1] })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn(),
}));

describe('ChatService - TC-025 & TC-026: Chat de Mesa y Push Bidireccional', () => {
  let service: ChatService;
  let mockFirestore: { obtenerDb: any; encolarNotificacion: any };
  let mockNotificaciones: { enviar: any };

  const mesaMock: Mesa = {
    id: 'mesa-1-uuid',
    numero: 1,
    cantidadComensales: 4,
    tipo: 'ESTANDAR',
    estado: 'OCUPADA',
    fotoUrl: '',
    qrCodeUrl: '',
    clienteActualId: 'cliente-1-id',
    clienteActualUid: 'cliente-1-uid',
  };

  const comensalMock: Usuario = {
    id: 'cliente-1-id',
    uid: 'cliente-1-uid',
    nombre: 'Ana',
    apellido: 'García',
    dni: '12345678',
    cuil: '27-12345678-4',
    email: 'ana@cliente.com',
    perfil: 'CLIENTE_REGISTRADO',
    fotoUrl: '',
    estado: 'APROBADO',
    activo: true,
    clave: null,
    createdAt: '2026-09-10T00:00:00.000Z',
  };

  const mozoMock: Usuario = {
    id: 'mozo-1-id',
    uid: 'mozo-1-uid',
    nombre: 'Carlos',
    apellido: 'Mozo',
    dni: '23456789',
    cuil: '20-23456789-3',
    email: 'carlos@sakura.com',
    perfil: 'MOZO',
    fotoUrl: '',
    estado: 'APROBADO',
    activo: true,
    clave: null,
    createdAt: '2026-09-10T00:00:00.000Z',
  };

  const esperaMock: Espera = {
    id: 'esp-1',
    clienteId: 'cliente-1-id',
    clienteUid: 'cliente-1-uid',
    clienteNombre: 'Ana García',
    clienteFotoUrl: '',
    estado: 'FINALIZADO',
    mesaAsignadaId: 'mesa-1-uuid',
    mesaAsignadaNumero: 1,
    timestamp: '2026-09-10T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFirestore = {
      obtenerDb: vi.fn().mockReturnValue({}),
      encolarNotificacion: vi.fn().mockResolvedValue(undefined),
    };

    mockNotificaciones = {
      enviar: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: FirestoreService, useValue: mockFirestore },
        { provide: NotificacionesService, useValue: mockNotificaciones },
        {
          provide: UsuariosService,
          useValue: {
            todos: signal<Usuario[]>([mozoMock, comensalMock]),
          },
        },
        {
          provide: EsperaService,
          useValue: {
            lista: signal<Espera[]>([esperaMock]),
          },
        },
      ],
    });

    service = TestBed.inject(ChatService);
  });

  it('TC-025: debe despachar consulta del comensal a mozos con rol MOZO y persistir el mensaje', async () => {
    const texto = '¿Podrías acercarte a la mesa?';

    const mensaje = await service.enviarMensaje(mesaMock, comensalMock, texto);

    expect(mensaje.texto).toBe(texto);
    expect(mensaje.remitenteRol).toBe('CLIENTE');
    expect(mensaje.mesaNumero).toBe(1);

    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioRol: 'MOZO',
        titulo: 'Consulta en Mesa 1',
        cuerpo: 'Ana García: ¿Podrías acercarte a la mesa?',
        ruta: '/mesas/mesa-1-uuid/chat',
      }),
    );

    expect(mockNotificaciones.enviar).toHaveBeenCalledWith(
      ['mozo-1-id'],
      'Consulta en Mesa 1',
      'Ana García: ¿Podrías acercarte a la mesa?',
      ['/mesas', 'mesa-1-uuid', 'chat'],
    );
  });

  it('TC-026: debe despachar respuesta del mozo con su nombre y push de retorno al comensal', async () => {
    const respuesta = '¡Enseguida me acerco a la mesa!';

    const mensaje = await service.enviarMensaje(mesaMock, mozoMock, respuesta);

    expect(mensaje.texto).toBe(respuesta);
    expect(mensaje.remitenteRol).toBe('MOZO');
    expect(mensaje.remitenteNombre).toBe('Carlos Mozo');

    expect(mockFirestore.encolarNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatarioUid: 'cliente-1-uid',
        titulo: 'Mozo Carlos Mozo · Mesa 1',
        cuerpo: '¡Enseguida me acerco a la mesa!',
        ruta: '/mesas/mesa-1-uuid/chat',
      }),
    );

    expect(mockNotificaciones.enviar).toHaveBeenCalledWith(
      ['cliente-1-uid'],
      'Mozo Carlos Mozo · Mesa 1',
      '¡Enseguida me acerco a la mesa!',
      ['/mesas', 'mesa-1-uuid', 'chat'],
    );
  });
});
