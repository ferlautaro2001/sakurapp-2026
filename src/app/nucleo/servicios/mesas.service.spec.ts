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
