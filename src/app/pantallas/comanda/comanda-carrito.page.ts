import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CarritoService } from '../../nucleo/servicios/carrito.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

@Component({
  selector: 'lm-comanda-carrito',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado
        titulo="Mi carrito"
        conVolver
        (volver)="volverCarta()"
      >
        @if (mesaActiva(); as mesa) {
          <span accion class="mesa-activa">
            <lm-icono
              nombre="table_restaurant"
              [tamano]="18"
              color="#FFFFFF"
            />
            Mesa {{ mesa.numero }}
          </span>
        }
      </lm-encabezado>

      <div class="lm-body lm-body--gap12 contenido">
        <lm-titulo
          [contador]="carrito.cantidadTotal()"
          bajada="Modificá las cantidades antes de confirmar tu pedido"
        >
          Tu comanda
        </lm-titulo>

        <lm-banner
          tono="info"
          titulo="Pedido todavía sin enviar"
        >
          Los productos de este carrito todavía no llegaron a Cocina ni a Bar.
        </lm-banner>

        @if (carrito.items().length) {
          <div class="lista-carrito">
            @for (
              item of carrito.items();
              track item.producto.id
            ) {
              <article class="item-carrito">
                <span class="item-carrito__foto">
                  @if (item.producto.fotos[0]) {
                    <img
                      [src]="item.producto.fotos[0]"
                      [alt]="item.producto.nombre"
                    />
                  } @else {
                    <lm-icono
                      nombre="restaurant"
                      [tamano]="30"
                      color="var(--action-primary)"
                    />
                  }
                </span>

                <span class="item-carrito__datos">
                  <strong>{{ item.producto.nombre }}</strong>

                  <span class="item-carrito__unitario">
                    {{ precio(item.producto.precio) }} cada uno
                  </span>

                  <span class="item-carrito__subtotal">
                    {{ precio(item.producto.precio * item.cantidad) }}
                  </span>
                </span>

                <span
                  class="cantidad"
                  [attr.aria-label]="
                    'Cantidad de ' + item.producto.nombre
                  "
                >
                  <button
                    type="button"
                    aria-label="Quitar una unidad"
                    (click)="restar(item.producto.id)"
                  >
                    <lm-icono nombre="remove" [tamano]="20" />
                  </button>

                  <strong>{{ item.cantidad }}</strong>

                  <button
                    type="button"
                    aria-label="Agregar una unidad"
                    (click)="sumar(item.producto.id)"
                  >
                    <lm-icono nombre="add" [tamano]="20" />
                  </button>
                </span>
              </article>
            }
          </div>
        } @else {
          <lm-vacio
            icono="shopping_cart"
            titulo="Tu carrito está vacío"
          >
            Volvé a la carta y agregá los productos que quieras pedir.
          </lm-vacio>
        }
      </div>

      <section
        class="sk-barra-total"
        aria-label="Resumen permanente del carrito"
        aria-live="polite"
      >
        <span class="resumen">
          <span>
            <small>TOTAL</small>
            <strong>{{ precio(carrito.importeTotal()) }}</strong>
          </span>

          <span>
            <small>TIEMPO ESTIMADO</small>
            <strong>
              <lm-icono nombre="schedule" [tamano]="19" />
              {{ carrito.tiempoEstimado() }} minutos
            </strong>
          </span>
        </span>

        <lm-boton
          icono="restaurant_menu"
          (presionar)="volverCarta()"
        >
          Seguir eligiendo
        </lm-boton>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      .contenido {
        padding-bottom: 12px;
      }

      .mesa-activa {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.72);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
        color: #ffffff;
        font: var(--type-body-small);
        font-weight: 800;
        white-space: nowrap;
      }

      .lista-carrito {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .item-carrito {
        display: grid;
        grid-template-columns: 76px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: var(--radius-card);
        background: var(--surface-card);
        box-shadow: var(--shadow-raised);
      }

      .item-carrito__foto {
        display: grid;
        place-items: center;
        width: 76px;
        height: 76px;
        overflow: hidden;
        border-radius: 14px;
        background: var(--surface-soft);
      }

      .item-carrito__foto img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .item-carrito__datos {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 4px;
        color: var(--text-title);
      }

      .item-carrito__datos strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .item-carrito__unitario {
        color: var(--text-muted);
        font: var(--type-caption);
      }

      .item-carrito__subtotal {
        color: var(--action-primary);
        font-weight: 900;
      }

      .cantidad {
        display: grid;
        grid-template-columns: 40px 34px 40px;
        align-items: center;
        text-align: center;
      }

      .cantidad button {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border: 2px solid var(--action-primary);
        border-radius: 50%;
        background: #ffffff;
        color: var(--action-primary);
        cursor: pointer;
      }

      .cantidad strong {
        color: var(--text-title);
        font-size: 18px;
      }

      .sk-barra-total {
        position: sticky;
        z-index: 20;
        bottom: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px 18px calc(14px + env(safe-area-inset-bottom));
        border-top: 2px solid rgba(255, 255, 255, 0.72);
        background: var(--action-primary);
        box-shadow: 0 -6px 22px rgba(38, 4, 17, 0.32);
        color: #ffffff;
      }

      .resumen {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .resumen > span {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 3px;
        padding: 10px 12px;
        border: 1px solid rgba(255, 255, 255, 0.7);
        border-radius: 14px;
        background: rgba(58, 0, 22, 0.28);
      }

      .resumen small {
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
      }

      .resumen strong {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #ffffff;
        font-size: clamp(18px, 5vw, 25px);
        font-weight: 900;
      }

      @media (max-width: 480px) {
        .item-carrito {
          grid-template-columns: 64px minmax(0, 1fr);
        }

        .item-carrito__foto {
          width: 64px;
          height: 64px;
        }

        .cantidad {
          grid-column: 1 / -1;
          justify-content: end;
        }
      }
    `,
  ],
})
export class ComandaCarritoPage extends PaginaConSesion {
  protected readonly carrito = inject(CarritoService);
  private readonly route = inject(ActivatedRoute);
  private readonly mesas = inject(MesasService);

  protected readonly mesaId =
    this.route.snapshot.queryParamMap.get('mesaId') ??
    this.carrito.mesaId();

  protected readonly mesaActiva = computed(() =>
    this.mesaId
      ? this.mesas.porId(this.mesaId)
      : undefined,
  );

  constructor() {
    super();

    if (this.mesaId) {
      this.carrito.iniciarMesa(this.mesaId);
    }
  }

  protected sumar(productoId: string): void {
    this.carrito.sumar(productoId);
  }

  protected restar(productoId: string): void {
    this.carrito.restar(productoId);
  }

  protected precio(valor: number): string {
    return `$ ${valor.toLocaleString('es-AR')}`;
  }

  protected volverCarta(): void {
    void this.router.navigate(
      ['/carta'],
      {
        queryParams: this.mesaId
          ? { mesaId: this.mesaId }
          : undefined,
      },
    );
  }
}