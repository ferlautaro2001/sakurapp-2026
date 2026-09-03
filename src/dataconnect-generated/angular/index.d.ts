import { CreateProductoData, CreateProductoVariables, CreateUsuarioData, CreateUsuarioVariables, CreateMesaData, CreateMesaVariables, CreatePedidoData, CreatePedidoVariables, CreateEncuestaData, CreateEncuestaVariables, ListProductosData, ListMesasData, ListUsuariosData, ListPedidosActivosData } from '../';
import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise} from '@angular/fire/data-connect';
import { CreateQueryResult, CreateMutationResult} from '@tanstack/angular-query-experimental';
import { CreateDataConnectQueryResult, CreateDataConnectQueryOptions, CreateDataConnectMutationResult, DataConnectMutationOptionsUndefinedMutationFn } from '@tanstack-query-firebase/angular/data-connect';
import { FirebaseError } from 'firebase/app';
import { Injector } from '@angular/core';

type CreateProductoOptions = DataConnectMutationOptionsUndefinedMutationFn<CreateProductoData, FirebaseError, CreateProductoVariables>;
export function injectCreateProducto(options?: CreateProductoOptions, injector?: Injector): CreateDataConnectMutationResult<CreateProductoData, CreateProductoVariables, CreateProductoVariables>;

type CreateUsuarioOptions = DataConnectMutationOptionsUndefinedMutationFn<CreateUsuarioData, FirebaseError, CreateUsuarioVariables>;
export function injectCreateUsuario(options?: CreateUsuarioOptions, injector?: Injector): CreateDataConnectMutationResult<CreateUsuarioData, CreateUsuarioVariables, CreateUsuarioVariables>;

type CreateMesaOptions = DataConnectMutationOptionsUndefinedMutationFn<CreateMesaData, FirebaseError, CreateMesaVariables>;
export function injectCreateMesa(options?: CreateMesaOptions, injector?: Injector): CreateDataConnectMutationResult<CreateMesaData, CreateMesaVariables, CreateMesaVariables>;

type CreatePedidoOptions = DataConnectMutationOptionsUndefinedMutationFn<CreatePedidoData, FirebaseError, CreatePedidoVariables>;
export function injectCreatePedido(options?: CreatePedidoOptions, injector?: Injector): CreateDataConnectMutationResult<CreatePedidoData, CreatePedidoVariables, CreatePedidoVariables>;

type CreateEncuestaOptions = DataConnectMutationOptionsUndefinedMutationFn<CreateEncuestaData, FirebaseError, CreateEncuestaVariables>;
export function injectCreateEncuesta(options?: CreateEncuestaOptions, injector?: Injector): CreateDataConnectMutationResult<CreateEncuestaData, CreateEncuestaVariables, CreateEncuestaVariables>;

export type ListProductosOptions = () => Omit<CreateDataConnectQueryOptions<ListProductosData, undefined>, 'queryFn'>;
export function injectListProductos(options?: ListProductosOptions, injector?: Injector): CreateDataConnectQueryResult<ListProductosData, undefined>;

export type ListMesasOptions = () => Omit<CreateDataConnectQueryOptions<ListMesasData, undefined>, 'queryFn'>;
export function injectListMesas(options?: ListMesasOptions, injector?: Injector): CreateDataConnectQueryResult<ListMesasData, undefined>;

export type ListUsuariosOptions = () => Omit<CreateDataConnectQueryOptions<ListUsuariosData, undefined>, 'queryFn'>;
export function injectListUsuarios(options?: ListUsuariosOptions, injector?: Injector): CreateDataConnectQueryResult<ListUsuariosData, undefined>;

export type ListPedidosActivosOptions = () => Omit<CreateDataConnectQueryOptions<ListPedidosActivosData, undefined>, 'queryFn'>;
export function injectListPedidosActivos(options?: ListPedidosActivosOptions, injector?: Injector): CreateDataConnectQueryResult<ListPedidosActivosData, undefined>;
