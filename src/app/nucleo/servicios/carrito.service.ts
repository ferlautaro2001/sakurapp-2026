import { Injectable, computed, signal } from '@angular/core';
import { sectorDe } from '../modelos/enums';
import { Pedido, Producto } from '../modelos/modelos';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly estado = signal<ItemCarrito[]>([]);
  private readonly mesaActual = signal<string | null>(null);
  private readonly enEdicion = signal<string | null>(null);

  readonly items = this.estado.asReadonly();
  readonly mesaId = this.mesaActual.asReadonly();

  /**
   * US-7.2 · AC-7.2.2 · identificador del pedido que el mozo devolvió y el
   * comensal está corrigiendo. Vive en el servicio y no en la dirección de la
   * pantalla para que ir a la carta a agregar algo y volver no lo pierda.
   */
  readonly pedidoEnEdicion = this.enEdicion.asReadonly();

  readonly cantidadTotal = computed(() =>
    this.items().reduce(
      (total, item) => total + item.cantidad,
      0,
    ),
  );

  readonly importeTotal = computed(() =>
    this.items().reduce(
      (total, item) =>
        total + item.producto.precio * item.cantidad,
      0,
    ),
  );

  /**
   * Minutos que va a tardar el pedido completo.
   *
   * Adentro de cada sector los productos se hacen uno después del otro, así
   * que sus tiempos se **suman**; las unidades repetidas de un mismo producto
   * no multiplican, porque dos ramen salen juntos de la misma olla. La cocina
   * y la barra trabajan a la vez, así que el pedido tarda lo que tarde el
   * sector más cargado.
   *
   * Antes era el máximo de todos los productos, y eso subestimaba: cinco
   * platos de veinte minutos no salen en veinte.
   */
  readonly tiempoEstimado = computed(() => {
    const porSector = new Map<string, number>();

    for (const item of this.items()) {
      const sector = sectorDe(item.producto.tipo);
      porSector.set(
        sector,
        (porSector.get(sector) ?? 0) + item.producto.tiempoElaboracion,
      );
    }

    return porSector.size ? Math.max(...porSector.values()) : 0;
  });

  iniciarMesa(mesaId: string): void {
    if (
      this.mesaActual() &&
      this.mesaActual() !== mesaId
    ) {
      this.estado.set([]);
    }

    this.mesaActual.set(mesaId);
  }

  agregar(producto: Producto): void {
    if (!producto.disponible) {
      return;
    }

    this.estado.update((items) => {
      const existente = items.find(
        (item) => item.producto.id === producto.id,
      );

      if (!existente) {
        return [
          ...items,
          {
            producto,
            cantidad: 1,
          },
        ];
      }

      return items.map((item) =>
        item.producto.id === producto.id
          ? {
              ...item,
              cantidad: item.cantidad + 1,
            }
          : item,
      );
    });
  }

  sumar(productoId: string): void {
    this.estado.update((items) =>
      items.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad: item.cantidad + 1,
            }
          : item,
      ),
    );
  }

  restar(productoId: string): void {
    this.estado.update((items) =>
      items
        .map((item) =>
          item.producto.id === productoId
            ? {
                ...item,
                cantidad: item.cantidad - 1,
              }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  }

  quitar(productoId: string): void {
    this.estado.update((items) =>
      items.filter(
        (item) => item.producto.id !== productoId,
      ),
    );
  }

  /**
   * US-7.2 · AC-7.2.2 · reabre en el carrito la comanda que el mozo devolvió.
   *
   * Se precargan los renglones tal como los mandó, con sus cantidades, para
   * que el comensal corrija sobre lo suyo en lugar de armar todo de nuevo. Un
   * producto que ya no esté en la carta simplemente no vuelve: no se puede
   * pedir algo que el local dio de baja.
   */
  editarPedido(pedido: Pedido, buscarProducto: (id: string) => Producto | undefined): void {
    const items: ItemCarrito[] = [];

    for (const item of pedido.items) {
      const producto = buscarProducto(item.productoId);
      if (!producto) continue;
      items.push({ producto, cantidad: Math.max(1, item.cantidad) });
    }

    this.mesaActual.set(pedido.mesaId);
    this.estado.set(items);
    this.enEdicion.set(pedido.id);
  }

  /** Deja de corregir: lo que haya en el carrito vuelve a ser un pedido nuevo. */
  dejarDeEditar(): void {
    this.enEdicion.set(null);
  }

  vaciar(): void {
    this.estado.set([]);
    this.enEdicion.set(null);
  }
}