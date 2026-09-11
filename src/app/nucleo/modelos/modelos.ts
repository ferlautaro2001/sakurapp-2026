import {
  AlcanceRechazo,
  EstadoEspera,
  EstadoMesa,
  EstadoPedido,
  EstadoSector,
  EstadoUsuario,
  MarcaRechazo,
  Perfil,
  RolMensaje,
  Sector,
  TipoMesa,
  TipoProducto,
} from './enums';

/**
 * Entidad Usuario para el MVP (v0).
 * Maneja los datos de los perfiles para la autenticación y la página principal.
 */
export interface Usuario {
  id: string;
  uid: string;
  nombre: string;
  apellido: string | null;
  dni: string | null;
  cuil: string | null;
  email: string | null;
  perfil: Perfil;
  fotoUrl: string;
  estado: EstadoUsuario;
  activo: boolean;
  clave: string | null;
  pushToken?: string | null;
  fcmToken?: string | null;
  createdAt: string;
}

export interface AltaCliente {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  email: string;
  clave: string;
  fotoUrl: string;
}

export interface AltaEmpleado extends AltaCliente {
  perfil: Extract<Perfil, 'COCINERO' | 'CANTINERO' | 'MOZO' | 'METRE'>;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  tiempoElaboracion: number;
  precio: number;
  tipo: TipoProducto;
  sector: Sector;
  fotos: string[];
  activo: boolean;
  disponible: boolean;
}

export interface Mesa {
  id: string;
  numero: number;
  cantidadComensales: number;
  tipo: TipoMesa;
  estado: EstadoMesa;
  fotoUrl: string;
  qrCodeUrl: string;
  clienteActualId?: string | null;
  clienteActualUid?: string | null;
}


export interface AltaMesa {
  numero: number;
  cantidadComensales: number;
  tipo: TipoMesa;
  estado: EstadoMesa;
  fotoUrl: string;
}

export interface CorreoEnviado {
  id: string;
  para: string;
  asunto: string;
  plantilla: 'REGISTRO_RECIBIDO' | 'APROBACION' | 'RECHAZO';
  cuerpoHtml: string;
  enviadoEn: string;
  entregado: boolean;
  detalle: string;
}

export interface DatosDni {
  apellidos: string;
  nombres: string;
  dni: string;
  cuil: string;
  sexo: string;
  fechaNacimiento: string;
}

export type ContenidoQr =
  | { tipo: 'MESA'; mesaId: string }
  | { tipo: 'INGRESO' }
  | { tipo: 'PROPINA'; porcentaje: number; rotulo: string }
  | { tipo: 'DNI'; datos: DatosDni }
  | { tipo: 'DESCONOCIDO'; texto: string };


/**
 * Una entrada de la lista de espera del salón.
 *
 * Guarda el nombre y la foto del comensal además de su identificador: el
 * metre tiene que poder reconocer a quien está esperando —muchas veces un
 * invitado que no tiene cuenta— sin depender de otra consulta.
 */
export interface Espera {
  id: string;
  clienteId: string;
  clienteUid: string;
  clienteNombre: string;
  clienteFotoUrl: string;
  estado: EstadoEspera;
  mesaAsignadaId: string | null;
  mesaAsignadaNumero: number | null;
  timestamp: string;
}

/** Una respuesta de encuesta ya cargada. Para el comensal es sólo lectura. */
export interface RespuestaEncuesta {
  id: string;
  calificacionMozo: number;
  nivelLimpieza: number;
  recomendaria: boolean;
  aspectoFavorito: string;
  fecha: string;
}

export interface PedidoItem {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: TipoProducto;
  sector: Sector;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * US-7.2 · un renglón marcado por el mozo al devolver la comanda.
 *
 * Se identifica por el producto y no por el renglón: al reenviar, la comanda
 * reescribe sus renglones y los identificadores cambian, pero el producto que
 * el mozo marcó sigue siendo el mismo.
 *
 * Guarda la cantidad que tenía en el momento de marcarlo, que es contra lo que
 * se verifica después: un amarillo se corrige bajando la cantidad, así que hay
 * que saber de cuánto venía.
 */
export interface ObservacionItem {
  productoId: string;
  marca: MarcaRechazo;
  cantidadAlMarcar: number;
}

/** Pedido operativo compartido por el mozo, el cliente, Cocina y Bar. */
export interface Pedido {
  id: string;
  mesaId: string;
  mesaNumero: number;
  clienteId: string;
  clienteUid: string;
  clienteNombre: string;
  estadoGlobal: EstadoPedido;
  estadoCocina: EstadoSector;
  estadoBar: EstadoSector;
  /**
   * US-7.2 · lo que el mozo escribió al devolver la comanda, tal cual, para
   * que el comensal sepa qué tiene que cambiar ("sólo me quedan tres gyozas").
   * Se limpia al reenviar: ya no describe lo que el mozo está por revisar.
   */
  motivoRechazo: string | null;
  /** Quién la devolvió, para que el comensal sepa con quién hablar. */
  rechazadoPorNombre: string | null;
  /** Si hay que rehacer la comanda entera o sólo una parte. Sale de lo marcado. */
  alcanceRechazo: AlcanceRechazo | null;
  /**
   * Los renglones que el mozo marcó al devolver la comanda. No se borran
   * solos: quedan señalados en la pantalla del comensal, que es quien corrige.
   */
  observaciones: ObservacionItem[];
  tiempoEstimado: number;
  totalBruto: number;
  descuentoJuego: number;
  montoDescuentoJuego: number;
  totalFinal: number;
  confirmadoPorId: string | null;
  juegoIntentado: boolean;
  timestampCreacion: string;
  items: PedidoItem[];
}

/** Mensaje de consulta o respuesta en la sala de chat de la mesa (US-6.2). */
export interface MensajeChat {
  id: string;
  mesaId: string;
  mesaNumero: number;
  remitenteId: string;
  remitenteNombre: string;
  remitenteRol: RolMensaje;
  texto: string;
  timestamp: string;
  leido: boolean;
}

