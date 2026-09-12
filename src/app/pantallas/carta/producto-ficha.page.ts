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
    <div class="lm-screen" [class.producto-screen--gestionable]="puedeGestionar()">
      <lm-encabezado
        titulo="Detalle del producto"
        conVolver
        (volver)="volver()"
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

      <div class="lm-body producto-body">
        @if (producto(); as producto) {
          <section
            class="producto-fotos"
            aria-label="Fotografías del producto"
          >
            <div
              class="lm-carousel__marco sk-carrusel-fotos"
              [style.background-image]="
                fotoActual()
                  ? 'url(' + fotoActual() + ')'
                  : null
              "
              (pointerdown)="iniciarSwipe($event)"
              (pointerup)="terminarSwipe($event)"
              (pointercancel)="cancelarSwipe()"
            >
              <span class="producto-tipo">
                <lm-icono
                  [nombre]="iconoProducto(producto)"
                  [tamano]="18"
                />
                {{ rotuloTipo(producto) }}
              </span>

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
                  class="lm-carousel__flecha lm-carousel__flecha--izquierda"
                  aria-label="Foto anterior"
                  (click)="moverFoto(-1)"
                >
                  <lm-icono
                    nombre="chevron_left"
                    [tamano]="26"
                    color="var(--action-primary)"
                  />
                </button>

                <button
                  type="button"
                  class="lm-carousel__flecha lm-carousel__flecha--derecha"
                  aria-label="Foto siguiente"
                  (click)="moverFoto(1)"
                >
                  <lm-icono
                    nombre="chevron_right"
                    [tamano]="26"
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

          <section class="producto-info">
            <h1>{{ producto.nombre }}</h1>

            <p class="producto-descripcion">
              {{ producto.descripcion }}
            </p>

            <div class="producto-datos">
              <article class="dato-card">
                <span class="dato-icono">
                  <lm-icono
                    nombre="payments"
                    [tamano]="26"
                  />
                </span>

                <span class="dato-contenido">
                  <small>PRECIO</small>
                  <strong>{{ precio(producto.precio) }}</strong>
                </span>
              </article>

              <article class="dato-card">
                <span class="dato-icono">
                  <lm-icono
                    nombre="schedule"
                    [tamano]="27"
                  />
                </span>

                <span class="dato-contenido">
                  <small>ELABORACIÓN</small>
                  <strong>
                    {{ producto.tiempoElaboracion }} minutos
                  </strong>
                </span>
              </article>
            </div>

            <div class="producto-estado">
              <strong class="producto-estado__titulo">
                Estado:
              </strong>

              <span
                class="estado-chip"
                [class.estado-chip--sin-stock]="!producto.disponible"
              >
                <span class="estado-chip__punto"></span>
                {{ producto.disponible ? 'Disponible' : 'Sin stock' }}
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
            [compacto]="true"
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

      .producto-body {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-bottom: 18px;
      }

      .producto-fotos {
        width: 100%;
      }

      .sk-carrusel-fotos {
        position: relative;
        width: 100%;
        aspect-ratio: 1.35 / 1;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, 0.72);
        border-radius: 20px;
        background-color: #fff7f8;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        box-shadow: 0 8px 24px rgba(73, 4, 31, 0.18);

        /*
         * Permite detectar el gesto horizontal sin bloquear
         * el scroll vertical normal de la pantalla.
         */
        touch-action: pan-y;
        user-select: none;
        -webkit-user-select: none;
      }

      .producto-tipo {
        position: absolute;
        top: 14px;
        left: 14px;
        z-index: 4;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 8px 14px;
        border-radius: 999px;
        color: var(--action-primary);
        background: rgba(253, 236, 239, 0.96);
        font: var(--type-caption);
        font-weight: 800;
        box-shadow: 0 4px 12px rgba(58, 6, 27, 0.15);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .lm-carousel__flecha {
        position: absolute;
        top: 50%;
        z-index: 5;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        display: grid;
        place-items: center;
        cursor: pointer;
        background: rgba(253, 236, 239, 0.94);
        box-shadow: 0 4px 12px rgba(64, 6, 28, 0.18);
        transform: translateY(-50%);
        transition:
          transform 150ms ease,
          background 150ms ease;
      }

      .lm-carousel__flecha:active {
        transform: translateY(-50%) scale(0.93);
      }

      .lm-carousel__flecha--izquierda {
        left: 12px;
      }

      .lm-carousel__flecha--derecha {
        right: 12px;
      }

      /*
       * Las flores vuelven a estar debajo de la foto,
       * sin cápsula ni fondo blanco alrededor.
       */
      .lm-carousel__puntos {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        width: max-content;
        margin: 8px auto 0;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
      }

      .sk-flor {
        appearance: none;
        -webkit-appearance: none;
        width: 23px;
        height: 23px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 0;
        cursor: pointer;
        background: transparent;
        box-shadow: none;
        opacity: 0.55;
        transform: scale(0.78);
        transition:
          opacity 150ms ease,
          transform 150ms ease;
      }

      .sk-flor img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
      }

      .sk-flor.on {
        opacity: 1;
        transform: scale(1.08);
      }

      .lm-carousel__vacio {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 24px;
        color: var(--text-muted);
        font: var(--type-body-small);
        text-align: center;
        background: var(--surface-card);
      }

      .producto-info {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 0 2px;
      }

      .producto-info h1 {
        margin: 0;
        color: var(--text-on-primary);
        font: 800 24px/1.15 var(--font-text);
        letter-spacing: -0.3px;
      }

      .producto-descripcion {
        margin: 0;
        color: rgba(255, 255, 255, 0.92);
        font: 500 14px/1.55 var(--font-text);
      }

      .producto-datos {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 3px;
      }

      .dato-card {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px;
        border-radius: 16px;
        background: var(--surface-card);
        box-shadow: 0 4px 12px rgba(73, 4, 31, 0.1);
      }

      .dato-icono {
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: var(--action-primary);
        background: rgba(227, 85, 133, 0.12);
      }

      .dato-contenido {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .dato-contenido small {
        color: var(--text-muted);
        font: var(--type-caption);
        font-weight: 800;
      }

      .dato-contenido strong {
        color: var(--text-title);
        font: 800 16px/1.15 var(--font-text);
      }

      .producto-estado {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        margin-top: 3px;
        padding: 15px 16px;
        border-radius: 18px;
        background: var(--surface-card);
        box-shadow: 0 4px 12px rgba(73, 4, 31, 0.1);
      }

      .producto-estado__titulo {
        flex: 0 0 auto;
        color: var(--action-primary);
        font: 800 16px/1 var(--font-text);
      }

      .estado-chip {
        min-width: 0;
        min-height: 46px;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        padding: 10px 16px;
        border-radius: 999px;
        color: #08783e;
        background: linear-gradient(90deg, #dcf8ea, #cff3df);
        font: 800 18px/1 var(--font-text);
      }

      .estado-chip__punto {
        width: 13px;
        height: 13px;
        flex: 0 0 13px;
        border-radius: 50%;
        background: #0a9b58;
        box-shadow: 0 0 0 4px rgba(10, 155, 88, 0.08);
      }

      .estado-chip--sin-stock {
        color: #a11b2d;
        background: linear-gradient(90deg, #ffe5e8, #ffdadd);
      }

      .estado-chip--sin-stock .estado-chip__punto {
        background: #d43c50;
        box-shadow: 0 0 0 4px rgba(212, 60, 80, 0.08);
      }

      @media (max-width: 380px) {
        .producto-datos {
          gap: 8px;
        }

        .dato-card {
          gap: 8px;
          padding: 12px 10px;
        }

        .dato-icono {
          width: 38px;
          height: 38px;
          flex-basis: 38px;
        }

        .dato-contenido strong {
          font-size: 14px;
        }

        .producto-estado {
          gap: 10px;
          padding: 13px;
        }

        .producto-estado__titulo {
          font-size: 14px;
        }

        .estado-chip {
          min-height: 42px;
          gap: 8px;
          padding: 9px 12px;
          font-size: 15px;
        }
      }

      /* Escalamiento exclusivo para roles con posibilidad de editar la carta */
      .producto-screen--gestionable .producto-body {
        gap: 10px;
        padding-top: 4px;
        padding-bottom: 6px;
      }

      .producto-screen--gestionable .sk-carrusel-fotos {
        aspect-ratio: 1.85 / 1;
        max-height: 175px;
        border-radius: 16px;
        box-shadow: 0 4px 14px rgba(73, 4, 31, 0.14);
      }

      .producto-screen--gestionable .producto-tipo {
        top: 8px;
        left: 8px;
        padding: 5px 11px;
        font-size: 11px;
      }

      .producto-screen--gestionable .lm-carousel__flecha {
        width: 36px;
        height: 36px;
      }

      .producto-screen--gestionable .lm-carousel__puntos {
        margin: 4px auto 0;
        gap: 5px;
      }

      .producto-screen--gestionable .sk-flor {
        width: 17px;
        height: 17px;
      }

      .producto-screen--gestionable .producto-info {
        gap: 8px;
      }

      .producto-screen--gestionable .producto-info h1 {
        font-size: 19px;
        line-height: 1.15;
      }

      .producto-screen--gestionable .producto-descripcion {
        font-size: 12.5px;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .producto-screen--gestionable .producto-datos {
        gap: 8px;
        margin-top: 0;
      }

      .producto-screen--gestionable .dato-card {
        gap: 8px;
        padding: 8px 10px;
        border-radius: 12px;
      }

      .producto-screen--gestionable .dato-icono {
        width: 34px;
        height: 34px;
        flex: 0 0 34px;
      }

      .producto-screen--gestionable .dato-contenido {
        gap: 2px;
      }

      .producto-screen--gestionable .dato-contenido small {
        font-size: 10px;
      }

      .producto-screen--gestionable .dato-contenido strong {
        font-size: 14px;
      }

      .producto-screen--gestionable .producto-estado {
        gap: 8px;
        margin-top: 0;
        padding: 8px 12px;
        border-radius: 14px;
      }

      .producto-screen--gestionable .producto-estado__titulo {
        font-size: 13px;
      }

      .producto-screen--gestionable .estado-chip {
        min-height: 34px;
        gap: 7px;
        padding: 5px 12px;
        font-size: 14px;
      }

      .producto-screen--gestionable .estado-chip__punto {
        width: 9px;
        height: 9px;
        flex: 0 0 9px;
      }

      .producto-screen--gestionable .lm-actionbar {
        padding: 6px var(--gutter-screen) calc(10px + env(safe-area-inset-bottom));
        gap: 2px;
      }

      .producto-screen--gestionable .lm-actionbar ::ng-deep .lm-textbtn {
        min-height: 36px;
        padding: 4px 8px;
        font-size: 13px;
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
  private inicioSwipeX: number | null = null;

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

  /* =========================================================
     SWIPE DEL CARRUSEL
     ========================================================= */

  protected iniciarSwipe(evento: PointerEvent): void {
    if (this.cantidadFotos() <= 1) {
      return;
    }

    this.inicioSwipeX = evento.clientX;

    const elemento = evento.currentTarget;
    if (elemento instanceof HTMLElement) {
      elemento.setPointerCapture?.(evento.pointerId);
    }
  }

  protected terminarSwipe(evento: PointerEvent): void {
    if (
      this.inicioSwipeX === null ||
      this.cantidadFotos() <= 1
    ) {
      return;
    }

    const diferencia = evento.clientX - this.inicioSwipeX;
    this.inicioSwipeX = null;

    const elemento = evento.currentTarget;
    if (
      elemento instanceof HTMLElement &&
      elemento.hasPointerCapture?.(evento.pointerId)
    ) {
      elemento.releasePointerCapture?.(evento.pointerId);
    }

    /*
     * Evita que un toque o un movimiento pequeño cambie la foto.
     * 45px funciona bien para diferenciar tap de swipe en móvil.
     */
    const umbral = 45;

    if (Math.abs(diferencia) < umbral) {
      return;
    }

    // Dedo hacia la izquierda => siguiente foto.
    if (diferencia < 0) {
      this.moverFoto(1);
      return;
    }

    // Dedo hacia la derecha => foto anterior.
    this.moverFoto(-1);
  }

  protected cancelarSwipe(): void {
    this.inicioSwipeX = null;
  }

  protected rotuloTipo(producto: Producto): string {
    if (producto.tipo === 'BEBIDA') return 'Bebida';
    if (producto.tipo === 'POSTRE') return 'Postre';
    return 'Comida';
  }

  protected iconoProducto(producto: Producto): string {
    if (producto.tipo === 'BEBIDA') return 'local_bar';
    if (producto.tipo === 'POSTRE') return 'icecream';
    return 'restaurant';
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
