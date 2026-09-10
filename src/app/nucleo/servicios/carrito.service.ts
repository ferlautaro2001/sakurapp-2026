import { Injectable, computed, signal } from '@angular/core';
import { Producto } from '../modelos/modelos';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly estado = signal<ItemCarrito[]>([]);
  private readonly mesaActual = signal<string | null>(null);

  readonly items = this.estado.asReadonly();
  readonly mesaId = this.mesaActual.asReadonly();

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

  readonly tiempoEstimado = computed(() => {
    const tiempos = this.items().map(
      (item) => item.producto.tiempoElaboracion,
    );

    return tiempos.length
      ? Math.max(...tiempos)
      : 0;
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

  vaciar(): void {
    this.estado.set([]);
  }
}