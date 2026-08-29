import { Injectable } from '@angular/core';

export type Sonido = 'inicio' | 'cierre' | 'error' | 'exito' | 'escaneo' | 'aviso';

/**
 * Sonidos de la aplicación.
 *
 * El de apertura y el de cierre son deliberadamente distintos: el primero es
 * un acorde que sube y el segundo el mismo acorde que baja, para que se
 * reconozcan sin mirar la pantalla.
 */
@Injectable({ providedIn: 'root' })
export class SonidoService {
  private readonly pistas = new Map<Sonido, HTMLAudioElement>();
  private habilitado = true;

  constructor() {
    const nombres: Sonido[] = ['inicio', 'cierre', 'error', 'exito', 'escaneo', 'aviso'];
    for (const nombre of nombres) {
      const audio = new Audio(`assets/sonidos/${nombre}.wav`);
      audio.preload = 'auto';
      audio.volume = nombre === 'error' ? 0.9 : 0.7;
      this.pistas.set(nombre, audio);
    }
  }

  /** Reproduce sin bloquear: si el navegador todavía no dio permiso, se ignora. */
  reproducir(sonido: Sonido): void {
    if (!this.habilitado) return;
    const pista = this.pistas.get(sonido);
    if (!pista) return;
    try {
      pista.currentTime = 0;
      void pista.play().catch(() => undefined);
    } catch {
      // Reproducir un sonido nunca puede romper un flujo de la aplicación.
    }
  }

  /**
   * El cierre necesita terminar de sonar antes de que el sistema congele la
   * aplicación, así que devuelve una promesa con la duración de la pista.
   */
  async reproducirYEsperar(sonido: Sonido, milisegundos = 700): Promise<void> {
    this.reproducir(sonido);
    await new Promise((resolver) => setTimeout(resolver, milisegundos));
  }

  silenciar(silenciado: boolean): void {
    this.habilitado = !silenciado;
  }
}
