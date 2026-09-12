import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  MarcaRechazo,
  ROTULO_ALCANCE_RECHAZO,
  ROTULO_MARCA_RECHAZO,
} from '../../nucleo/modelos/enums';
import { CarritoService, ItemCarrito } from '../../nucleo/servicios/carrito.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

@Component({
  selector: 'lm-comanda-carrito',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado
        [titulo]="corrigiendo() ? 'Corregir mi pedido' : 'Mi carrito'"
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
          [bajada]="
            corrigiendo()
              ? 'Corregí lo que marcó el mozo y volvé a mandarlo'
              : 'Modificá las cantidades antes de confirmar tu pedido'
          "
        >
          Tu comanda
        </lm-titulo>

        @if (devuelto(); as pedido) {
          <section class="lm-card devuelto">
            <div class="devuelto__encabezado">
              <lm-icono nombre="edit_note" [tamano]="24" color="var(--state-error)" />
              <div>
                <b>{{ alcance() }}</b>
                <small>Lo devolvió {{ pedido.rechazadoPorNombre ?? 'el mozo del salón' }}</small>
              </div>
            </div>
            <p class="devuelto__motivo">{{ pedido.motivoRechazo }}</p>
          </section>

          @if (pedido.observaciones.length) {
            <div class="lm-card leyenda">
              <span class="leyenda__item">
                <i class="leyenda__sello leyenda__sello--cantidad">
                  <lm-icono nombre="warning" [tamano]="16" color="#FFFFFF" />
                </i>
                <span><b>Hay menos de lo que pediste.</b> Bajá la cantidad: el más queda apagado.</span>
              </span>
              <span class="leyenda__item">
                <i class="leyenda__sello leyenda__sello--cambiar">
                  <lm-icono nombre="block" [tamano]="16" color="#FFFFFF" />
                </i>
                <span><b>No lo pueden preparar.</b> Sacalo o cambialo por otra cosa.</span>
              </span>
            </div>
          }

          @if (aCambiar().length) {
            <lm-boton
              variante="danger"
              icono="delete_sweep"
              (presionar)="sacarLosQueNoVan()"
            >
              {{
                aCambiar().length === 1
                  ? 'Sacar el producto en rojo'
                  : 'Sacar los ' + aCambiar().length + ' productos en rojo'
              }}
            </lm-boton>
          }

          @if (traba(); as falta) {
            <lm-banner tono="error" titulo="Todavía no lo podés mandar">{{ falta }}</lm-banner>
          }
        } @else {
          <lm-banner
            tono="info"
            titulo="Pedido todavía sin enviar"
          >
            Los productos de este carrito todavía no llegaron a Cocina ni a Bar.
          </lm-banner>
        }

        @if (carrito.items().length) {
          <div class="lista-carrito">
            @for (
              item of carrito.items();
              track item.producto.id
            ) {
              <article
                class="item-carrito"
                [class.item-carrito--cantidad]="marca(item) === 'CANTIDAD'"
                [class.item-carrito--cambiar]="marca(item) === 'CAMBIAR'"
              >
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

                  @if (marca(item); as marcado) {
                    <span
                      class="item-carrito__marca"
                      [class.item-carrito__marca--cantidad]="marcado === 'CANTIDAD'"
                      [class.item-carrito__marca--cambiar]="marcado === 'CAMBIAR'"
                    >
                      <lm-icono
                        [nombre]="marcado === 'CANTIDAD' ? 'warning' : 'block'"
                        [tamano]="15"
                      />
                      {{ rotuloMarca(marcado) }}
                    </span>
                  }

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
                    [disabled]="noPuedeSumar(item)"
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
          icono="send"
          [deshabilitado]="
            !carrito.items().length || enviando() || traba() !== null
          "
          (presionar)="finalizarPedido()"
        >
          {{ corrigiendo() ? 'Reenviar pedido corregido' : 'Finalizar y enviar pedido' }}
        </lm-boton>

        <lm-texto-boton
          enfasis="claro"
          (presionar)="volverCarta()"
        >
          Seguir eligiendo
        </lm-texto-boton>
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

      /* US-7.2 · el renglón marcado por el mozo se tiñe igual que en su
         pantalla, para que el comensal reconozca de qué le está hablando. */
      .item-carrito--cantidad {
        box-shadow: 0 0 0 2px var(--state-pending), var(--shadow-raised);
        background: var(--state-pending-surface);
      }

      .item-carrito--cambiar {
        box-shadow: 0 0 0 2px var(--state-error), var(--shadow-raised);
        background: var(--state-error-surface);
      }

      .item-carrito__marca {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font: var(--type-caption);
        font-weight: 800;
      }

      .item-carrito__marca--cantidad {
        color: var(--state-pending);
      }

      .item-carrito__marca--cambiar {
        color: var(--state-error);
      }

      .devuelto {
        padding: 14px;
        border-left: 4px solid var(--state-error);
      }

      .devuelto__encabezado {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .devuelto__encabezado b {
        display: block;
        color: var(--state-error);
        font: var(--type-card-title);
      }

      .devuelto__encabezado small {
        display: block;
        color: var(--text-muted);
        font: var(--type-caption);
      }

      .devuelto__motivo {
        margin: 10px 0 0;
        color: var(--text-body);
        font: var(--type-body);
        text-wrap: pretty;
      }

      .leyenda {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px;
      }

      .leyenda__item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: var(--text-body);
        font: var(--type-body-small);
        text-wrap: pretty;
      }

      .leyenda__item b {
        color: var(--text-title);
      }

      .leyenda__sello {
        display: grid;
        flex: 0 0 auto;
        width: 26px;
        height: 26px;
        place-items: center;
        border-radius: 50%;
      }

      .leyenda__sello--cantidad {
        background: var(--state-pending);
      }

      .leyenda__sello--cambiar {
        background: var(--state-error);
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

      /* En los amarillos subir la cantidad no tiene sentido: el mozo avisó que
         hay menos de lo pedido. El botón queda apagado, no escondido. */
      .cantidad button[disabled] {
        border-color: var(--border-divider);
        color: var(--text-muted);
        cursor: not-allowed;
        opacity: 0.55;
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
  private readonly pedidos = inject(PedidosService);

  protected readonly enviando = signal(false);

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

  /**
   * US-7.2 · AC-7.2.2 · la comanda que el mozo devolvió y el comensal está
   * corrigiendo, si es que hay alguna.
   */
  protected readonly devuelto = computed(() => {
    const id = this.carrito.pedidoEnEdicion();
    if (!id) return undefined;
    const pedido = this.pedidos.porId(id);
    return pedido?.estadoGlobal === 'RECHAZADO' ? pedido : undefined;
  });

  protected readonly corrigiendo = computed(() => this.devuelto() !== undefined);

  /** Los que el mozo marcó en rojo y todavía están en el carrito. */
  protected readonly aCambiar = computed(() =>
    this.pedidos.itemsACambiar(this.devuelto(), this.carrito.items()),
  );

  /** Lo que le falta corregir antes de poder reenviar. Nulo si ya puede. */
  protected readonly traba = computed(() =>
    this.corrigiendo()
      ? this.pedidos.trabaParaReenviar(this.devuelto(), this.carrito.items())
      : null,
  );

  protected alcance(): string {
    const alcance = this.devuelto()?.alcanceRechazo;
    return alcance ? ROTULO_ALCANCE_RECHAZO[alcance] : 'Modificación pedida';
  }

  protected marca(item: ItemCarrito): MarcaRechazo | null {
    return this.pedidos.marcaDe(this.devuelto(), item.producto.id);
  }

  protected rotuloMarca(marca: MarcaRechazo): string {
    return ROTULO_MARCA_RECHAZO[marca];
  }

  /** En un amarillo, subir la cantidad va justo en contra de lo que pidió el mozo. */
  protected noPuedeSumar(item: ItemCarrito): boolean {
    return this.marca(item) === 'CANTIDAD';
  }

  /** Saca de una vez todos los renglones que el mozo marcó en rojo. */
  protected async sacarLosQueNoVan(): Promise<void> {
    const enRojo = this.aCambiar();
    if (!enRojo.length) return;

    const seguro = await this.preguntar({
      titulo:
        enRojo.length === 1
          ? '¿Sacás el producto en rojo?'
          : `¿Sacás los ${enRojo.length} productos en rojo?`,
      mensaje:
        'Son los que el mozo marcó como imposibles de preparar. Salen de tu pedido y podés elegir otra cosa desde la carta.',
      confirmar: 'Sacarlos del pedido',
      tono: 'peligro',
      icono: 'delete_sweep',
      detalle: enRojo.map((item) => ({
        rotulo: item.producto.nombre,
        valor: `${item.cantidad}`,
      })),
    });
    if (!seguro) return;

    for (const item of enRojo) this.carrito.quitar(item.producto.id);
    this.avisos.info('Listo', 'Podés elegir otra cosa desde la carta.');
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

  protected async finalizarPedido(): Promise<void> {
    const mesa = this.mesaActiva();
    const cliente = this.usuario();
    const items = this.carrito.items();

    if (!mesa || !cliente) {
      this.avisos.error(
        'No pudimos identificar la mesa',
        'Volvé a escanear el código QR de tu mesa.',
      );
      return;
    }

    if (!items.length) {
      this.avisos.error(
        'Tu carrito está vacío',
        'Agregá al menos un producto antes de enviar el pedido.',
      );
      return;
    }

    const corregido = this.devuelto();
    const falta = this.traba();
    if (corregido && falta) {
      this.avisos.error('Todavía no lo podés mandar', falta);
      return;
    }

    const confirmado = await this.preguntar({
      titulo: corregido ? '¿Reenviás el pedido corregido?' : '¿Enviás este pedido?',
      mensaje: corregido
        ? 'El mozo lo vuelve a revisar con los cambios que hiciste. Todavía no será enviado a Cocina ni a Bar.'
        : 'El pedido llegará al mozo para que lo revise y confirme. Todavía no será enviado a Cocina ni a Bar.',
      confirmar: corregido ? 'Reenviar pedido' : 'Enviar pedido',
      tono: 'exito',
      icono: 'send',
      detalle: [
        {
          rotulo: 'Mesa',
          valor: `Mesa ${mesa.numero}`,
        },
        {
          rotulo: 'Productos',
          valor: `${this.carrito.cantidadTotal()} unidades`,
        },
        {
          rotulo: 'Total',
          valor: this.precio(
            this.carrito.importeTotal(),
          ),
        },
        {
          rotulo: 'Tiempo estimado',
          valor: `${this.carrito.tiempoEstimado()} minutos`,
        },
      ],
    });

    if (!confirmado) {
      return;
    }

    this.enviando.set(true);

    try {
      const pedido = await this.cargando.conEsperaMinima(
        corregido ? 'Reenviando el pedido corregido…' : 'Enviando el pedido al mozo…',
        () =>
          corregido
            ? this.pedidos.reenviar(
                corregido,
                items,
                this.carrito.tiempoEstimado(),
                this.carrito.importeTotal(),
              )
            : this.pedidos.crearPendiente(
                mesa,
                cliente,
                items,
                this.carrito.tiempoEstimado(),
                this.carrito.importeTotal(),
              ),
      );

      // Solo se vacía después de guardar correctamente.
      this.carrito.vaciar();

      this.avisos.exito(
        corregido ? 'Pedido reenviado' : 'Pedido enviado',
        `El pedido de la mesa ${mesa.numero} está esperando la confirmación del mozo.`,
      );

      await this.router.navigate(
        ['/cliente/estado-pedido', pedido.id],
        {
          replaceUrl: true,
        },
      );
    } catch (error) {
      console.error('No se pudo enviar el pedido:', error);

      this.avisos.error(
        corregido ? 'No pudimos reenviar el pedido' : 'No pudimos enviar el pedido',
        error instanceof Error
          ? error.message
          : 'Revisá la conexión e intentá nuevamente.',
      );
    } finally {
      this.enviando.set(false);
    }
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