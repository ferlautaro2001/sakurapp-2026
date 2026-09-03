const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const EstadoMesa = {
  VACIA: "VACIA",
  OCUPADA: "OCUPADA",
}
exports.EstadoMesa = EstadoMesa;

const EstadoPedido = {
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
exports.EstadoPedido = EstadoPedido;

const EstadoSector = {
  NO_APLICA: "NO_APLICA",
  PENDIENTE: "PENDIENTE",
  EN_PREPARACION: "EN_PREPARACION",
  LISTO: "LISTO",
}
exports.EstadoSector = EstadoSector;

const EstadoUsuario = {
  PENDIENTE: "PENDIENTE",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
}
exports.EstadoUsuario = EstadoUsuario;

const Perfil = {
  DUENO: "DUENO",
  SUPERVISOR: "SUPERVISOR",
  METRE: "METRE",
  MOZO: "MOZO",
  COCINERO: "COCINERO",
  CANTINERO: "CANTINERO",
  CLIENTE_REGISTRADO: "CLIENTE_REGISTRADO",
  CLIENTE_ANONIMO: "CLIENTE_ANONIMO",
}
exports.Perfil = Perfil;

const Sector = {
  COCINA: "COCINA",
  BAR: "BAR",
}
exports.Sector = Sector;

const TipoMesa = {
  VIP: "VIP",
  ESTANDAR: "ESTANDAR",
  MOVILIDAD_REDUCIDA: "MOVILIDAD_REDUCIDA",
}
exports.TipoMesa = TipoMesa;

const TipoProducto = {
  COMIDA: "COMIDA",
  BEBIDA: "BEBIDA",
  POSTRE: "POSTRE",
}
exports.TipoProducto = TipoProducto;

const connectorConfig = {
  connector: 'example',
  service: 'sakurapp',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const createProductoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateProducto', inputVars);
}
createProductoRef.operationName = 'CreateProducto';
exports.createProductoRef = createProductoRef;

exports.createProducto = function createProducto(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createProductoRef(dcInstance, inputVars));
}
;

const createUsuarioRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUsuario', inputVars);
}
createUsuarioRef.operationName = 'CreateUsuario';
exports.createUsuarioRef = createUsuarioRef;

exports.createUsuario = function createUsuario(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createUsuarioRef(dcInstance, inputVars));
}
;

const createMesaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMesa', inputVars);
}
createMesaRef.operationName = 'CreateMesa';
exports.createMesaRef = createMesaRef;

exports.createMesa = function createMesa(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createMesaRef(dcInstance, inputVars));
}
;

const createPedidoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePedido', inputVars);
}
createPedidoRef.operationName = 'CreatePedido';
exports.createPedidoRef = createPedidoRef;

exports.createPedido = function createPedido(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createPedidoRef(dcInstance, inputVars));
}
;

const createEncuestaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEncuesta', inputVars);
}
createEncuestaRef.operationName = 'CreateEncuesta';
exports.createEncuestaRef = createEncuestaRef;

exports.createEncuesta = function createEncuesta(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createEncuestaRef(dcInstance, inputVars));
}
;

const listProductosRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProductos');
}
listProductosRef.operationName = 'ListProductos';
exports.listProductosRef = listProductosRef;

exports.listProductos = function listProductos(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listProductosRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listMesasRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMesas');
}
listMesasRef.operationName = 'ListMesas';
exports.listMesasRef = listMesasRef;

exports.listMesas = function listMesas(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listMesasRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listUsuariosRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUsuarios');
}
listUsuariosRef.operationName = 'ListUsuarios';
exports.listUsuariosRef = listUsuariosRef;

exports.listUsuarios = function listUsuarios(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listUsuariosRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listPedidosActivosRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPedidosActivos');
}
listPedidosActivosRef.operationName = 'ListPedidosActivos';
exports.listPedidosActivosRef = listPedidosActivosRef;

exports.listPedidosActivos = function listPedidosActivos(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPedidosActivosRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
