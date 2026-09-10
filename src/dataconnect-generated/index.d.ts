import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export enum EstadoEspera {
  ESPERANDO = "ESPERANDO",
  ASIGNADO = "ASIGNADO",
  CANCELADO = "CANCELADO",
  FINALIZADO = "FINALIZADO",
};

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



export interface AplicarDescuentoJuegoData {
  pedido_update?: Pedido_Key | null;
}

export interface AplicarDescuentoJuegoVariables {
  id: UUIDString;
  descuentoJuego: number;
  montoDescuentoJuego: number;
  totalFinal: number;
}

export interface ConfirmarPedidoData {
  pedido_update?: Pedido_Key | null;
}

export interface ConfirmarPedidoVariables {
  id: UUIDString;
  estadoCocina: EstadoSector;
  estadoBar: EstadoSector;
  confirmadoPorId: UUIDString;
}

export interface Conversacion_Key {
  id: UUIDString;
  __typename?: 'Conversacion_Key';
}

export interface CreateEncuestaData {
  encuesta_insert: Encuesta_Key;
}

export interface CreateEncuestaVariables {
  clienteId: UUIDString;
  pedidoId: UUIDString;
  mesaId: UUIDString;
  calificacionMozo: number;
  nivelLimpieza: number;
  recomendaria: boolean;
  aspectoFavorito: string;
  comentarios?: string | null;
  timestamp: TimestampString;
}

export interface CreateEsperaData {
  espera_insert: Espera_Key;
}

export interface CreateEsperaVariables {
  clienteId: UUIDString;
}

export interface CreateMesaData {
  mesa_insert: Mesa_Key;
}

export interface CreateMesaVariables {
  numero: number;
  cantidadComensales: number;
  tipo: TipoMesa;
  estado: EstadoMesa;
  fotoUrl: string;
  qrCodeUrl: string;
}

export interface CreatePedidoData {
  pedido_insert: Pedido_Key;
}

export interface CreatePedidoVariables {
  mesaId: UUIDString;
  clienteId: UUIDString;
  estadoGlobal: EstadoPedido;
  tiempoEstimado: number;
  totalBruto: number;
  descuentoJuego: number;
  montoDescuentoJuego: number;
  porcentajePropina: number;
  montoPropina: number;
  totalFinal: number;
  timestampCreacion: TimestampString;
}

export interface CreateProductoData {
  producto_insert: Producto_Key;
}

export interface CreateProductoVariables {
  nombre: string;
  descripcion: string;
  precio: number;
  tiempoElaboracion: number;
  tipo: TipoProducto;
  sector: Sector;
  foto1: string;
  foto2: string;
  foto3: string;
}

export interface CreateUsuarioData {
  user_insert: User_Key;
}

