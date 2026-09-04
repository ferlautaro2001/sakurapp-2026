import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../servicios/sesion.service';
import { Perfil } from '../modelos/enums';

/** Exige sesión abierta para acceder a la pantalla principal. Sin sesión, al login. */
export const guardiaSesion: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (sesion.autenticado()) return true;
  return router.createUrlTree(['/login']);
};

/**
 * Exige uno de los perfiles indicados.
 *
 * Cierra por defecto: quien no está en la lista vuelve a su pantalla de
 * inicio, nunca ve la pantalla protegida ni un mensaje de error que revele
 * que existe.
 */
export function guardiaPerfil(...perfiles: Perfil[]): CanActivateFn {
  return () => {
    const sesion = inject(SesionService);
    const router = inject(Router);
    const usuario = sesion.usuario();
    if (!usuario) return router.createUrlTree(['/login']);
    if (perfiles.includes(usuario.perfil)) return true;
    return router.createUrlTree([sesion.rutaInicio()]);
  };
}
