import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EsperaService } from './espera.service';
import { FirestoreService } from './firestore.service';
import { NotificacionesService } from './notificaciones.service';
import { Espera, Mesa } from '../modelos/modelos';

describe('EsperaService - TC-021 & TC-023: Asignación y Bloqueo de Concurrencia', () => {
  let service: EsperaService;
  let mockFirestore: {
    obtenerDb: ReturnType<typeof vi.fn>;
    asignarMesaTransaccional: ReturnType<typeof vi.fn>;
  };
  let mockNotificaciones: {
    enviar: ReturnType<typeof vi.fn>;
  };

  const entradaMock: Espera = {
    id: 'b7a32190-3490-4bf0-b184-2a6c1157b85e',
    clienteId: '772c69b2-38d5-45a7-96a9-4a0fb5b61e2a',
    clienteUid: 'uid-comensal-123',
    clienteNombre: 'Akira Kurosawa',
    clienteFotoUrl: '',
    estado: 'ESPERANDO',
    mesaAsignadaId: null,
    mesaAsignadaNumero: null,
    timestamp: new Date().toISOString(),
  };

  const mesaMock: Mesa = {
    id: '992a54b1-8b27-4a0b-9321-72986428d011',
    numero: 5,
    cantidadComensales: 4,
    tipo: 'ESTANDAR',
    estado: 'VACIA',
    fotoUrl: '',
    qrCodeUrl: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFirestore = {
      obtenerDb: vi.fn(),
      asignarMesaTransaccional: vi.fn().mockResolvedValue(undefined),
    };

    mockNotificaciones = {
      enviar: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        EsperaService,
        { provide: FirestoreService, useValue: mockFirestore },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    });

    service = TestBed.inject(EsperaService);
    service.lista.set([entradaMock]);
  });

  it('TC-021: debe asignar la mesa transaccionalmente y despachar notificación push al comensal', async () => {
    await service.asignarMesa(entradaMock, mesaMock);

    // 1. Debe invocar el bloqueo transaccional de Firestore
    expect(mockFirestore.asignarMesaTransaccional).toHaveBeenCalledWith(
      entradaMock.id,
      mesaMock.id,
      entradaMock.clienteUid,
      entradaMock.clienteId,
      mesaMock.numero,
    );

    // 2. Debe despachar push notification al UID del comensal
    expect(mockNotificaciones.enviar).toHaveBeenCalledWith(
      [entradaMock.clienteUid, entradaMock.clienteId],
      '¡Tu mesa está lista!',
      expect.stringContaining('mesa 5'),
      ['/cliente/espera'],
    );

    // 3. El estado de la lista debe conmutar a ASIGNADO con la mesa vinculada
    const entradaActualizada = service.lista().find((e) => e.id === entradaMock.id);
    expect(entradaActualizada?.estado).toBe('ASIGNADO');
    expect(entradaActualizada?.mesaAsignadaId).toBe(mesaMock.id);
    expect(entradaActualizada?.mesaAsignadaNumero).toBe(5);
  });

  it('TC-023: debe abortar y propagar error si la mesa ya no se encuentra disponible (bloqueo concurrente)', async () => {
    mockFirestore.asignarMesaTransaccional.mockRejectedValueOnce(
      new Error('La mesa 5 ya no se encuentra libre.'),
    );

    await expect(service.asignarMesa(entradaMock, mesaMock)).rejects.toThrow(
      'La mesa 5 ya no se encuentra libre.',
    );

    // No debe enviar notificación push si falló la asignación transaccional
    expect(mockNotificaciones.enviar).not.toHaveBeenCalled();

    // El estado del comensal no debe alterarse
    const entrada = service.lista().find((e) => e.id === entradaMock.id);
    expect(entrada?.estado).toBe('ESPERANDO');
  });
});
