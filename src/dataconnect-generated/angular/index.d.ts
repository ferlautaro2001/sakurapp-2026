import { ListProductosData, ListMesasData, ListUsuariosData, ListPedidosActivosData } from '../';
import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions} from '@angular/fire/data-connect';
import { CreateQueryResult} from '@tanstack/angular-query-experimental';
import { CreateDataConnectQueryResult, CreateDataConnectQueryOptions } from '@tanstack-query-firebase/angular/data-connect';
import { FirebaseError } from 'firebase/app';
import { Injector } from '@angular/core';

export type ListProductosOptions = () => Omit<CreateDataConnectQueryOptions<ListProductosData, undefined>, 'queryFn'>;
export function injectListProductos(options?: ListProductosOptions, injector?: Injector): CreateDataConnectQueryResult<ListProductosData, undefined>;

export type ListMesasOptions = () => Omit<CreateDataConnectQueryOptions<ListMesasData, undefined>, 'queryFn'>;
export function injectListMesas(options?: ListMesasOptions, injector?: Injector): CreateDataConnectQueryResult<ListMesasData, undefined>;

export type ListUsuariosOptions = () => Omit<CreateDataConnectQueryOptions<ListUsuariosData, undefined>, 'queryFn'>;
export function injectListUsuarios(options?: ListUsuariosOptions, injector?: Injector): CreateDataConnectQueryResult<ListUsuariosData, undefined>;

export type ListPedidosActivosOptions = () => Omit<CreateDataConnectQueryOptions<ListPedidosActivosData, undefined>, 'queryFn'>;
export function injectListPedidosActivos(options?: ListPedidosActivosOptions, injector?: Injector): CreateDataConnectQueryResult<ListPedidosActivosData, undefined>;
