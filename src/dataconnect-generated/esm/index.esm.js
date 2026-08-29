import { queryRef, executeQuery, validateArgsWithOptions, validateArgs } from 'firebase/data-connect';

export const EstadoMesa = {
  VACIA: "VACIA",
  OCUPADA: "OCUPADA",
}

export const EstadoPedido = {
  SELECCIONANDO: "SELECCIONANDO",
  PENDIENTE_CONFIRMACION: "PENDIENTE_CONFIRMACION",
  RECHAZADO: "RECHAZADO",
  CONFIRMADO: "CONFIRMADO",
  EN_PREPARACION: "EN_PREPARACION",
  LISTO: "LISTO",
  ENTREGADO: "ENTREGADO",
  RECIBIDO: "RECIBIDO",
  CUENTA_SOLICITADA: "CUENTA_SOLICITADA",
  PAGO_PENDIENTE: "PAGO_PENDIENTE",
  CERRADO: "CERRADO",
}

export const EstadoSector = {
  NO_APLICA: "NO_APLICA",
  PENDIENTE: "PENDIENTE",
  EN_PREPARACION: "EN_PREPARACION",
  LISTO: "LISTO",
}

export const EstadoUsuario = {
  PENDIENTE: "PENDIENTE",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
}

export const Perfil = {
  DUENO: "DUENO",
  SUPERVISOR: "SUPERVISOR",
  METRE: "METRE",
  MOZO: "MOZO",
  COCINERO: "COCINERO",
  CANTINERO: "CANTINERO",
  CLIENTE_REGISTRADO: "CLIENTE_REGISTRADO",
  CLIENTE_ANONIMO: "CLIENTE_ANONIMO",
}

export const Sector = {
  COCINA: "COCINA",
  BAR: "BAR",
}

export const TipoMesa = {
  VIP: "VIP",
  ESTANDAR: "ESTANDAR",
  MOVILIDAD_REDUCIDA: "MOVILIDAD_REDUCIDA",
}

export const TipoProducto = {
  COMIDA: "COMIDA",
  BEBIDA: "BEBIDA",
  POSTRE: "POSTRE",
}

export const connectorConfig = {
  connector: 'example',
  service: 'sakurapp',
  location: 'us-east4'
};
export const listProductosRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProductos');
}
listProductosRef.operationName = 'ListProductos';

export function listProductos(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listProductosRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listMesasRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMesas');
}
listMesasRef.operationName = 'ListMesas';

export function listMesas(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listMesasRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listUsuariosRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUsuarios');
}
listUsuariosRef.operationName = 'ListUsuarios';

export function listUsuarios(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listUsuariosRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listPedidosActivosRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPedidosActivos');
}
listPedidosActivosRef.operationName = 'ListPedidosActivos';

export function listPedidosActivos(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPedidosActivosRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

