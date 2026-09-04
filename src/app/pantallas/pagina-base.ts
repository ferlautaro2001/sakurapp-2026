import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SesionService } from '../nucleo/servicios/sesion.service';
import { AvisosService } from '../nucleo/servicios/avisos.service';
import { CargandoService } from '../nucleo/servicios/cargando.service';
import { ConfirmacionService, PedidoConfirmacion } from '../nucleo/servicios/confirmacion.service';
import { navegacionDe } from './navegacion';

/**
 * Base de las pantallas con sesión abierta.
 *
 * Resuelve la barra inferior del rol y el cierre de sesión, que es el mismo en
 * todas las pantallas y siempre vive en el encabezado.
 */
export abstract class PaginaConSesion {
  protected readonly sesion = inject(SesionService);
  protected readonly router = inject(Router);
  protected readonly avisos = inject(AvisosService);
  protected readonly cargando = inject(CargandoService);
  protected readonly confirmacion = inject(ConfirmacionService);

  protected readonly usuario = this.sesion.usuario;
  protected readonly secciones = computed(() => navegacionDe(this.sesion.usuario()?.perfil));

  /** Pregunta antes de hacer algo que acepta, rechaza, modifica o da de baja. */
  protected preguntar(pedido: PedidoConfirmacion): Promise<boolean> {
    return this.confirmacion.pedir(pedido);
  }

  /** Cierra la sesión y borra la credencial guardada en el dispositivo. */
  protected async cerrarSesion(): Promise<void> {
    const seguro = await this.preguntar({
      titulo: '¿Cerrás la sesión?',
      mensaje: 'Se borran las credenciales guardadas en este dispositivo y volvés a la pantalla de ingreso.',
      confirmar: 'Cerrar sesión',
      tono: 'peligro',
      icono: 'logout',
    });
    if (!seguro) return;

    // Sin sonido ni cartel: la consigna pide sonidos distintos al iniciar y
    // cerrar la APLICACIÓN, no la sesión, y volver a la pantalla de ingreso ya
    // dice por sí solo que la sesión se cerró.
    await this.cargando.conEsperaMinima('Cerrando la sesión…', () => this.sesion.cerrar(), 400);
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  protected ir(ruta: unknown[]): void {
    void this.router.navigate(ruta);
  }
}
