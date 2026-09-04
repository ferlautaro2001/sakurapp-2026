import { Injectable, inject, signal } from '@angular/core';
import { BarcodeFormat, BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { AvisosService } from './avisos.service';
import { SonidoService } from './sonido.service';

export type TipoLectura = 'QR' | 'DNI';

/** Cuántas veces se le vuelve a preguntar al sistema por el permiso recién dado. */
const REINTENTOS_PERMISO = 6;

/** Entre consulta y consulta. Seis intentos dan poco más de un segundo. */
const ESPERA_ENTRE_INTENTOS = 180;

/** El permiso limitado alcanza para leer un código: da acceso a la cámara. */
function concedido(estado: string): boolean {
  return estado === 'granted' || estado === 'limited';
}

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

  /**
   * Permiso de cámara, incluso cuando el sistema tarda en confirmarlo.
   *
   * Al pedir el permiso, Android manda la aplicación al fondo para mostrar su
   * propio diálogo. Cuando la persona acepta y la aplicación vuelve, el plugin
   * a veces responde con el estado viejo, el de antes de aceptar: por eso
   * antes hacía falta tocar el botón dos veces. Así que si la respuesta no
   * llega concedida, se vuelve a consultar unas cuantas veces antes de darla
   * por negada.
   */
  private async pedirPermiso(): Promise<boolean> {
    if (await this.tienePermiso()) return true;

    const pedido = await BarcodeScanner.requestPermissions();
    if (concedido(pedido.camera)) return true;

    // El sistema todavía no terminó de propagar la respuesta: se le da tiempo.
    for (let intento = 0; intento < REINTENTOS_PERMISO; intento++) {
      await new Promise((seguir) => setTimeout(seguir, ESPERA_ENTRE_INTENTOS));
      if (await this.tienePermiso()) return true;
    }

    this.avisos.error(
      'Falta el permiso de cámara',
      'Habilitalo desde los ajustes del teléfono para poder leer los códigos.',
    );
    return false;
  }

  private async tienePermiso(): Promise<boolean> {
    const estado = await BarcodeScanner.checkPermissions().catch(() => null);
    return Boolean(estado && concedido(estado.camera));
  }

  private marcarCamaraVisible(visible: boolean): void {
    document.documentElement.classList.toggle('camara-encendida', visible);
    document.body.classList.toggle('camara-encendida', visible);
  }
}

