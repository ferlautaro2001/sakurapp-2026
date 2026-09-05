const { createProductoRef, createUsuarioRef, createMesaRef, createPedidoRef, createEncuestaRef, updateEstadoUsuarioRef, updateEstadoMesaRef, listProductosRef, listMesasRef, listUsuariosRef, listPedidosActivosRef } = require('../');
const { DataConnect, CallerSdkTypeEnum } = require('@angular/fire/data-connect');
const { injectDataConnectQuery, injectDataConnectMutation } = require('@tanstack-query-firebase/angular/data-connect');
const { inject, EnvironmentInjector } = require('@angular/core');

exports.injectCreateProducto = function injectCreateProducto(args, injector) {
  return injectDataConnectMutation(createProductoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectCreateUsuario = function injectCreateUsuario(args, injector) {
  return injectDataConnectMutation(createUsuarioRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectCreateMesa = function injectCreateMesa(args, injector) {
  return injectDataConnectMutation(createMesaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectCreatePedido = function injectCreatePedido(args, injector) {
  return injectDataConnectMutation(createPedidoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectCreateEncuesta = function injectCreateEncuesta(args, injector) {
  return injectDataConnectMutation(createEncuestaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectUpdateEstadoUsuario = function injectUpdateEstadoUsuario(args, injector) {
  return injectDataConnectMutation(updateEstadoUsuarioRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectUpdateEstadoMesa = function injectUpdateEstadoMesa(args, injector) {
  return injectDataConnectMutation(updateEstadoMesaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectListProductos = function injectListProductos(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  listProductosRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectListMesas = function injectListMesas(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  listMesasRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectListUsuarios = function injectListUsuarios(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  listUsuariosRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectListPedidosActivos = function injectListPedidosActivos(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  listPedidosActivosRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

