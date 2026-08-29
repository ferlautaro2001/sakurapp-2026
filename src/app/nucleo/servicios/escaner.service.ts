import { Injectable, inject, signal } from '@angular/core';
import { BarcodeFormat, BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { AvisosService } from './avisos.service';
import { SonidoService } from './sonido.service';

export type TipoLectura = 'QR' | 'DNI';

@Injectable({ providedIn: 'root' })
export class EscanerService {
  private readonly avisos = inject(AvisosService);
  private readonly sonido = inject(SonidoService);

  private oyente: PluginListenerHandle | null = null;
  private activo = false;
  private cancelar: (() => void) | null = null;

  readonly visor = signal<{ rotulo: string; ayuda: string } | null>(null);

  disponible(): boolean {
    return Capacitor.isNativePlatform();
  }

  async cancelarLectura(): Promise<void> {
    const cancelar = this.cancelar;
    await this.detener();
    cancelar?.();
  }

  async leer(tipo: TipoLectura): Promise<string | null> {
    if (!this.disponible()) return null;

    const permitido = await this.pedirPermiso();
    if (!permitido) return null;

    const formatos =
      tipo === 'DNI'
        ? [BarcodeFormat.Pdf417, BarcodeFormat.QrCode]
        : [BarcodeFormat.QrCode];

    return new Promise<string | null>(async (resolver) => {
      try {
        this.cancelar = () => resolver(null);
        this.visor.set(
          tipo === 'DNI'
            ? { rotulo: 'Escanear el código del documento', ayuda: 'Sostené el reverso del documento dentro del marco' }
            : { rotulo: 'Escanear código QR', ayuda: 'Centrá el código dentro del marco' },
        );
        this.marcarCamaraVisible(true);
        this.activo = true;

        this.oyente = await BarcodeScanner.addListener('barcodesScanned', async (evento) => {
          const valor = evento.barcodes?.[0]?.rawValue ?? null;
          if (!valor) return;
          this.sonido.reproducir('escaneo');
          await this.detener();
          resolver(valor);
        });

        await BarcodeScanner.startScan({ formats: formatos, lensFacing: LensFacing.Back });
      } catch {
        await this.detener();
        this.avisos.error('No pudimos abrir el lector', 'Revisá los permisos de cámara de la aplicación.');
        resolver(null);
      }
    });
  }

  async detener(): Promise<void> {
    this.cancelar = null;
    this.visor.set(null);
    if (this.oyente) {
      await this.oyente.remove().catch(() => undefined);
      this.oyente = null;
    }
    if (this.activo) {
      this.activo = false;
      await BarcodeScanner.stopScan().catch(() => undefined);
    }
    this.marcarCamaraVisible(false);
  }

  private async pedirPermiso(): Promise<boolean> {
    const estado = await BarcodeScanner.checkPermissions();
    if (estado.camera === 'granted' || estado.camera === 'limited') return true;

    const pedido = await BarcodeScanner.requestPermissions();
    if (pedido.camera === 'granted' || pedido.camera === 'limited') return true;

    this.avisos.error(
      'Falta el permiso de cámara',
      'Habilitalo desde los ajustes del teléfono para poder leer los códigos.',
    );
    return false;
  }

  private marcarCamaraVisible(visible: boolean): void {
    document.documentElement.classList.toggle('camara-encendida', visible);
    document.body.classList.toggle('camara-encendida', visible);
  }
}

