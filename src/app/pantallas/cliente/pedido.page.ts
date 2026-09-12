import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
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
import { Unsubscribe } from 'firebase/firestore';

/**
 * Pantalla integral "Mi pedido" que unifica borrador, revisión, comanda devuelta y progreso.
 */
@Component({
  selector: 'lm-cliente-pedido',
  imports: [...UI],
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
        <div class="lm-body lm-body--gap12">
          @if (!esperando()) {
            <lm-titulo [bajada]="bajada()">{{ titulo() }}</lm-titulo>
          }

          @if (p.estadoGlobal === 'RECHAZADO') {
            <div class="lm-card devuelto">
              <div class="devuelto__encabezado">
                <lm-icono nombre="edit_note" [tamano]="24" color="var(--state-error)" />
                <div>
                  <b>{{ alcance() }}</b>
                  <small>Lo devolvió {{ p.rechazadoPorNombre ?? 'el mozo del salón' }}</small>
                </div>
              </div>
              <p class="devuelto__motivo">{{ p.motivoRechazo }}</p>
            </div>
          }

          @if (esperando()) {
            <div class="lm-card espera">
              <h1 class="espera__titulo">Pedido enviado</h1>
              <span class="espera__reloj">
                <lm-icono nombre="hourglass_top" [tamano]="30" color="var(--action-primary)" />
              </span>
              <b>El mozo está revisando tu pedido</b>
              <small>Cuando lo confirme te avisamos. Mientras esperás podés mirar los resultados de las encuestas.</small>
              <div style="margin-top: 12px; width: 100%;">
                <lm-boton icono="insights" (presionar)="ir(['/cliente/encuestas'])">Ver encuestas</lm-boton>
              </div>
            </div>
          }

          @if (confirmado()) {
            <div class="lm-grid2">
              @if (p.estadoCocina !== 'NO_APLICA') {
                <div class="lm-card sector">
                  <lm-icono nombre="skillet" [tamano]="24" color="var(--action-primary)" />
                  <span class="lm-label">Cocina</span>
                  <lm-chip [estado]="chipSector(p.estadoCocina)">{{ rotuloSector(p.estadoCocina) }}</lm-chip>
                </div>
              }
              @if (p.estadoBar !== 'NO_APLICA') {
                <div class="lm-card sector">
                  <lm-icono nombre="local_bar" [tamano]="24" color="var(--action-primary)" />
                  <span class="lm-label">Barra</span>
                  <lm-chip [estado]="chipSector(p.estadoBar)">{{ rotuloSector(p.estadoBar) }}</lm-chip>
                </div>
              }
            </div>
          }

          <lm-separador flor rotulo="Detalle" />

          @if (editable() && p.observaciones.length) {
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

                <button type="button" class="limpiar" (click)="sacarLosQueNoVan()">
                  <lm-icono nombre="delete_sweep" [tamano]="20" />
                  Eliminar los productos que no se pueden preparar
                </button>
              }
            </div>
          }

          <!-- Renglones en modo editable (desde carrito) -->
          @if (editable()) {
            <div class="lm-list">
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

            @if (traba(); as motivo) {
              <lm-banner tono="error" titulo="Todavía no lo podés mandar">{{ motivo }}</lm-banner>
            } @else {
              <p class="lm-parrafo">
                Podés cambiar las cantidades acá o volver a la carta para sumar o sacar productos.
              </p>
            }
          } @else {
            <!-- Renglones de pedido enviado o confirmado -->
            <div class="lm-list">
              @for (item of p.items; track item.id) {
                <lm-renglon-pedido
                  [item]="item"
                  [editable]="false"
                />
              }
            </div>
          }

          @if (confirmado()) {
            @if (p.juegoIntentado) {
              <lm-banner icono="redeem" [titulo]="p.descuentoJuego ? 'Descuento aplicado' : 'Intento utilizado'">
                {{ p.descuentoJuego ? '¡Ganaste un ' + p.descuentoJuego + '% de descuento en tu comanda!' : 'Esta vez no hubo descuento para este pedido.' }}
              </lm-banner>
            }
          }
        </div>

        <div class="lm-actionbar">
          <lm-resumen-pedido
            [total]="editable() ? carrito.importeTotal() : p.totalFinal"
            [tiempo]="editable() ? carrito.tiempoEstimado() : p.tiempoEstimado"
            [unidades]="editable() ? carrito.cantidadTotal() : unidadesPedido(p)"
          >
            @if (editable()) {
              <lm-boton
                icono="send"
                [deshabilitado]="!carrito.items().length || traba() !== null"
                (presionar)="enviar()"
              >
                {{ p.estadoGlobal === 'RECHAZADO' ? 'Reenviar el pedido corregido' : 'Enviar el pedido al mozo' }}
              </lm-boton>
              <lm-texto-boton (presionar)="ir(['/carta'])">Volver a la carta</lm-texto-boton>
            } @else if (p.estadoGlobal === 'PENDIENTE_CONFIRMACION') {
              <lm-boton variante="secondary" icono="hourglass_top" [deshabilitado]="true">
                Esperando al mozo
              </lm-boton>
            } @else if (p.estadoGlobal === 'LISTO') {
              <lm-boton icono="check_circle" (presionar)="recibir(p)">
                Confirmar recepción del pedido
              </lm-boton>
            } @else if (p.estadoGlobal === 'RECIBIDO') {
              <lm-boton icono="receipt" (presionar)="pedirCuenta(p)">
                Pedir la cuenta al mozo
              </lm-boton>
            } @else {
              <lm-boton variante="secondary" icono="sports_esports" (presionar)="ir(['/cliente/juegos'])">
                Jugar mientras esperás
              </lm-boton>
            }
          </lm-resumen-pedido>
        </div>
      } @else if (carrito.items().length) {
        <!-- Borrador antes de enviar -->
        <div class="lm-body lm-body--gap12">
          <lm-titulo bajada="Sumá o sacá lo que quieras antes de mandarlo">Mi pedido</lm-titulo>

          <div class="lm-list">
            @for (item of carrito.items(); track item.producto.id) {
              <lm-renglon-pedido
                [item]="item"
                [editable]="true"
                (agregar)="carrito.sumar(item.producto.id)"
                (quitar)="carrito.restar(item.producto.id)"
              />
            }
          </div>

          <p class="lm-parrafo">
            Podés cambiar las cantidades acá o volver a la carta para sumar otros productos.
          </p>
        </div>

        <div class="lm-actionbar">
          <lm-resumen-pedido
            [total]="carrito.importeTotal()"
            [tiempo]="carrito.tiempoEstimado()"
            [unidades]="carrito.cantidadTotal()"
          >
            <lm-boton
              icono="send"
              [deshabilitado]="!carrito.items().length"
              (presionar)="enviarNuevo()"
            >
              Enviar el pedido al mozo
            </lm-boton>
            <lm-texto-boton (presionar)="ir(['/carta'])">Volver a la carta</lm-texto-boton>
          </lm-resumen-pedido>
        </div>
      } @else {
        <!-- Vacío -->
        <div class="lm-body">
          <lm-titulo bajada="Todavía no armaste ningún pedido">Mi pedido</lm-titulo>
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
      :host { display: flex; flex: 1; min-height: 0; }
      .devuelto { padding: 14px; border-left: 4px solid var(--state-error); }
      .devuelto__encabezado { display: flex; align-items: center; gap: 10px; }
      .devuelto__encabezado b { display: block; font: var(--type-card-title); color: var(--state-error); }
      .devuelto__encabezado small { display: block; font: var(--type-caption); color: var(--text-muted); }
      .devuelto__motivo { margin: 10px 0 0; font: var(--type-body); color: var(--text-body); text-wrap: pretty; }
      .leyenda { display: flex; flex-direction: column; gap: 10px; padding: 14px; }
      .leyenda__item {
        display: flex; align-items: flex-start; gap: 10px;
        font: var(--type-body-small); color: var(--text-body); text-wrap: pretty;
      }
      .leyenda__item b { color: var(--text-title); }
      .leyenda__sello {
        width: 26px; height: 26px; border-radius: 50%; flex: 0 0 auto;
        display: grid; place-items: center; color: #FFFFFF;
      }
      .leyenda__sello--cantidad { background: var(--state-pending); }
      .leyenda__sello--cambiar { background: var(--state-error); }
      .limpiar {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; min-height: var(--touch-min); padding: 10px 14px; margin-top: 2px;
        border: none; border-radius: var(--radius-button); cursor: pointer;
        background: var(--state-error); color: #FFF6F5;
        font: var(--type-button); line-height: 1.25; text-align: center; text-wrap: balance;
      }
      .limpiar:active { background: #9E1D13; transform: scale(0.99); }
      .sector { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; text-align: center; }
      .espera { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 18px 16px; text-align: center; }
      .espera__titulo {
        margin: 0 0 6px; font: var(--type-title); letter-spacing: var(--tracking-tight);
        color: var(--text-title); text-wrap: balance;
      }
      .espera__reloj {
        width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center;
        background: var(--surface-sunken);
      }
      .espera b { font: var(--type-card-title); color: var(--text-title); }
      .espera small { font: var(--type-body-small); color: var(--text-muted); text-wrap: pretty; }
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

  protected titulo(): string {
    const estado = this.pedido()?.estadoGlobal;
    if (estado === 'RECHAZADO') return 'Tu pedido necesita cambios';
    if (estado === 'PENDIENTE_CONFIRMACION') return 'Pedido enviado';
    if (estado === 'LISTO') return 'Tu pedido está listo';
    if (estado === 'EN_PREPARACION') return 'Lo están preparando';
    if (estado === 'CONFIRMADO') return 'Pedido confirmado';
    if (estado === 'RECIBIDO' || estado === 'ENTREGADO') return 'Pedido entregado';
    if (estado === 'CUENTA_SOLICITADA') return 'Cuenta solicitada';
    if (estado === 'PAGO_PENDIENTE') return 'Pago pendiente';
    if (estado === 'CERRADO') return 'Pedido cerrado';
    return 'Mi pedido';
  }

  protected bajada(): string | null {
    const p = this.pedido();
    if (!p) return 'Sumá o sacá lo que quieras antes de mandarlo';
    switch (p.estadoGlobal) {
      case 'RECHAZADO':
        return 'El mozo te devolvió el pedido';
      case 'PENDIENTE_CONFIRMACION':
        return null;
      case 'CONFIRMADO':
        return `Salió para la cocina y la barra · listo en unos ${p.tiempoEstimado} minutos`;
      case 'EN_PREPARACION':
        return 'Ya lo están preparando';
      case 'LISTO':
        return 'El mozo te lo va a acercar en un momento';
      case 'RECIBIDO':
      case 'ENTREGADO':
        return 'Esperamos que disfrutes tu comida';
      case 'CUENTA_SOLICITADA':
        return 'El mozo se acerca con la cuenta';
      default:
        return 'Sumá o sacá lo que quieras antes de mandarlo';
    }
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

  protected async sacarLosQueNoVan(): Promise<void> {
    const cuantos = this.aCambiar().length;
    if (!cuantos) return;

    const seguro = await this.preguntar({
      titulo: cuantos === 1 ? '¿Sacás el producto en rojo?' : `¿Sacás los ${cuantos} productos en rojo?`,
      mensaje: 'Son los que el mozo marcó como imposibles de preparar. Salen de tu pedido y podés elegir otra cosa desde la carta.',
      confirmar: 'Sacarlos del pedido',
      tono: 'peligro',
      icono: 'delete_sweep',
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
      const seguro = await this.preguntar({
        titulo: '¿Reenviás el pedido corregido?',
        mensaje: 'El mozo lo vuelve a revisar con los cambios que hiciste.',
        confirmar: 'Reenviar',
        tono: 'primario',
        icono: 'send',
        detalle: [
          { rotulo: 'Productos', valor: `${this.carrito.cantidadTotal()}` },
          { rotulo: 'Total', valor: `$ ${this.carrito.importeTotal()}` },
          { rotulo: 'Demora', valor: `${this.carrito.tiempoEstimado()} min` },
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
        { rotulo: 'Demora', valor: `${this.carrito.tiempoEstimado()} min` },
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
      titulo: '¿Confirmás la entrega?',
      mensaje: '¿El mozo ya te acercó el pedido completo a la mesa?',
      confirmar: 'Confirmar recepción',
      tono: 'primario',
      icono: 'check_circle',
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
      mensaje: 'Le avisamos al mozo para que acerque la cuenta a la mesa.',
      confirmar: 'Pedir la cuenta',
      tono: 'primario',
      icono: 'receipt',
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima('Avisando al mozo…', async () => {
      await this.pedidos.actualizarEstadoGlobal(p.id, 'CUENTA_SOLICITADA');
    });
    this.avisos.exito('Cuenta solicitada', 'El mozo ya está notificado.');
  }
}
