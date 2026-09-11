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
    path: 'admin/alta-mesa',
    canActivate: [guardiaSesion, guardiaPerfil('DUENO', 'SUPERVISOR')],
    loadComponent: () => import('./pantallas/admin/alta-mesa.page').then((m) => m.AltaMesaPage),
  },
  {
    path: 'mesas',
    canActivate: [guardiaSesion, guardiaPerfil('DUENO', 'SUPERVISOR', 'METRE', 'MOZO')],
    loadComponent: () => import('./pantallas/mesas/mesas.page').then((m) => m.MesasPage),
  },
  {
    path: 'mesas/nueva',
    canActivate: [guardiaSesion, guardiaPerfil('DUENO', 'SUPERVISOR')],
    loadComponent: () => import('./pantallas/admin/alta-mesa.page').then((m) => m.AltaMesaPage),
  },
  {
    path: 'mesas/:id/chat',
    canActivate: [
      guardiaSesion,
      guardiaPerfil('MOZO', 'CLIENTE_REGISTRADO', 'CLIENTE_ANONIMO', 'DUENO', 'SUPERVISOR'),
    ],
    loadComponent: () => import('./pantallas/mesas/chat-mesa.page').then((m) => m.ChatMesaPage),
  },
  {
    path: 'mesas/:id/qr',
    canActivate: [guardiaSesion, guardiaPerfil('DUENO', 'SUPERVISOR', 'METRE', 'MOZO')],
    loadComponent: () => import('./pantallas/mesas/mesa-qr.page').then((m) => m.MesaQrPage),
  },
  {
    path: 'mesas/:id',
    canActivate: [guardiaSesion, guardiaPerfil('DUENO', 'SUPERVISOR', 'METRE', 'MOZO')],
    loadComponent: () => import('./pantallas/mesas/mesa-form.page').then((m) => m.MesaFormPage),
  },
    {
    path: 'carta/:id/editar',
    canActivate: [
      guardiaSesion,
      guardiaPerfil('COCINERO'),
    ],
    loadComponent: () =>
      import('./pantallas/cocinero/alta-plato.page').then(
        (m) => m.AltaPlatoPage,
      ),
  },
    {
    path: 'comanda/carrito',
    canActivate: [
      guardiaSesion,
      guardiaPerfil(
        'CLIENTE_REGISTRADO',
        'CLIENTE_ANONIMO',
      ),
    ],
    loadComponent: () =>
      import(
        './pantallas/comanda/comanda-carrito.page'
      ).then(
        (m) => m.ComandaCarritoPage,
      ),
  },
    {
    path: 'carta/:id',
    canActivate: [guardiaSesion],
    loadComponent: () =>
      import('./pantallas/carta/producto-ficha.page').then(
        (m) => m.ProductoFichaPage,
      ),
  },
    {
    path: 'carta',
    canActivate: [guardiaSesion],
    loadComponent: () =>
      import('./pantallas/carta/carta.page').then((m) => m.CartaPage),
  },
  {
    path: 'cantinero/alta-bebida',
    canActivate: [guardiaSesion, guardiaPerfil('CANTINERO')],
    loadComponent: () =>
      import('./pantallas/cantinero/alta-bebida.page').then(
        (m) => m.AltaBebidaPage,
      ),
  },
  {
    path: 'cocinero/alta-plato',
    canActivate: [guardiaSesion, guardiaPerfil('COCINERO')],
    loadComponent: () =>
      import('./pantallas/cocinero/alta-plato.page').then(
        (m) => m.AltaPlatoPage,
      ),
  },
  {
    path: 'metre/espera',
    canActivate: [guardiaSesion, guardiaPerfil('METRE')],
    loadComponent: () =>
      import('./pantallas/metre/lista-espera.page').then((m) => m.MetreListaEsperaPage),
  },
  {
    path: 'mozo/pedidos',
    canActivate: [guardiaSesion, guardiaPerfil('MOZO')],
    loadComponent: () =>
      import('./pantallas/mozo/pedidos-mozo.page').then((m) => m.PedidosMozoPage),
  },
  {
    // US-7.2 · punto 13 · devolver la comanda es una pantalla propia y no un
    // modal: el mozo recorre la comanda entera marcando renglón por renglón.
    path: 'mozo/pedidos/:id/rechazar',
    canActivate: [guardiaSesion, guardiaPerfil('MOZO')],
    loadComponent: () => import('./pantallas/mozo/rechazo.page').then((m) => m.MozoRechazoPage),
  },
  {
    // US-5.1 · punto 9 · el comensal escanea el código de ingreso al salón y
    // queda anotado en la lista de espera. Hasta que el metre le asigne una
    // mesa, lo único habilitado son los resultados de las encuestas anteriores.
    path: 'cliente/ingreso',
    canActivate: [guardiaSesion, guardiaPerfil('CLIENTE_REGISTRADO', 'CLIENTE_ANONIMO')],
    loadComponent: () =>
      import('./pantallas/cliente/ingreso-local.page').then((m) => m.ClienteIngresoLocalPage),
  },
  {
    // Mi lugar en la fila: el número de orden, la mesa que le asignó el metre
    // y el escaneo del código de esa mesa.
    path: 'cliente/espera',
    canActivate: [guardiaSesion, guardiaPerfil('CLIENTE_REGISTRADO', 'CLIENTE_ANONIMO')],
    loadComponent: () => import('./pantallas/cliente/espera.page').then((m) => m.ClienteEsperaPage),
  },
  {
    path: 'cliente/encuestas',
    canActivate: [guardiaSesion, guardiaPerfil('CLIENTE_REGISTRADO', 'CLIENTE_ANONIMO')],
    loadComponent: () =>
      import('./pantallas/cliente/encuestas-previas.page').then((m) => m.ClienteEncuestasPreviasPage),
  },
  {
  path: 'cliente/estado-pedido/:id',
  canActivate: [
    guardiaSesion,
    guardiaPerfil(
      'CLIENTE_REGISTRADO',
      'CLIENTE_ANONIMO',
    ),
  ],
  loadComponent: () =>
    import(
      './pantallas/cliente/estado-pedido.page'
    ).then(
      (m) => m.EstadoPedidoPage,
    ),
  },
  {
    path: 'cliente/estado-pedido',
    canActivate: [
      guardiaSesion,
      guardiaPerfil(
        'CLIENTE_REGISTRADO',
        'CLIENTE_ANONIMO',
      ),
    ],
    loadComponent: () =>
      import(
        './pantallas/cliente/estado-pedido.page'
      ).then(
        (m) => m.EstadoPedidoPage,
      ),
  },
  {
    // Los descuentos de los juegos son sólo para el cliente registrado: el
    // anónimo no juega, así lo pide la consigna.
    path: 'juegos',
    canActivate: [guardiaSesion, guardiaPerfil('CLIENTE_REGISTRADO')],
    loadComponent: () => import('./pantallas/cliente/juegos.page').then((m) => m.JuegosPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
