import { createProductoRef, createUsuarioRef, createMesaRef, createPedidoRef, createEncuestaRef, listProductosRef, listMesasRef, listUsuariosRef, listPedidosActivosRef } from '../../';
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

