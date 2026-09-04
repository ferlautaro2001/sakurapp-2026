import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { AvisosService } from './avisos.service';
import { SonidoService } from './sonido.service';

/**
 * Captura de fotos con la cámara nativa o web.
 */
@Injectable({ providedIn: 'root' })
export class CamaraService {
  private readonly avisos = inject(AvisosService);
  private readonly sonido = inject(SonidoService);

  /** Foto tomada con la cámara del dispositivo. */
  async tomarFoto(): Promise<string | null> {
    return this.capturar(CameraSource.Camera);
  }

  /** Foto tomada con la cámara o elegida de la galería. */
  async elegirFoto(): Promise<string | null> {
    const origen = Capacitor.isNativePlatform()
      ? CameraSource.Prompt
      : CameraSource.Photos;

    return this.capturar(origen);
  }

  private async capturar(origen: CameraSource): Promise<string | null> {
    // La cámara nativa se abre encima de la aplicación y la manda al fondo:
    // eso no es cerrar la aplicación, así que no tiene que sonar.
    this.sonido.abrioPantallaDelSistema();
    try {
      if (Capacitor.isNativePlatform()) {
        const permisos = await Camera.checkPermissions();
        if (permisos.camera !== 'granted' || permisos.photos !== 'granted') {
          await Camera.requestPermissions();
        }
      }

      const foto = await Camera.getPhoto({
        quality: 72,
        width: 1080,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: origen,
        correctOrientation: true,
        promptLabelHeader: 'Foto',
        promptLabelPhoto: 'Elegir de la galería',
        promptLabelPicture: 'Tomar una foto',
        promptLabelCancel: 'Cancelar',
      });

      return foto.dataUrl ?? null;
    } catch (error) {
      if (this.fueCancelada(error)) return null;
      this.avisos.error('No pudimos abrir la cámara', 'Revisá los permisos de la aplicación y volvé a intentar.');
      return null;
    } finally {
      this.sonido.cerroPantallaDelSistema();
    }
  }

  private fueCancelada(error: unknown): boolean {
    const mensaje = String((error as { message?: string })?.message ?? error ?? '').toLowerCase();
    return mensaje.includes('cancel') || mensaje.includes('cancelad');
  }
}

