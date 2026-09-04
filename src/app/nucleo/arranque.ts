import { inject } from '@angular/core';
import { AlmacenService } from './datos/almacen.service';
import { construirSemilla } from './datos/semilla';
import { SesionService } from './servicios/sesion.service';
import { NotificacionesService } from './servicios/notificaciones.service';

/**
 * Arranque de la aplicación para v0.
 * Inicializa el almacén con los perfiles requeridos y recupera la sesión activa.
 */
export async function arrancar(): Promise<void> {
  const almacen = inject(AlmacenService);
  const sesion = inject(SesionService);
  const notificaciones = inject(NotificacionesService);

  await almacen.iniciar(() => construirSemilla());
  await sesion.restaurar();
  await notificaciones.iniciar();
}


