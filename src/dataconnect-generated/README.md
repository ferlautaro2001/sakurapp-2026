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
  - [*CreateProducto*](#createproducto)
  - [*CreateUsuario*](#createusuario)
  - [*CreateMesa*](#createmesa)
  - [*CreatePedido*](#createpedido)
  - [*CreateEncuesta*](#createencuesta)
  - [*UpdateEstadoUsuario*](#updateestadousuario)

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

