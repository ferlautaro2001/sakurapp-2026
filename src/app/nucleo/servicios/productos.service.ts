import { Injectable, computed, inject } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import { createProducto, connectorConfig, Sector as DcSector, TipoProducto as DcTipoProducto } from '../../../dataconnect-generated';
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
  readonly bebidas = computed(() => this.almacen.productos().filter((p) => p.activo && p.tipo === 'BEBIDA'));

  existeNombre(nombre: string): boolean {
    const buscado = nombre.trim().toLocaleLowerCase('es-AR');
    return this.almacen.productos().some((p) => p.activo && p.nombre.trim().toLocaleLowerCase('es-AR') === buscado);
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
}
