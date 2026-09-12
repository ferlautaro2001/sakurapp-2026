# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `Angular README`, you can find it at [`dataconnect-generated/angular/README.md`](./angular/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListProductos*](#listproductos)
  - [*ListMesas*](#listmesas)
  - [*ListUsuarios*](#listusuarios)
  - [*ListPedidosActivos*](#listpedidosactivos)
  - [*ListPedidoItems*](#listpedidoitems)
  - [*ListEspera*](#listespera)
  - [*ListEncuestas*](#listencuestas)
- [**Mutations**](#mutations)
  - [*CreateProducto*](#createproducto)
  - [*CreateUsuario*](#createusuario)
  - [*CreateMesa*](#createmesa)
  - [*CreatePedido*](#createpedido)
  - [*CreatePedidoItem*](#createpedidoitem)
  - [*CreateEncuesta*](#createencuesta)
  - [*UpdateEstadoUsuario*](#updateestadousuario)
  - [*UpdateEstadoMesa*](#updateestadomesa)
  - [*UpdateProducto*](#updateproducto)
  - [*UpdateActivoProducto*](#updateactivoproducto)
  - [*CreateEspera*](#createespera)
  - [*UpdateEstadoEspera*](#updateestadoespera)
  - [*ConfirmarPedido*](#confirmarpedido)
  - [*RegistrarIntentoJuego*](#registrarintentojuego)
  - [*AplicarDescuentoJuego*](#aplicardescuentojuego)
  - [*AsignarMesaCliente*](#asignarmesacliente)
  - [*RechazarPedido*](#rechazarpedido)
  - [*ReenviarPedido*](#reenviarpedido)
  - [*BorrarItemsPedido*](#borraritemspedido)
  - [*AvanzarSectorPedido*](#avanzarsectorpedido)
  - [*ActualizarEstadoPedido*](#actualizarestadopedido)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListProductos
You can execute the `ListProductos` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listProductos(options?: ExecuteQueryOptions): QueryPromise<ListProductosData, undefined>;

interface ListProductosRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductosData, undefined>;
}
export const listProductosRef: ListProductosRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProductos(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListProductosData, undefined>;

interface ListProductosRef {
  ...
  (dc: DataConnect): QueryRef<ListProductosData, undefined>;
}
export const listProductosRef: ListProductosRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProductosRef:
```typescript
const name = listProductosRef.operationName;
console.log(name);
```

### Variables
The `ListProductos` query has no variables.
### Return Type
Recall that executing the `ListProductos` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProductosData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListProductos`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProductos } from '@dataconnect/generated';


// Call the `listProductos()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProductos();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProductos(dataConnect);

console.log(data.productos);

// Or, you can use the `Promise` API.
listProductos().then((response) => {
  const data = response.data;
  console.log(data.productos);
});
```

### Using `ListProductos`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProductosRef } from '@dataconnect/generated';


// Call the `listProductosRef()` function to get a reference to the query.
const ref = listProductosRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProductosRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.productos);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.productos);
});
```

## ListMesas
You can execute the `ListMesas` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMesas(options?: ExecuteQueryOptions): QueryPromise<ListMesasData, undefined>;

interface ListMesasRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMesasData, undefined>;
}
export const listMesasRef: ListMesasRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMesas(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMesasData, undefined>;

interface ListMesasRef {
  ...
  (dc: DataConnect): QueryRef<ListMesasData, undefined>;
}
export const listMesasRef: ListMesasRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMesasRef:
```typescript
const name = listMesasRef.operationName;
console.log(name);
```

### Variables
The `ListMesas` query has no variables.
### Return Type
Recall that executing the `ListMesas` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMesasData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListMesas`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMesas } from '@dataconnect/generated';


// Call the `listMesas()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMesas();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMesas(dataConnect);

console.log(data.mesas);

// Or, you can use the `Promise` API.
listMesas().then((response) => {
  const data = response.data;
  console.log(data.mesas);
});
```

### Using `ListMesas`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMesasRef } from '@dataconnect/generated';


// Call the `listMesasRef()` function to get a reference to the query.
const ref = listMesasRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMesasRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.mesas);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.mesas);
});
```

## ListUsuarios
You can execute the `ListUsuarios` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUsuarios(options?: ExecuteQueryOptions): QueryPromise<ListUsuariosData, undefined>;

interface ListUsuariosRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsuariosData, undefined>;
}
export const listUsuariosRef: ListUsuariosRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUsuarios(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsuariosData, undefined>;

interface ListUsuariosRef {
  ...
  (dc: DataConnect): QueryRef<ListUsuariosData, undefined>;
}
export const listUsuariosRef: ListUsuariosRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUsuariosRef:
```typescript
const name = listUsuariosRef.operationName;
console.log(name);
```

### Variables
The `ListUsuarios` query has no variables.
### Return Type
Recall that executing the `ListUsuarios` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUsuariosData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListUsuarios`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUsuarios } from '@dataconnect/generated';


// Call the `listUsuarios()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUsuarios();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUsuarios(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
listUsuarios().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListUsuarios`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUsuariosRef } from '@dataconnect/generated';


// Call the `listUsuariosRef()` function to get a reference to the query.
const ref = listUsuariosRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUsuariosRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## ListPedidosActivos
You can execute the `ListPedidosActivos` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPedidosActivos(options?: ExecuteQueryOptions): QueryPromise<ListPedidosActivosData, undefined>;

interface ListPedidosActivosRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPedidosActivosData, undefined>;
}
export const listPedidosActivosRef: ListPedidosActivosRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPedidosActivos(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPedidosActivosData, undefined>;

interface ListPedidosActivosRef {
  ...
  (dc: DataConnect): QueryRef<ListPedidosActivosData, undefined>;
}
export const listPedidosActivosRef: ListPedidosActivosRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPedidosActivosRef:
```typescript
const name = listPedidosActivosRef.operationName;
console.log(name);
```

### Variables
The `ListPedidosActivos` query has no variables.
### Return Type
Recall that executing the `ListPedidosActivos` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPedidosActivosData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListPedidosActivos`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPedidosActivos } from '@dataconnect/generated';


// Call the `listPedidosActivos()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPedidosActivos();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPedidosActivos(dataConnect);

console.log(data.pedidos);

// Or, you can use the `Promise` API.
listPedidosActivos().then((response) => {
  const data = response.data;
  console.log(data.pedidos);
});
```

### Using `ListPedidosActivos`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPedidosActivosRef } from '@dataconnect/generated';


// Call the `listPedidosActivosRef()` function to get a reference to the query.
const ref = listPedidosActivosRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPedidosActivosRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.pedidos);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.pedidos);
});
```

## ListPedidoItems
You can execute the `ListPedidoItems` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPedidoItems(options?: ExecuteQueryOptions): QueryPromise<ListPedidoItemsData, undefined>;

interface ListPedidoItemsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPedidoItemsData, undefined>;
}
export const listPedidoItemsRef: ListPedidoItemsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPedidoItems(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPedidoItemsData, undefined>;

interface ListPedidoItemsRef {
  ...
  (dc: DataConnect): QueryRef<ListPedidoItemsData, undefined>;
}
export const listPedidoItemsRef: ListPedidoItemsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPedidoItemsRef:
```typescript
const name = listPedidoItemsRef.operationName;
console.log(name);
```

### Variables
The `ListPedidoItems` query has no variables.
### Return Type
Recall that executing the `ListPedidoItems` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPedidoItemsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListPedidoItems`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPedidoItems } from '@dataconnect/generated';


// Call the `listPedidoItems()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPedidoItems();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPedidoItems(dataConnect);

console.log(data.pedidoItems);

// Or, you can use the `Promise` API.
listPedidoItems().then((response) => {
  const data = response.data;
  console.log(data.pedidoItems);
});
```

### Using `ListPedidoItems`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPedidoItemsRef } from '@dataconnect/generated';


// Call the `listPedidoItemsRef()` function to get a reference to the query.
const ref = listPedidoItemsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPedidoItemsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.pedidoItems);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.pedidoItems);
});
```

## ListEspera
You can execute the `ListEspera` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listEspera(options?: ExecuteQueryOptions): QueryPromise<ListEsperaData, undefined>;

interface ListEsperaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEsperaData, undefined>;
}
export const listEsperaRef: ListEsperaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listEspera(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListEsperaData, undefined>;

interface ListEsperaRef {
  ...
  (dc: DataConnect): QueryRef<ListEsperaData, undefined>;
}
export const listEsperaRef: ListEsperaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listEsperaRef:
```typescript
const name = listEsperaRef.operationName;
console.log(name);
```

### Variables
The `ListEspera` query has no variables.
### Return Type
Recall that executing the `ListEspera` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListEsperaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListEspera`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listEspera } from '@dataconnect/generated';


// Call the `listEspera()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listEspera();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listEspera(dataConnect);

console.log(data.esperas);

// Or, you can use the `Promise` API.
listEspera().then((response) => {
  const data = response.data;
  console.log(data.esperas);
});
```

### Using `ListEspera`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listEsperaRef } from '@dataconnect/generated';


// Call the `listEsperaRef()` function to get a reference to the query.
const ref = listEsperaRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listEsperaRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.esperas);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.esperas);
});
```

## ListEncuestas
You can execute the `ListEncuestas` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listEncuestas(options?: ExecuteQueryOptions): QueryPromise<ListEncuestasData, undefined>;

interface ListEncuestasRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListEncuestasData, undefined>;
}
export const listEncuestasRef: ListEncuestasRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listEncuestas(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListEncuestasData, undefined>;

interface ListEncuestasRef {
  ...
  (dc: DataConnect): QueryRef<ListEncuestasData, undefined>;
}
export const listEncuestasRef: ListEncuestasRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listEncuestasRef:
```typescript
const name = listEncuestasRef.operationName;
console.log(name);
```

### Variables
The `ListEncuestas` query has no variables.
### Return Type
Recall that executing the `ListEncuestas` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListEncuestasData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListEncuestas`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listEncuestas } from '@dataconnect/generated';


// Call the `listEncuestas()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listEncuestas();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listEncuestas(dataConnect);

console.log(data.encuestas);

// Or, you can use the `Promise` API.
listEncuestas().then((response) => {
  const data = response.data;
  console.log(data.encuestas);
});
```

### Using `ListEncuestas`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listEncuestasRef } from '@dataconnect/generated';


// Call the `listEncuestasRef()` function to get a reference to the query.
const ref = listEncuestasRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listEncuestasRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.encuestas);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.encuestas);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateProducto
You can execute the `CreateProducto` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createProducto(vars: CreateProductoVariables): MutationPromise<CreateProductoData, CreateProductoVariables>;

interface CreateProductoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProductoVariables): MutationRef<CreateProductoData, CreateProductoVariables>;
}
export const createProductoRef: CreateProductoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createProducto(dc: DataConnect, vars: CreateProductoVariables): MutationPromise<CreateProductoData, CreateProductoVariables>;

interface CreateProductoRef {
  ...
  (dc: DataConnect, vars: CreateProductoVariables): MutationRef<CreateProductoData, CreateProductoVariables>;
}
export const createProductoRef: CreateProductoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createProductoRef:
```typescript
const name = createProductoRef.operationName;
console.log(name);
```

### Variables
The `CreateProducto` mutation requires an argument of type `CreateProductoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateProducto` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateProductoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateProductoData {
  producto_insert: Producto_Key;
}
```
### Using `CreateProducto`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createProducto, CreateProductoVariables } from '@dataconnect/generated';

// The `CreateProducto` mutation requires an argument of type `CreateProductoVariables`:
const createProductoVars: CreateProductoVariables = {
  nombre: ..., 
  descripcion: ..., 
  precio: ..., 
  tiempoElaboracion: ..., 
  tipo: ..., 
  sector: ..., 
  foto1: ..., 
  foto2: ..., 
  foto3: ..., 
};

// Call the `createProducto()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createProducto(createProductoVars);
// Variables can be defined inline as well.
const { data } = await createProducto({ nombre: ..., descripcion: ..., precio: ..., tiempoElaboracion: ..., tipo: ..., sector: ..., foto1: ..., foto2: ..., foto3: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createProducto(dataConnect, createProductoVars);

console.log(data.producto_insert);

// Or, you can use the `Promise` API.
createProducto(createProductoVars).then((response) => {
  const data = response.data;
  console.log(data.producto_insert);
});
```

### Using `CreateProducto`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createProductoRef, CreateProductoVariables } from '@dataconnect/generated';

// The `CreateProducto` mutation requires an argument of type `CreateProductoVariables`:
const createProductoVars: CreateProductoVariables = {
  nombre: ..., 
  descripcion: ..., 
  precio: ..., 
  tiempoElaboracion: ..., 
  tipo: ..., 
  sector: ..., 
  foto1: ..., 
  foto2: ..., 
  foto3: ..., 
};

// Call the `createProductoRef()` function to get a reference to the mutation.
const ref = createProductoRef(createProductoVars);
// Variables can be defined inline as well.
const ref = createProductoRef({ nombre: ..., descripcion: ..., precio: ..., tiempoElaboracion: ..., tipo: ..., sector: ..., foto1: ..., foto2: ..., foto3: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createProductoRef(dataConnect, createProductoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.producto_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.producto_insert);
});
```

## CreateUsuario
You can execute the `CreateUsuario` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUsuario(vars: CreateUsuarioVariables): MutationPromise<CreateUsuarioData, CreateUsuarioVariables>;

interface CreateUsuarioRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUsuarioVariables): MutationRef<CreateUsuarioData, CreateUsuarioVariables>;
}
export const createUsuarioRef: CreateUsuarioRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUsuario(dc: DataConnect, vars: CreateUsuarioVariables): MutationPromise<CreateUsuarioData, CreateUsuarioVariables>;

interface CreateUsuarioRef {
  ...
  (dc: DataConnect, vars: CreateUsuarioVariables): MutationRef<CreateUsuarioData, CreateUsuarioVariables>;
}
export const createUsuarioRef: CreateUsuarioRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUsuarioRef:
```typescript
const name = createUsuarioRef.operationName;
console.log(name);
```

### Variables
The `CreateUsuario` mutation requires an argument of type `CreateUsuarioVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateUsuario` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUsuarioData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUsuarioData {
  user_insert: User_Key;
}
```
### Using `CreateUsuario`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUsuario, CreateUsuarioVariables } from '@dataconnect/generated';

// The `CreateUsuario` mutation requires an argument of type `CreateUsuarioVariables`:
const createUsuarioVars: CreateUsuarioVariables = {
  uid: ..., 
  nombre: ..., 
  apellido: ..., // optional
  dni: ..., // optional
  cuil: ..., // optional
  email: ..., // optional
  perfil: ..., 
  fotoUrl: ..., 
  estado: ..., 
};

// Call the `createUsuario()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUsuario(createUsuarioVars);
// Variables can be defined inline as well.
const { data } = await createUsuario({ uid: ..., nombre: ..., apellido: ..., dni: ..., cuil: ..., email: ..., perfil: ..., fotoUrl: ..., estado: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUsuario(dataConnect, createUsuarioVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUsuario(createUsuarioVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUsuario`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUsuarioRef, CreateUsuarioVariables } from '@dataconnect/generated';

// The `CreateUsuario` mutation requires an argument of type `CreateUsuarioVariables`:
const createUsuarioVars: CreateUsuarioVariables = {
  uid: ..., 
  nombre: ..., 
  apellido: ..., // optional
  dni: ..., // optional
  cuil: ..., // optional
  email: ..., // optional
  perfil: ..., 
  fotoUrl: ..., 
  estado: ..., 
};

// Call the `createUsuarioRef()` function to get a reference to the mutation.
const ref = createUsuarioRef(createUsuarioVars);
// Variables can be defined inline as well.
const ref = createUsuarioRef({ uid: ..., nombre: ..., apellido: ..., dni: ..., cuil: ..., email: ..., perfil: ..., fotoUrl: ..., estado: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUsuarioRef(dataConnect, createUsuarioVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## CreateMesa
You can execute the `CreateMesa` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMesa(vars: CreateMesaVariables): MutationPromise<CreateMesaData, CreateMesaVariables>;

interface CreateMesaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMesaVariables): MutationRef<CreateMesaData, CreateMesaVariables>;
}
export const createMesaRef: CreateMesaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMesa(dc: DataConnect, vars: CreateMesaVariables): MutationPromise<CreateMesaData, CreateMesaVariables>;

interface CreateMesaRef {
  ...
  (dc: DataConnect, vars: CreateMesaVariables): MutationRef<CreateMesaData, CreateMesaVariables>;
}
export const createMesaRef: CreateMesaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMesaRef:
```typescript
const name = createMesaRef.operationName;
console.log(name);
```

### Variables
The `CreateMesa` mutation requires an argument of type `CreateMesaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateMesaVariables {
  numero: number;
  cantidadComensales: number;
  tipo: TipoMesa;
  estado: EstadoMesa;
  fotoUrl: string;
  qrCodeUrl: string;
}
```
### Return Type
Recall that executing the `CreateMesa` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMesaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMesaData {
  mesa_insert: Mesa_Key;
}
```
### Using `CreateMesa`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMesa, CreateMesaVariables } from '@dataconnect/generated';

// The `CreateMesa` mutation requires an argument of type `CreateMesaVariables`:
const createMesaVars: CreateMesaVariables = {
  numero: ..., 
  cantidadComensales: ..., 
  tipo: ..., 
  estado: ..., 
  fotoUrl: ..., 
  qrCodeUrl: ..., 
};

// Call the `createMesa()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMesa(createMesaVars);
// Variables can be defined inline as well.
const { data } = await createMesa({ numero: ..., cantidadComensales: ..., tipo: ..., estado: ..., fotoUrl: ..., qrCodeUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMesa(dataConnect, createMesaVars);

console.log(data.mesa_insert);

// Or, you can use the `Promise` API.
createMesa(createMesaVars).then((response) => {
  const data = response.data;
  console.log(data.mesa_insert);
});
```

### Using `CreateMesa`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMesaRef, CreateMesaVariables } from '@dataconnect/generated';

// The `CreateMesa` mutation requires an argument of type `CreateMesaVariables`:
const createMesaVars: CreateMesaVariables = {
  numero: ..., 
  cantidadComensales: ..., 
  tipo: ..., 
  estado: ..., 
  fotoUrl: ..., 
  qrCodeUrl: ..., 
};

// Call the `createMesaRef()` function to get a reference to the mutation.
const ref = createMesaRef(createMesaVars);
// Variables can be defined inline as well.
const ref = createMesaRef({ numero: ..., cantidadComensales: ..., tipo: ..., estado: ..., fotoUrl: ..., qrCodeUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMesaRef(dataConnect, createMesaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.mesa_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.mesa_insert);
});
```

## CreatePedido
You can execute the `CreatePedido` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPedido(vars: CreatePedidoVariables): MutationPromise<CreatePedidoData, CreatePedidoVariables>;

interface CreatePedidoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePedidoVariables): MutationRef<CreatePedidoData, CreatePedidoVariables>;
}
export const createPedidoRef: CreatePedidoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPedido(dc: DataConnect, vars: CreatePedidoVariables): MutationPromise<CreatePedidoData, CreatePedidoVariables>;

interface CreatePedidoRef {
  ...
  (dc: DataConnect, vars: CreatePedidoVariables): MutationRef<CreatePedidoData, CreatePedidoVariables>;
}
export const createPedidoRef: CreatePedidoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPedidoRef:
```typescript
const name = createPedidoRef.operationName;
console.log(name);
```

### Variables
The `CreatePedido` mutation requires an argument of type `CreatePedidoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreatePedido` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePedidoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePedidoData {
  pedido_insert: Pedido_Key;
}
```
### Using `CreatePedido`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPedido, CreatePedidoVariables } from '@dataconnect/generated';

// The `CreatePedido` mutation requires an argument of type `CreatePedidoVariables`:
const createPedidoVars: CreatePedidoVariables = {
  mesaId: ..., 
  clienteId: ..., 
  estadoGlobal: ..., 
  tiempoEstimado: ..., 
  totalBruto: ..., 
  descuentoJuego: ..., 
  montoDescuentoJuego: ..., 
  porcentajePropina: ..., 
  montoPropina: ..., 
  totalFinal: ..., 
  timestampCreacion: ..., 
};

// Call the `createPedido()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPedido(createPedidoVars);
// Variables can be defined inline as well.
const { data } = await createPedido({ mesaId: ..., clienteId: ..., estadoGlobal: ..., tiempoEstimado: ..., totalBruto: ..., descuentoJuego: ..., montoDescuentoJuego: ..., porcentajePropina: ..., montoPropina: ..., totalFinal: ..., timestampCreacion: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPedido(dataConnect, createPedidoVars);

console.log(data.pedido_insert);

// Or, you can use the `Promise` API.
createPedido(createPedidoVars).then((response) => {
  const data = response.data;
  console.log(data.pedido_insert);
});
```

### Using `CreatePedido`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPedidoRef, CreatePedidoVariables } from '@dataconnect/generated';

// The `CreatePedido` mutation requires an argument of type `CreatePedidoVariables`:
const createPedidoVars: CreatePedidoVariables = {
  mesaId: ..., 
  clienteId: ..., 
  estadoGlobal: ..., 
  tiempoEstimado: ..., 
  totalBruto: ..., 
  descuentoJuego: ..., 
  montoDescuentoJuego: ..., 
  porcentajePropina: ..., 
  montoPropina: ..., 
  totalFinal: ..., 
  timestampCreacion: ..., 
};

// Call the `createPedidoRef()` function to get a reference to the mutation.
const ref = createPedidoRef(createPedidoVars);
// Variables can be defined inline as well.
const ref = createPedidoRef({ mesaId: ..., clienteId: ..., estadoGlobal: ..., tiempoEstimado: ..., totalBruto: ..., descuentoJuego: ..., montoDescuentoJuego: ..., porcentajePropina: ..., montoPropina: ..., totalFinal: ..., timestampCreacion: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPedidoRef(dataConnect, createPedidoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedido_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedido_insert);
});
```

## CreatePedidoItem
You can execute the `CreatePedidoItem` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPedidoItem(vars: CreatePedidoItemVariables): MutationPromise<CreatePedidoItemData, CreatePedidoItemVariables>;

interface CreatePedidoItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePedidoItemVariables): MutationRef<CreatePedidoItemData, CreatePedidoItemVariables>;
}
export const createPedidoItemRef: CreatePedidoItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPedidoItem(dc: DataConnect, vars: CreatePedidoItemVariables): MutationPromise<CreatePedidoItemData, CreatePedidoItemVariables>;

interface CreatePedidoItemRef {
  ...
  (dc: DataConnect, vars: CreatePedidoItemVariables): MutationRef<CreatePedidoItemData, CreatePedidoItemVariables>;
}
export const createPedidoItemRef: CreatePedidoItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPedidoItemRef:
```typescript
const name = createPedidoItemRef.operationName;
console.log(name);
```

### Variables
The `CreatePedidoItem` mutation requires an argument of type `CreatePedidoItemVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreatePedidoItemVariables {
  pedidoId: UUIDString;
  productoId: UUIDString;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  sector: Sector;
}
```
### Return Type
Recall that executing the `CreatePedidoItem` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePedidoItemData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePedidoItemData {
  pedidoItem_insert: PedidoItem_Key;
}
```
### Using `CreatePedidoItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPedidoItem, CreatePedidoItemVariables } from '@dataconnect/generated';

// The `CreatePedidoItem` mutation requires an argument of type `CreatePedidoItemVariables`:
const createPedidoItemVars: CreatePedidoItemVariables = {
  pedidoId: ..., 
  productoId: ..., 
  cantidad: ..., 
  precioUnitario: ..., 
  subtotal: ..., 
  sector: ..., 
};

// Call the `createPedidoItem()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPedidoItem(createPedidoItemVars);
// Variables can be defined inline as well.
const { data } = await createPedidoItem({ pedidoId: ..., productoId: ..., cantidad: ..., precioUnitario: ..., subtotal: ..., sector: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPedidoItem(dataConnect, createPedidoItemVars);

console.log(data.pedidoItem_insert);

// Or, you can use the `Promise` API.
createPedidoItem(createPedidoItemVars).then((response) => {
  const data = response.data;
  console.log(data.pedidoItem_insert);
});
```

### Using `CreatePedidoItem`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPedidoItemRef, CreatePedidoItemVariables } from '@dataconnect/generated';

// The `CreatePedidoItem` mutation requires an argument of type `CreatePedidoItemVariables`:
const createPedidoItemVars: CreatePedidoItemVariables = {
  pedidoId: ..., 
  productoId: ..., 
  cantidad: ..., 
  precioUnitario: ..., 
  subtotal: ..., 
  sector: ..., 
};

// Call the `createPedidoItemRef()` function to get a reference to the mutation.
const ref = createPedidoItemRef(createPedidoItemVars);
// Variables can be defined inline as well.
const ref = createPedidoItemRef({ pedidoId: ..., productoId: ..., cantidad: ..., precioUnitario: ..., subtotal: ..., sector: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPedidoItemRef(dataConnect, createPedidoItemVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedidoItem_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedidoItem_insert);
});
```

## CreateEncuesta
You can execute the `CreateEncuesta` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEncuesta(vars: CreateEncuestaVariables): MutationPromise<CreateEncuestaData, CreateEncuestaVariables>;

interface CreateEncuestaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEncuestaVariables): MutationRef<CreateEncuestaData, CreateEncuestaVariables>;
}
export const createEncuestaRef: CreateEncuestaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEncuesta(dc: DataConnect, vars: CreateEncuestaVariables): MutationPromise<CreateEncuestaData, CreateEncuestaVariables>;

interface CreateEncuestaRef {
  ...
  (dc: DataConnect, vars: CreateEncuestaVariables): MutationRef<CreateEncuestaData, CreateEncuestaVariables>;
}
export const createEncuestaRef: CreateEncuestaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEncuestaRef:
```typescript
const name = createEncuestaRef.operationName;
console.log(name);
```

### Variables
The `CreateEncuesta` mutation requires an argument of type `CreateEncuestaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateEncuesta` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEncuestaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEncuestaData {
  encuesta_insert: Encuesta_Key;
}
```
### Using `CreateEncuesta`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEncuesta, CreateEncuestaVariables } from '@dataconnect/generated';

// The `CreateEncuesta` mutation requires an argument of type `CreateEncuestaVariables`:
const createEncuestaVars: CreateEncuestaVariables = {
  clienteId: ..., 
  pedidoId: ..., 
  mesaId: ..., 
  calificacionMozo: ..., 
  nivelLimpieza: ..., 
  recomendaria: ..., 
  aspectoFavorito: ..., 
  comentarios: ..., // optional
  timestamp: ..., 
};

// Call the `createEncuesta()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEncuesta(createEncuestaVars);
// Variables can be defined inline as well.
const { data } = await createEncuesta({ clienteId: ..., pedidoId: ..., mesaId: ..., calificacionMozo: ..., nivelLimpieza: ..., recomendaria: ..., aspectoFavorito: ..., comentarios: ..., timestamp: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEncuesta(dataConnect, createEncuestaVars);

console.log(data.encuesta_insert);

// Or, you can use the `Promise` API.
createEncuesta(createEncuestaVars).then((response) => {
  const data = response.data;
  console.log(data.encuesta_insert);
});
```

### Using `CreateEncuesta`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEncuestaRef, CreateEncuestaVariables } from '@dataconnect/generated';

// The `CreateEncuesta` mutation requires an argument of type `CreateEncuestaVariables`:
const createEncuestaVars: CreateEncuestaVariables = {
  clienteId: ..., 
  pedidoId: ..., 
  mesaId: ..., 
  calificacionMozo: ..., 
  nivelLimpieza: ..., 
  recomendaria: ..., 
  aspectoFavorito: ..., 
  comentarios: ..., // optional
  timestamp: ..., 
};

// Call the `createEncuestaRef()` function to get a reference to the mutation.
const ref = createEncuestaRef(createEncuestaVars);
// Variables can be defined inline as well.
const ref = createEncuestaRef({ clienteId: ..., pedidoId: ..., mesaId: ..., calificacionMozo: ..., nivelLimpieza: ..., recomendaria: ..., aspectoFavorito: ..., comentarios: ..., timestamp: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEncuestaRef(dataConnect, createEncuestaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.encuesta_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.encuesta_insert);
});
```

## UpdateEstadoUsuario
You can execute the `UpdateEstadoUsuario` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateEstadoUsuario(vars: UpdateEstadoUsuarioVariables): MutationPromise<UpdateEstadoUsuarioData, UpdateEstadoUsuarioVariables>;

interface UpdateEstadoUsuarioRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEstadoUsuarioVariables): MutationRef<UpdateEstadoUsuarioData, UpdateEstadoUsuarioVariables>;
}
export const updateEstadoUsuarioRef: UpdateEstadoUsuarioRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateEstadoUsuario(dc: DataConnect, vars: UpdateEstadoUsuarioVariables): MutationPromise<UpdateEstadoUsuarioData, UpdateEstadoUsuarioVariables>;

interface UpdateEstadoUsuarioRef {
  ...
  (dc: DataConnect, vars: UpdateEstadoUsuarioVariables): MutationRef<UpdateEstadoUsuarioData, UpdateEstadoUsuarioVariables>;
}
export const updateEstadoUsuarioRef: UpdateEstadoUsuarioRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateEstadoUsuarioRef:
```typescript
const name = updateEstadoUsuarioRef.operationName;
console.log(name);
```

### Variables
The `UpdateEstadoUsuario` mutation requires an argument of type `UpdateEstadoUsuarioVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateEstadoUsuarioVariables {
  id: UUIDString;
  estado: EstadoUsuario;
}
```
### Return Type
Recall that executing the `UpdateEstadoUsuario` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateEstadoUsuarioData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateEstadoUsuarioData {
  user_update?: User_Key | null;
}
```
### Using `UpdateEstadoUsuario`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateEstadoUsuario, UpdateEstadoUsuarioVariables } from '@dataconnect/generated';

// The `UpdateEstadoUsuario` mutation requires an argument of type `UpdateEstadoUsuarioVariables`:
const updateEstadoUsuarioVars: UpdateEstadoUsuarioVariables = {
  id: ..., 
  estado: ..., 
};

// Call the `updateEstadoUsuario()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateEstadoUsuario(updateEstadoUsuarioVars);
// Variables can be defined inline as well.
const { data } = await updateEstadoUsuario({ id: ..., estado: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateEstadoUsuario(dataConnect, updateEstadoUsuarioVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateEstadoUsuario(updateEstadoUsuarioVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateEstadoUsuario`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateEstadoUsuarioRef, UpdateEstadoUsuarioVariables } from '@dataconnect/generated';

// The `UpdateEstadoUsuario` mutation requires an argument of type `UpdateEstadoUsuarioVariables`:
const updateEstadoUsuarioVars: UpdateEstadoUsuarioVariables = {
  id: ..., 
  estado: ..., 
};

// Call the `updateEstadoUsuarioRef()` function to get a reference to the mutation.
const ref = updateEstadoUsuarioRef(updateEstadoUsuarioVars);
// Variables can be defined inline as well.
const ref = updateEstadoUsuarioRef({ id: ..., estado: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateEstadoUsuarioRef(dataConnect, updateEstadoUsuarioVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## UpdateEstadoMesa
You can execute the `UpdateEstadoMesa` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateEstadoMesa(vars: UpdateEstadoMesaVariables): MutationPromise<UpdateEstadoMesaData, UpdateEstadoMesaVariables>;

interface UpdateEstadoMesaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEstadoMesaVariables): MutationRef<UpdateEstadoMesaData, UpdateEstadoMesaVariables>;
}
export const updateEstadoMesaRef: UpdateEstadoMesaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateEstadoMesa(dc: DataConnect, vars: UpdateEstadoMesaVariables): MutationPromise<UpdateEstadoMesaData, UpdateEstadoMesaVariables>;

interface UpdateEstadoMesaRef {
  ...
  (dc: DataConnect, vars: UpdateEstadoMesaVariables): MutationRef<UpdateEstadoMesaData, UpdateEstadoMesaVariables>;
}
export const updateEstadoMesaRef: UpdateEstadoMesaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateEstadoMesaRef:
```typescript
const name = updateEstadoMesaRef.operationName;
console.log(name);
```

### Variables
The `UpdateEstadoMesa` mutation requires an argument of type `UpdateEstadoMesaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateEstadoMesaVariables {
  id: UUIDString;
  estado: EstadoMesa;
}
```
### Return Type
Recall that executing the `UpdateEstadoMesa` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateEstadoMesaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateEstadoMesaData {
  mesa_update?: Mesa_Key | null;
}
```
### Using `UpdateEstadoMesa`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateEstadoMesa, UpdateEstadoMesaVariables } from '@dataconnect/generated';

// The `UpdateEstadoMesa` mutation requires an argument of type `UpdateEstadoMesaVariables`:
const updateEstadoMesaVars: UpdateEstadoMesaVariables = {
  id: ..., 
  estado: ..., 
};

// Call the `updateEstadoMesa()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateEstadoMesa(updateEstadoMesaVars);
// Variables can be defined inline as well.
const { data } = await updateEstadoMesa({ id: ..., estado: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateEstadoMesa(dataConnect, updateEstadoMesaVars);

console.log(data.mesa_update);

// Or, you can use the `Promise` API.
updateEstadoMesa(updateEstadoMesaVars).then((response) => {
  const data = response.data;
  console.log(data.mesa_update);
});
```

### Using `UpdateEstadoMesa`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateEstadoMesaRef, UpdateEstadoMesaVariables } from '@dataconnect/generated';

// The `UpdateEstadoMesa` mutation requires an argument of type `UpdateEstadoMesaVariables`:
const updateEstadoMesaVars: UpdateEstadoMesaVariables = {
  id: ..., 
  estado: ..., 
};

// Call the `updateEstadoMesaRef()` function to get a reference to the mutation.
const ref = updateEstadoMesaRef(updateEstadoMesaVars);
// Variables can be defined inline as well.
const ref = updateEstadoMesaRef({ id: ..., estado: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateEstadoMesaRef(dataConnect, updateEstadoMesaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.mesa_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.mesa_update);
});
```

## UpdateProducto
You can execute the `UpdateProducto` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateProducto(vars: UpdateProductoVariables): MutationPromise<UpdateProductoData, UpdateProductoVariables>;

interface UpdateProductoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProductoVariables): MutationRef<UpdateProductoData, UpdateProductoVariables>;
}
export const updateProductoRef: UpdateProductoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateProducto(dc: DataConnect, vars: UpdateProductoVariables): MutationPromise<UpdateProductoData, UpdateProductoVariables>;

interface UpdateProductoRef {
  ...
  (dc: DataConnect, vars: UpdateProductoVariables): MutationRef<UpdateProductoData, UpdateProductoVariables>;
}
export const updateProductoRef: UpdateProductoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateProductoRef:
```typescript
const name = updateProductoRef.operationName;
console.log(name);
```

### Variables
The `UpdateProducto` mutation requires an argument of type `UpdateProductoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateProducto` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateProductoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateProductoData {
  producto_update?: Producto_Key | null;
}
```
### Using `UpdateProducto`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateProducto, UpdateProductoVariables } from '@dataconnect/generated';

// The `UpdateProducto` mutation requires an argument of type `UpdateProductoVariables`:
const updateProductoVars: UpdateProductoVariables = {
  id: ..., 
  nombre: ..., 
  descripcion: ..., 
  precio: ..., 
  tiempoElaboracion: ..., 
  tipo: ..., 
  sector: ..., 
  foto1: ..., 
  foto2: ..., 
  foto3: ..., 
};

// Call the `updateProducto()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateProducto(updateProductoVars);
// Variables can be defined inline as well.
const { data } = await updateProducto({ id: ..., nombre: ..., descripcion: ..., precio: ..., tiempoElaboracion: ..., tipo: ..., sector: ..., foto1: ..., foto2: ..., foto3: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateProducto(dataConnect, updateProductoVars);

console.log(data.producto_update);

// Or, you can use the `Promise` API.
updateProducto(updateProductoVars).then((response) => {
  const data = response.data;
  console.log(data.producto_update);
});
```

### Using `UpdateProducto`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateProductoRef, UpdateProductoVariables } from '@dataconnect/generated';

// The `UpdateProducto` mutation requires an argument of type `UpdateProductoVariables`:
const updateProductoVars: UpdateProductoVariables = {
  id: ..., 
  nombre: ..., 
  descripcion: ..., 
  precio: ..., 
  tiempoElaboracion: ..., 
  tipo: ..., 
  sector: ..., 
  foto1: ..., 
  foto2: ..., 
  foto3: ..., 
};

// Call the `updateProductoRef()` function to get a reference to the mutation.
const ref = updateProductoRef(updateProductoVars);
// Variables can be defined inline as well.
const ref = updateProductoRef({ id: ..., nombre: ..., descripcion: ..., precio: ..., tiempoElaboracion: ..., tipo: ..., sector: ..., foto1: ..., foto2: ..., foto3: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateProductoRef(dataConnect, updateProductoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.producto_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.producto_update);
});
```

## UpdateActivoProducto
You can execute the `UpdateActivoProducto` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateActivoProducto(vars: UpdateActivoProductoVariables): MutationPromise<UpdateActivoProductoData, UpdateActivoProductoVariables>;

interface UpdateActivoProductoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateActivoProductoVariables): MutationRef<UpdateActivoProductoData, UpdateActivoProductoVariables>;
}
export const updateActivoProductoRef: UpdateActivoProductoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateActivoProducto(dc: DataConnect, vars: UpdateActivoProductoVariables): MutationPromise<UpdateActivoProductoData, UpdateActivoProductoVariables>;

interface UpdateActivoProductoRef {
  ...
  (dc: DataConnect, vars: UpdateActivoProductoVariables): MutationRef<UpdateActivoProductoData, UpdateActivoProductoVariables>;
}
export const updateActivoProductoRef: UpdateActivoProductoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateActivoProductoRef:
```typescript
const name = updateActivoProductoRef.operationName;
console.log(name);
```

### Variables
The `UpdateActivoProducto` mutation requires an argument of type `UpdateActivoProductoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateActivoProductoVariables {
  id: UUIDString;
  activo: boolean;
}
```
### Return Type
Recall that executing the `UpdateActivoProducto` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateActivoProductoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateActivoProductoData {
  producto_update?: Producto_Key | null;
}
```
### Using `UpdateActivoProducto`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateActivoProducto, UpdateActivoProductoVariables } from '@dataconnect/generated';

// The `UpdateActivoProducto` mutation requires an argument of type `UpdateActivoProductoVariables`:
const updateActivoProductoVars: UpdateActivoProductoVariables = {
  id: ..., 
  activo: ..., 
};

// Call the `updateActivoProducto()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateActivoProducto(updateActivoProductoVars);
// Variables can be defined inline as well.
const { data } = await updateActivoProducto({ id: ..., activo: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateActivoProducto(dataConnect, updateActivoProductoVars);

console.log(data.producto_update);

// Or, you can use the `Promise` API.
updateActivoProducto(updateActivoProductoVars).then((response) => {
  const data = response.data;
  console.log(data.producto_update);
});
```

### Using `UpdateActivoProducto`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateActivoProductoRef, UpdateActivoProductoVariables } from '@dataconnect/generated';

// The `UpdateActivoProducto` mutation requires an argument of type `UpdateActivoProductoVariables`:
const updateActivoProductoVars: UpdateActivoProductoVariables = {
  id: ..., 
  activo: ..., 
};

// Call the `updateActivoProductoRef()` function to get a reference to the mutation.
const ref = updateActivoProductoRef(updateActivoProductoVars);
// Variables can be defined inline as well.
const ref = updateActivoProductoRef({ id: ..., activo: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateActivoProductoRef(dataConnect, updateActivoProductoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.producto_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.producto_update);
});
```

## CreateEspera
You can execute the `CreateEspera` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEspera(vars: CreateEsperaVariables): MutationPromise<CreateEsperaData, CreateEsperaVariables>;

interface CreateEsperaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEsperaVariables): MutationRef<CreateEsperaData, CreateEsperaVariables>;
}
export const createEsperaRef: CreateEsperaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEspera(dc: DataConnect, vars: CreateEsperaVariables): MutationPromise<CreateEsperaData, CreateEsperaVariables>;

interface CreateEsperaRef {
  ...
  (dc: DataConnect, vars: CreateEsperaVariables): MutationRef<CreateEsperaData, CreateEsperaVariables>;
}
export const createEsperaRef: CreateEsperaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEsperaRef:
```typescript
const name = createEsperaRef.operationName;
console.log(name);
```

### Variables
The `CreateEspera` mutation requires an argument of type `CreateEsperaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateEsperaVariables {
  clienteId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateEspera` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEsperaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEsperaData {
  espera_insert: Espera_Key;
}
```
### Using `CreateEspera`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEspera, CreateEsperaVariables } from '@dataconnect/generated';

// The `CreateEspera` mutation requires an argument of type `CreateEsperaVariables`:
const createEsperaVars: CreateEsperaVariables = {
  clienteId: ..., 
};

// Call the `createEspera()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEspera(createEsperaVars);
// Variables can be defined inline as well.
const { data } = await createEspera({ clienteId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEspera(dataConnect, createEsperaVars);

console.log(data.espera_insert);

// Or, you can use the `Promise` API.
createEspera(createEsperaVars).then((response) => {
  const data = response.data;
  console.log(data.espera_insert);
});
```

### Using `CreateEspera`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEsperaRef, CreateEsperaVariables } from '@dataconnect/generated';

// The `CreateEspera` mutation requires an argument of type `CreateEsperaVariables`:
const createEsperaVars: CreateEsperaVariables = {
  clienteId: ..., 
};

// Call the `createEsperaRef()` function to get a reference to the mutation.
const ref = createEsperaRef(createEsperaVars);
// Variables can be defined inline as well.
const ref = createEsperaRef({ clienteId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEsperaRef(dataConnect, createEsperaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.espera_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.espera_insert);
});
```

## UpdateEstadoEspera
You can execute the `UpdateEstadoEspera` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateEstadoEspera(vars: UpdateEstadoEsperaVariables): MutationPromise<UpdateEstadoEsperaData, UpdateEstadoEsperaVariables>;

interface UpdateEstadoEsperaRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateEstadoEsperaVariables): MutationRef<UpdateEstadoEsperaData, UpdateEstadoEsperaVariables>;
}
export const updateEstadoEsperaRef: UpdateEstadoEsperaRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateEstadoEspera(dc: DataConnect, vars: UpdateEstadoEsperaVariables): MutationPromise<UpdateEstadoEsperaData, UpdateEstadoEsperaVariables>;

interface UpdateEstadoEsperaRef {
  ...
  (dc: DataConnect, vars: UpdateEstadoEsperaVariables): MutationRef<UpdateEstadoEsperaData, UpdateEstadoEsperaVariables>;
}
export const updateEstadoEsperaRef: UpdateEstadoEsperaRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateEstadoEsperaRef:
```typescript
const name = updateEstadoEsperaRef.operationName;
console.log(name);
```

### Variables
The `UpdateEstadoEspera` mutation requires an argument of type `UpdateEstadoEsperaVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateEstadoEsperaVariables {
  id: UUIDString;
  estado: EstadoEspera;
}
```
### Return Type
Recall that executing the `UpdateEstadoEspera` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateEstadoEsperaData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateEstadoEsperaData {
  espera_update?: Espera_Key | null;
}
```
### Using `UpdateEstadoEspera`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateEstadoEspera, UpdateEstadoEsperaVariables } from '@dataconnect/generated';

// The `UpdateEstadoEspera` mutation requires an argument of type `UpdateEstadoEsperaVariables`:
const updateEstadoEsperaVars: UpdateEstadoEsperaVariables = {
  id: ..., 
  estado: ..., 
};

// Call the `updateEstadoEspera()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateEstadoEspera(updateEstadoEsperaVars);
// Variables can be defined inline as well.
const { data } = await updateEstadoEspera({ id: ..., estado: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateEstadoEspera(dataConnect, updateEstadoEsperaVars);

console.log(data.espera_update);

// Or, you can use the `Promise` API.
updateEstadoEspera(updateEstadoEsperaVars).then((response) => {
  const data = response.data;
  console.log(data.espera_update);
});
```

### Using `UpdateEstadoEspera`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateEstadoEsperaRef, UpdateEstadoEsperaVariables } from '@dataconnect/generated';

// The `UpdateEstadoEspera` mutation requires an argument of type `UpdateEstadoEsperaVariables`:
const updateEstadoEsperaVars: UpdateEstadoEsperaVariables = {
  id: ..., 
  estado: ..., 
};

// Call the `updateEstadoEsperaRef()` function to get a reference to the mutation.
const ref = updateEstadoEsperaRef(updateEstadoEsperaVars);
// Variables can be defined inline as well.
const ref = updateEstadoEsperaRef({ id: ..., estado: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateEstadoEsperaRef(dataConnect, updateEstadoEsperaVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.espera_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.espera_update);
});
```

## ConfirmarPedido
You can execute the `ConfirmarPedido` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
confirmarPedido(vars: ConfirmarPedidoVariables): MutationPromise<ConfirmarPedidoData, ConfirmarPedidoVariables>;

interface ConfirmarPedidoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ConfirmarPedidoVariables): MutationRef<ConfirmarPedidoData, ConfirmarPedidoVariables>;
}
export const confirmarPedidoRef: ConfirmarPedidoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
confirmarPedido(dc: DataConnect, vars: ConfirmarPedidoVariables): MutationPromise<ConfirmarPedidoData, ConfirmarPedidoVariables>;

interface ConfirmarPedidoRef {
  ...
  (dc: DataConnect, vars: ConfirmarPedidoVariables): MutationRef<ConfirmarPedidoData, ConfirmarPedidoVariables>;
}
export const confirmarPedidoRef: ConfirmarPedidoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the confirmarPedidoRef:
```typescript
const name = confirmarPedidoRef.operationName;
console.log(name);
```

### Variables
The `ConfirmarPedido` mutation requires an argument of type `ConfirmarPedidoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ConfirmarPedidoVariables {
  id: UUIDString;
  estadoCocina: EstadoSector;
  estadoBar: EstadoSector;
  confirmadoPorId: UUIDString;
}
```
### Return Type
Recall that executing the `ConfirmarPedido` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ConfirmarPedidoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ConfirmarPedidoData {
  pedido_update?: Pedido_Key | null;
}
```
### Using `ConfirmarPedido`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, confirmarPedido, ConfirmarPedidoVariables } from '@dataconnect/generated';

// The `ConfirmarPedido` mutation requires an argument of type `ConfirmarPedidoVariables`:
const confirmarPedidoVars: ConfirmarPedidoVariables = {
  id: ..., 
  estadoCocina: ..., 
  estadoBar: ..., 
  confirmadoPorId: ..., 
};

// Call the `confirmarPedido()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await confirmarPedido(confirmarPedidoVars);
// Variables can be defined inline as well.
const { data } = await confirmarPedido({ id: ..., estadoCocina: ..., estadoBar: ..., confirmadoPorId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await confirmarPedido(dataConnect, confirmarPedidoVars);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
confirmarPedido(confirmarPedidoVars).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

### Using `ConfirmarPedido`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, confirmarPedidoRef, ConfirmarPedidoVariables } from '@dataconnect/generated';

// The `ConfirmarPedido` mutation requires an argument of type `ConfirmarPedidoVariables`:
const confirmarPedidoVars: ConfirmarPedidoVariables = {
  id: ..., 
  estadoCocina: ..., 
  estadoBar: ..., 
  confirmadoPorId: ..., 
};

// Call the `confirmarPedidoRef()` function to get a reference to the mutation.
const ref = confirmarPedidoRef(confirmarPedidoVars);
// Variables can be defined inline as well.
const ref = confirmarPedidoRef({ id: ..., estadoCocina: ..., estadoBar: ..., confirmadoPorId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = confirmarPedidoRef(dataConnect, confirmarPedidoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

## RegistrarIntentoJuego
You can execute the `RegistrarIntentoJuego` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
registrarIntentoJuego(vars: RegistrarIntentoJuegoVariables): MutationPromise<RegistrarIntentoJuegoData, RegistrarIntentoJuegoVariables>;

interface RegistrarIntentoJuegoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegistrarIntentoJuegoVariables): MutationRef<RegistrarIntentoJuegoData, RegistrarIntentoJuegoVariables>;
}
export const registrarIntentoJuegoRef: RegistrarIntentoJuegoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
registrarIntentoJuego(dc: DataConnect, vars: RegistrarIntentoJuegoVariables): MutationPromise<RegistrarIntentoJuegoData, RegistrarIntentoJuegoVariables>;

interface RegistrarIntentoJuegoRef {
  ...
  (dc: DataConnect, vars: RegistrarIntentoJuegoVariables): MutationRef<RegistrarIntentoJuegoData, RegistrarIntentoJuegoVariables>;
}
export const registrarIntentoJuegoRef: RegistrarIntentoJuegoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registrarIntentoJuegoRef:
```typescript
const name = registrarIntentoJuegoRef.operationName;
console.log(name);
```

### Variables
The `RegistrarIntentoJuego` mutation requires an argument of type `RegistrarIntentoJuegoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegistrarIntentoJuegoVariables {
  pedidoId: UUIDString;
  clienteId: UUIDString;
  gano: boolean;
  descuentoOtorgado: number;
}
```
### Return Type
Recall that executing the `RegistrarIntentoJuego` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegistrarIntentoJuegoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegistrarIntentoJuegoData {
  intentoJuego_insert: IntentoJuego_Key;
}
```
### Using `RegistrarIntentoJuego`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registrarIntentoJuego, RegistrarIntentoJuegoVariables } from '@dataconnect/generated';

// The `RegistrarIntentoJuego` mutation requires an argument of type `RegistrarIntentoJuegoVariables`:
const registrarIntentoJuegoVars: RegistrarIntentoJuegoVariables = {
  pedidoId: ..., 
  clienteId: ..., 
  gano: ..., 
  descuentoOtorgado: ..., 
};

// Call the `registrarIntentoJuego()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registrarIntentoJuego(registrarIntentoJuegoVars);
// Variables can be defined inline as well.
const { data } = await registrarIntentoJuego({ pedidoId: ..., clienteId: ..., gano: ..., descuentoOtorgado: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registrarIntentoJuego(dataConnect, registrarIntentoJuegoVars);

console.log(data.intentoJuego_insert);

// Or, you can use the `Promise` API.
registrarIntentoJuego(registrarIntentoJuegoVars).then((response) => {
  const data = response.data;
  console.log(data.intentoJuego_insert);
});
```

### Using `RegistrarIntentoJuego`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, registrarIntentoJuegoRef, RegistrarIntentoJuegoVariables } from '@dataconnect/generated';

// The `RegistrarIntentoJuego` mutation requires an argument of type `RegistrarIntentoJuegoVariables`:
const registrarIntentoJuegoVars: RegistrarIntentoJuegoVariables = {
  pedidoId: ..., 
  clienteId: ..., 
  gano: ..., 
  descuentoOtorgado: ..., 
};

// Call the `registrarIntentoJuegoRef()` function to get a reference to the mutation.
const ref = registrarIntentoJuegoRef(registrarIntentoJuegoVars);
// Variables can be defined inline as well.
const ref = registrarIntentoJuegoRef({ pedidoId: ..., clienteId: ..., gano: ..., descuentoOtorgado: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registrarIntentoJuegoRef(dataConnect, registrarIntentoJuegoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.intentoJuego_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.intentoJuego_insert);
});
```

## AplicarDescuentoJuego
You can execute the `AplicarDescuentoJuego` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
aplicarDescuentoJuego(vars: AplicarDescuentoJuegoVariables): MutationPromise<AplicarDescuentoJuegoData, AplicarDescuentoJuegoVariables>;

interface AplicarDescuentoJuegoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AplicarDescuentoJuegoVariables): MutationRef<AplicarDescuentoJuegoData, AplicarDescuentoJuegoVariables>;
}
export const aplicarDescuentoJuegoRef: AplicarDescuentoJuegoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
aplicarDescuentoJuego(dc: DataConnect, vars: AplicarDescuentoJuegoVariables): MutationPromise<AplicarDescuentoJuegoData, AplicarDescuentoJuegoVariables>;

interface AplicarDescuentoJuegoRef {
  ...
  (dc: DataConnect, vars: AplicarDescuentoJuegoVariables): MutationRef<AplicarDescuentoJuegoData, AplicarDescuentoJuegoVariables>;
}
export const aplicarDescuentoJuegoRef: AplicarDescuentoJuegoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the aplicarDescuentoJuegoRef:
```typescript
const name = aplicarDescuentoJuegoRef.operationName;
console.log(name);
```

### Variables
The `AplicarDescuentoJuego` mutation requires an argument of type `AplicarDescuentoJuegoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AplicarDescuentoJuegoVariables {
  id: UUIDString;
  descuentoJuego: number;
  montoDescuentoJuego: number;
  totalFinal: number;
}
```
### Return Type
Recall that executing the `AplicarDescuentoJuego` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AplicarDescuentoJuegoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AplicarDescuentoJuegoData {
  pedido_update?: Pedido_Key | null;
}
```
### Using `AplicarDescuentoJuego`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, aplicarDescuentoJuego, AplicarDescuentoJuegoVariables } from '@dataconnect/generated';

// The `AplicarDescuentoJuego` mutation requires an argument of type `AplicarDescuentoJuegoVariables`:
const aplicarDescuentoJuegoVars: AplicarDescuentoJuegoVariables = {
  id: ..., 
  descuentoJuego: ..., 
  montoDescuentoJuego: ..., 
  totalFinal: ..., 
};

// Call the `aplicarDescuentoJuego()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await aplicarDescuentoJuego(aplicarDescuentoJuegoVars);
// Variables can be defined inline as well.
const { data } = await aplicarDescuentoJuego({ id: ..., descuentoJuego: ..., montoDescuentoJuego: ..., totalFinal: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await aplicarDescuentoJuego(dataConnect, aplicarDescuentoJuegoVars);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
aplicarDescuentoJuego(aplicarDescuentoJuegoVars).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

### Using `AplicarDescuentoJuego`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, aplicarDescuentoJuegoRef, AplicarDescuentoJuegoVariables } from '@dataconnect/generated';

// The `AplicarDescuentoJuego` mutation requires an argument of type `AplicarDescuentoJuegoVariables`:
const aplicarDescuentoJuegoVars: AplicarDescuentoJuegoVariables = {
  id: ..., 
  descuentoJuego: ..., 
  montoDescuentoJuego: ..., 
  totalFinal: ..., 
};

// Call the `aplicarDescuentoJuegoRef()` function to get a reference to the mutation.
const ref = aplicarDescuentoJuegoRef(aplicarDescuentoJuegoVars);
// Variables can be defined inline as well.
const ref = aplicarDescuentoJuegoRef({ id: ..., descuentoJuego: ..., montoDescuentoJuego: ..., totalFinal: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = aplicarDescuentoJuegoRef(dataConnect, aplicarDescuentoJuegoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

## AsignarMesaCliente
You can execute the `AsignarMesaCliente` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
asignarMesaCliente(vars: AsignarMesaClienteVariables): MutationPromise<AsignarMesaClienteData, AsignarMesaClienteVariables>;

interface AsignarMesaClienteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AsignarMesaClienteVariables): MutationRef<AsignarMesaClienteData, AsignarMesaClienteVariables>;
}
export const asignarMesaClienteRef: AsignarMesaClienteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
asignarMesaCliente(dc: DataConnect, vars: AsignarMesaClienteVariables): MutationPromise<AsignarMesaClienteData, AsignarMesaClienteVariables>;

interface AsignarMesaClienteRef {
  ...
  (dc: DataConnect, vars: AsignarMesaClienteVariables): MutationRef<AsignarMesaClienteData, AsignarMesaClienteVariables>;
}
export const asignarMesaClienteRef: AsignarMesaClienteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the asignarMesaClienteRef:
```typescript
const name = asignarMesaClienteRef.operationName;
console.log(name);
```

### Variables
The `AsignarMesaCliente` mutation requires an argument of type `AsignarMesaClienteVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AsignarMesaClienteVariables {
  esperaId: UUIDString;
  mesaId: UUIDString;
  clienteId: UUIDString;
}
```
### Return Type
Recall that executing the `AsignarMesaCliente` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AsignarMesaClienteData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AsignarMesaClienteData {
  espera_update?: Espera_Key | null;
  mesa_update?: Mesa_Key | null;
}
```
### Using `AsignarMesaCliente`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, asignarMesaCliente, AsignarMesaClienteVariables } from '@dataconnect/generated';

// The `AsignarMesaCliente` mutation requires an argument of type `AsignarMesaClienteVariables`:
const asignarMesaClienteVars: AsignarMesaClienteVariables = {
  esperaId: ..., 
  mesaId: ..., 
  clienteId: ..., 
};

// Call the `asignarMesaCliente()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await asignarMesaCliente(asignarMesaClienteVars);
// Variables can be defined inline as well.
const { data } = await asignarMesaCliente({ esperaId: ..., mesaId: ..., clienteId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await asignarMesaCliente(dataConnect, asignarMesaClienteVars);

console.log(data.espera_update);
console.log(data.mesa_update);

// Or, you can use the `Promise` API.
asignarMesaCliente(asignarMesaClienteVars).then((response) => {
  const data = response.data;
  console.log(data.espera_update);
  console.log(data.mesa_update);
});
```

### Using `AsignarMesaCliente`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, asignarMesaClienteRef, AsignarMesaClienteVariables } from '@dataconnect/generated';

// The `AsignarMesaCliente` mutation requires an argument of type `AsignarMesaClienteVariables`:
const asignarMesaClienteVars: AsignarMesaClienteVariables = {
  esperaId: ..., 
  mesaId: ..., 
  clienteId: ..., 
};

// Call the `asignarMesaClienteRef()` function to get a reference to the mutation.
const ref = asignarMesaClienteRef(asignarMesaClienteVars);
// Variables can be defined inline as well.
const ref = asignarMesaClienteRef({ esperaId: ..., mesaId: ..., clienteId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = asignarMesaClienteRef(dataConnect, asignarMesaClienteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.espera_update);
console.log(data.mesa_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.espera_update);
  console.log(data.mesa_update);
});
```

## RechazarPedido
You can execute the `RechazarPedido` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
rechazarPedido(vars: RechazarPedidoVariables): MutationPromise<RechazarPedidoData, RechazarPedidoVariables>;

interface RechazarPedidoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RechazarPedidoVariables): MutationRef<RechazarPedidoData, RechazarPedidoVariables>;
}
export const rechazarPedidoRef: RechazarPedidoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
rechazarPedido(dc: DataConnect, vars: RechazarPedidoVariables): MutationPromise<RechazarPedidoData, RechazarPedidoVariables>;

interface RechazarPedidoRef {
  ...
  (dc: DataConnect, vars: RechazarPedidoVariables): MutationRef<RechazarPedidoData, RechazarPedidoVariables>;
}
export const rechazarPedidoRef: RechazarPedidoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the rechazarPedidoRef:
```typescript
const name = rechazarPedidoRef.operationName;
console.log(name);
```

### Variables
The `RechazarPedido` mutation requires an argument of type `RechazarPedidoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RechazarPedidoVariables {
  id: UUIDString;
  motivoRechazo: string;
}
```
### Return Type
Recall that executing the `RechazarPedido` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RechazarPedidoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RechazarPedidoData {
  pedido_update?: Pedido_Key | null;
}
```
### Using `RechazarPedido`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, rechazarPedido, RechazarPedidoVariables } from '@dataconnect/generated';

// The `RechazarPedido` mutation requires an argument of type `RechazarPedidoVariables`:
const rechazarPedidoVars: RechazarPedidoVariables = {
  id: ..., 
  motivoRechazo: ..., 
};

// Call the `rechazarPedido()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await rechazarPedido(rechazarPedidoVars);
// Variables can be defined inline as well.
const { data } = await rechazarPedido({ id: ..., motivoRechazo: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await rechazarPedido(dataConnect, rechazarPedidoVars);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
rechazarPedido(rechazarPedidoVars).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

### Using `RechazarPedido`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, rechazarPedidoRef, RechazarPedidoVariables } from '@dataconnect/generated';

// The `RechazarPedido` mutation requires an argument of type `RechazarPedidoVariables`:
const rechazarPedidoVars: RechazarPedidoVariables = {
  id: ..., 
  motivoRechazo: ..., 
};

// Call the `rechazarPedidoRef()` function to get a reference to the mutation.
const ref = rechazarPedidoRef(rechazarPedidoVars);
// Variables can be defined inline as well.
const ref = rechazarPedidoRef({ id: ..., motivoRechazo: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = rechazarPedidoRef(dataConnect, rechazarPedidoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

## ReenviarPedido
You can execute the `ReenviarPedido` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
reenviarPedido(vars: ReenviarPedidoVariables): MutationPromise<ReenviarPedidoData, ReenviarPedidoVariables>;

interface ReenviarPedidoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReenviarPedidoVariables): MutationRef<ReenviarPedidoData, ReenviarPedidoVariables>;
}
export const reenviarPedidoRef: ReenviarPedidoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
reenviarPedido(dc: DataConnect, vars: ReenviarPedidoVariables): MutationPromise<ReenviarPedidoData, ReenviarPedidoVariables>;

interface ReenviarPedidoRef {
  ...
  (dc: DataConnect, vars: ReenviarPedidoVariables): MutationRef<ReenviarPedidoData, ReenviarPedidoVariables>;
}
export const reenviarPedidoRef: ReenviarPedidoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the reenviarPedidoRef:
```typescript
const name = reenviarPedidoRef.operationName;
console.log(name);
```

### Variables
The `ReenviarPedido` mutation requires an argument of type `ReenviarPedidoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReenviarPedidoVariables {
  id: UUIDString;
  tiempoEstimado: number;
  totalBruto: number;
  totalFinal: number;
}
```
### Return Type
Recall that executing the `ReenviarPedido` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReenviarPedidoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReenviarPedidoData {
  pedido_update?: Pedido_Key | null;
}
```
### Using `ReenviarPedido`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, reenviarPedido, ReenviarPedidoVariables } from '@dataconnect/generated';

// The `ReenviarPedido` mutation requires an argument of type `ReenviarPedidoVariables`:
const reenviarPedidoVars: ReenviarPedidoVariables = {
  id: ..., 
  tiempoEstimado: ..., 
  totalBruto: ..., 
  totalFinal: ..., 
};

// Call the `reenviarPedido()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await reenviarPedido(reenviarPedidoVars);
// Variables can be defined inline as well.
const { data } = await reenviarPedido({ id: ..., tiempoEstimado: ..., totalBruto: ..., totalFinal: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await reenviarPedido(dataConnect, reenviarPedidoVars);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
reenviarPedido(reenviarPedidoVars).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

### Using `ReenviarPedido`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, reenviarPedidoRef, ReenviarPedidoVariables } from '@dataconnect/generated';

// The `ReenviarPedido` mutation requires an argument of type `ReenviarPedidoVariables`:
const reenviarPedidoVars: ReenviarPedidoVariables = {
  id: ..., 
  tiempoEstimado: ..., 
  totalBruto: ..., 
  totalFinal: ..., 
};

// Call the `reenviarPedidoRef()` function to get a reference to the mutation.
const ref = reenviarPedidoRef(reenviarPedidoVars);
// Variables can be defined inline as well.
const ref = reenviarPedidoRef({ id: ..., tiempoEstimado: ..., totalBruto: ..., totalFinal: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = reenviarPedidoRef(dataConnect, reenviarPedidoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

## BorrarItemsPedido
You can execute the `BorrarItemsPedido` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
borrarItemsPedido(vars: BorrarItemsPedidoVariables): MutationPromise<BorrarItemsPedidoData, BorrarItemsPedidoVariables>;

interface BorrarItemsPedidoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BorrarItemsPedidoVariables): MutationRef<BorrarItemsPedidoData, BorrarItemsPedidoVariables>;
}
export const borrarItemsPedidoRef: BorrarItemsPedidoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
borrarItemsPedido(dc: DataConnect, vars: BorrarItemsPedidoVariables): MutationPromise<BorrarItemsPedidoData, BorrarItemsPedidoVariables>;

interface BorrarItemsPedidoRef {
  ...
  (dc: DataConnect, vars: BorrarItemsPedidoVariables): MutationRef<BorrarItemsPedidoData, BorrarItemsPedidoVariables>;
}
export const borrarItemsPedidoRef: BorrarItemsPedidoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the borrarItemsPedidoRef:
```typescript
const name = borrarItemsPedidoRef.operationName;
console.log(name);
```

### Variables
The `BorrarItemsPedido` mutation requires an argument of type `BorrarItemsPedidoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BorrarItemsPedidoVariables {
  pedidoId: UUIDString;
}
```
### Return Type
Recall that executing the `BorrarItemsPedido` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BorrarItemsPedidoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BorrarItemsPedidoData {
  pedidoItem_deleteMany: number;
}
```
### Using `BorrarItemsPedido`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, borrarItemsPedido, BorrarItemsPedidoVariables } from '@dataconnect/generated';

// The `BorrarItemsPedido` mutation requires an argument of type `BorrarItemsPedidoVariables`:
const borrarItemsPedidoVars: BorrarItemsPedidoVariables = {
  pedidoId: ..., 
};

// Call the `borrarItemsPedido()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await borrarItemsPedido(borrarItemsPedidoVars);
// Variables can be defined inline as well.
const { data } = await borrarItemsPedido({ pedidoId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await borrarItemsPedido(dataConnect, borrarItemsPedidoVars);

console.log(data.pedidoItem_deleteMany);

// Or, you can use the `Promise` API.
borrarItemsPedido(borrarItemsPedidoVars).then((response) => {
  const data = response.data;
  console.log(data.pedidoItem_deleteMany);
});
```

### Using `BorrarItemsPedido`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, borrarItemsPedidoRef, BorrarItemsPedidoVariables } from '@dataconnect/generated';

// The `BorrarItemsPedido` mutation requires an argument of type `BorrarItemsPedidoVariables`:
const borrarItemsPedidoVars: BorrarItemsPedidoVariables = {
  pedidoId: ..., 
};

// Call the `borrarItemsPedidoRef()` function to get a reference to the mutation.
const ref = borrarItemsPedidoRef(borrarItemsPedidoVars);
// Variables can be defined inline as well.
const ref = borrarItemsPedidoRef({ pedidoId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = borrarItemsPedidoRef(dataConnect, borrarItemsPedidoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedidoItem_deleteMany);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedidoItem_deleteMany);
});
```

## AvanzarSectorPedido
You can execute the `AvanzarSectorPedido` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
avanzarSectorPedido(vars: AvanzarSectorPedidoVariables): MutationPromise<AvanzarSectorPedidoData, AvanzarSectorPedidoVariables>;

interface AvanzarSectorPedidoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AvanzarSectorPedidoVariables): MutationRef<AvanzarSectorPedidoData, AvanzarSectorPedidoVariables>;
}
export const avanzarSectorPedidoRef: AvanzarSectorPedidoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
avanzarSectorPedido(dc: DataConnect, vars: AvanzarSectorPedidoVariables): MutationPromise<AvanzarSectorPedidoData, AvanzarSectorPedidoVariables>;

interface AvanzarSectorPedidoRef {
  ...
  (dc: DataConnect, vars: AvanzarSectorPedidoVariables): MutationRef<AvanzarSectorPedidoData, AvanzarSectorPedidoVariables>;
}
export const avanzarSectorPedidoRef: AvanzarSectorPedidoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the avanzarSectorPedidoRef:
```typescript
const name = avanzarSectorPedidoRef.operationName;
console.log(name);
```

### Variables
The `AvanzarSectorPedido` mutation requires an argument of type `AvanzarSectorPedidoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AvanzarSectorPedidoVariables {
  id: UUIDString;
  estadoGlobal: EstadoPedido;
  estadoCocina: EstadoSector;
  estadoBar: EstadoSector;
}
```
### Return Type
Recall that executing the `AvanzarSectorPedido` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AvanzarSectorPedidoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AvanzarSectorPedidoData {
  pedido_update?: Pedido_Key | null;
}
```
### Using `AvanzarSectorPedido`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, avanzarSectorPedido, AvanzarSectorPedidoVariables } from '@dataconnect/generated';

// The `AvanzarSectorPedido` mutation requires an argument of type `AvanzarSectorPedidoVariables`:
const avanzarSectorPedidoVars: AvanzarSectorPedidoVariables = {
  id: ..., 
  estadoGlobal: ..., 
  estadoCocina: ..., 
  estadoBar: ..., 
};

// Call the `avanzarSectorPedido()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await avanzarSectorPedido(avanzarSectorPedidoVars);
// Variables can be defined inline as well.
const { data } = await avanzarSectorPedido({ id: ..., estadoGlobal: ..., estadoCocina: ..., estadoBar: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await avanzarSectorPedido(dataConnect, avanzarSectorPedidoVars);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
avanzarSectorPedido(avanzarSectorPedidoVars).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

### Using `AvanzarSectorPedido`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, avanzarSectorPedidoRef, AvanzarSectorPedidoVariables } from '@dataconnect/generated';

// The `AvanzarSectorPedido` mutation requires an argument of type `AvanzarSectorPedidoVariables`:
const avanzarSectorPedidoVars: AvanzarSectorPedidoVariables = {
  id: ..., 
  estadoGlobal: ..., 
  estadoCocina: ..., 
  estadoBar: ..., 
};

// Call the `avanzarSectorPedidoRef()` function to get a reference to the mutation.
const ref = avanzarSectorPedidoRef(avanzarSectorPedidoVars);
// Variables can be defined inline as well.
const ref = avanzarSectorPedidoRef({ id: ..., estadoGlobal: ..., estadoCocina: ..., estadoBar: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = avanzarSectorPedidoRef(dataConnect, avanzarSectorPedidoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

## ActualizarEstadoPedido
You can execute the `ActualizarEstadoPedido` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
actualizarEstadoPedido(vars: ActualizarEstadoPedidoVariables): MutationPromise<ActualizarEstadoPedidoData, ActualizarEstadoPedidoVariables>;

interface ActualizarEstadoPedidoRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ActualizarEstadoPedidoVariables): MutationRef<ActualizarEstadoPedidoData, ActualizarEstadoPedidoVariables>;
}
export const actualizarEstadoPedidoRef: ActualizarEstadoPedidoRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
actualizarEstadoPedido(dc: DataConnect, vars: ActualizarEstadoPedidoVariables): MutationPromise<ActualizarEstadoPedidoData, ActualizarEstadoPedidoVariables>;

interface ActualizarEstadoPedidoRef {
  ...
  (dc: DataConnect, vars: ActualizarEstadoPedidoVariables): MutationRef<ActualizarEstadoPedidoData, ActualizarEstadoPedidoVariables>;
}
export const actualizarEstadoPedidoRef: ActualizarEstadoPedidoRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the actualizarEstadoPedidoRef:
```typescript
const name = actualizarEstadoPedidoRef.operationName;
console.log(name);
```

### Variables
The `ActualizarEstadoPedido` mutation requires an argument of type `ActualizarEstadoPedidoVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ActualizarEstadoPedidoVariables {
  id: UUIDString;
  estadoGlobal: EstadoPedido;
}
```
### Return Type
Recall that executing the `ActualizarEstadoPedido` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ActualizarEstadoPedidoData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ActualizarEstadoPedidoData {
  pedido_update?: Pedido_Key | null;
}
```
### Using `ActualizarEstadoPedido`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, actualizarEstadoPedido, ActualizarEstadoPedidoVariables } from '@dataconnect/generated';

// The `ActualizarEstadoPedido` mutation requires an argument of type `ActualizarEstadoPedidoVariables`:
const actualizarEstadoPedidoVars: ActualizarEstadoPedidoVariables = {
  id: ..., 
  estadoGlobal: ..., 
};

// Call the `actualizarEstadoPedido()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await actualizarEstadoPedido(actualizarEstadoPedidoVars);
// Variables can be defined inline as well.
const { data } = await actualizarEstadoPedido({ id: ..., estadoGlobal: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await actualizarEstadoPedido(dataConnect, actualizarEstadoPedidoVars);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
actualizarEstadoPedido(actualizarEstadoPedidoVars).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

### Using `ActualizarEstadoPedido`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, actualizarEstadoPedidoRef, ActualizarEstadoPedidoVariables } from '@dataconnect/generated';

// The `ActualizarEstadoPedido` mutation requires an argument of type `ActualizarEstadoPedidoVariables`:
const actualizarEstadoPedidoVars: ActualizarEstadoPedidoVariables = {
  id: ..., 
  estadoGlobal: ..., 
};

// Call the `actualizarEstadoPedidoRef()` function to get a reference to the mutation.
const ref = actualizarEstadoPedidoRef(actualizarEstadoPedidoVars);
// Variables can be defined inline as well.
const ref = actualizarEstadoPedidoRef({ id: ..., estadoGlobal: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = actualizarEstadoPedidoRef(dataConnect, actualizarEstadoPedidoVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pedido_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pedido_update);
});
```

