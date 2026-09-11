import { Routes } from '@angular/router';
import { guardiaPerfil, guardiaSesion } from './nucleo/guardias/guardias';

/**
 * Rutas de SakurApp agrupadas por rol y flujo de trabajo.
 *
 * Flujo de ingreso:
 * 1. Splash dinámico ('')
 * 2. Presentación estática ('presentacion')
 * 3. Formulario de login ('login')
 * 4. Pantalla directa del perfil que abrió la sesión (sin tableros intermedios)
 */
export const routes: Routes = [
  // --- comunes ---
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

  // --- alta de clientes ---
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

  // --- dueño y supervisor ---
  {
    path: 'dueno',
    canActivate: [guardiaPerfil('DUENO', 'SUPERVISOR')],
    children: [
      {
        path: 'registros',
        loadComponent: () => import('./pantallas/dueno/registros.page').then((m) => m.DuenoRegistrosPage),
      },
      {
        path: 'resultado/:id/:decision',
        loadComponent: () => import('./pantallas/dueno/resultado.page').then((m) => m.DuenoResultadoPage),
      },
      {
        path: 'alta-empleado',
        loadComponent: () => import('./pantallas/dueno/alta-empleado.page').then((m) => m.AltaEmpleadoPage),
      },
      {
        path: 'correos',
        loadComponent: () => import('./pantallas/dueno/correos.page').then((m) => m.DuenoCorreosPage),
      },
      {
        path: 'codigos',
        loadComponent: () => import('./pantallas/dueno/codigos.page').then((m) => m.DuenoCodigosPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'registros' },
    ],
  },
  {
    path: 'clientes-pendientes',
    redirectTo: 'dueno/registros',
    pathMatch: 'full',
  },
  {
    path: 'admin/alta-empleado',
    redirectTo: 'dueno/alta-empleado',
    pathMatch: 'full',
  },

  // --- mesas: dueño, supervisor, metre y mozo ---
  {
    path: 'mesas',
    canActivate: [guardiaPerfil('DUENO', 'SUPERVISOR', 'METRE', 'MOZO')],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pantallas/mesas/mesas.page').then((m) => m.MesasPage),
      },
      {
        path: 'nueva',
        canActivate: [guardiaPerfil('DUENO', 'SUPERVISOR')],
        loadComponent: () => import('./pantallas/admin/alta-mesa.page').then((m) => m.AltaMesaPage),
      },
      {
        path: ':id/chat',
        canActivate: [guardiaPerfil('MOZO', 'CLIENTE_REGISTRADO', 'CLIENTE_ANONIMO', 'DUENO', 'SUPERVISOR')],
        loadComponent: () => import('./pantallas/mesas/chat-mesa.page').then((m) => m.ChatMesaPage),
      },
      {
        path: ':id/qr',
        loadComponent: () => import('./pantallas/mesas/mesa-qr.page').then((m) => m.MesaQrPage),
      },
      {
        path: ':id',
        loadComponent: () => import('./pantallas/mesas/mesa-form.page').then((m) => m.MesaFormPage),
      },
    ],
  },
  {
    path: 'admin/alta-mesa',
    redirectTo: 'mesas/nueva',
    pathMatch: 'full',
  },

  // --- carta: cocina, barra, mozo y el comensal ya sentado ---
  {
    path: 'carta',
    canActivate: [guardiaPerfil('COCINERO', 'CANTINERO', 'MOZO', 'CLIENTE_REGISTRADO', 'CLIENTE_ANONIMO')],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pantallas/carta/carta.page').then((m) => m.CartaPage),
      },
      {
        path: 'alta-plato',
        canActivate: [guardiaPerfil('COCINERO')],
        loadComponent: () => import('./pantallas/cocinero/alta-plato.page').then((m) => m.AltaPlatoPage),
      },
      {
        path: 'alta-bebida',
        canActivate: [guardiaPerfil('CANTINERO')],
        loadComponent: () => import('./pantallas/cantinero/alta-bebida.page').then((m) => m.AltaBebidaPage),
      },
      {
        path: ':id/editar',
        canActivate: [guardiaPerfil('COCINERO')],
        loadComponent: () => import('./pantallas/cocinero/alta-plato.page').then((m) => m.AltaPlatoPage),
      },
      {
        path: ':id',
        loadComponent: () => import('./pantallas/carta/producto-ficha.page').then((m) => m.ProductoFichaPage),
      },
    ],
  },
  {
    path: 'cocinero/alta-plato',
    redirectTo: 'carta/alta-plato',
    pathMatch: 'full',
  },
  {
    path: 'cantinero/alta-bebida',
    redirectTo: 'carta/alta-bebida',
    pathMatch: 'full',
  },

  // --- metre ---
  {
    path: 'metre',
    canActivate: [guardiaPerfil('METRE')],
    children: [
      {
        path: 'espera',
        loadComponent: () => import('./pantallas/metre/lista-espera.page').then((m) => m.MetreListaEsperaPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'espera' },
    ],
  },

  // --- mozo: comandas para auditar y consultas de las mesas ---
  {
    path: 'mozo',
    canActivate: [guardiaPerfil('MOZO')],
    children: [
      {
        path: 'pedidos',
        pathMatch: 'full',
        loadComponent: () => import('./pantallas/mozo/pedidos.page').then((m) => m.MozoPedidosPage),
      },
      {
        path: 'pedidos/:id/rechazar',
        loadComponent: () => import('./pantallas/mozo/rechazo.page').then((m) => m.MozoRechazoPage),
      },
      {
        path: 'pedidos/:id',
        loadComponent: () => import('./pantallas/mozo/pedido-detalle.page').then((m) => m.MozoPedidoDetallePage),
      },
      {
        path: 'consultas',
        pathMatch: 'full',
        loadComponent: () => import('./pantallas/mozo/consultas.page').then((m) => m.MozoConsultasPage),
      },
      {
        path: 'consultas/:id',
        loadComponent: () => import('./pantallas/mozo/sala.page').then((m) => m.MozoSalaPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'pedidos' },
    ],
  },

  // --- cocina y barra: comandas filtradas por sector ---
  {
    path: 'sector',
    canActivate: [guardiaPerfil('COCINERO', 'CANTINERO')],
    children: [
      {
        path: 'pedidos',
        loadComponent: () => import('./pantallas/sector/pedidos.page').then((m) => m.SectorPedidosPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'pedidos' },
    ],
  },

  // --- cliente: ingreso, espera, pedido, consulta y minijuegos ---
  {
    path: 'cliente',
    canActivate: [guardiaPerfil('CLIENTE_REGISTRADO', 'CLIENTE_ANONIMO')],
    children: [
      {
        path: 'ingreso',
        loadComponent: () => import('./pantallas/cliente/ingreso-local.page').then((m) => m.ClienteIngresoLocalPage),
      },
      {
        path: 'espera',
        loadComponent: () => import('./pantallas/cliente/espera.page').then((m) => m.ClienteEsperaPage),
      },
      {
        path: 'encuestas',
        loadComponent: () =>
          import('./pantallas/cliente/encuestas-previas.page').then((m) => m.ClienteEncuestasPreviasPage),
      },
      {
        path: 'pedido',
        loadComponent: () => import('./pantallas/cliente/pedido.page').then((m) => m.ClientePedidoPage),
      },
      {
        path: 'consulta',
        loadComponent: () => import('./pantallas/cliente/consulta.page').then((m) => m.ClienteConsultaPage),
      },
      {
        path: 'juegos',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./pantallas/cliente/juegos/juegos.page').then((m) => m.ClienteJuegosPage),
          },
          {
            path: 'ninja-sakura',
            loadComponent: () =>
              import('./pantallas/cliente/juegos/ninja-sakura.page').then((m) => m.NinjaSakuraPage),
          },
          {
            path: 'emparejando-sushis',
            loadComponent: () =>
              import('./pantallas/cliente/juegos/emparejando-sushis.page').then((m) => m.EmparejandoSushisPage),
          },
          {
            path: 'tateti-sushis',
            loadComponent: () =>
              import('./pantallas/cliente/juegos/tateti-sushis.page').then((m) => m.TatetiSushisPage),
          },
        ],
      },
      { path: '', pathMatch: 'full', redirectTo: 'ingreso' },
    ],
  },
  {
    path: 'comanda/carrito',
    redirectTo: 'cliente/pedido',
    pathMatch: 'full',
  },
  {
    path: 'cliente/estado-pedido',
    redirectTo: 'cliente/pedido',
    pathMatch: 'full',
  },
  {
    path: 'cliente/estado-pedido/:id',
    redirectTo: 'cliente/pedido',
  },
  {
    path: 'juegos',
    redirectTo: 'cliente/juegos',
    pathMatch: 'full',
  },

  // --- fallback provisorio ---
  {
    path: 'en-preparacion',
    canActivate: [guardiaSesion],
    loadComponent: () => import('./pantallas/comunes/en-preparacion.page').then((m) => m.EnPreparacionPage),
  },

  {
    path: '**',
    redirectTo: '',
  },
];
