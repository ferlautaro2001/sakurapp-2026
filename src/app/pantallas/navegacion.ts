import { ItemNavegacion } from '../ui/estructura';
import { EstadoPedido, Perfil } from '../nucleo/modelos/enums';

/**
 * En qué momento del recorrido está el comensal. Su barra cambia con eso:
 * antes de sentarse no existe la carta, y con el pedido mandado no existe
 * nada más que el pedido.
 */
export interface ContextoNavegacion {
  /** Ya escaneó el código de su mesa y está sentado. */
  enMesa?: boolean;
  /** Estado del pedido vivo, si tiene alguno. */
  estadoPedido?: EstadoPedido | null;
  /** Si tiene habilitados los juegos. */
  juegosHabilitados?: boolean;
}

/**
 * Secciones de la barra inferior por perfil.
 *
 * No hay pantallas de tablero: cada sección es una de las pantallas que pide
 * el trabajo, sin resúmenes intermedios. Los perfiles que tienen una sola
 * pantalla no llevan barra —el componente no la dibuja—, y eso es justamente
 * lo que deja al comensal encerrado en su pedido mientras espera al mozo.
 */
export function navegacionDe(
  perfil: Perfil | undefined,
  contextoOPedidoConfirmado?: ContextoNavegacion | boolean,
  pedidoDevuelto = false,
): ItemNavegacion[] {
  let contexto: ContextoNavegacion;
  if (typeof contextoOPedidoConfirmado === 'boolean') {
    contexto = {
      enMesa: true,
      estadoPedido: contextoOPedidoConfirmado
        ? 'CONFIRMADO'
        : pedidoDevuelto
          ? 'RECHAZADO'
          : null,
    };
  } else {
    contexto = contextoOPedidoConfirmado ?? {};
  }

  switch (perfil) {
    case 'DUENO':
    case 'SUPERVISOR':
      return [
        { id: 'registros', rotulo: 'Registros', icono: 'how_to_reg', ruta: '/dueno/registros' },
        { id: 'mesas', rotulo: 'Mesas', icono: 'table_restaurant', ruta: '/mesas' },
        { id: 'codigos', rotulo: 'Códigos', icono: 'qr_code_2', ruta: '/dueno/codigos' },
        { id: 'correos', rotulo: 'Correos', icono: 'outgoing_mail', ruta: '/dueno/correos' },
        { id: 'empleados', rotulo: 'Empleados', icono: 'groups', ruta: '/dueno/empleados' },
      ];
    case 'METRE':
      return [
        { id: 'espera', rotulo: 'Lista de espera', icono: 'hourglass_top', ruta: '/metre/espera' },
        { id: 'mesas', rotulo: 'Mesas', icono: 'table_restaurant', ruta: '/mesas' },
        { id: 'registrar', rotulo: 'Registrar cliente', icono: 'person_add', ruta: '/metre/registrar' },
      ];
    case 'MOZO':
      return [
        { id: 'mesas', rotulo: 'Mesas', icono: 'table_restaurant', ruta: '/mesas' },
        { id: 'pedidos', rotulo: 'Pedidos', icono: 'receipt_long', ruta: '/mozo/pedidos' },
        { id: 'consultas', rotulo: 'Consultas', icono: 'forum', ruta: '/mozo/consultas' },
        { id: 'carta', rotulo: 'Carta', icono: 'ramen_dining', ruta: '/carta' },
      ];
    case 'COCINERO':
    case 'CANTINERO':
      return [
        { id: 'pedidos', rotulo: 'Pedidos', icono: 'skillet', ruta: '/sector/pedidos' },
        { id: 'carta', rotulo: 'Carta', icono: 'ramen_dining', ruta: '/carta' },
      ];
    case 'CLIENTE_REGISTRADO':
    case 'CLIENTE_ANONIMO':
      return navegacionDelComensal(contexto);
    default:
      return [];
  }
}

/**
 * La barra del comensal, que es la que más cambia.
 *
 *  1. En la fila → su lugar, los juegos de la espera y las encuestas.
 *  2. Sentado, armando el pedido → su mesa, la carta y el pedido.
 *  3. Con el pedido mandado → sólo el pedido, hasta que el mozo lo resuelva.
 *  4. Con el pedido confirmado o posterior → el estado del pedido y los juegos.
 */
function navegacionDelComensal(contexto: ContextoNavegacion): ItemNavegacion[] {
  const lugar: ItemNavegacion = { id: 'lugar', rotulo: 'Mi mesa', icono: 'table_restaurant', ruta: '/cliente/espera' };
  const carta: ItemNavegacion = { id: 'carta', rotulo: 'Carta', icono: 'ramen_dining', ruta: '/carta' };
  const pedido: ItemNavegacion = { id: 'pedido', rotulo: 'Mi pedido', icono: 'receipt_long', ruta: '/cliente/pedido' };
  const juegos: ItemNavegacion = { id: 'juegos', rotulo: 'Juegos', icono: 'sports_esports', ruta: '/cliente/juegos' };

  if (!contexto.enMesa) {
    return [
      { id: 'lugar', rotulo: 'Mi lugar', icono: 'hourglass_top', ruta: '/cliente/espera' },
      juegos,
      { id: 'encuestas', rotulo: 'Encuestas', icono: 'insights', ruta: '/cliente/encuestas' },
    ];
  }

  switch (contexto.estadoPedido) {
    case 'PENDIENTE_CONFIRMACION':
      return [pedido];
    case 'CONFIRMADO':
    case 'EN_PREPARACION':
    case 'LISTO':
    case 'ENTREGADO':
    case 'RECIBIDO':
    case 'CUENTA_SOLICITADA':
    case 'PAGO_PENDIENTE':
    case 'CERRADO':
      return [pedido, juegos];
    default:
      return [lugar, carta, pedido];
  }
}
