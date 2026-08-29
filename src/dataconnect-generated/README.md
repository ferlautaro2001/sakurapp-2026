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
- [**Mutations**](#mutations)

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
      numero: number;
    };
    cliente: {
      nombre: string;
      apellido?: string | null;
    };
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

# Mutations

No mutations were generated for the `example` connector.

If you want to learn more about how to use mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

