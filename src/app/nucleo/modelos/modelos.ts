import { EstadoEspera, EstadoMesa, EstadoUsuario, Perfil, Sector, TipoMesa, TipoProducto } from './enums';

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
