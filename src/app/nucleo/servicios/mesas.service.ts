import { Injectable, computed, inject } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import {
  connectorConfig,
  createMesa,
  TipoMesa as DcTipoMesa,
  EstadoMesa as DcEstadoMesa,
} from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { AlmacenService } from '../datos/almacen.service';
import { nuevoId } from '../datos/semilla';
import { AltaMesa, Mesa } from '../modelos/modelos';
import { EstadoMesa } from '../modelos/enums';
import { QrService } from './qr.service';
import { AlmacenamientoService } from './almacenamiento.service';

/**
 * Gestión integral de Mesas de SakurApp (US-4.3):
 * - Persistencia híbrida resiliente: Cloud SQL PostgreSQL (Data Connect) + Storage + Local.
 * - Generación automática de código QR vectorial codificando identificación de mesa.
 * - Validación estricta de unicidad de número de mesa.
 */
@Injectable({ providedIn: 'root' })
export class MesasService {
  private readonly almacen = inject(AlmacenService);
  private readonly qr = inject(QrService);
  private readonly almacenamiento = inject(AlmacenamientoService);

  readonly todas = computed(() => [...this.almacen.mesas()].sort((a, b) => a.numero - b.numero));
  readonly vacias = computed(() => this.todas().filter((m) => m.estado === 'VACIA'));
  readonly ocupadas = computed(() => this.todas().filter((m) => m.estado === 'OCUPADA'));

  porId(id: string): Mesa | undefined {
    return this.almacen.mesas().find((m) => m.id === id);
  }

  porNumero(numero: number): Mesa | undefined {
    return this.almacen.mesas().find((m) => m.numero === numero);
  }

  existeNumero(numero: number, exceptoId?: string): boolean {
    const encontrada = this.porNumero(numero);
    return Boolean(encontrada && encontrada.id !== exceptoId);
  }

  /**
   * Crea una nueva mesa en el restaurante.
   * 1. Genera ID único.
   * 2. Sube la foto capturada a Firebase Storage.
   * 3. Genera automáticamente el código QR vectorial.
   * 4. Sube el código QR a Firebase Storage.
   * 5. Ejecuta la mutación CreateMesa en Cloud SQL PostgreSQL (Data Connect).
   * 6. Persiste en el almacén local reactivo.
   */
  async crear(datos: AltaMesa): Promise<Mesa> {
    const idLocal = nuevoId();

    // 1. Subir fotografía a Firebase Storage
    let fotoUrl = datos.fotoUrl;
    if (datos.fotoUrl && datos.fotoUrl.startsWith('data:')) {
      try {
        fotoUrl = await this.almacenamiento.subirFoto(`mesas/${idLocal}/foto.jpg`, datos.fotoUrl);
        console.log('📸 Fotografía de mesa subida exitosamente a Firebase Storage');
      } catch (storageErr) {
        console.warn('⚠️ Fallback Storage foto mesa:', storageErr);
      }
    }

    // 2. Generar código QR vectorial
    const qrDataUrl = await this.qr.generarDeMesa(idLocal, datos.numero);
    let qrCodeUrl = qrDataUrl;
    try {
      qrCodeUrl = await this.almacenamiento.subirFoto(`mesas/${idLocal}/qr.png`, qrDataUrl);
      console.log('🏁 Código QR de mesa persistido en Firebase Storage');
    } catch {
      // Si Storage no responde, el data URL sigue siendo completamente funcional y nítido
      qrCodeUrl = qrDataUrl;
    }

    const mesa: Mesa = {
      id: idLocal,
      numero: datos.numero,
      cantidadComensales: datos.cantidadComensales,
      tipo: datos.tipo,
      estado: datos.estado,
      fotoUrl,
      qrCodeUrl,
    };

    // 3. Persistencia en Cloud SQL PostgreSQL mediante Firebase Data Connect
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const dc = getDataConnect(app, connectorConfig);
      const res = await createMesa(dc, {
        numero: mesa.numero,
        cantidadComensales: mesa.cantidadComensales,
        tipo: mesa.tipo as DcTipoMesa,
        estado: mesa.estado === 'OCUPADA' ? DcEstadoMesa.OCUPADA : DcEstadoMesa.VACIA,
        fotoUrl: mesa.fotoUrl,
        qrCodeUrl: mesa.qrCodeUrl,
      });

      if (res?.data?.mesa_insert?.id) {
        mesa.id = res.data.mesa_insert.id;
        console.log(`✅ Mesa ${mesa.numero} registrada exitosamente en Cloud SQL Data Connect`);
      }
    } catch (sqlErr) {
      console.warn('⚠️ No se pudo persistir mesa en Cloud SQL Data Connect (se mantiene localmente):', sqlErr);
    }

    await this.almacen.guardarMesas([...this.almacen.mesas(), mesa]);
    return mesa;
  }

  async editar(id: string, cambios: Partial<AltaMesa>): Promise<Mesa | undefined> {
    const lista = this.almacen.mesas().map((m) => (m.id === id ? { ...m, ...cambios } : m));
    await this.almacen.guardarMesas(lista);
    return lista.find((m) => m.id === id);
  }

  async cambiarEstado(id: string, estado: EstadoMesa): Promise<void> {
    await this.editar(id, { estado });
  }

  async desactivar(id: string): Promise<void> {
    await this.editar(id, { estado: 'INACTIVA' });
  }

  /** Próximo número sugerido para proponer en el formulario de alta. */
  proximoNumero(): number {
    const numeros = this.almacen.mesas().map((m) => m.numero);
    let candidato = 1;
    while (numeros.includes(candidato)) candidato++;
    return candidato;
  }
}
