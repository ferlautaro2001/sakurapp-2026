import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { ItemCarrito, CarritoService } from '../../nucleo/servicios/carrito.service';
import { Pedido, PedidoItem } from '../../nucleo/modelos/modelos';
import { MarcaRechazo, ROTULO_ALCANCE_RECHAZO, ROTULO_ESTADO_PEDIDO, ROTULO_ESTADO_SECTOR } from '../../nucleo/modelos/enums';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { ChatService } from '../../nucleo/servicios/chat.service';
import { EncuestasService } from '../../nucleo/servicios/encuestas.service';
import { ClienteCuentaComponent } from './cuenta';
import { Unsubscribe } from 'firebase/firestore';

/**
 * Pantalla integral "Mi pedido" que unifica borrador, revisión, comanda devuelta y progreso.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-cliente-pedido',
  imports: [...UI, ClienteCuentaComponent],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()">
        <lm-icono-boton
          accion
          icono="forum"
          rotulo="Consultarle al mozo"
          [globo]="respuestasSinLeer()"
          (presionar)="ir(['/cliente/consulta'])"
        />
      </lm-encabezado>

      @if (pedido(); as p) {
        @if (enCuenta(p)) {
          <!-- Punto 21 · con la cuenta habilitada, Mi pedido es el cobro, paso a paso. -->
          <div class="lm-body lm-body--gap12 lm-body--pantalla">
            <lm-cliente-cuenta [pedido]="p" />
          </div>
        } @else {
        <div class="lm-body lm-body--gap12 lm-body--pantalla">
          @if (!esperando()) {
            <lm-titulo>{{ titulo() }}</lm-titulo>
          }

          @if (p.estadoGlobal === 'RECHAZADO') {
            <!-- El aviso y las marcas viven en una ventana: acá sólo queda un renglón. -->
            <button type="button" class="info-devolucion" (click)="infoDevolucion.set(true)">
              <span class="info-devolucion__signo">
                <lm-icono nombre="priority_high" [tamano]="16" color="#FFFFFF" />
              </span>
              Información de la devolución
            </button>
          }

          @if (esperando()) {
            <!-- Una franja de un renglón: todo el alto que sobra es para el detalle. -->
            <div class="lm-card espera">
              <span class="espera__reloj">
                <lm-icono nombre="hourglass_top" [tamano]="18" color="var(--action-primary)" />
              </span>
              <b>El mozo está revisando tu pedido</b>
            </div>
          }

          @if (p.estadoGlobal === 'ENTREGADO') {
            <lm-boton class="momento" variante="success" icono="check_circle" (presionar)="recibir(p)">
              Confirmar recepción
            </lm-boton>
          } @else if (p.estadoGlobal === 'RECIBIDO') {
            <lm-boton class="momento" icono="receipt_long" (presionar)="pedirCuenta(p)">Pedir la cuenta</lm-boton>
          } @else if (p.estadoGlobal === 'CUENTA_SOLICITADA' || p.estadoGlobal === 'PAGO_PENDIENTE') {
            @if (encuestas.respondida(p.id)) {
              <div class="lm-card espera">
                <span class="espera__reloj">
                  <lm-icono nombre="receipt_long" [tamano]="18" color="var(--action-primary)" />
                </span>
                <b>El mozo está preparando tu cuenta</b>
              </div>
            } @else {
              <lm-boton class="momento" icono="rate_review" (presionar)="ir(['/cliente/encuestas'])">
                Responder la encuesta
              </lm-boton>
            }
          } @else if (confirmado()) {
            <div class="lm-grid2">
              @if (p.estadoCocina !== 'NO_APLICA') {
                <div class="lm-card sector">
                  <span class="sector__titulo">
                    <lm-icono nombre="skillet" [tamano]="18" color="var(--action-primary)" />
                    <span class="lm-label">Cocina</span>
                  </span>
                  <lm-chip [estado]="chipSector(p.estadoCocina)">{{ rotuloSector(p.estadoCocina) }}</lm-chip>
                </div>
              }
              @if (p.estadoBar !== 'NO_APLICA') {
                <div class="lm-card sector">
                  <span class="sector__titulo">
                    <lm-icono nombre="local_bar" [tamano]="18" color="var(--action-primary)" />
                    <span class="lm-label">Barra</span>
                  </span>
                  <lm-chip [estado]="chipSector(p.estadoBar)">{{ rotuloSector(p.estadoBar) }}</lm-chip>
                </div>
              }
            </div>
          }


          @if (infoDevolucion()) {
            <div class="lm-modal__fondo" (click)="infoDevolucion.set(false)">
              <div class="lm-modal info-modal" role="dialog" aria-modal="true" aria-label="Información de la devolución" (click)="$event.stopPropagation()">
                <button type="button" class="info-modal__cerrar" aria-label="Cerrar" (click)="infoDevolucion.set(false)">
                  <lm-icono nombre="close" [tamano]="20" />
                </button>
                <span class="lm-modal__icono lm-modal__icono--peligro">
                  <lm-icono nombre="edit_note" color="#FFFFFF" />
                </span>
                <div class="info-modal__cuerpo">
                  <p class="info-modal__alcance">Motivo de la devolución</p>
                  <p class="info-modal__motivo">{{ p.motivoRechazo }}</p>
                  @if (editable() && p.observaciones.length) {
                    <div class="info-modal__marcas">
                      @if (hayAmarillos()) {
                        <span class="leyenda__item">
                          <i class="leyenda__sello leyenda__sello--cantidad">
                            <lm-icono nombre="warning" [tamano]="16" color="#FFFFFF" />
                          </i>
                          <span><b>Hay menos:</b> bajá la cantidad</span>
                        </span>
                      }
                      @if (aCambiar().length) {
                        <span class="leyenda__item">
                          <i class="leyenda__sello leyenda__sello--cambiar">
                            <lm-icono nombre="block" [tamano]="16" color="#FFFFFF" />
                          </i>
                          <span><b>No hay:</b> sacalo o cambialo</span>
                        </span>
                        <button type="button" class="limpiar" (click)="sacarDesdeInfo()">
                          <lm-icono nombre="delete_sweep" [tamano]="20" />
                          Sacar los que no hay
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Renglones en modo editable (desde carrito) -->
          @if (editable()) {
            <div class="pedido__lista">
              @for (item of carrito.items(); track item.producto.id) {
                <lm-renglon-pedido
                  [item]="item"
                  [editable]="true"
                  [marca]="marcaDe(item)"
                  (agregar)="carrito.sumar(item.producto.id)"
                  (quitar)="carrito.restar(item.producto.id)"
                />
              }
            </div>

          } @else {
            <!-- Renglones de pedido enviado o confirmado -->
            <div class="pedido__lista pedido__lista--compacta">
              @for (item of p.items; track item.id) {
                <lm-renglon-pedido
                  [item]="item"
                  [editable]="false"
                />
              }
            </div>
          }

          <!--
            El descuento ganado ya no se avisa acá: vive en el resumen, como
            renglón entre el subtotal y el total, que es donde se lo busca.
            El banner queda sólo para el intento sin premio, que no tiene
            renglón propio, y en tono informativo: no es un error.
          -->
          @if (confirmado() && p.juegoIntentado && !p.descuentoJuego) {
            <lm-banner tono="info" titulo="Intento utilizado">
              Esta vez no hubo descuento para este pedido.
            </lm-banner>
          }
        </div>

        <lm-barra-pedido
            [enFila]="editable()"
            [total]="editable() ? carrito.importeTotal() : p.totalFinal"
            [tiempo]="editable() ? carrito.tiempoEstimado() : p.tiempoEstimado"
            [unidades]="editable() ? carrito.cantidadTotal() : unidadesPedido(p)"
            [subtotal]="editable() ? null : p.totalBruto"
            [descuento]="editable() ? 0 : p.montoDescuentoJuego"
            [porcentaje]="editable() ? 0 : p.descuentoJuego"
          >
            @if (editable()) {
              <lm-boton
                compacto
                variante="success"
                icono="send"
                [ancho]="false"
                [deshabilitado]="!carrito.items().length"
                (presionar)="enviar()"
              >
                {{ p.estadoGlobal === 'RECHAZADO' ? 'Reenviar' : 'Pedir' }}
              </lm-boton>
            }
          </lm-barra-pedido>
        }
      } @else if (carrito.items().length) {
        <!-- Borrador antes de enviar -->
        <div class="lm-body lm-body--gap12 lm-body--pantalla">
          <lm-titulo>Mi pedido</lm-titulo>

          <div class="pedido__lista">
            @for (item of carrito.items(); track item.producto.id) {
              <lm-renglon-pedido
                [item]="item"
                [editable]="true"
                (agregar)="carrito.sumar(item.producto.id)"
                (quitar)="carrito.restar(item.producto.id)"
              />
            }
          </div>
        </div>

        <lm-barra-pedido
            enFila
            [total]="carrito.importeTotal()"
            [tiempo]="carrito.tiempoEstimado()"
            [unidades]="carrito.cantidadTotal()"
          >
            <lm-boton
              compacto
              variante="success"
              icono="send"
              [ancho]="false"
              [deshabilitado]="!carrito.items().length"
              (presionar)="enviarNuevo()"
            >
              Pedir
            </lm-boton>
          </lm-barra-pedido>
      } @else {
        <!-- Vacío -->
        <div class="lm-body">
          <lm-titulo>Mi pedido</lm-titulo>
          <lm-vacio icono="receipt_long" titulo="Tu pedido está vacío">
            Entrá a la carta, tocá el más en lo que quieras y el pedido se va armando solo.
            <lm-boton accion variante="secondary" icono="restaurant_menu" [ancho]="false" (presionar)="ir(['/carta'])">
              Ir a la carta
            </lm-boton>
          </lm-vacio>
        </div>
      }

      <lm-barra-inferior [items]="secciones()" activo="pedido" />
    </div>
  `,
  styles: [
    `
    `,
    `
      :host { display: flex; flex: 1; min-height: 0; }
      /* Todo lo de arriba del detalle va apretado: el lugar es para la lista. */
      /* El título va siempre en un solo renglón: la letra se achica con el ancho (el título
         más largo mide unos 14,3 em) en vez de bajar de línea y robarle alto al detalle. */
      :host ::ng-deep lm-titulo h1 {
        white-space: nowrap; font-size: min(20.8px, calc((100vw - 28px) / 14.8));
      }
      /* El aviso de devolución: un solo renglón; el detalle está en la ventana. */
      .info-devolucion {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; min-height: 38px; padding: 6px 12px; cursor: pointer;
        border-radius: var(--radius-pill); border: 1.5px solid var(--state-error);
        background: var(--state-error-surface); color: var(--state-error);
        font: var(--type-body-small); font-weight: 800;
      }
      .info-devolucion__signo {
        flex: 0 0 auto; width: 22px; height: 22px; border-radius: 50%;
        display: grid; place-items: center; background: var(--state-error);
      }
      .info-modal { gap: var(--space-3); position: relative; }
      .info-modal__cerrar {
        position: absolute; top: 10px; right: 10px; z-index: 1;
        width: 36px; height: 36px; padding: 0; cursor: pointer; border-radius: 50%;
        display: grid; place-items: center;
        background: var(--surface-sunken); color: var(--action-primary);
        border: 1.5px solid rgba(255, 255, 255, .85);
        box-shadow: 0 0 0 1px rgba(232, 51, 111, .25), 0 3px 8px rgba(59, 8, 27, .16);
      }
      .info-modal__cerrar:active { transform: scale(.92); }
      /* El cuerpo se recorre adentro si el motivo es largo; el título y el botón quedan a la vista. */
      .lm-modal > .info-modal__cuerpo {
        flex: 0 1 auto; min-height: 0; width: 100%; overflow-y: auto; overscroll-behavior: contain;
        display: flex; flex-direction: column; gap: var(--space-3);
        scrollbar-width: thin; scrollbar-color: rgba(199, 38, 87, .55) transparent;
      }
      .info-modal__alcance { margin: 0; text-align: center; font: var(--type-card-title); color: var(--state-error); }
      .info-modal__motivo {
        margin: 0; text-align: center; font: var(--type-body); color: var(--text-title);
        text-wrap: pretty; overflow-wrap: anywhere;
      }
      /* Las marcas y la acción van enmarcadas: se leen como un grupo aparte del motivo. */
      .info-modal__marcas {
        display: flex; flex-direction: column; gap: var(--space-2); text-align: left;
        padding: var(--space-3); border-radius: var(--radius-field);
        background: var(--surface-sunken); border: 1.5px solid rgba(255, 255, 255, .85);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), 0 3px 8px rgba(94, 12, 44, .1);
      }
      .leyenda__item {
        display: flex; align-items: center; gap: 8px;
        font: var(--type-body-small); color: var(--text-body); text-wrap: pretty;
      }
      .leyenda__item b { color: var(--text-title); }
      .leyenda__sello {
        width: 22px; height: 22px; border-radius: 50%; flex: 0 0 auto;
        display: grid; place-items: center; color: #FFFFFF;
        border: 1.5px solid rgba(255, 255, 255, .6);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), 0 3px 8px rgba(94, 12, 44, .14);
      }
      .leyenda__sello--cantidad { background: var(--state-pending); }
      .leyenda__sello--cambiar { background: var(--state-error); }
      .limpiar {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; min-height: 38px; padding: 6px var(--space-4); margin-top: 2px;
        border: 1.5px solid rgba(255, 255, 255, .6); border-radius: 17px; cursor: pointer;
        background: var(--state-error); color: #FFF6F5;
        font: var(--type-button); line-height: 1.25; text-align: center; text-wrap: balance;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), 0 3px 8px rgba(94, 12, 44, .14);
      }
      .limpiar:active { background: #9E1D13; transform: scale(0.99); }
      /* Dos pisos y no tres: el ícono va al lado del nombre del sector, así la
         lista de abajo se queda con el alto para mostrar tres renglones. */
      .sector { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 4px var(--space-2); text-align: center; }
      .sector__titulo { display: inline-flex; align-items: center; gap: 5px; }
      .momento { flex: 0 0 auto; }
      .espera { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: var(--space-5) var(--space-4); text-align: center; }
      .espera__reloj {
        width: clamp(44px, 13.5vw, 54px); height: clamp(44px, 13.5vw, 54px); border-radius: 50%; display: grid; place-items: center;
        background: var(--surface-sunken);
        border: 1.5px solid rgba(255, 255, 255, .6);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), 0 3px 8px rgba(94, 12, 44, .14);
      }
      .espera b { font: var(--type-card-title); color: var(--text-title); }
      /* El estado vacío llena el alto que sobra: sin hueco debajo. */
      lm-vacio { display: flex; flex-direction: column; flex: 1 1 auto; }
      lm-vacio ::ng-deep .lm-empty { flex: 1 1 auto; justify-content: center; }

      /* Esperando al mozo: una franja de un renglón, con el reloj al costado. */
      .espera { flex: 0 0 auto; flex-direction: row; justify-content: center; gap: 8px; padding: 8px 12px; }
      .espera__reloj { width: 30px; height: 30px; }
      .espera b { font: var(--type-body-medium); font-weight: 800; white-space: nowrap; font-size: clamp(12px, 3.9vw, 15px); }
      /* "Mi pedido" en tandas exactas: cada renglón mide justo una parte del
         alto de la lista (unos 110px de contenido), así entran enteros, sin
         hueco de más, y el snap ancla de a uno, de a dos, de a tres o de a cuatro. */
      .pedido__lista {
        flex: 1 1 0 !important; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3);
        container: pedidolista / size; overflow-y: auto; overscroll-behavior: contain;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0; scrollbar-width: none;
      }
      .pedido__lista::-webkit-scrollbar { display: none; }
      .pedido__lista > lm-renglon-pedido {
        --por: 1;
        flex: 0 0 calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por));
        min-height: min-content; display: flex; flex-direction: column; justify-content: center;
        scroll-snap-align: start; scroll-snap-stop: always;
      }
      /* Tandas ajustadas al contenido: se muestran tantos renglones como entran enteros.
         El más alto (nombre de dos líneas) mide unos 135px, así que cada tanda
         necesita n × 135 + los espacios. Los nombres se cortan en dos líneas con "…":
         un tercer renglón estiraría la tarjeta y rompería el snap. Así no sobra
         aire entre tarjetas ni hace falta estirarlas. */
      .pedido__lista > lm-renglon-pedido ::ng-deep .renglon__datos b {
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }
      @container pedidolista (min-height: 282px) { .pedido__lista > lm-renglon-pedido { --por: 2; } }
      @container pedidolista (min-height: 417px) { .pedido__lista > lm-renglon-pedido { --por: 3; } }
      @container pedidolista (min-height: 552px) { .pedido__lista > lm-renglon-pedido { --por: 4; } }
      /* El estado y el resumen dejan menos alto que en el borrador:
         como en el carrito, se muestran hasta dos renglones por tanda. */
      /* Detalle del pedido enviado: renglones más bajos que los del carrito. */
      .pedido__lista--compacta { container: pedidodetalle / size; }
      .pedido__lista--compacta > lm-renglon-pedido ::ng-deep .renglon { padding-top: 5px !important; padding-bottom: 5px !important; }
      /* Acá el renglón más alto (nombre de dos líneas) mide 93px y el espacio
         entre renglones llega a 10px: cada tanda de n necesita n × 93 + (n − 1) × 10. */
      @container pedidodetalle (min-height: 196px) { .pedido__lista--compacta > lm-renglon-pedido { --por: 2; } }
      @container pedidodetalle (min-height: 299px) { .pedido__lista--compacta > lm-renglon-pedido { --por: 3; } }
      @container pedidodetalle (min-height: 402px) { .pedido__lista--compacta > lm-renglon-pedido { --por: 4; } }
      @container pedidodetalle (min-height: 505px) { .pedido__lista--compacta > lm-renglon-pedido { --por: 5; } }

    `,
  ],
})
export class ClientePedidoPage extends PaginaConSesion implements OnInit {
  protected readonly pedidos = inject(PedidosService);
  protected readonly productos = inject(ProductosService);
  protected readonly carrito = inject(CarritoService);
  private readonly espera = inject(EsperaService);
  private readonly mesas = inject(MesasService);
  private readonly chat = inject(ChatService);
  protected readonly encuestas = inject(EncuestasService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly respuestasSinLeer = signal(0);
  private escuchaChat: Unsubscribe | null = null;

  protected readonly pedido = computed(() => this.pedidos.activoDe(this.usuario()));

  protected readonly editable = computed(() => {
    const p = this.pedido();
    return p === undefined || p.estadoGlobal === 'SELECCIONANDO' || p.estadoGlobal === 'RECHAZADO';
  });

  protected readonly esperando = computed(() => this.pedido()?.estadoGlobal === 'PENDIENTE_CONFIRMACION');

  protected readonly confirmado = computed(() => {
    const estado = this.pedido()?.estadoGlobal;
    return (
      estado === 'CONFIRMADO' ||
      estado === 'EN_PREPARACION' ||
      estado === 'LISTO' ||
      estado === 'ENTREGADO' ||
      estado === 'RECIBIDO' ||
      estado === 'CUENTA_SOLICITADA' ||
      estado === 'PAGO_PENDIENTE' ||
      estado === 'CERRADO'
    );
  });

  private readonly mesaId = computed(() => {
    const id = this.usuario()?.id;
    if (this.sesion.mesaActivaId()) return this.sesion.mesaActivaId();
    const entrada = id ? this.espera.activaDe(id) : undefined;
    return entrada?.estado === 'FINALIZADO' ? entrada.mesaAsignadaId : null;
  });

  protected readonly aCambiar = computed(() => this.pedidos.itemsACambiar(this.pedido(), this.carrito.items()));

  protected readonly hayAmarillos = computed(() =>
    (this.pedido()?.observaciones ?? []).some((o) => o.marca === 'CANTIDAD'),
  );

  /** La ventana con el motivo de la devolución y las marcas. */
  protected readonly infoDevolucion = signal(false);

  protected readonly traba = computed(() =>
    this.editable() ? this.pedidos.trabaParaReenviar(this.pedido(), this.carrito.items()) : null,
  );

  ngOnInit(): void {
    const p = this.pedido();
    if (p?.estadoGlobal === 'RECHAZADO' && this.carrito.pedidoEnEdicion() !== p.id) {
      this.carrito.editarPedido(p, (id) => this.productos.porId(id));
    }
  }

  constructor() {
    super();

    // Con la cuenta pedida, la zona de arriba depende de si ya respondió la encuesta.
    effect(() => {
      const p = this.pedido();
      if (p && (p.estadoGlobal === 'CUENTA_SOLICITADA' || p.estadoGlobal === 'PAGO_PENDIENTE')) {
        void this.encuestas.consultar(p.id);
      }
    });

    effect(() => {
      const p = this.pedido();
      if (p?.estadoGlobal === 'RECHAZADO' && this.carrito.pedidoEnEdicion() !== p.id) {
        this.carrito.editarPedido(p, (id) => this.productos.porId(id));
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

  /** Con la cuenta habilitada, la pantalla es el cobro. */
  protected enCuenta(p: Pedido): boolean {
    return p.estadoGlobal === 'CUENTA_SOLICITADA' && !!p.cuentaHabilitada;
  }

  protected titulo(): string {
    const estado = this.pedido()?.estadoGlobal;
    if (estado === 'RECHAZADO') return 'Tu pedido necesita cambios';
    if (estado === 'PENDIENTE_CONFIRMACION') return 'Pedido enviado';
    if (estado === 'LISTO') return 'Tu pedido está listo';
    if (estado === 'EN_PREPARACION') return 'Lo están preparando';
    if (estado === 'CONFIRMADO') return 'Pedido confirmado';
    if (estado === 'ENTREGADO') return 'Pedido entregado';
    if (estado === 'RECIBIDO') return 'Recepción confirmada';
    if (estado === 'CUENTA_SOLICITADA') return 'Cuenta solicitada';
    if (estado === 'PAGO_PENDIENTE') return 'Pago pendiente';
    if (estado === 'CERRADO') return 'Pedido cerrado';
    return 'Mi pedido';
  }


  protected alcance(): string {
    const p = this.pedido();
    return p?.alcanceRechazo ? ROTULO_ALCANCE_RECHAZO[p.alcanceRechazo] : 'Modificación pedida';
  }

  protected rotuloSector(estado: string): string {
    return (ROTULO_ESTADO_SECTOR as Record<string, string>)[estado] ?? estado;
  }

  protected chipSector(estado: string): string {
    return estado === 'LISTO' ? 'aprobado' : estado === 'EN_PREPARACION' ? 'reservada' : 'pendiente';
  }

  protected marcaDe(item: ItemCarrito): MarcaRechazo | null {
    return this.pedidos.marcaDe(this.pedido(), item.producto.id);
  }

  protected unidadesPedido(p: Pedido): number {
    return (p.items ?? []).reduce((s, i) => s + i.cantidad, 0);
  }

  /** Cierra la ventana y saca los productos sin stock (que pide su propia confirmación). */
  protected sacarDesdeInfo(): void {
    this.infoDevolucion.set(false);
    void this.sacarLosQueNoVan();
  }

  protected async sacarLosQueNoVan(): Promise<void> {
    const cuantos = this.aCambiar().length;
    if (!cuantos) return;

    const seguro = await this.preguntar({
      titulo: cuantos === 1 ? '¿Sacás el producto en rojo?' : `¿Sacás los ${cuantos} productos en rojo?`,
      confirmar: 'Sacarlos del pedido',
      tono: 'peligro',
      icono: 'delete_sweep',
      // Cuáles son: uno por línea, con el mismo sello rojo que llevan en la lista.
      detalle: [
        {
          rotulo: '',
          valor: '',
          marcas: this.aCambiar().map((item) => ({
            icono: 'block',
            tono: 'peligro' as const,
            texto: item.producto.nombre,
          })),
        },
      ],
    });
    if (!seguro) return;

    for (const item of this.aCambiar()) {
      this.carrito.quitar(item.producto.id);
    }
    this.avisos.info('Listo', 'Podés elegir otra cosa desde la carta.');
  }

  protected async enviar(): Promise<void> {
    const p = this.pedido();
    const cliente = this.usuario();
    if (!cliente || !this.carrito.items().length) return;

    if (p?.estadoGlobal === 'RECHAZADO') {
      // Todavía quedan productos marcados: se avisa arriba, sin ocupar lugar en la pantalla.
      const motivo = this.traba();
      if (motivo) {
        this.avisos.error('Todavía no lo podés mandar', motivo);
        return;
      }
      const seguro = await this.preguntar({
        titulo: '¿Reenviás el pedido corregido?',
        confirmar: 'Reenviar',
        tono: 'primario',
        icono: 'send',
        detalle: [
          { rotulo: 'Productos', valor: `${this.carrito.cantidadTotal()}` },
          { rotulo: 'Total', valor: `$ ${this.carrito.importeTotal()}` },
          { rotulo: 'Demora', valor: `${this.carrito.tiempoEstimado()}'` },
        ],
      });
      if (!seguro) return;

      await this.cargando.conEsperaMinima('Reenviando tu pedido…', async () => {
        await this.pedidos.reenviar(
          p,
          this.carrito.items(),
          this.carrito.tiempoEstimado(),
          this.carrito.importeTotal(),
        );
        this.carrito.vaciar();
      });
      this.avisos.exito('Reenviado', 'El mozo está revisando tus cambios.');
    } else {
      await this.enviarNuevo();
    }
  }

  protected async enviarNuevo(): Promise<void> {
    const cliente = this.usuario();
    const mesaId = this.mesaId();
    let mesa = mesaId ? this.mesas.porId(mesaId) : undefined;
    if (!mesa && mesaId) {
      mesa = {
        id: mesaId,
        numero: this.sesion.mesaActivaNumero() ?? 1,
        cantidadComensales: 4,
        tipo: 'ESTANDAR',
        estado: 'OCUPADA',
        fotoUrl: '',
        qrCodeUrl: '',
      };
    }
    if (!cliente || !mesa || !this.carrito.items().length) {
      this.avisos.error('Error', 'Se necesita una mesa vinculada y productos en el pedido.');
      return;
    }

    const seguro = await this.preguntar({
      titulo: '¿Mandás el pedido al mozo?',
      mensaje: 'El mozo lo revisa y te avisa. Mientras tanto no vas a poder modificarlo.',
      confirmar: 'Enviar el pedido',
      tono: 'primario',
      icono: 'send',
      detalle: [
        { rotulo: 'Productos', valor: `${this.carrito.cantidadTotal()}` },
        { rotulo: 'Total', valor: `$ ${this.carrito.importeTotal()}` },
        { rotulo: 'Demora', valor: `${this.carrito.tiempoEstimado()}'` },
      ],
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima('Mandando tu pedido…', async () => {
      await this.pedidos.crearPendiente(
        mesa!,
        cliente,
        this.carrito.items(),
        this.carrito.tiempoEstimado(),
        this.carrito.importeTotal(),
      );
      this.carrito.vaciar();
    });
    this.avisos.exito('Tu pedido salió', 'El mozo lo está revisando.');
  }

  protected async recibir(p: Pedido): Promise<void> {
    const seguro = await this.preguntar({
      titulo: '¿Recibiste tu pedido?',
      mensaje: 'Confirmalo cuando tengas en la mesa todo lo que pediste.',
      confirmar: 'Confirmar recepción',
      tono: 'exito',
      icono: 'check_circle',
      detalle: [
        { rotulo: 'Mesa', valor: `${p.mesaNumero}` },
        { rotulo: 'Productos', valor: `${this.unidadesPedido(p)}` },
      ],
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima('Confirmando entrega…', async () => {
      await this.pedidos.actualizarEstadoGlobal(p.id, 'RECIBIDO');
    });
    this.avisos.exito('¡Buen provecho!', 'Que disfrutes tu comida.');
  }

  protected async pedirCuenta(p: Pedido): Promise<void> {
    const seguro = await this.preguntar({
      titulo: '¿Pedís la cuenta?',
      mensaje:
        'Le avisamos al mozo para que te la acerque. Mientras tanto, te vamos a pedir que respondas una encuesta corta de satisfacción.',
      confirmar: 'Pedir la cuenta',
      tono: 'primario',
      icono: 'receipt_long',
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima('Avisando al mozo…', async () => {
      await this.pedidos.actualizarEstadoGlobal(p.id, 'CUENTA_SOLICITADA');
    });

    // Un solo modal, y al cerrarlo la barra lo lleva a Encuestas: la encuesta
    // nueva lo está esperando ahí.
    await this.confirmacion.mostrar({
      titulo: 'Cuenta solicitada',
      mensaje: 'El mozo ya está avisado. Mientras te la acerca, contanos cómo te fue: son cinco pasos.',
      confirmar: 'Ir a la encuesta',
      tono: 'exito',
      icono: 'receipt_long',
    });
    this.ir(['/cliente/encuestas']);
  }
}
