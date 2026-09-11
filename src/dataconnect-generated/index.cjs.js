const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const EstadoEspera = {
  ESPERANDO: "ESPERANDO",
  ASIGNADO: "ASIGNADO",
  CANCELADO: "CANCELADO",
  FINALIZADO: "FINALIZADO",
}
exports.EstadoEspera = EstadoEspera;

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

const createPedidoItemRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePedidoItem', inputVars);
}
createPedidoItemRef.operationName = 'CreatePedidoItem';
exports.createPedidoItemRef = createPedidoItemRef;

exports.createPedidoItem = function createPedidoItem(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createPedidoItemRef(dcInstance, inputVars));
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

const updateEstadoUsuarioRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateEstadoUsuario', inputVars);
}
updateEstadoUsuarioRef.operationName = 'UpdateEstadoUsuario';
exports.updateEstadoUsuarioRef = updateEstadoUsuarioRef;

exports.updateEstadoUsuario = function updateEstadoUsuario(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateEstadoUsuarioRef(dcInstance, inputVars));
}
;

const updateEstadoMesaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateEstadoMesa', inputVars);
}
updateEstadoMesaRef.operationName = 'UpdateEstadoMesa';
exports.updateEstadoMesaRef = updateEstadoMesaRef;

exports.updateEstadoMesa = function updateEstadoMesa(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateEstadoMesaRef(dcInstance, inputVars));
}
;

const updateProductoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateProducto', inputVars);
}
updateProductoRef.operationName = 'UpdateProducto';
exports.updateProductoRef = updateProductoRef;

exports.updateProducto = function updateProducto(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateProductoRef(dcInstance, inputVars));
}
;

const updateActivoProductoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateActivoProducto', inputVars);
}
updateActivoProductoRef.operationName = 'UpdateActivoProducto';
exports.updateActivoProductoRef = updateActivoProductoRef;

exports.updateActivoProducto = function updateActivoProducto(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateActivoProductoRef(dcInstance, inputVars));
}
;

const createEsperaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateEspera', inputVars);
}
createEsperaRef.operationName = 'CreateEspera';
exports.createEsperaRef = createEsperaRef;

exports.createEspera = function createEspera(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createEsperaRef(dcInstance, inputVars));
}
;

const updateEstadoEsperaRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateEstadoEspera', inputVars);
}
updateEstadoEsperaRef.operationName = 'UpdateEstadoEspera';
exports.updateEstadoEsperaRef = updateEstadoEsperaRef;

exports.updateEstadoEspera = function updateEstadoEspera(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateEstadoEsperaRef(dcInstance, inputVars));
}
;

const confirmarPedidoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ConfirmarPedido', inputVars);
}
confirmarPedidoRef.operationName = 'ConfirmarPedido';
exports.confirmarPedidoRef = confirmarPedidoRef;

exports.confirmarPedido = function confirmarPedido(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(confirmarPedidoRef(dcInstance, inputVars));
}
;

const registrarIntentoJuegoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegistrarIntentoJuego', inputVars);
}
registrarIntentoJuegoRef.operationName = 'RegistrarIntentoJuego';
exports.registrarIntentoJuegoRef = registrarIntentoJuegoRef;

exports.registrarIntentoJuego = function registrarIntentoJuego(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(registrarIntentoJuegoRef(dcInstance, inputVars));
}
;

const aplicarDescuentoJuegoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AplicarDescuentoJuego', inputVars);
}
aplicarDescuentoJuegoRef.operationName = 'AplicarDescuentoJuego';
exports.aplicarDescuentoJuegoRef = aplicarDescuentoJuegoRef;

exports.aplicarDescuentoJuego = function aplicarDescuentoJuego(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(aplicarDescuentoJuegoRef(dcInstance, inputVars));
}
;

const asignarMesaClienteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AsignarMesaCliente', inputVars);
}
asignarMesaClienteRef.operationName = 'AsignarMesaCliente';
exports.asignarMesaClienteRef = asignarMesaClienteRef;

exports.asignarMesaCliente = function asignarMesaCliente(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(asignarMesaClienteRef(dcInstance, inputVars));
}
;

const rechazarPedidoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RechazarPedido', inputVars);
}
rechazarPedidoRef.operationName = 'RechazarPedido';
exports.rechazarPedidoRef = rechazarPedidoRef;

exports.rechazarPedido = function rechazarPedido(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(rechazarPedidoRef(dcInstance, inputVars));
}
;

const reenviarPedidoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReenviarPedido', inputVars);
}
reenviarPedidoRef.operationName = 'ReenviarPedido';
exports.reenviarPedidoRef = reenviarPedidoRef;

exports.reenviarPedido = function reenviarPedido(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(reenviarPedidoRef(dcInstance, inputVars));
}
;

const borrarItemsPedidoRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BorrarItemsPedido', inputVars);
}
borrarItemsPedidoRef.operationName = 'BorrarItemsPedido';
exports.borrarItemsPedidoRef = borrarItemsPedidoRef;

exports.borrarItemsPedido = function borrarItemsPedido(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(borrarItemsPedidoRef(dcInstance, inputVars));
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

const listPedidoItemsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPedidoItems');
}
listPedidoItemsRef.operationName = 'ListPedidoItems';
exports.listPedidoItemsRef = listPedidoItemsRef;

exports.listPedidoItems = function listPedidoItems(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPedidoItemsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listEsperaRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEspera');
}
listEsperaRef.operationName = 'ListEspera';
exports.listEsperaRef = listEsperaRef;

exports.listEspera = function listEspera(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listEsperaRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listEncuestasRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListEncuestas');
}
listEncuestasRef.operationName = 'ListEncuestas';
exports.listEncuestasRef = listEncuestasRef;

exports.listEncuestas = function listEncuestas(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listEncuestasRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