export interface CreateUsuarioVariables {
  uid: string;
  nombre: string;
  apellido?: string | null;
  dni?: string | null;
  cuil?: string | null;
  email?: string | null;
  perfil: Perfil;
  fotoUrl: string;
  estado: EstadoUsuario;
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

export interface ListEncuestasData {
  encuestas: ({
    id: UUIDString;
    calificacionMozo: number;
    nivelLimpieza: number;
    recomendaria: boolean;
    aspectoFavorito: string;
    timestamp: TimestampString;
  } & Encuesta_Key)[];
}

export interface ListEsperaData {
  esperas: ({
    id: UUIDString;
    estado: EstadoEspera;
    timestamp: TimestampString;
    cliente: {
      id: UUIDString;
      nombre: string;
      apellido?: string | null;
      fotoUrl: string;
    } & User_Key;
    mesaAsignada?: {
      id: UUIDString;
      numero: number;
    } & Mesa_Key;
  } & Espera_Key)[];
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

export interface ListPedidoItemsData {
  pedidoItems: ({
    id: UUIDString;
    pedido: {
      id: UUIDString;
    } & Pedido_Key;
    producto: {
      id: UUIDString;
      nombre: string;
      tipo: TipoProducto;
    } & Producto_Key;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    sector: Sector;
  } & PedidoItem_Key)[];
}

export interface ListPedidosActivosData {
  pedidos: ({
    id: UUIDString;
    mesa: {
      id: UUIDString;
      numero: number;
    } & Mesa_Key;
    cliente: {
      id: UUIDString;
      uid: string;
      nombre: string;
      apellido?: string | null;
    } & User_Key;
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

export interface RegistrarIntentoJuegoData {
  intentoJuego_insert: IntentoJuego_Key;
}

export interface RegistrarIntentoJuegoVariables {
  pedidoId: UUIDString;
  clienteId: UUIDString;
  gano: boolean;
  descuentoOtorgado: number;
}

export interface UpdateActivoProductoData {
  producto_update?: Producto_Key | null;
}

export interface UpdateActivoProductoVariables {
  id: UUIDString;
  activo: boolean;
}

export interface UpdateEstadoEsperaData {
  espera_update?: Espera_Key | null;
}

export interface UpdateEstadoEsperaVariables {
  id: UUIDString;
  estado: EstadoEspera;
}

export interface AsignarMesaClienteData {
  espera_update?: Espera_Key | null;
  mesa_update?: Mesa_Key | null;
}

export interface AsignarMesaClienteVariables {
  esperaId: UUIDString;
  mesaId: UUIDString;
  clienteId: UUIDString;
}


export interface UpdateEstadoMesaData {
  mesa_update?: Mesa_Key | null;
}

export interface UpdateEstadoMesaVariables {
  id: UUIDString;
  estado: EstadoMesa;
}

export interface UpdateEstadoUsuarioData {
  user_update?: User_Key | null;
}

export interface UpdateEstadoUsuarioVariables {
  id: UUIDString;
  estado: EstadoUsuario;
}

export interface UpdateProductoData {
  producto_update?: Producto_Key | null;
}

export interface UpdateProductoVariables {
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
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateProductoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProductoVariables): MutationRef<CreateProductoData, CreateProductoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateProductoVariables): MutationRef<CreateProductoData, CreateProductoVariables>;
  operationName: string;
}
export const createProductoRef: CreateProductoRef;

export function createProducto(vars: CreateProductoVariables): MutationPromise<CreateProductoData, CreateProductoVariables>;
export function createProducto(dc: DataConnect, vars: CreateProductoVariables): MutationPromise<CreateProductoData, CreateProductoVariables>;

interface CreateUsuarioRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUsuarioVariables): MutationRef<CreateUsuarioData, CreateUsuarioVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUsuarioVariables): MutationRef<CreateUsuarioData, CreateUsuarioVariables>;
  operationName: string;
}
export const createUsuarioRef: CreateUsuarioRef;

export function createUsuario(vars: CreateUsuarioVariables): MutationPromise<CreateUsuarioData, CreateUsuarioVariables>;
export function createUsuario(dc: DataConnect, vars: CreateUsuarioVariables): MutationPromise<CreateUsuarioData, CreateUsuarioVariables>;

interface CreateMesaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMesaVariables): MutationRef<CreateMesaData, CreateMesaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateMesaVariables): MutationRef<CreateMesaData, CreateMesaVariables>;
  operationName: string;
}
export const createMesaRef: CreateMesaRef;

export function createMesa(vars: CreateMesaVariables): MutationPromise<CreateMesaData, CreateMesaVariables>;
export function createMesa(dc: DataConnect, vars: CreateMesaVariables): MutationPromise<CreateMesaData, CreateMesaVariables>;

interface CreatePedidoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePedidoVariables): MutationRef<CreatePedidoData, CreatePedidoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePedidoVariables): MutationRef<CreatePedidoData, CreatePedidoVariables>;
  operationName: string;
}
export const createPedidoRef: CreatePedidoRef;

export function createPedido(vars: CreatePedidoVariables): MutationPromise<CreatePedidoData, CreatePedidoVariables>;
export function createPedido(dc: DataConnect, vars: CreatePedidoVariables): MutationPromise<CreatePedidoData, CreatePedidoVariables>;

interface CreateEncuestaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEncuestaVariables): MutationRef<CreateEncuestaData, CreateEncuestaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEncuestaVariables): MutationRef<CreateEncuestaData, CreateEncuestaVariables>;
  operationName: string;
}
export const createEncuestaRef: CreateEncuestaRef;

