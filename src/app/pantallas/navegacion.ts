import { ItemNavegacion } from '../ui/estructura';
import { Perfil } from '../nucleo/modelos/enums';

/**
 * Secciones de la barra inferior por perfil.
 *
 * No hay pantallas de tablero: cada sección es una de las pantallas que pide
 * el trabajo, sin resúmenes intermedios. Los perfiles que tienen una sola
 * pantalla no llevan barra.
 */
export function navegacionDe(
  perfil: Perfil | undefined,
  pedidoConfirmado = false,
  /**
   * US-7.2 · el mozo le devolvió la comanda. Los juegos siguen apagados —no
   * hay nada confirmado todavía— pero "Mi pedido" tiene que estar a mano: es
   * donde lee el motivo y desde donde corrige.
   */
  pedidoDevuelto = false,
): ItemNavegacion[] {
  return SECCIONES(perfil)
    .filter((item) => RUTAS_IMPLEMENTADAS.includes(item.ruta))
    .filter((item) => {
      // La consigna es explícita: los descuentos de los juegos son para el
      // cliente registrado, el anónimo no.
      if (item.ruta === '/juegos') return pedidoConfirmado && perfil === 'CLIENTE_REGISTRADO';
      if (item.ruta === '/cliente/estado-pedido') return pedidoConfirmado || pedidoDevuelto;
      return true;
    });
}

/**
 * Rutas que ya existen en la aplicación.
 *
 * La barra sólo dibuja las secciones que se pueden abrir: un botón que lleva a
 * una pantalla inexistente es peor que no tener el botón. A medida que cada
 * integrante del grupo sube su pantalla, suma acá su ruta y la sección aparece
 * sola, sin tocar nada más.
 */
const RUTAS_IMPLEMENTADAS: string[] = [
  '/carta',
  '/clientes-pendientes',
  '/mesas',
  '/metre/espera',
  '/mozo/pedidos',
  '/cliente/espera',
  '/cliente/encuestas',
  '/cliente/estado-pedido',
  '/juegos',
];

function SECCIONES(perfil: Perfil | undefined): ItemNavegacion[] {
  switch (perfil) {
    case 'DUENO':
    case 'SUPERVISOR':
      return [
        { id: 'registros', rotulo: 'Registros', icono: 'how_to_reg', ruta: '/clientes-pendientes' },
        { id: 'mesas', rotulo: 'Mesas', icono: 'table_restaurant', ruta: '/mesas' },
        { id: 'codigos', rotulo: 'Códigos', icono: 'qr_code_2', ruta: '/dueno/codigos' },
        { id: 'correos', rotulo: 'Correos', icono: 'outgoing_mail', ruta: '/dueno/correos' },
      ];
    case 'METRE':
      return [
        { id: 'espera', rotulo: 'Lista de espera', icono: 'hourglass_top', ruta: '/metre/espera' },
        { id: 'mesas', rotulo: 'Mesas', icono: 'table_restaurant', ruta: '/mesas' },
        { id: 'registrar', rotulo: 'Registrar cliente', icono: 'person_add', ruta: '/metre/registrar' },
      ];
    case 'MOZO':
      return [
        { id: 'pedidos', rotulo: 'Pedidos', icono: 'room_service', ruta: '/mozo/pedidos' },
        { id: 'mesas', rotulo: 'Mesas', icono: 'table_restaurant', ruta: '/mesas' },
        { id: 'carta', rotulo: 'Carta', icono: 'ramen_dining', ruta: '/carta' },
      ];
    // Una vez anunciado en la puerta, el comensal alterna entre su lugar en la
    // fila y los resultados de las encuestas anteriores.
    case 'CLIENTE_REGISTRADO':
    case 'CLIENTE_ANONIMO':
      return [
        { id: 'lugar', rotulo: 'Mi lugar', icono: 'hourglass_top', ruta: '/cliente/espera' },
        { id: 'pedido', rotulo: 'Mi pedido', icono: 'receipt_long', ruta: '/cliente/estado-pedido' },
        { id: 'juegos', rotulo: 'Juegos', icono: 'sports_esports', ruta: '/juegos' },
        { id: 'encuestas', rotulo: 'Encuestas', icono: 'insights', ruta: '/cliente/encuestas' },
      ];
    // El cocinero y el cantinero trabajan sobre una sola pantalla: una barra de
    // una sola sección sería un adorno.
    default:
      return [];
  }
}
