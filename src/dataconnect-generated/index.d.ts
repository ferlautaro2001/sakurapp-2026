import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export enum EstadoMesa {
  VACIA = "VACIA",
  OCUPADA = "OCUPADA",
};

export enum EstadoPedido {
  SELECCIONANDO = "SELECCIONANDO",
  PENDIENTE_CONFIRMACION = "PENDIENTE_CONFIRMACION",
  RECHAZADO = "RECHAZADO",
  CONFIRMADO = "CONFIRMADO",
  EN_PREPARACION = "EN_PREPARACION",
  LISTO = "LISTO",
  ENTREGADO = "ENTREGADO",
  RECIBIDO = "RECIBIDO",
  CUENTA_SOLICITADA = "CUENTA_SOLICITADA",
  PAGO_PENDIENTE = "PAGO_PENDIENTE",
  CERRADO = "CERRADO",
};

export enum EstadoSector {
  NO_APLICA = "NO_APLICA",
  PENDIENTE = "PENDIENTE",
  EN_PREPARACION = "EN_PREPARACION",
  LISTO = "LISTO",
};

export enum EstadoUsuario {
  PENDIENTE = "PENDIENTE",
  APROBADO = "APROBADO",
  RECHAZADO = "RECHAZADO",
};

export enum Perfil {
  DUENO = "DUENO",
  SUPERVISOR = "SUPERVISOR",
  METRE = "METRE",
  MOZO = "MOZO",
  COCINERO = "COCINERO",
  CANTINERO = "CANTINERO",
  CLIENTE_REGISTRADO = "CLIENTE_REGISTRADO",
  CLIENTE_ANONIMO = "CLIENTE_ANONIMO",
};

export enum Sector {
  COCINA = "COCINA",
  BAR = "BAR",
};

export enum TipoMesa {
  VIP = "VIP",
  ESTANDAR = "ESTANDAR",
  MOVILIDAD_REDUCIDA = "MOVILIDAD_REDUCIDA",
};

export enum TipoProducto {
  COMIDA = "COMIDA",
  BEBIDA = "BEBIDA",
  POSTRE = "POSTRE",
};



export interface Conversacion_Key {
  id: UUIDString;
  __typename?: 'Conversacion_Key';
}

export interface Encuesta_Key {
  id: UUIDString;
  __typename?: 'Encuesta_Key';
}

export interface Espera_Key {
  id: UUIDString;
  __typename?: 'Espera_Key';
}

export interface IntentoJuego_Key {
  id: UUIDString;
  __typename?: 'IntentoJuego_Key';
}

export interface ListMesasData {
  mesas: ({
    id: UUIDString;
    numero: number;
    cantidadComensales: number;
    tipo: TipoMesa;
    estado: EstadoMesa;
    fotoUrl: string;
    qrCodeUrl: string;
    clienteActual?: {
      id: UUIDString;
      nombre: string;
      apellido?: string | null;
      perfil: Perfil;
    } & User_Key;
  } & Mesa_Key)[];
}

export interface ListPedidosActivosData {
  pedidos: ({
    id: UUIDString;
    mesa: {
      numero: number;
    };
    cliente: {
      nombre: string;
      apellido?: string | null;
    };
    estadoGlobal: EstadoPedido;
    estadoCocina: EstadoSector;
    estadoBar: EstadoSector;
    tiempoEstimado: number;
    totalFinal: number;
    timestampCreacion: TimestampString;
  } & Pedido_Key)[];
}

export interface ListProductosData {
  productos: ({
    id: UUIDString;
    nombre: string;
    descripcion: string;
    precio: number;
    tiempoElaboracion: number;
    tipo: TipoProducto;
    sector: Sector;
    foto1: string;
    foto2: string;
    foto3: string;
    activo: boolean;
  } & Producto_Key)[];
}

export interface ListUsuariosData {
  users: ({
    id: UUIDString;
    uid: string;
    nombre: string;
    apellido?: string | null;
    dni?: string | null;
    cuil?: string | null;
    email?: string | null;
    perfil: Perfil;
    fotoUrl: string;
    estado: EstadoUsuario;
    createdAt: TimestampString;
  } & User_Key)[];
}

export interface Mensaje_Key {
  id: UUIDString;
  __typename?: 'Mensaje_Key';
}

export interface Mesa_Key {
  id: UUIDString;
  __typename?: 'Mesa_Key';
}

export interface PedidoItem_Key {
  id: UUIDString;
  __typename?: 'PedidoItem_Key';
}

export interface Pedido_Key {
  id: UUIDString;
  __typename?: 'Pedido_Key';
}

export interface Producto_Key {
  id: UUIDString;
  __typename?: 'Producto_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface ListProductosRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductosData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProductosData, undefined>;
  operationName: string;
}
export const listProductosRef: ListProductosRef;

export function listProductos(options?: ExecuteQueryOptions): QueryPromise<ListProductosData, undefined>;
export function listProductos(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProductosData, undefined>;

interface ListMesasRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMesasData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMesasData, undefined>;
  operationName: string;
}
export const listMesasRef: ListMesasRef;

export function listMesas(options?: ExecuteQueryOptions): QueryPromise<ListMesasData, undefined>;
export function listMesas(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMesasData, undefined>;

interface ListUsuariosRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsuariosData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsuariosData, undefined>;
  operationName: string;
}
export const listUsuariosRef: ListUsuariosRef;

export function listUsuarios(options?: ExecuteQueryOptions): QueryPromise<ListUsuariosData, undefined>;
export function listUsuarios(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsuariosData, undefined>;

interface ListPedidosActivosRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPedidosActivosData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPedidosActivosData, undefined>;
  operationName: string;
}
export const listPedidosActivosRef: ListPedidosActivosRef;

export function listPedidosActivos(options?: ExecuteQueryOptions): QueryPromise<ListPedidosActivosData, undefined>;
export function listPedidosActivos(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPedidosActivosData, undefined>;

