import { Injectable, inject } from '@angular/core';
import {
  Camera,
  CameraPermissionType,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { AvisosService } from './avisos.service';
import { SonidoService } from './sonido.service';

/** Cuántas veces se le vuelve a preguntar al sistema por el permiso recién dado. */
const REINTENTOS_PERMISO = 6;

/** Entre consulta y consulta. Seis intentos dan poco más de un segundo. */
const ESPERA_ENTRE_INTENTOS = 180;

/** El permiso limitado alcanza para sacar una foto: da acceso a la cámara. */
function concedido(estado: string | undefined): boolean {
  return estado === 'granted' || estado === 'limited';
}

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
      if (Capacitor.isNativePlatform() && !(await this.pedirPermiso(origen))) {
        return null;
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

  /**
   * Permiso para abrir la cámara, incluso cuando el sistema tarda en confirmarlo.
   *
   * Al pedir el permiso, Android manda la aplicación al fondo para mostrar su
   * propio diálogo. Cuando la persona acepta y la aplicación vuelve, el plugin
   * a veces responde con el estado viejo, el de antes de aceptar: por eso hacía
   * falta tocar el botón dos veces. Así que si la respuesta no llega concedida,
   * se vuelve a consultar unas cuantas veces antes de darla por negada.
   *
   * Se piden **sólo los permisos que hace falta tener** para este origen: para
   * sacar una foto no se necesita la galería, y exigirla dejaba el botón
   * trabado para siempre en quien hubiera denegado el acceso a sus fotos.
   */
  private async pedirPermiso(origen: CameraSource): Promise<boolean> {
    const necesarios = PERMISOS_DE[origen];
    if (await this.tienePermiso(necesarios)) return true;

    const pedido = await Camera.requestPermissions({ permissions: necesarios }).catch(() => null);
    if (pedido && this.alcanza(necesarios, pedido)) return true;

    // El sistema todavía no terminó de propagar la respuesta: se le da tiempo.
    for (let intento = 0; intento < REINTENTOS_PERMISO; intento++) {
      await new Promise((seguir) => setTimeout(seguir, ESPERA_ENTRE_INTENTOS));
      if (await this.tienePermiso(necesarios)) return true;
    }

    this.avisos.error(
      necesarios.includes('camera') ? 'Falta el permiso de cámara' : 'Falta el permiso de fotos',
      'Habilitalo desde los ajustes del teléfono para poder cargar la foto.',
    );
    return false;
  }

  private async tienePermiso(necesarios: CameraPermissionType[]): Promise<boolean> {
    const estado = await Camera.checkPermissions().catch(() => null);
    return Boolean(estado && this.alcanza(necesarios, estado));
  }

  /**
   * Con el diálogo del sistema, que deja elegir entre la cámara y la galería,
   * alcanza con tener uno de los dos: si denegó las fotos igual puede sacarla.
   * Cuando el origen es uno solo, ese permiso es obligatorio.
   */
  private alcanza(
    necesarios: CameraPermissionType[],
    estado: Partial<Record<CameraPermissionType, string>>,
  ): boolean {
    return necesarios.length > 1
      ? necesarios.some((permiso) => concedido(estado[permiso]))
      : necesarios.every((permiso) => concedido(estado[permiso]));
  }

  private fueCancelada(error: unknown): boolean {
    const mensaje = String((error as { message?: string })?.message ?? error ?? '').toLowerCase();
    return mensaje.includes('cancel') || mensaje.includes('cancelad');
  }
}

/** Lo que hace falta tener concedido según de dónde salga la foto. */
const PERMISOS_DE: Record<CameraSource, CameraPermissionType[]> = {
  [CameraSource.Camera]: ['camera'],
  [CameraSource.Photos]: ['photos'],
  [CameraSource.Prompt]: ['camera', 'photos'],
};
