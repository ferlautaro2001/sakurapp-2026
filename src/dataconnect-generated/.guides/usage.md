# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.


### Angular

The generated SDK creates injectable wrapper functions.

Here's an example:
```
import { injectCreateProducto, injectCreateUsuario, injectCreateMesa, injectCreatePedido, injectCreateEncuesta, injectUpdateEstadoUsuario, injectListProductos, injectListMesas, injectListUsuarios, injectListPedidosActivos } from '@dataconnect/generated/angular';

@Component({
  selector: 'my-component',
  ...
})
class MyComponent {
  // The types of these injectors are available in angular/index.d.ts
  private readonly CreateProductoOperation = injectCreateProducto(createProductoVars);
  private readonly CreateUsuarioOperation = injectCreateUsuario(createUsuarioVars);
  private readonly CreateMesaOperation = injectCreateMesa(createMesaVars);
  private readonly CreatePedidoOperation = injectCreatePedido(createPedidoVars);
  private readonly CreateEncuestaOperation = injectCreateEncuesta(createEncuestaVars);
  private readonly UpdateEstadoUsuarioOperation = injectUpdateEstadoUsuario(updateEstadoUsuarioVars);
  private readonly ListProductosOperation = injectListProductos();
  private readonly ListMesasOperation = injectListMesas();
  private readonly ListUsuariosOperation = injectListUsuarios();
  private readonly ListPedidosActivosOperation = injectListPedidosActivos();
  }
```

Each operation is a wrapper function around Tanstack Query Angular.

Here's an example:
```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'simple-example',
  template: `
    @if (movies.isPending()) {
      Loading...
    }
    @if (movies.error()) {
      An error has occurred: {{ movies.error().message }}
    }
    @if (movies.data(); as data) {
      @for (movie of data.movies ; track
        movie.id) {
      <h1>{{ movie.title }}</h1>
      <p>{{ movie.synopsis }}</p>
      }
    }
  `
})
export class SimpleExampleComponent {
  http = inject(HttpClient)

  movies = injectListMovies();
}
```




## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createProducto, createUsuario, createMesa, createPedido, createEncuesta, updateEstadoUsuario, listProductos, listMesas, listUsuarios, listPedidosActivos } from '@dataconnect/generated';


// Operation CreateProducto:  For variables, look at type CreateProductoVars in ../index.d.ts
const { data } = await CreateProducto(dataConnect, createProductoVars);

// Operation CreateUsuario:  For variables, look at type CreateUsuarioVars in ../index.d.ts
const { data } = await CreateUsuario(dataConnect, createUsuarioVars);

// Operation CreateMesa:  For variables, look at type CreateMesaVars in ../index.d.ts
const { data } = await CreateMesa(dataConnect, createMesaVars);

// Operation CreatePedido:  For variables, look at type CreatePedidoVars in ../index.d.ts
const { data } = await CreatePedido(dataConnect, createPedidoVars);

// Operation CreateEncuesta:  For variables, look at type CreateEncuestaVars in ../index.d.ts
const { data } = await CreateEncuesta(dataConnect, createEncuestaVars);

// Operation UpdateEstadoUsuario:  For variables, look at type UpdateEstadoUsuarioVars in ../index.d.ts
const { data } = await UpdateEstadoUsuario(dataConnect, updateEstadoUsuarioVars);

// Operation ListProductos: 
const { data } = await ListProductos(dataConnect);

// Operation ListMesas: 
const { data } = await ListMesas(dataConnect);

// Operation ListUsuarios: 
const { data } = await ListUsuarios(dataConnect);

// Operation ListPedidosActivos: 
const { data } = await ListPedidosActivos(dataConnect);


```