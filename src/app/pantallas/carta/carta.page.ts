import { Component, computed, inject, signal } from '@angular/core';
import { Producto } from '../../nucleo/modelos/modelos';
import { TipoProducto } from '../../nucleo/modelos/enums';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { ActivatedRoute } from '@angular/router';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { CarritoService } from '../../nucleo/servicios/carrito.service';

type Categoria = 'TODOS' | TipoProducto;

@Component({
  selector: 'lm-carta',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()">
          @if (mesaActiva(); as mesa) {
            <div accion class="acciones-carta">
              <span class="mesa-activa">
                <lm-icono
                  nombre="table_restaurant"
                  [tamano]="18"
                  color="#FFFFFF"
                />
                Mesa {{ mesa.numero }}
              </span>

              <button
                type="button"
                class="boton-carrito"
                [attr.aria-label]="
                  'Abrir carrito con ' +
                  carrito.cantidadTotal() +
                  ' productos'
                "
                (click)="verCarrito()"
              >
                <lm-icono
                  nombre="shopping_cart"
                  [tamano]="22"
                  color="var(--action-primary)"
                />

                <strong>{{ carrito.cantidadTotal() }}</strong>
              </button>
            </div>
          } @else if (puedeCargar()) {
          <lm-icono-boton
            accion
            icono="add"
            rotulo="Agregar un producto"
            tono="primario"
            (presionar)="agregarProducto()"
          />
        }
      </lm-encabezado>

      <div class="lm-body lm-body--gap12">
        <lm-titulo
          [contador]="visibles().length"
          bajada="La carta completa del salón. Tocá un producto para ver sus tres fotos"
        >
          Carta
        </lm-titulo>

        <lm-segmentado
          [opciones]="categorias"
          [valor]="categoria()"
          [columnas]="4"
          (cambiar)="categoria.set($any($event))"
        />

        <lm-buscador
          marcador="Buscar en la carta"
          [valor]="busqueda()"
          (cambiar)="busqueda.set($event)"
        />

        @if (visibles().length) {
          <div class="lm-list">
            @for (producto of visibles(); track producto.id) {
              <button
                type="button"
                class="lm-product"
                (click)="abrirProducto(producto)"
              >
                <span class="lm-product__thumb">
                  @if (portada(producto)) {
                    <img
                      [src]="portada(producto)"
                      [alt]="producto.nombre"
                    />
                  } @else {
                    <lm-icono
                      [nombre]="icono(producto)"
                      [tamano]="28"
                      color="var(--action-primary)"
                    />
                  }
                </span>

                <span class="lm-product__datos">
                  <span class="lm-product__nombre">
                    {{ producto.nombre }}
                  </span>

                  <span class="lm-product__desc">
                    {{ producto.descripcion }}
                  </span>

                  <span class="lm-product__pie">
                    <span class="lm-product__precio">
                      {{ precio(producto.precio) }}
                    </span>

                    <span class="lm-product__tiempo">
                      <lm-icono nombre="schedule" [tamano]="15" />
                      {{ producto.tiempoElaboracion }} minutos
                    </span>
                  </span>
                </span>
              </button>
            }
          </div>
        } @else {
          <lm-vacio
            icono="restaurant_menu"
            titulo="No encontramos productos"
          >
            Probá con otra categoría o con otra búsqueda.
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="carta" />
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      .lm-product__thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
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

      .acciones-carta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .boton-carrito {
        position: relative;
        display: inline-flex;
        width: 46px;
        height: 46px;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 14px;
        background: #ffffff;
        cursor: pointer;
      }

      .boton-carrito strong {
        position: absolute;
        top: -5px;
        right: -5px;
        display: grid;
        min-width: 22px;
        height: 22px;
        place-items: center;
        padding: 0 5px;
        border: 2px solid var(--action-primary);
        border-radius: 999px;
        background: #ffffff;
        color: var(--action-primary);
        font-size: 12px;
        font-weight: 900;
      }
    `,

  ],
})
export class CartaPage extends PaginaConSesion {
  protected readonly busqueda = signal('');
  protected readonly categoria = signal<Categoria>('TODOS');
  protected readonly carrito = inject(CarritoService);
  private readonly route = inject(ActivatedRoute);
  private readonly mesas = inject(MesasService);
  private readonly productos = inject(ProductosService);


  protected readonly mesaId =
    this.route.snapshot.queryParamMap.get('mesaId');

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

  protected readonly categorias: {
    valor: Categoria;
    rotulo: string;
  }[] = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'COMIDA', rotulo: 'Comidas' },
    { valor: 'BEBIDA', rotulo: 'Bebidas' },
    { valor: 'POSTRE', rotulo: 'Postres' },
  ];

    protected readonly puedeCargar = computed(() => {
        const perfil = this.sesion.usuario()?.perfil;
        return perfil === 'COCINERO' || perfil === 'CANTINERO';
    });

  protected readonly visibles = computed<Producto[]>(() => {
    const categoria = this.categoria();
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');

    const productos =
      categoria === 'TODOS'
        ? this.productos.todos()
        : this.productos.porTipo(categoria);

    return productos.filter(
      (producto) =>
        !texto ||
        producto.nombre.toLocaleLowerCase('es-AR').includes(texto) ||
        producto.descripcion.toLocaleLowerCase('es-AR').includes(texto),
    );
  });

  protected portada(producto: Producto): string | null {
    return producto.fotos[0] ?? null;
  }

  protected icono(producto: Producto): string {
    if (producto.tipo === 'BEBIDA') return 'local_bar';
    if (producto.tipo === 'POSTRE') return 'icecream';
    return 'restaurant';
  }

  protected precio(valor: number): string {
    return `$ ${valor.toLocaleString('es-AR')}`;
  }

  protected abrirProducto(
    producto: Producto,
  ): void {
    void this.router.navigate(
      ['/carta', producto.id],
      {
        queryParams: this.mesaId
          ? { mesaId: this.mesaId }
          : undefined,
      },
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

  protected agregarProducto(): void {
    if (this.sesion.usuario()?.perfil === 'CANTINERO') {
      this.ir(['/cantinero/alta-bebida']);
      return;
    }

    this.ir(['/cocinero/alta-plato']);
  }

}