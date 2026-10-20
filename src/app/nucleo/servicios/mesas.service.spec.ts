import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MesasService } from './mesas.service';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { AlmacenService } from '../datos/almacen.service';
import { QrService } from './qr.service';
import { AlmacenamientoService } from './almacenamiento.service';
import { FirestoreService } from './firestore.service';
import { signal } from '@angular/core';
import { Mesa } from '../modelos/modelos';

/** Lo que devuelve Cloud SQL al listar las mesas: se simula en el paquete de Data Connect. */
const sql = vi.hoisted(() => ({ mesas: [] as unknown[] }));
vi.mock('firebase/app', () => ({
  getApps: () => [{ name: '[DEFAULT]' }],
  getApp: () => ({ name: '[DEFAULT]' }),
  initializeApp: () => ({ name: '[DEFAULT]' }),
}));
vi.mock('firebase/data-connect', () => ({
  getDataConnect: () => ({ _useGeneratedSdk: () => undefined }),
  validateArgs: (_cfg: unknown, dc: unknown, vars: unknown) => ({ dc, vars }),
  validateArgsWithOptions: (_cfg: unknown, dc: unknown) => ({ dc, vars: undefined, options: undefined }),
  queryRef: (_dc: unknown, nombre: string) => ({ nombre }),
  mutationRef: (_dc: unknown, nombre: string, vars: unknown) => ({ nombre, vars }),
  executeQuery: async () => ({ data: { mesas: sql.mesas } }),
  executeMutation: async () => ({ data: {} }),
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    notification: vi.fn().mockResolvedValue(undefined),
    selectionChanged: vi.fn().mockResolvedValue(undefined),
  },
  NotificationType: {
    Error: 'ERROR',
    Success: 'SUCCESS',
    Warning: 'WARNING',
  },
}));

describe('MesasService - TC-022: Validación estricta de QR de mesa', () => {
  let service: MesasService;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockAlmacen = {
      mesas: signal<Mesa[]>([
        {
          id: 'mesa-1-uuid',
          numero: 1,
          cantidadComensales: 4,
          tipo: 'ESTANDAR',
          estado: 'VACIA',
          fotoUrl: '',
          qrCodeUrl: '',
        },
        {
          id: 'mesa-2-uuid',
          numero: 2,
          cantidadComensales: 2,
          tipo: 'VIP',
          estado: 'VACIA',
          fotoUrl: '',
          qrCodeUrl: '',
        },
      ]),
      guardarMesas: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        MesasService,
        { provide: AlmacenService, useValue: mockAlmacen },
        { provide: QrService, useValue: {} },
        { provide: AlmacenamientoService, useValue: {} },
        { provide: FirestoreService, useValue: { guardarMesa: vi.fn(), actualizarEstadoMesa: vi.fn() } },
      ],
    });

    service = TestBed.inject(MesasService);
  });

  it('debe validar exitosamente cuando el código QR coincide con la mesa asignada', async () => {
    const mesaEscaneadaId = 'mesa-1-uuid';
    const mesaAsignadaId = 'mesa-1-uuid';

    const esValido = await service.validarMesaEscaneada(mesaEscaneadaId, mesaAsignadaId);

    expect(esValido).toBe(true);
    expect(Haptics.notification).not.toHaveBeenCalled();
  });

  it('debe rechazar y disparar vibración háptica de error cuando el QR no coincide con la mesa asignada', async () => {
    const mesaEscaneadaId = 'mesa-2-uuid';
    const mesaAsignadaId = 'mesa-1-uuid';

    const esValido = await service.validarMesaEscaneada(mesaEscaneadaId, mesaAsignadaId);

    expect(esValido).toBe(false);
    expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Error });
  });

  it('debe rechazar si alguno de los identificadores es vacío o nulo', async () => {
    const esValido = await service.validarMesaEscaneada('', 'mesa-1-uuid');

    expect(esValido).toBe(false);
    expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Error });
  });
});

describe('MesasService · sincronizar con Cloud SQL no pisa el estado en vivo', () => {
  const guardarMesas = vi.fn().mockResolvedValue(undefined);
  let service: MesasService;
  const ocupada: Mesa = {
    id: 'mesa-9-uuid',
    numero: 9,
    cantidadComensales: 4,
    tipo: 'ESTANDAR',
    estado: 'OCUPADA',
    fotoUrl: 'foto-firestore',
    qrCodeUrl: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        MesasService,
        { provide: AlmacenService, useValue: { mesas: signal<Mesa[]>([ocupada]), guardarMesas } },
        { provide: QrService, useValue: {} },
        { provide: AlmacenamientoService, useValue: {} },
        { provide: FirestoreService, useValue: { guardarMesa: vi.fn(), actualizarEstadoMesa: vi.fn() } },
      ],
    });
    service = TestBed.inject(MesasService);
  });

  it('una mesa ocupada sigue ocupada aunque Cloud SQL la tenga vacía', async () => {
    sql.mesas = [{ ...ocupada, estado: 'VACIA', fotoUrl: 'foto-vieja' }];

    await service.sincronizar();

    const guardadas = guardarMesas.mock.calls[0][0] as Mesa[];
    expect(guardadas.find((m) => m.numero === 9)).toMatchObject({ estado: 'OCUPADA', fotoUrl: 'foto-firestore' });
  });

  it('las mesas que sólo están en Cloud SQL se suman', async () => {
    sql.mesas = [{ ...ocupada, estado: 'VACIA' }, { ...ocupada, id: 'mesa-20-uuid', numero: 20, estado: 'VACIA' }];

    await service.sincronizar();

    const guardadas = guardarMesas.mock.calls[0][0] as Mesa[];
    expect(guardadas.map((m) => [m.numero, m.estado])).toEqual([
      [9, 'OCUPADA'],
      [20, 'VACIA'],
    ]);
  });
});
