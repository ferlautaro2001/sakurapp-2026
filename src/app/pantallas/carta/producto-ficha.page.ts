import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Producto } from '../../nucleo/modelos/modelos';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { CarritoService } from '../../nucleo/servicios/carrito.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { MarcaRechazo } from '../../nucleo/modelos/enums';

@Component({
  selector: 'lm-producto-ficha',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado
        titulo="Detalle del producto"
        conVolver
        (volver)="volver()"
      >
        @if (mesaActiva(); as mesa) {
          <span
            accion
            class="mesa-activa"
          >
            <lm-icono
              nombre="table_restaurant"
              [tamano]="18"
              color="#FFFFFF"
            />
            Mesa {{ mesa.numero }}
          </span>
        }
      </lm-encabezado>

      <div class="lm-body lm-body--gap14">
        @if (producto(); as producto) {
          <section aria-label="Fotografías del producto">
            <div
              class="lm-carousel__marco sk-carrusel-fotos"
              [style.height.px]="320"
              [style.background-image]="
                fotoActual() ? 'url(' + fotoActual() + ')' : null
              "
            >
              @if (!fotoActual()) {
                <span class="lm-carousel__vacio">
                  <lm-icono
                    nombre="add_a_photo"
                    [tamano]="30"
                    color="var(--action-accent)"
                  />
                  <span>El producto no tiene fotografías</span>
                </span>
              }

              @if (cantidadFotos() > 1) {
                <button
                  type="button"
                  class="lm-carousel__flecha"
                  style="left: 10px"
                  aria-label="Foto anterior"
                  (click)="moverFoto(-1)"
                >
                  <lm-icono
                    nombre="chevron_left"
                    [tamano]="24"
                    color="var(--action-primary)"
                  />
                </button>

                <button
                  type="button"
                  class="lm-carousel__flecha"
                  style="right: 10px"
                  aria-label="Foto siguiente"
                  (click)="moverFoto(1)"
                >
                  <lm-icono
                    nombre="chevron_right"
                    [tamano]="24"
                    color="var(--action-primary)"
                  />
                </button>
              }
            </div>

            @if (cantidadFotos() > 1) {
              <div class="lm-carousel__puntos">
                @for (foto of fotos(); track $index) {
                  <button
                    type="button"
                    class="sk-flor"
                    [class.on]="$index === indiceActual()"
                    [attr.aria-label]="'Ver la foto ' + ($index + 1)"
                    [attr.aria-current]="
                      $index === indiceActual()
                        ? 'true'
                        : null
                    "
                    (click)="irAFoto($index)"
                  >
                    <img
                      src="assets/img/flor-2.png"
                      alt=""
                    />
                  </button>
                }
              </div>
            }
          </section>

          <section class="lm-card detalle">
            <div class="cabecera">
              <span class="tipo">{{ rotuloTipo(producto) }}</span>
              <span
                class="estado"
                [class.estado--sin-stock]="!producto.disponible"
              >
                {{ producto.disponible ? 'Disponible' : 'Sin stock' }}
              </span>
            </div>

            <h1>{{ producto.nombre }}</h1>
            <p>{{ producto.descripcion }}</p>

            <div class="datos">
              <span>
                <small>PRECIO</small>
                <strong>{{ precio(producto.precio) }}</strong>
              </span>

              <span>
                <small>ELABORACIÓN</small>
                <strong>
                  <lm-icono nombre="schedule" [tamano]="17" />
                  {{ producto.tiempoElaboracion }} minutos
                </strong>
              </span>
            </div>
          </section>
        } @else {
          <lm-vacio
            icono="restaurant_menu"
            titulo="Producto no encontrado"
          >
            El producto solicitado no está disponible en la carta.
          </lm-vacio>
        }
      </div>

      <div class="lm-actionbar">
        @if (puedeGestionar()) {
          <lm-boton
            icono="edit"
            (presionar)="editar()"
          >
            Editar producto
          </lm-boton>

          <lm-texto-boton
            enfasis="peligro"
            (presionar)="quitar()"
          >
            Quitar de la carta
          </lm-texto-boton>
        } @else if (puedeAgregar()) {
          @if (marca(); as marcado) {
            <lm-banner
              [tono]="marcado === 'CAMBIAR' ? 'error' : 'info'"
              [titulo]="
                marcado === 'CAMBIAR'
                  ? 'El mozo no puede prepararlo'
                  : 'Hay menos de lo que pediste'
              "
            >
              {{ avisoDeMarca() }}
            </lm-banner>
          }

          <lm-boton
            icono="add_shopping_cart"
            [deshabilitado]="marca() !== null"
            (presionar)="agregarAlCarrito()"
          >
            Agregar al carrito
          </lm-boton>

          @if (carrito.cantidadTotal() > 0) {
            <lm-texto-boton
              (presionar)="verCarrito()"
            >
              Ver carrito ({{ carrito.cantidadTotal() }})
            </lm-texto-boton>
          }
        } @else {
          <lm-boton
            icono="arrow_back"
            (presionar)="volver()"
          >
            Volver a la carta
          </lm-boton>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
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

      .sk-carrusel-fotos {
        background-color: #fff7f8;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        border: 2px solid rgba(112, 10, 49, 0.22);
      }

      .lm-carousel__puntos {
        width: max-content;
        margin: 8px auto 0;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 2px 8px rgba(38, 4, 17, 0.28);
      }

      .detalle {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 20px;
      }

      .cabecera {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .tipo,
      .estado {
        padding: 6px 12px;
        border-radius: 999px;
        font: var(--type-caption);
        font-weight: 800;
      }

      .tipo {
        color: var(--action-primary);
        background: var(--surface-sunken);
      }

      .estado {
        color: #08783e;
        background: #d8f6e5;
      }

      .estado--sin-stock {
        color: #a11b2d;
        background: #ffe1e5;
      }

      h1 {
        margin: 0;
        color: var(--text-title);
        font: var(--type-page-title);
      }

      p {
        margin: 0;
        color: var(--text-body);
        font: var(--type-body-medium);
      }

      .datos {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .datos > span {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 14px;
        border-radius: var(--radius-field);
        background: var(--surface-sunken);
        border: 2px solid rgba(112, 10, 49, 0.16);
      }

      .datos small {
        color: var(--text-muted);
        font: var(--type-caption);
        font-weight: 800;
      }

      .datos strong {
        display: flex;
        align-items: center;
        gap: 5px;
        color: var(--text-title);
        font: var(--type-body-medium);
      }
    `,
  ],
})
export class ProductoFichaPage extends PaginaConSesion {
  private readonly route = inject(ActivatedRoute);
  private readonly productos = inject(ProductosService);
  private readonly mesas = inject(MesasService);
  private readonly pedidos = inject(PedidosService);
  protected readonly carrito = inject(CarritoService);
  private readonly posicionFoto = signal(0);

  protected readonly mesaId =
    this.route.snapshot.queryParamMap.get('mesaId');

  protected readonly mesaActiva = computed(() =>
    this.mesaId
      ? this.mesas.porId(this.mesaId)
      : undefined,
  );

  protected readonly producto = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.productos.porId(id) : undefined;
  });

  protected readonly puedeGestionar = computed(() => {
    const producto = this.producto();

    return (
        this.sesion.usuario()?.perfil === 'COCINERO' &&
        producto !== undefined &&
        producto.tipo !== 'BEBIDA'
        );
    });

  protected readonly puedeAgregar = computed(() => {
      const perfil = this.sesion.usuario()?.perfil;
      const producto = this.producto();

      return (
        (perfil === 'CLIENTE_REGISTRADO' ||
          perfil === 'CLIENTE_ANONIMO') &&
        Boolean(this.mesaId) &&
        producto !== undefined &&
        producto.disponible
      );
    });

  /**
   * US-7.2 · AC-7.2.2 · la marca que el mozo le puso a este producto al
   * devolver la comanda, si es que se la puso.
   *
   * Mientras el comensal está corrigiendo, la carta tiene que decir lo mismo
   * que el pedido: agregar de nuevo lo que el mozo marcó en rojo, o sumarle
   * unidades a un amarillo, va justo en contra de lo que le pidieron. Se
   * entera acá y no al volver al carrito.
   */
  protected readonly marca = computed<MarcaRechazo | null>(() => {
    const producto = this.producto();
    if (!producto) return null;

    const enEdicion = this.carrito.pedidoEnEdicion();
    if (!enEdicion) return null;

    const devuelto = this.pedidos.porId(enEdicion);
    if (devuelto?.estadoGlobal !== 'RECHAZADO') return null;

    return this.pedidos.marcaDe(devuelto, producto.id);
  });

  protected avisoDeMarca(): string {
    return this.marca() === 'CAMBIAR'
      ? 'El mozo lo marcó porque hoy no lo pueden preparar. Elegí otra cosa para tu pedido.'
      : 'El mozo avisó que hay menos de lo que pediste, así que no podés sumar más unidades. Bajá la cantidad desde tu pedido.';
  }

  protected readonly fotos = computed(() =>
    (this.producto()?.fotos ?? []).filter(Boolean),
  );

  protected cantidadFotos(): number {
    return this.fotos().length;
  }

  protected indiceActual(): number {
    return Math.min(
      this.posicionFoto(),
      Math.max(0, this.cantidadFotos() - 1),
    );
  }

  protected fotoActual(): string | null {
    return this.fotos()[this.indiceActual()] ?? null;
  }

  protected moverFoto(paso: number): void {
    const cantidad = this.cantidadFotos();
    if (!cantidad) return;

    this.posicionFoto.set(
      (this.indiceActual() + paso + cantidad) % cantidad,
    );
  }

  protected irAFoto(indice: number): void {
    this.posicionFoto.set(indice);
  }

  protected rotuloTipo(producto: Producto): string {
    if (producto.tipo === 'BEBIDA') return 'Bebida';
    if (producto.tipo === 'POSTRE') return 'Postre';
    return 'Comida';
  }

  protected precio(valor: number): string {
    return `$ ${valor.toLocaleString('es-AR')}`;
  }

  protected editar(): void {
        const producto = this.producto();

        if (!producto) {
            return;
        }

        this.ir([
            '/carta',
            producto.id,
            'editar',
        ]);
   }

protected async quitar(): Promise<void> {
  const producto = this.producto();

  if (!producto) {
    return;
  }

  const seguro = await this.preguntar({
      titulo: '¿Quitás este producto de la carta?',
      mensaje:
        'El producto dejará de mostrarse, pero sus datos se conservarán.',
      confirmar: 'Quitar de la carta',
      tono: 'peligro',
      icono: 'delete',
      detalle: [
        {
          rotulo: 'Producto',
          valor: producto.nombre,
        },
        {
          rotulo: 'Categoría',
          valor: this.rotuloTipo(producto),
        },
      ],
    });

    if (!seguro) {
      return;
    }

    try {
      await this.cargando.conEsperaMinima(
        'Quitando el producto de la carta...',
        () =>
          this.productos.quitarDeLaCarta(
            producto.id,
          ),
      );

      this.avisos.exito(
        'Producto quitado',
        `${producto.nombre} ya no aparece en la carta.`,
      );

      this.ir(['/carta']);
    } catch (error) {
      console.error(
        'No se pudo quitar el producto:',
        error,
      );

      this.avisos.error(
        'No pudimos quitar el producto',
        'Revisá la conexión e intentá nuevamente.',
        );
      }
    }

  protected agregarAlCarrito(): void {
    const producto = this.producto();

    if (!producto || !this.mesaId) {
      return;
    }

    const marcado = this.marca();
    if (marcado) {
      this.avisos.error(
        marcado === 'CAMBIAR'
          ? 'El mozo no puede prepararlo'
          : 'No podés sumar más unidades',
        this.avisoDeMarca(),
      );
      return;
    }

    this.carrito.iniciarMesa(this.mesaId);
    this.carrito.agregar(producto);

    this.avisos.exito(
      'Producto agregado',
      `${producto.nombre} se agregó al carrito.`,
      );
    }

  protected verCarrito(): void {
    void this.router.navigate(
        ['/comanda/carrito'],
        {
          queryParams: this.mesaId
            ? { mesaId: this.mesaId }
            : undefined,
      },
    );
  }

  protected volver(): void {
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