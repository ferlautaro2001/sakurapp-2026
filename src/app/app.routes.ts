import { Routes } from '@angular/router';
import { guardiaSesion } from './nucleo/guardias/guardias';

/**
 * Rutas de SakurApp para el MVP (v0).
 *
 * Flujo:
 * 1. Splash dinámico ('')
 * 2. Presentación estática ('presentacion')
 * 3. Formulario de login ('login')
 * 4. Página Principal con sesión ('home')
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pantallas/comunes/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'presentacion',
    loadComponent: () => import('./pantallas/comunes/presentacion.page').then((m) => m.PresentacionPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pantallas/comunes/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro-cliente',
    loadComponent: () => import('./pantallas/cliente/registro-cliente.page').then((m) => m.RegistroClientePage),
  },
  {
    path: 'registro-enviado',
    loadComponent: () => import('./pantallas/cliente/registro-enviado.page').then((m) => m.RegistroEnviadoPage),
  },
  {
    path: 'registro-invitado',
    loadComponent: () => import('./pantallas/cliente/registro-invitado.page').then((m) => m.RegistroInvitadoPage),
  },
  {
    path: 'estado-cuenta/:estado',
    loadComponent: () => import('./pantallas/cliente/estado-cuenta.page').then((m) => m.EstadoCuentaPage),
  },
  {
    path: 'home',
    canActivate: [guardiaSesion],
    loadComponent: () => import('./pantallas/comunes/home.page').then((m) => m.HomePage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

