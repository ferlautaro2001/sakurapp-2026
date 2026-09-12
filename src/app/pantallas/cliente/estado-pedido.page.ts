import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import {
  MarcaRechazo,
  ROTULO_ALCANCE_RECHAZO,
  ROTULO_ESTADO_PEDIDO,
} from '../../nucleo/modelos/enums';
import { CarritoService, ItemCarrito } from '../../nucleo/servicios/carrito.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

/**
 * US-7.2 · "Mi pedido": una sola pantalla que cambia con el estado.
 *
 * Para quien está en la mesa esto siempre es "mi pedido", así que no se parte
 * en dos: cuando el mozo lo devuelve, acá mismo lee el motivo, ve los sellos
 * de cada renglón, corrige las cantidades y lo reenvía. No hay un paso
 * intermedio de "modificar" que lo mande a otra pantalla.
 *
 *  - `RECHAZADO` → el motivo del mozo y la comanda ya editable.
 *  - el resto → cómo viene el pedido, sector por sector.
 */
@Component({
  selector: 'lm-estado-pedido',
  imports: [CurrencyPipe, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />
      <div class="lm-body lm-body--gap12">
        @if (pedido(); as actual) {
          @if (corrigiendo()) {
            <lm-titulo bajada="El mozo te devolvió el pedido">Tu pedido necesita cambios</lm-titulo>

            <section class="lm-card devuelto">
              <div class="devuelto__encabezado">
                <lm-icono nombre="edit_note" [tamano]="24" color="var(--state-error)" />
                <div>
                  <b>{{ alcance() }}</b>
                  <small>Lo devolvió {{ actual.rechazadoPorNombre ?? 'el mozo del salón' }}</small>
                </div>
              </div>
              <p class="devuelto__motivo">{{ actual.motivoRechazo }}</p>
            </section>

            <lm-separador flor rotulo="Detalle" />

            @if (actual.observaciones.length) {
              <!-- Qué quiere decir cada sello de los renglones de abajo. -->
              <div class="lm-card leyenda">
                @if (hayAmarillos()) {
                  <span class="leyenda__item">
                    <i class="leyenda__sello leyenda__sello--cantidad">
                      <lm-icono nombre="warning" [tamano]="16" color="#FFFFFF" />
                    </i>
                    <span><b>Hay menos de lo que pediste.</b> Bajale la cantidad: no vas a poder sumar más.</span>
                  </span>
                }
                @if (aCambiar().length) {
                  <span class="leyenda__item">
                    <i class="leyenda__sello leyenda__sello--cambiar">
                      <lm-icono nombre="block" [tamano]="16" color="#FFFFFF" />
                    </i>
                    <span><b>No lo pueden preparar.</b> Sacalo del pedido o cambialo por otra cosa.</span>
                  </span>

                  <!-- El atajo va pegado a la explicación que lo justifica, no
                       suelto entre los renglones. -->
                  <button type="button" class="limpiar" (click)="sacarLosQueNoVan()">
                    <lm-icono nombre="delete_sweep" [tamano]="20" />
                    Eliminar los productos que no se pueden preparar
                  </button>
                }
              </div>
            }

            <div class="renglones">
              @for (item of carrito.items(); track item.producto.id) {
                <div
                  class="renglon"
                  [class.renglon--cantidad]="marcaDe(item) === 'CANTIDAD'"
                  [class.renglon--cambiar]="marcaDe(item) === 'CAMBIAR'"
                >
                  <span class="renglon__datos">
                    <b>{{ item.producto.nombre }}</b>
                    <small>
                      {{ item.cantidad }} ×
                      {{ item.producto.precio | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}
                    </small>
                  </span>

                  @if (marcaDe(item); as marcado) {
                    <i
                      class="renglon__sello"
                      [class.renglon__sello--cantidad]="marcado === 'CANTIDAD'"
                      [class.renglon__sello--cambiar]="marcado === 'CAMBIAR'"
                      [attr.aria-label]="rotuloMarca(marcado)"
                    >
                      <lm-icono
                        [nombre]="marcado === 'CANTIDAD' ? 'warning' : 'block'"
                        [tamano]="16"
                        color="#FFFFFF"
                      />
                    </i>
                  }

                  <span class="cantidad" [attr.aria-label]="'Cantidad de ' + item.producto.nombre">
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
                </div>
              }
            </div>

            @if (traba(); as falta) {
              <lm-banner tono="error" titulo="Todavía no lo podés mandar">{{ falta }}</lm-banner>
            } @else {
              <p class="lm-parrafo">
                Podés cambiar las cantidades acá o volver a la carta para sumar o sacar productos.
              </p>
            }
          } @else {
            <lm-titulo bajada="Actualización automática de Cocina y Bar">Estado de mi pedido</lm-titulo>

            <section class="lm-card estado">
              <span class="estado__icono"><lm-icono nombre="receipt_long" [tamano]="34" /></span>
              <div>
                <small>ESTADO GENERAL</small>
                <h2>{{ rotulo() }}</h2>
                <p>Mesa {{ actual.mesaNumero }} · {{ actual.items.length }} productos</p>
              </div>
            </section>

            <div class="lm-grid2">
              <section class="lm-card sector">
                <lm-icono nombre="skillet" [tamano]="28" />
                <small>COCINA</small><b>{{ rotuloSector(actual.estadoCocina) }}</b>
              </section>
              <section class="lm-card sector">
                <lm-icono nombre="local_bar" [tamano]="28" />
                <small>BAR</small><b>{{ rotuloSector(actual.estadoBar) }}</b>
              </section>
            </div>

            <section class="lm-card total">
              <span>Total del pedido</span>
              <b>{{ actual.totalFinal | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}</b>
            </section>

            @if (pedidos.juegosHabilitados(actual) && !actual.juegoIntentado) {
              <lm-boton icono="sports_esports" (presionar)="ir(['/juegos'])">Jugar por un descuento</lm-boton>
            } @else if (actual.juegoIntentado) {
              <lm-banner icono="redeem" [titulo]="actual.descuentoJuego ? 'Descuento aplicado' : 'Intento utilizado'">
                {{ actual.descuentoJuego ? 'Ganaste un ' + actual.descuentoJuego + '% para este pedido.' : 'Esta vez no hubo premio.' }}
              </lm-banner>
            }
          }
        } @else {
          <lm-vacio icono="receipt_long" titulo="Todavía no hay un pedido activo">
            Cuando envíes un pedido vas a poder seguir su preparación desde acá.
          </lm-vacio>
        }
      </div>

      @if (corrigiendo()) {
        <div class="lm-actionbar">
          <div class="resumen">
            <span>
              <small>TOTAL</small>
              <strong>{{ carrito.importeTotal() | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}</strong>
            </span>
            <span>
              <small>TIEMPO ESTIMADO</small>
              <strong>
                <lm-icono nombre="schedule" [tamano]="18" />
                {{ carrito.tiempoEstimado() }} minutos
              </strong>
            </span>
          </div>

          <lm-boton
            icono="send"
            [deshabilitado]="!carrito.items().length || enviando() || traba() !== null"
            (presionar)="reenviar()"
          >
            Reenviar el pedido corregido
          </lm-boton>
          <lm-texto-boton (presionar)="volverCarta()">Volver a la carta</lm-texto-boton>
        </div>
      }

      <lm-barra-inferior [items]="secciones()" activo="pedido" />
    </div>
  `,
  styles: [`
    :host{display:flex;flex:1;min-height:0}.estado{padding:18px;display:flex;align-items:center;gap:14px}
    .estado__icono{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:var(--action-primary);color:var(--text-on-primary)}
    .estado small,.sector small{font:var(--type-label);letter-spacing:var(--tracking-label);color:var(--text-muted)}
    .estado h2{margin:3px 0;font:var(--type-section-title);color:var(--text-title)}.estado p{margin:0;color:var(--text-muted)}
    .sector{padding:16px;display:grid;gap:5px;color:var(--action-primary)}.sector b{color:var(--text-title)}
    .total{padding:16px;display:flex;justify-content:space-between;align-items:center}.total b{font:var(--type-card-title);color:var(--text-title)}

    /* US-7.2 · la comanda devuelta. El motivo es lo único que le dice al
       comensal qué cambiar, así que va grande y sobre tarjeta. */
    .devuelto{padding:14px;border-left:4px solid var(--state-error)}
    .devuelto__encabezado{display:flex;align-items:center;gap:10px}
    .devuelto__encabezado b{display:block;font:var(--type-card-title);color:var(--state-error)}
    .devuelto__encabezado small{display:block;font:var(--type-caption);color:var(--text-muted)}
    .devuelto__motivo{margin:10px 0 0;font:var(--type-body);color:var(--text-body);text-wrap:pretty}

    .leyenda{display:flex;flex-direction:column;gap:10px;padding:14px}
    .leyenda__item{display:flex;align-items:flex-start;gap:10px;font:var(--type-body-small);color:var(--text-body);text-wrap:pretty}
    .leyenda__item b{color:var(--text-title)}
    /* El mismo sello que llevan los renglones, para que se reconozca. */
    .leyenda__sello{flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:grid;place-items:center}
    .leyenda__sello--cantidad{background:var(--state-pending)}
    .leyenda__sello--cambiar{background:var(--state-error)}

    /* Botón de alto libre: el rótulo es largo y en un teléfono entra en dos
       líneas, así que no puede usar la altura fija de los botones del
       sistema. Va pegado a la explicación que lo justifica. */
    .limpiar{
      display:flex;align-items:center;justify-content:center;gap:8px;
      width:100%;min-height:var(--touch-min);padding:10px 14px;margin-top:2px;
      border:none;border-radius:var(--radius-button);cursor:pointer;
      background:var(--state-error);color:#FFF6F5;
      font:var(--type-button);line-height:1.25;text-align:center;text-wrap:balance;
    }
    .limpiar:active{background:#9E1D13;transform:scale(0.99)}

    .renglones{display:flex;flex-direction:column;gap:8px}
    .renglon{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius-card);background:var(--surface-card);box-shadow:var(--shadow-card)}
    .renglon--cantidad{background:var(--state-pending-surface);box-shadow:0 0 0 2px var(--state-pending),var(--shadow-card)}
    .renglon--cambiar{background:var(--state-error-surface);box-shadow:0 0 0 2px var(--state-error),var(--shadow-card)}
    .renglon__datos{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
    .renglon__datos b{font:var(--type-card-title);color:var(--text-title);text-wrap:pretty}
    .renglon__datos small{font:var(--type-caption);color:var(--text-muted)}
    .renglon__sello{flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:grid;place-items:center}
    .renglon__sello--cantidad{background:var(--state-pending)}
    .renglon__sello--cambiar{background:var(--state-error)}

    /* El control de cantidad, igual que en el carrito. */
    .cantidad{flex:0 0 auto;display:flex;align-items:center;gap:6px}
    .cantidad button{
      width:34px;height:34px;border-radius:50%;border:none;cursor:pointer;
      display:grid;place-items:center;
      background:var(--surface-sunken);color:var(--action-primary);
    }
    .cantidad button:disabled{opacity:.38;cursor:not-allowed}
    .cantidad button:active:not(:disabled){transform:scale(.94)}
    .cantidad strong{min-width:18px;text-align:center;font:var(--type-card-title);color:var(--text-title)}

    /* El resumen permanente arriba de la acción de reenviar. */
    .resumen{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .resumen span{display:flex;flex-direction:column;gap:2px}
    .resumen small{font:var(--type-label);letter-spacing:var(--tracking-label);color:#FFFFFF;opacity:.82}
    .resumen strong{display:flex;align-items:center;gap:6px;font:var(--type-card-title);color:#FFFFFF}
  `],
})
export class EstadoPedidoPage extends PaginaConSesion implements OnInit {
  protected readonly pedidos = inject(PedidosService);
  protected readonly carrito = inject(CarritoService);
  private readonly productos = inject(ProductosService);

  protected readonly enviando = signal(false);

  protected readonly pedido = computed(() => this.pedidos.activoDe(this.usuario()));
  protected readonly rotulo = computed(() => {
    const pedido = this.pedido();
    return pedido ? ROTULO_ESTADO_PEDIDO[pedido.estadoGlobal] : '';
  });

  /** US-7.2 · AC-7.2.2 · la comanda devuelta que está corrigiendo, si la hay. */
  protected readonly devuelto = computed(() => {
    const pedido = this.pedido();
    return pedido?.estadoGlobal === 'RECHAZADO' ? pedido : undefined;
  });

  protected readonly corrigiendo = computed(() => this.devuelto() !== undefined);

  /** Los que el mozo marcó en rojo y todavía están en la comanda. */
  protected readonly aCambiar = computed(() =>
    this.pedidos.itemsACambiar(this.devuelto(), this.carrito.items()),
  );

  /** Si el mozo marcó algo por cantidad, aunque ya lo hayan bajado. */
  protected readonly hayAmarillos = computed(() =>
    (this.devuelto()?.observaciones ?? []).some((o) => o.marca === 'CANTIDAD'),
  );

  /** Lo que le falta corregir antes de poder reenviar. Nulo si ya puede. */
  protected readonly traba = computed(() =>
    this.corrigiendo()
      ? this.pedidos.trabaParaReenviar(this.devuelto(), this.carrito.items())
      : null,
  );

  constructor() {
    super();

    // La comanda devuelta se abre sola en el carrito: corregir es seguir sobre
    // lo suyo, no empezar de nuevo, y por eso no hay un paso previo que tocar.
    // Espera a que la carta esté cargada: sin los productos, los renglones se
    // perderían al reconstruirlos.
    effect(() => {
      const pedido = this.devuelto();
      if (!pedido) return;
      if (this.carrito.pedidoEnEdicion() === pedido.id) return;
      if (!this.productos.todos().length) return;
      this.carrito.editarPedido(pedido, (id) => this.productos.porId(id));
    });
  }

  ngOnInit(): void {
    this.pedidos.iniciar();
  }

  /** Si hay que rehacer la comanda entera o sólo una parte. */
  protected alcance(): string {
    const alcance = this.devuelto()?.alcanceRechazo;
    return alcance ? ROTULO_ALCANCE_RECHAZO[alcance] : 'Modificación pedida';
  }

  /** Cómo marcó el mozo ese renglón, si lo marcó. */
  protected marcaDe(item: ItemCarrito): MarcaRechazo | null {
    return this.pedidos.marcaDe(this.devuelto(), item.producto.id);
  }

  /**
   * En la pantalla del comensal el rótulo va en su idioma —lo que tiene que
   * hacer él—, no en el del mozo: "no lo podemos preparar", no "sin stock".
   */
  protected rotuloMarca(marca: MarcaRechazo): string {
    return marca === 'CANTIDAD' ? 'Hay menos de lo que pediste' : 'No lo podemos preparar';
  }

  /** En un amarillo, subir la cantidad va justo en contra de lo que pidió el mozo. */
  protected noPuedeSumar(item: ItemCarrito): boolean {
    return this.marcaDe(item) === 'CANTIDAD';
  }

  protected sumar(productoId: string): void {
    this.carrito.sumar(productoId);
  }

  protected restar(productoId: string): void {
    this.carrito.restar(productoId);
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

  /** Manda de nuevo al mozo la comanda ya corregida. */
  protected async reenviar(): Promise<void> {
    const pedido = this.devuelto();
    const items = this.carrito.items();
    if (!pedido || !items.length) return;

    const falta = this.traba();
    if (falta) {
      this.avisos.error('Todavía no lo podés mandar', falta);
      return;
    }

    const seguro = await this.preguntar({
      titulo: '¿Reenviás el pedido corregido?',
      mensaje:
        'El mozo lo vuelve a revisar con los cambios que hiciste. Todavía no será enviado a Cocina ni a Bar.',
      confirmar: 'Reenviar pedido',
      tono: 'exito',
      icono: 'send',
      detalle: [
        { rotulo: 'Mesa', valor: `Mesa ${pedido.mesaNumero}` },
        { rotulo: 'Productos', valor: `${this.carrito.cantidadTotal()} unidades` },
        {
          rotulo: 'Total',
          valor: `$ ${this.carrito.importeTotal().toLocaleString('es-AR')}`,
        },
        { rotulo: 'Tiempo estimado', valor: `${this.carrito.tiempoEstimado()} minutos` },
      ],
    });
    if (!seguro) return;

    this.enviando.set(true);

    try {
      await this.cargando.conEsperaMinima('Reenviando el pedido corregido…', () =>
        this.pedidos.reenviar(
          pedido,
          items,
          this.carrito.tiempoEstimado(),
          this.carrito.importeTotal(),
        ),
      );

      // Sólo se vacía después de guardar correctamente.
      this.carrito.vaciar();

      this.avisos.exito(
        'Pedido reenviado',
        `El pedido de la mesa ${pedido.mesaNumero} está esperando la confirmación del mozo.`,
      );
    } catch (error) {
      this.avisos.error(
        'No pudimos reenviar el pedido',
        error instanceof Error ? error.message : 'Revisá la conexión e intentá nuevamente.',
      );
    } finally {
      this.enviando.set(false);
    }
  }

  protected volverCarta(): void {
    const pedido = this.devuelto();
    void this.router.navigate(['/carta'], {
      queryParams: pedido ? { mesaId: pedido.mesaId } : undefined,
    });
  }

  protected rotuloSector(estado: string): string {
    const rotulos: Record<string, string> = {
      NO_APLICA: 'Sin productos', PENDIENTE: 'Pendiente', EN_PREPARACION: 'En preparación', LISTO: 'Listo',
    };
    return rotulos[estado] ?? estado;
  }
}
