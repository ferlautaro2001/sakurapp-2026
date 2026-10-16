import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

/**
 * Dirección del barrido horizontal entre pantallas.
 *
 * La barra inferior decide el sentido según el botón tocado respecto del
 * activo (a la derecha → entra desde la derecha, a la izquierda → desde la
 * izquierda) y lo publica en `data-nav-dir` antes de navegar, que es lo que
 * lee el CSS. El botón físico Atrás (`popstate`) siempre barre hacia atrás.
 */
@Injectable({ providedIn: 'root' })
export class TransicionService {
  private readonly router = inject(Router);

  /** 1 = avanza (entra desde la derecha), -1 = retrocede (entra desde la izquierda). */
  readonly direccion = signal<1 | -1>(1);

  /** Índice de la pestaña de origen, para que el vidrio de la barra nueva deslice desde ahí. */
  private origenPendiente: number | null = null;

  constructor() {
    this.aplicar();
    // En los tests el Router suele ser un mock sin `events`: ahí no hay Atrás que escuchar.
    this.router.events?.subscribe?.((evento) => {
      if (evento instanceof NavigationStart && evento.navigationTrigger === 'popstate') {
        this.origenPendiente = null;
        this.atras();
      }
    });
  }

  /** Sentido según la posición del botón destino respecto del activo. */
  segunIndices(origen: number, destino: number): void {
    this.origenPendiente = origen >= 0 ? origen : null;
    if (destino > origen) this.adelante();
    else this.atras();
  }

  adelante(): void {
    this.direccion.set(1);
    this.aplicar();
  }

  atras(): void {
    this.direccion.set(-1);
    this.aplicar();
  }

  /** Lo consume la barra recién montada para animar el vidrio desde la pestaña anterior. */
  consumirOrigen(): number | null {
    const origen = this.origenPendiente;
    this.origenPendiente = null;
    return origen;
  }

  private aplicar(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['navDir'] = String(this.direccion());
    }
  }
}
