import { Injectable, computed, signal } from '@angular/core';
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
 * Nunca se usa `alert()` ni un diálogo del sistema: los errores aparecen
 * como banner y los éxitos/guardados se avisan mediante un modal con transición suave.
 */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguienteId = 1;

  readonly avisos = signal<Aviso[]>([]);
  readonly avisosToast = computed(() => this.avisos().filter((a) => a.tono !== 'success'));
  readonly modalExito = computed(() => this.avisos().find((a) => a.tono === 'success') || null);

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
