import { Routes } from '@angular/router';
import { guardiaPerfil, guardiaSesion } from './nucleo/guardias/guardias';

/**
 * Rutas de SakurApp.
 *
 * No hay pantalla de tablero: al iniciar sesión, cada perfil aterriza
 * directamente en su pantalla de trabajo (ver `SesionService.rutaInicio()`).
 *
 * Flujo de ingreso:
 * 1. Splash dinámico ('')
 * 2. Presentación estática ('presentacion')
 * 3. Formulario de login ('login')
 * 4. Pantalla del perfil que abrió la sesión
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
    // Punto 6 · sólo el dueño y el supervisor resuelven registros de comensales.
    path: 'clientes-pendientes',
    canActivate: [guardiaSesion, guardiaPerfil('DUENO', 'SUPERVISOR')],
    loadComponent: () =>
      import('./pantallas/admin/clientes-pendientes.page').then((m) => m.ClientesPendientesPage),
  },
  {
    // Provisorio: perfiles cuya pantalla todavía está en desarrollo.
    path: 'en-preparacion',
    canActivate: [guardiaSesion],
    loadComponent: () => import('./pantallas/comunes/en-preparacion.page').then((m) => m.EnPreparacionPage),
  },
  {
    path: 'admin/alta-empleado',
    canActivate: [guardiaSesion, guardiaPerfil('DUENO', 'SUPERVISOR')],
    loadComponent: () => import('./pantallas/admin/alta-empleado.page').then((m) => m.AltaEmpleadoPage),
  },
  {
    path: 'cantinero/alta-bebida',
    canActivate: [guardiaSesion, guardiaPerfil('CANTINERO')],
    loadComponent: () => import('./pantallas/cantinero/alta-bebida.page').then((m) => m.AltaBebidaPage),
  },
{
  path: 'cocinero/alta-plato',
  canActivate: [
    guardiaSesion,
    guardiaPerfil('COCINERO'),
  ],
  loadComponent: () =>
    import('./pantallas/cocinero/alta-plato.page')
      .then((m) => m.AltaPlatoPage),
},
  {
    path: '**',
    redirectTo: '',
  },
];
