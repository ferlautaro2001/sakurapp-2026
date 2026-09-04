import { Injectable } from '@angular/core';

export type Sonido = 'inicio' | 'cierre';

/**
 * Sonidos de la aplicación.
 *
 * Sólo dos, y son los que pide la consigna: uno al iniciar la aplicación y
 * otro, distinto, al cerrarla. Las acciones de adentro no suenan: taparían a
 * estos dos, que son los que hay que reconocer sin mirar la pantalla. El
 * error avisa por vibración, y el resultado de cada acción se ve en pantalla.
 */
@Injectable({ providedIn: 'root' })
export class SonidoService {
  private readonly pistas = new Map<Sonido, HTMLAudioElement>();
  private habilitado = true;
  /** Cuántas pantallas del sistema hay abiertas encima de la aplicación. */
  private pantallasDelSistema = 0;

  constructor() {
    for (const [nombre, archivo] of Object.entries(ARCHIVOS) as [Sonido, string][]) {
      const audio = new Audio(`assets/sonidos/${archivo}`);
      audio.preload = 'auto';
      audio.volume = 0.7;
      this.pistas.set(nombre, audio);
    }
  }

  /**
   * Sonido de apertura o de cierre de la aplicación.
   *
   * No suena si arriba hay una pantalla del sistema: cuando se abre la cámara
   * o aparece un pedido de permiso, Android manda la aplicación al fondo y
   * después la devuelve, pero la persona nunca la cerró ni la volvió a abrir.
   * Sonar ahí convertiría los dos gongs en ruido de fondo, y son justamente
   * los únicos sonidos que tiene la aplicación.
   */
  porCicloDeVida(sonido: Sonido): void {
    if (this.pantallasDelSistema > 0) return;
    this.reproducir(sonido);
  }

  /** Se abrió la cámara o un diálogo de permisos encima de la aplicación. */
  abrioPantallaDelSistema(): void {
    this.pantallasDelSistema++;
  }

  /** Se cerró. */
  cerroPantallaDelSistema(): void {
    // El sistema avisa que la aplicación volvió un instante antes de devolver
    // el control, así que la marca se levanta con un respiro: si se levantara
    // en el acto, ese aviso todavía haría sonar el gong de apertura.
    setTimeout(() => {
      this.pantallasDelSistema = Math.max(0, this.pantallasDelSistema - 1);
    }, GRACIA_PANTALLA_SISTEMA);
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
   * Duración real de una pista, en milisegundos.
   *
   * La pide quien tiene que acompañar al sonido con algo en pantalla, para
   * que la animación dure lo mismo que se escucha y el audio no se corte a la
   * mitad. Si el archivo todavía no cargó sus metadatos, espera; si falla o
   * tarda demasiado, devuelve el valor por defecto y sigue: una pantalla nunca
   * se queda esperando a un sonido.
   */
  duracion(sonido: Sonido, porDefecto: number): Promise<number> {
    const pista = this.pistas.get(sonido);
    if (!pista) return Promise.resolve(porDefecto);

    const leida = () => (Number.isFinite(pista.duration) && pista.duration > 0 ? pista.duration * 1000 : porDefecto);
    if (Number.isFinite(pista.duration) && pista.duration > 0) return Promise.resolve(leida());

    return new Promise<number>((resolver) => {
      const limpiar = () => {
        pista.removeEventListener('loadedmetadata', alCargar);
        pista.removeEventListener('error', alFallar);
        clearTimeout(reloj);
      };
      const alCargar = () => {
        limpiar();
        resolver(leida());
      };
      const alFallar = () => {
        limpiar();
        resolver(porDefecto);
      };
      const reloj = setTimeout(alFallar, ESPERA_METADATOS);
      pista.addEventListener('loadedmetadata', alCargar);
      pista.addEventListener('error', alFallar);
    });
  }

  silenciar(silenciado: boolean): void {
    this.habilitado = !silenciado;
  }
}

/** Margen para que el aviso de vuelta del sistema no dispare el gong. */
const GRACIA_PANTALLA_SISTEMA = 900;

/** Archivo de cada sonido. */
const ARCHIVOS: Record<Sonido, string> = {
  inicio: 'inicio.mp3',
  cierre: 'cierre.mp3',
};

/** Más de esto esperando los metadatos de un audio es una pantalla congelada. */
const ESPERA_METADATOS = 1500;
