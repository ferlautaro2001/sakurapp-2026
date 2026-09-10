const { createProductoRef, createUsuarioRef, createMesaRef, createPedidoRef, createPedidoItemRef, createEncuestaRef, updateEstadoUsuarioRef, updateEstadoMesaRef, updateProductoRef, updateActivoProductoRef, createEsperaRef, updateEstadoEsperaRef, confirmarPedidoRef, registrarIntentoJuegoRef, aplicarDescuentoJuegoRef, listProductosRef, listMesasRef, listUsuariosRef, listPedidosActivosRef, listPedidoItemsRef, listEsperaRef, listEncuestasRef } = require('../');
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

exports.injectCreatePedidoItem = function injectCreatePedidoItem(args, injector) {
  return injectDataConnectMutation(createPedidoItemRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
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

exports.injectUpdateProducto = function injectUpdateProducto(args, injector) {
  return injectDataConnectMutation(updateProductoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectUpdateActivoProducto = function injectUpdateActivoProducto(args, injector) {
  return injectDataConnectMutation(updateActivoProductoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectCreateEspera = function injectCreateEspera(args, injector) {
  return injectDataConnectMutation(createEsperaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectUpdateEstadoEspera = function injectUpdateEstadoEspera(args, injector) {
  return injectDataConnectMutation(updateEstadoEsperaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectConfirmarPedido = function injectConfirmarPedido(args, injector) {
  return injectDataConnectMutation(confirmarPedidoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectRegistrarIntentoJuego = function injectRegistrarIntentoJuego(args, injector) {
  return injectDataConnectMutation(registrarIntentoJuegoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectAplicarDescuentoJuego = function injectAplicarDescuentoJuego(args, injector) {
  return injectDataConnectMutation(aplicarDescuentoJuegoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
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

exports.injectListPedidoItems = function injectListPedidoItems(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  listPedidoItemsRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectListEspera = function injectListEspera(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  listEsperaRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

exports.injectListEncuestas = function injectListEncuestas(options, injector) {
  const finalInjector = injector || inject(EnvironmentInjector);
  const dc = finalInjector.get(DataConnect);
  return injectDataConnectQuery(() => {
    const addOpn = options && options();
    return {
      queryFn: () =>  listEncuestasRef(dc),
      ...addOpn
    };
  }, finalInjector, CallerSdkTypeEnum.GeneratedAngular);
}

