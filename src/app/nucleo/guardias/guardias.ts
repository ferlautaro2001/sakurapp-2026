import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../servicios/sesion.service';

/** Exige sesión abierta para acceder a la pantalla principal. Sin sesión, al login. */
export const guardiaSesion: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (sesion.autenticado()) return true;
  return router.createUrlTree(['/login']);
};

