import { Injectable, signal } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type TonoAviso = 'error' | 'success' | 'info';

export interface Aviso {
  id: number;
  tono: TonoAviso;
  titulo: string;
  cuerpo?: string;
}

/**
 * Avisos de la aplicación.
 *
 * Nunca se usa `alert()` ni un diálogo del sistema: todo error o confirmación
 * aparece como banner dentro de la pantalla, que es un control propio de la
 * aplicación. Los errores, además, vibran el dispositivo. No suenan: los
 * únicos sonidos son los de abrir y cerrar la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguienteId = 1;

  readonly avisos = signal<Aviso[]>([]);

  error(titulo: string, cuerpo?: string): void {
    this.vibrarError();
    this.mostrar('error', titulo, cuerpo, 5000);
  }

  exito(titulo: string, cuerpo?: string): void {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    this.mostrar('success', titulo, cuerpo, 3800);
  }

  info(titulo: string, cuerpo?: string): void {
    this.mostrar('info', titulo, cuerpo, 3800);
  }

  /** Vibración de error, disponible por separado para las validaciones de formulario. */
  vibrarError(): void {
    void Haptics.notification({ type: NotificationType.Error }).catch(() => undefined);
    void Haptics.vibrate({ duration: 260 }).catch(() => undefined);
  }

  cerrar(id: number): void {
    this.avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  private mostrar(tono: TonoAviso, titulo: string, cuerpo: string | undefined, duracion: number): void {
    const id = this.siguienteId++;
    this.avisos.update((lista) => [...lista, { id, tono, titulo, cuerpo }]);
    setTimeout(() => this.cerrar(id), duracion);
  }
}
