import { Injectable, computed, signal } from '@angular/core';

/**
 * Indicador de espera global.
 *
 * Toda espera de la aplicación pasa por acá, así que siempre se ve el mismo
 * spinner con el logo en el centro. Lleva un contador para que dos esperas
 * simultáneas no se apaguen entre ellas.
 */
@Injectable({ providedIn: 'root' })
export class CargandoService {
  private readonly pendientes = signal(0);
  private readonly mensaje = signal('Cargando…');

  readonly visible = computed(() => this.pendientes() > 0);
  readonly rotulo = computed(() => this.mensaje());

  mostrar(rotulo = 'Cargando…'): void {
    this.mensaje.set(rotulo);
    this.pendientes.update((n) => n + 1);
  }

  ocultar(): void {
    this.pendientes.update((n) => Math.max(0, n - 1));
  }

  /** Envuelve una tarea asíncrona mostrando el indicador mientras dure. */
  async durante<T>(rotulo: string, tarea: () => Promise<T>): Promise<T> {
    this.mostrar(rotulo);
    try {
      return await tarea();
    } finally {
      this.ocultar();
    }
  }

  /** Espera visible mínima, para que el indicador no titile en operaciones instantáneas. */
  async conEsperaMinima<T>(rotulo: string, tarea: () => Promise<T>, minimo = 550): Promise<T> {
    this.mostrar(rotulo);
    const arranque = Date.now();
    try {
      const resultado = await tarea();
      const transcurrido = Date.now() - arranque;
      if (transcurrido < minimo) {
        await new Promise((resolver) => setTimeout(resolver, minimo - transcurrido));
      }
      return resultado;
    } finally {
      this.ocultar();
    }
  }
}