export function createEncuesta(vars: CreateEncuestaVariables): MutationPromise<CreateEncuestaData, CreateEncuestaVariables>;
export function createEncuesta(dc: DataConnect, vars: CreateEncuestaVariables): MutationPromise<CreateEncuestaData, CreateEncuestaVariables>;

interface UpdateEstadoUsuarioRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEstadoUsuarioVariables): MutationRef<UpdateEstadoUsuarioData, UpdateEstadoUsuarioVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateEstadoUsuarioVariables): MutationRef<UpdateEstadoUsuarioData, UpdateEstadoUsuarioVariables>;
  operationName: string;
}
export const updateEstadoUsuarioRef: UpdateEstadoUsuarioRef;

export function updateEstadoUsuario(vars: UpdateEstadoUsuarioVariables): MutationPromise<UpdateEstadoUsuarioData, UpdateEstadoUsuarioVariables>;
export function updateEstadoUsuario(dc: DataConnect, vars: UpdateEstadoUsuarioVariables): MutationPromise<UpdateEstadoUsuarioData, UpdateEstadoUsuarioVariables>;

interface UpdateEstadoMesaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEstadoMesaVariables): MutationRef<UpdateEstadoMesaData, UpdateEstadoMesaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateEstadoMesaVariables): MutationRef<UpdateEstadoMesaData, UpdateEstadoMesaVariables>;
  operationName: string;
}
export const updateEstadoMesaRef: UpdateEstadoMesaRef;

export function updateEstadoMesa(vars: UpdateEstadoMesaVariables): MutationPromise<UpdateEstadoMesaData, UpdateEstadoMesaVariables>;
export function updateEstadoMesa(dc: DataConnect, vars: UpdateEstadoMesaVariables): MutationPromise<UpdateEstadoMesaData, UpdateEstadoMesaVariables>;

interface UpdateProductoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProductoVariables): MutationRef<UpdateProductoData, UpdateProductoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateProductoVariables): MutationRef<UpdateProductoData, UpdateProductoVariables>;
  operationName: string;
}
export const updateProductoRef: UpdateProductoRef;

export function updateProducto(vars: UpdateProductoVariables): MutationPromise<UpdateProductoData, UpdateProductoVariables>;
export function updateProducto(dc: DataConnect, vars: UpdateProductoVariables): MutationPromise<UpdateProductoData, UpdateProductoVariables>;

interface UpdateActivoProductoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateActivoProductoVariables): MutationRef<UpdateActivoProductoData, UpdateActivoProductoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateActivoProductoVariables): MutationRef<UpdateActivoProductoData, UpdateActivoProductoVariables>;
  operationName: string;
}
export const updateActivoProductoRef: UpdateActivoProductoRef;

export function updateActivoProducto(vars: UpdateActivoProductoVariables): MutationPromise<UpdateActivoProductoData, UpdateActivoProductoVariables>;
export function updateActivoProducto(dc: DataConnect, vars: UpdateActivoProductoVariables): MutationPromise<UpdateActivoProductoData, UpdateActivoProductoVariables>;

interface CreateEsperaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEsperaVariables): MutationRef<CreateEsperaData, CreateEsperaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEsperaVariables): MutationRef<CreateEsperaData, CreateEsperaVariables>;
  operationName: string;
}
export const createEsperaRef: CreateEsperaRef;

export function createEspera(vars: CreateEsperaVariables): MutationPromise<CreateEsperaData, CreateEsperaVariables>;
export function createEspera(dc: DataConnect, vars: CreateEsperaVariables): MutationPromise<CreateEsperaData, CreateEsperaVariables>;

interface UpdateEstadoEsperaRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEstadoEsperaVariables): MutationRef<UpdateEstadoEsperaData, UpdateEstadoEsperaVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateEstadoEsperaVariables): MutationRef<UpdateEstadoEsperaData, UpdateEstadoEsperaVariables>;
  operationName: string;
}
export const updateEstadoEsperaRef: UpdateEstadoEsperaRef;

export function updateEstadoEspera(vars: UpdateEstadoEsperaVariables): MutationPromise<UpdateEstadoEsperaData, UpdateEstadoEsperaVariables>;
export function updateEstadoEspera(dc: DataConnect, vars: UpdateEstadoEsperaVariables): MutationPromise<UpdateEstadoEsperaData, UpdateEstadoEsperaVariables>;

