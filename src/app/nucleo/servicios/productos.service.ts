import { Injectable, computed, inject } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import { createProducto, updateActivoProducto, updateProducto, connectorConfig, Sector as DcSector, TipoProducto as DcTipoProducto } from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { AlmacenService } from '../datos/almacen.service';
import { nuevoId } from '../datos/semilla';
import { Producto } from '../modelos/modelos';
import { Sector, TipoProducto, sectorDe } from '../modelos/enums';
import { AlmacenamientoService } from './almacenamiento.service';

export interface AltaProducto {
  nombre: string;
  descripcion: string;
  precio: number;
  tiempoElaboracion: number;
  tipo: TipoProducto;
  fotos: string[];
}

/** Persistencia de carta para altas de bebidas y platos. */
@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly almacen = inject(AlmacenService);
  private readonly almacenamiento = inject(AlmacenamientoService);
  readonly todos = computed(() =>
  this.almacen.productos().filter((producto) => producto.activo),
  );

  readonly disponibles = computed(() =>
    this.todos().filter((producto) => producto.disponible),
  );

  readonly comidas = computed(() =>
    this.todos().filter((producto) => producto.tipo === 'COMIDA'),
  );

  readonly bebidas = computed(() =>
    this.todos().filter((producto) => producto.tipo === 'BEBIDA'),
  );

  readonly postres = computed(() =>
    this.todos().filter((producto) => producto.tipo === 'POSTRE'),
  );

  porId(id: string): Producto | undefined {
    return this.todos().find((producto) => producto.id === id);
  }

  porTipo(tipo: TipoProducto): Producto[] {
    return this.todos().filter((producto) => producto.tipo === tipo);
  }
  existeNombre(
    nombre: string,
    excluirId?: string,
  ): boolean {
    const buscado = nombre
      .trim()
      .toLocaleLowerCase('es-AR');

    return this.almacen.productos().some(
      (producto) =>
        producto.activo &&
        producto.id !== excluirId &&
        producto.nombre
          .trim()
          .toLocaleLowerCase('es-AR') === buscado,
    );
  }

  async crear(datos: AltaProducto): Promise<Producto> {
    const idLocal = nuevoId();
    const sector: Sector = sectorDe(datos.tipo);
    let fotos = datos.fotos;
    try {
      fotos = await this.almacenamiento.subirMultiplesFotos(`productos/${idLocal}`, datos.fotos);
    } catch (err) {
      console.warn('Firebase Storage alta de producto:', err);
    }

    const producto: Producto = {
      id: idLocal,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      precio: datos.precio,
      tiempoElaboracion: datos.tiempoElaboracion,
      tipo: datos.tipo,
      sector,
      fotos,
      activo: true,
      disponible: true,
    };
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const res = await createProducto(getDataConnect(app, connectorConfig), {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        tiempoElaboracion: producto.tiempoElaboracion,
        tipo: producto.tipo as DcTipoProducto,
        sector: producto.sector as DcSector,
        foto1: producto.fotos[0],
        foto2: producto.fotos[1],
        foto3: producto.fotos[2],
      });
      if (res?.data?.producto_insert?.id) producto.id = res.data.producto_insert.id;
    } catch (err) {
      console.warn('Cloud SQL alta de producto:', err);
    }
    await this.almacen.guardarProductos([...this.almacen.productos(), producto]);
    return producto;
  }

  async editar(id: string, datos: AltaProducto): Promise<Producto> {
  const existente = this.almacen
    .productos()
    .find((producto) => producto.id === id);

  if (!existente) {
    throw new Error('El producto no existe.');
  }

  const sector: Sector = sectorDe(datos.tipo);

  const fotos = await this.almacenamiento.subirMultiplesFotos(
    `productos/${id}`,
    datos.fotos,
  );

  const actualizado: Producto = {
    ...existente,
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    precio: datos.precio,
    tiempoElaboracion: datos.tiempoElaboracion,
    tipo: datos.tipo,
    sector,
    fotos,
  };

  const app = getApps().length
    ? getApp()
    : initializeApp(environment.firebase);

  await updateProducto(
    getDataConnect(app, connectorConfig),
    {
      id,
      nombre: actualizado.nombre,
      descripcion: actualizado.descripcion,
      precio: actualizado.precio,
      tiempoElaboracion: actualizado.tiempoElaboracion,
      tipo: actualizado.tipo as DcTipoProducto,
      sector: actualizado.sector as DcSector,
      foto1: actualizado.fotos[0],
      foto2: actualizado.fotos[1],
      foto3: actualizado.fotos[2],
    },
  );

  const productos = this.almacen
    .productos()
    .map((producto) =>
      producto.id === id ? actualizado : producto,
    );

  await this.almacen.guardarProductos(productos);

  return actualizado;
}

async quitarDeLaCarta(id: string): Promise<void> {
  const existente = this.almacen
    .productos()
    .find((producto) => producto.id === id);

  if (!existente) {
    throw new Error('El producto no existe.');
  }

  const app = getApps().length
    ? getApp()
    : initializeApp(environment.firebase);

  await updateActivoProducto(
    getDataConnect(app, connectorConfig),
    {
      id,
      activo: false,
    },
  );

  const productos = this.almacen
    .productos()
    .map((producto) =>
      producto.id === id
        ? { ...producto, activo: false }
        : producto,
    );

  await this.almacen.guardarProductos(productos);
}
}
