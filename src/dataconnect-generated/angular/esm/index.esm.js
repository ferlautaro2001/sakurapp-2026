import { createProductoRef, createUsuarioRef, createMesaRef, createPedidoRef, createEncuestaRef, updateEstadoUsuarioRef, updateEstadoMesaRef, updateProductoRef, updateActivoProductoRef, createEsperaRef, updateEstadoEsperaRef, confirmarPedidoRef, registrarIntentoJuegoRef, aplicarDescuentoJuegoRef, listProductosRef, listMesasRef, listUsuariosRef, listPedidosActivosRef, listPedidoItemsRef, listEsperaRef, listEncuestasRef } from '../../';
import { DataConnect, CallerSdkTypeEnum } from '@angular/fire/data-connect';
import { injectDataConnectQuery, injectDataConnectMutation } from '@tanstack-query-firebase/angular/data-connect';
import { inject, EnvironmentInjector } from '@angular/core';
export function injectCreateProducto(args, injector) {
  return injectDataConnectMutation(createProductoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectCreateUsuario(args, injector) {
  return injectDataConnectMutation(createUsuarioRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectCreateMesa(args, injector) {
  return injectDataConnectMutation(createMesaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectCreatePedido(args, injector) {
  return injectDataConnectMutation(createPedidoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectCreateEncuesta(args, injector) {
  return injectDataConnectMutation(createEncuestaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectUpdateEstadoUsuario(args, injector) {
  return injectDataConnectMutation(updateEstadoUsuarioRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectUpdateEstadoMesa(args, injector) {
  return injectDataConnectMutation(updateEstadoMesaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectUpdateProducto(args, injector) {
  return injectDataConnectMutation(updateProductoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectUpdateActivoProducto(args, injector) {
  return injectDataConnectMutation(updateActivoProductoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectCreateEspera(args, injector) {
  return injectDataConnectMutation(createEsperaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectUpdateEstadoEspera(args, injector) {
  return injectDataConnectMutation(updateEstadoEsperaRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectConfirmarPedido(args, injector) {
  return injectDataConnectMutation(confirmarPedidoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectRegistrarIntentoJuego(args, injector) {
  return injectDataConnectMutation(registrarIntentoJuegoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectAplicarDescuentoJuego(args, injector) {
  return injectDataConnectMutation(aplicarDescuentoJuegoRef, args, injector, CallerSdkTypeEnum.GeneratedAngular);
}

export function injectListProductos(options, injector) {
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

export function injectListMesas(options, injector) {
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

export function injectListUsuarios(options, injector) {
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

export function injectListPedidosActivos(options, injector) {
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

export function injectListPedidoItems(options, injector) {
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

export function injectListEspera(options, injector) {
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

export function injectListEncuestas(options, injector) {
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