interface AsignarMesaClienteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AsignarMesaClienteVariables): MutationRef<AsignarMesaClienteData, AsignarMesaClienteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AsignarMesaClienteVariables): MutationRef<AsignarMesaClienteData, AsignarMesaClienteVariables>;
  operationName: string;
}
export const asignarMesaClienteRef: AsignarMesaClienteRef;

export function asignarMesaCliente(vars: AsignarMesaClienteVariables): MutationPromise<AsignarMesaClienteData, AsignarMesaClienteVariables>;
export function asignarMesaCliente(dc: DataConnect, vars: AsignarMesaClienteVariables): MutationPromise<AsignarMesaClienteData, AsignarMesaClienteVariables>;


interface ConfirmarPedidoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ConfirmarPedidoVariables): MutationRef<ConfirmarPedidoData, ConfirmarPedidoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ConfirmarPedidoVariables): MutationRef<ConfirmarPedidoData, ConfirmarPedidoVariables>;
  operationName: string;
}
export const confirmarPedidoRef: ConfirmarPedidoRef;

export function confirmarPedido(vars: ConfirmarPedidoVariables): MutationPromise<ConfirmarPedidoData, ConfirmarPedidoVariables>;
export function confirmarPedido(dc: DataConnect, vars: ConfirmarPedidoVariables): MutationPromise<ConfirmarPedidoData, ConfirmarPedidoVariables>;

interface RegistrarIntentoJuegoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegistrarIntentoJuegoVariables): MutationRef<RegistrarIntentoJuegoData, RegistrarIntentoJuegoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RegistrarIntentoJuegoVariables): MutationRef<RegistrarIntentoJuegoData, RegistrarIntentoJuegoVariables>;
  operationName: string;
}
export const registrarIntentoJuegoRef: RegistrarIntentoJuegoRef;

export function registrarIntentoJuego(vars: RegistrarIntentoJuegoVariables): MutationPromise<RegistrarIntentoJuegoData, RegistrarIntentoJuegoVariables>;
export function registrarIntentoJuego(dc: DataConnect, vars: RegistrarIntentoJuegoVariables): MutationPromise<RegistrarIntentoJuegoData, RegistrarIntentoJuegoVariables>;

interface AplicarDescuentoJuegoRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AplicarDescuentoJuegoVariables): MutationRef<AplicarDescuentoJuegoData, AplicarDescuentoJuegoVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AplicarDescuentoJuegoVariables): MutationRef<AplicarDescuentoJuegoData, AplicarDescuentoJuegoVariables>;
  operationName: string;
}
export const aplicarDescuentoJuegoRef: AplicarDescuentoJuegoRef;

export function aplicarDescuentoJuego(vars: AplicarDescuentoJuegoVariables): MutationPromise<AplicarDescuentoJuegoData, AplicarDescuentoJuegoVariables>;
export function aplicarDescuentoJuego(dc: DataConnect, vars: AplicarDescuentoJuegoVariables): MutationPromise<AplicarDescuentoJuegoData, AplicarDescuentoJuegoVariables>;

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

interface ListPedidoItemsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPedidoItemsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPedidoItemsData, undefined>;
  operationName: string;
}
export const listPedidoItemsRef: ListPedidoItemsRef;

export function listPedidoItems(options?: ExecuteQueryOptions): QueryPromise<ListPedidoItemsData, undefined>;
export function listPedidoItems(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPedidoItemsData, undefined>;

interface ListEsperaRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEsperaData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListEsperaData, undefined>;
  operationName: string;
}
export const listEsperaRef: ListEsperaRef;

export function listEspera(options?: ExecuteQueryOptions): QueryPromise<ListEsperaData, undefined>;
export function listEspera(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListEsperaData, undefined>;

interface ListEncuestasRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEncuestasData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListEncuestasData, undefined>;
  operationName: string;
}
export const listEncuestasRef: ListEncuestasRef;

export function listEncuestas(options?: ExecuteQueryOptions): QueryPromise<ListEncuestasData, undefined>;
export function listEncuestas(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListEncuestasData, undefined>;

