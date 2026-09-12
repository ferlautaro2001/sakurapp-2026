import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Producto } from '../../nucleo/modelos/modelos';
import { TipoProducto } from '../../nucleo/modelos/enums';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { CarritoService } from '../../nucleo/servicios/carrito.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { ChatService } from '../../nucleo/servicios/chat.service';
import { Unsubscribe } from 'firebase/firestore';

type Categoria = 'TODOS' | TipoProducto;

/**
 * La carta completa del salón adaptada a la composición y UX de la-mesa.
 */
@Component({
  selector: 'lm-carta',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()">
        @if (esComensal()) {
          <lm-icono-boton
            accion
            icono="forum"
            rotulo="Consultarle al mozo"
            [globo]="respuestasSinLeer()"
            (presionar)="ir(['/cliente/consulta'])"
          />
        }
        @if (puedeCargar()) {
          <lm-icono-boton
            accion
            icono="add"
            rotulo="Agregar un producto"
            tono="primario"
            (presionar)="agregarNuevo()"
          />
        }
      </lm-encabezado>

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="visibles().length" [bajada]="bajada()">Carta </lm-titulo>

        <lm-pestanas [opciones]="pestanas" [valor]="pestana()" (cambiar)="pestana.set($any($event))" />

        <lm-buscador marcador="Buscar en la carta" [valor]="busqueda()" (cambiar)="busqueda.set($event)" />

        @if (rechazado()) {
          <lm-banner tono="error" titulo="El mozo te pidió que modifiques el pedido">
            {{ pedido()?.motivoRechazo }}
          </lm-banner>
        } @else if (sinStock() > 0) {
          <lm-banner tono="info" titulo="Hay productos sin stock">
            {{ avisoSinStock() }}
          </lm-banner>
        }

        @if (visibles().length) {
          <div class="lm-list">
            @for (producto of visibles(); track producto.id) {
              <lm-fila-producto
                [producto]="producto"
                [conCarrito]="esComensal() && producto.disponible"
                [cantidad]="cantidadDe(producto)"
                [permitirAgregar]="puedeAgregar(producto)"
                (presionar)="ir(['/carta', producto.id])"
                (agregar)="agregar(producto)"
                (quitar)="quitar(producto)"
              />
            }
          </div>
        } @else {
          <lm-vacio icono="restaurant_menu" [titulo]="tituloVacio()">
            {{ textoVacio() }}
            @if (puedeCargar()) {
              <lm-boton accion variante="secondary" icono="add" [ancho]="false" (presionar)="agregarNuevo()">
                Agregar el primero
              </lm-boton>
            }
          </lm-vacio>
        }
      </div>

      @if (esComensal()) {
        <div class="lm-actionbar">
          <lm-resumen-pedido
            [total]="carrito.importeTotal()"
            [tiempo]="carrito.tiempoEstimado()"
            [unidades]="carrito.cantidadTotal()"
          >
            <lm-boton
              icono="receipt_long"
              [deshabilitado]="carrito.cantidadTotal() === 0"
              (presionar)="ir(['/cliente/pedido'])"
            >
              {{ carrito.cantidadTotal() ? 'Ver mi pedido' : 'Elegí lo primero' }}
            </lm-boton>
          </lm-resumen-pedido>
        </div>
      }

      <lm-barra-inferior [items]="secciones()" activo="carta" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
    `,
  ],
})
export class CartaPage extends PaginaConSesion {
  private readonly productos = inject(ProductosService);
  private readonly pedidos = inject(PedidosService);
  protected readonly carrito = inject(CarritoService);
  private readonly espera = inject(EsperaService);
  private readonly chat = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly busqueda = signal('');
  protected readonly pestana = signal<Categoria>('TODOS');
  protected readonly respuestasSinLeer = signal(0);

  private escuchaChat: Unsubscribe | null = null;

  protected readonly pestanas: { valor: Categoria; rotulo: string }[] = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'COMIDA', rotulo: 'Comidas' },
    { valor: 'BEBIDA', rotulo: 'Bebidas' },
    { valor: 'POSTRE', rotulo: 'Postres' },
  ];

  protected readonly puedeCargar = computed(() => this.sesion.tienePerfil('COCINERO', 'CANTINERO'));

  protected readonly mesaId = computed(() => {
    const id = this.usuario()?.id;
    if (this.sesion.mesaActivaId()) return this.sesion.mesaActivaId();
    if (!id || !this.sesion.esCliente()) return null;
    const entrada = this.espera.activaDe(id);
    return entrada?.estado === 'FINALIZADO' ? entrada.mesaAsignadaId : null;
  });

  protected readonly pedido = computed(() => this.pedidos.activoDe(this.usuario()));

  protected readonly esComensal = computed(
    () => this.mesaId() !== null && (this.pedido() === undefined || this.pedido()?.estadoGlobal === 'SELECCIONANDO' || this.pedido()?.estadoGlobal === 'RECHAZADO'),
  );

  protected readonly rechazado = computed(() => this.pedido()?.estadoGlobal === 'RECHAZADO');

  constructor() {
    super();

    effect(() => {
      if (this.sesion.esCliente() && this.pedido()?.estadoGlobal === 'PENDIENTE_CONFIRMACION') {
        void this.router.navigate(['/cliente/pedido'], { replaceUrl: true });
      }
    });

    effect(() => {
      const mid = this.mesaId();
      const uid = this.usuario()?.id;
      if (this.escuchaChat) {
        this.escuchaChat();
        this.escuchaChat = null;
      }
      if (mid && uid) {
        this.escuchaChat = this.chat.escucharMensajes(mid, uid, (msjs) => {
          const sinLeer = msjs.filter((m) => m.remitenteRol === 'MOZO' && !m.leido).length;
          this.respuestasSinLeer.set(sinLeer);
        });
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.escuchaChat) {
        this.escuchaChat();
        this.escuchaChat = null;
      }
    });
  }

  protected puedeAgregar(producto: Producto): boolean {
    const p = this.pedido();
    if (p?.estadoGlobal === 'RECHAZADO') {
      return this.pedidos.marcaDe(p, producto.id) !== 'CANTIDAD';
    }
    return true;
  }

  protected cantidadDe(producto: Producto): number {
    return this.carrito.items().find((i) => i.producto.id === producto.id)?.cantidad ?? 0;
  }

  protected agregar(producto: Producto): void {
    if (!producto.disponible) {
      this.avisos.error(`${producto.nombre} no está disponible`, 'La cocina lo marcó sin stock por hoy.');
      return;
    }
    const mesa = this.mesaId();
    if (mesa) this.carrito.iniciarMesa(mesa);
    this.carrito.agregar(producto);
  }

  protected quitar(producto: Producto): void {
    this.carrito.restar(producto.id);
  }

  protected agregarNuevo(): void {
    const perfil = this.usuario()?.perfil;
    if (perfil === 'COCINERO') {
      this.ir(['/cocinero/alta-plato']);
    } else if (perfil === 'CANTINERO') {
      this.ir(['/cantinero/alta-bebida']);
    }
  }

  protected readonly visibles = computed<Producto[]>(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');
    const categoria = this.pestana();
    const lista = categoria === 'TODOS' ? this.productos.todos() : this.productos.porTipo(categoria);
    return lista.filter(
      (p) =>
        !texto ||
        p.nombre.toLocaleLowerCase('es-AR').includes(texto) ||
        p.descripcion.toLocaleLowerCase('es-AR').includes(texto),
    );
  });

  protected readonly sinStock = computed(() => this.visibles().filter((p) => !p.disponible).length);

  protected avisoSinStock(): string {
    const cuantos = this.sinStock();
    return cuantos === 1
      ? 'Un producto está marcado como no disponible para hoy. Sigue en la carta.'
      : `${cuantos} productos están marcados como no disponibles para hoy. Siguen en la carta.`;
  }

  protected bajada(): string {
    if (this.esComensal()) {
      return 'Tocá el más para sumar al pedido, o el producto para ver sus fotos y su descripción';
    }
    return this.puedeCargar()
      ? 'La carta completa del salón. Tocá un producto para verlo, editarlo o marcarlo sin stock'
      : 'Tocá un producto para ver sus fotos, su precio y su tiempo de elaboración';
  }

  protected tituloVacio(): string {
    if (this.busqueda().trim()) return 'No encontramos nada con esa búsqueda';
    const categoria = this.pestana();
    if (categoria === 'TODOS') return 'Todavía no hay nada en la carta';
    const rotulo = this.pestanas.find((p) => p.valor === categoria)?.rotulo ?? '';
    return `Todavía no hay ${rotulo.toLocaleLowerCase('es-AR')} en la carta`;
  }

  protected textoVacio(): string {
    if (this.busqueda().trim()) return 'Probá con otro nombre o con una palabra de la descripción.';
    return this.puedeCargar()
      ? 'Cargá nombre, descripción, precio, tiempo de elaboración y hasta tres fotos por producto.'
      : 'El cocinero y el cantinero van cargando la carta desde sus dispositivos.';
  }
}