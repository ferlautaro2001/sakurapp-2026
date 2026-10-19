import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, signal, viewChild } from '@angular/core';
import { UI } from '../../ui';
import { PaginaDeComandas } from './comandas-base';
import { ROTULO_ESTADO_PEDIDO, Sector } from '../../nucleo/modelos/enums';
import { PedidoItem } from '../../nucleo/modelos/modelos';

/** Alto de un renglón con nombre de hasta dos líneas, del separador y del espacio entre piezas. */
const ALTO_RENGLON = 95;
const ALTO_SEPARADOR = 22;
const ESPACIO = 8;

/**
 * Detalle completo de la comanda para revisión y auditoría del mozo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-mozo-pedido-detalle',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado [titulo]="pedido() ? 'Pedido · Mesa ' + mesa() : 'Pedido'" conVolver (volver)="volver()" />

      @if (pedido(); as p) {
        <div class="lm-body lm-body--gap12">
          <div class="lm-card mesa">
            <span class="mesa__icono">
              <lm-icono nombre="table_restaurant" [tamano]="24" color="var(--action-primary)" />
            </span>
            <div class="mesa__datos">
              <b>Mesa {{ mesa() }}</b>
              <small>Pedido de {{ comensalNombre() }}</small>
            </div>
            <lm-chip class="mesa__estado" [estado]="chip()">
              @if (confirmado()) {
                <lm-icono [nombre]="iconoSector()" [tamano]="18" />
              }
              {{ rotuloEstado() }}
            </lm-chip>
          </div>

          @if (p.estadoGlobal === 'RECHAZADO' && p.motivoRechazo) {
            <div class="lm-card devuelto">
              <b>Se lo devolviste para modificar</b>
              <p>{{ p.motivoRechazo }}</p>
            </div>
          }

          <!-- Cada pantalla de la lista es una página exacta: el separador del
               sector y los renglones que entran enteros. Si un sector no entra en
               una pantalla, sigue en la siguiente con su separador. -->
          <div #lista class="detalle__lista" [style.--k]="porPagina()">
            @for (pagina of paginas(); track pagina.clave) {
              <section class="pagina">
                <lm-separador flor [rotulo]="pagina.rotulo" />
                <div class="pagina__items">
                  @for (item of pagina.items; track item.id) {
                    <lm-renglon-pedido class="casilla" [item]="item" />
                  }
                </div>
              </section>
            }
          </div>
        </div>

        <lm-barra-pedido
          class="detalle__barra"
          tira
          compacta
          [total]="p.totalFinal"
          [tiempo]="p.tiempoEstimado"
          [unidades]="unidadesTotal()"
          [decision]="p.estadoGlobal === 'PENDIENTE_CONFIRMACION'"
          (devolver)="ir(['/mozo/pedidos', p.id, 'rechazar'])"
          (confirmar)="confirmar()"
        />
      } @else {
        <div class="lm-body">
          <lm-vacio icono="receipt_long" titulo="No encontramos ese pedido">
            Puede que el cliente lo haya modificado desde su teléfono.
            <lm-boton accion variante="secondary" [ancho]="false" (presionar)="volver()">Volver a los pedidos</lm-boton>
          </lm-vacio>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      /* El estado del pedido, más grande y con el ícono del sector. */
      .mesa__estado { flex: 0 0 auto; }
      .mesa__estado ::ng-deep .lm-chip { display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: clamp(12px, 3.2vw, 13.5px); padding: 5px clamp(8px, 2.2vw, 12px); box-sizing: border-box; white-space: nowrap; max-width: 100%; }
      /* Tarjetas y resumen con el aro de vidrio del botón de volver. Los botones
         de decisión (✕/✓) ya traen su propio borde estandarizado en el componente. */
      .lm-card, :host ::ng-deep .renglon,
      :host ::ng-deep .lm-resumen {
        background-clip: padding-box !important;
        border: 1.5px solid rgba(255, 255, 255, .5) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, .55),
          inset 0 -6px 12px rgba(255, 255, 255, .06),
          0 4px 10px rgba(94, 12, 44, .16) !important;
      }
      .mesa { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); }
      .mesa__icono {
        flex: 0 0 auto; width: var(--touch-min); min-height: var(--touch-min); border-radius: 14px;
        display: grid; place-items: center; background: var(--surface-sunken);
      }
      .mesa__datos { flex: 1 1 auto; min-width: 0; }
      .mesa__datos b { display: block; font: var(--type-section); color: var(--text-title); }
      .mesa__datos small { display: block; font: var(--type-body-small); color: var(--text-muted); white-space: nowrap; }
      .devuelto { padding: var(--space-4); border-left: 4px solid var(--state-error); }
      .devuelto b { display: block; font: var(--type-card-title); color: var(--state-error); }
      .devuelto p { margin: 6px 0 0; font: var(--type-body); color: var(--text-body); text-wrap: pretty; }
      /* La mesa y el aviso quedan fijos arriba; la lista se lleva el resto del
         alto y va en tandas exactas: cada renglón mide justo una parte de la
         lista y el snap frena en tandas enteras, sin nada cortado. */
      .lm-body { overflow: hidden; }
      .detalle__lista {
        flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3);
        container: detalle / size; overflow-y: auto; overscroll-behavior: contain;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0; scrollbar-width: none;
      }
      .detalle__lista::-webkit-scrollbar { display: none; }
      .pagina {
        flex: 0 0 100cqh; min-height: 0; display: flex; flex-direction: column; gap: 8px;
        scroll-snap-align: start; scroll-snap-stop: always;
      }
      .pagina > lm-separador { flex: 0 0 auto; }
      .pagina__items { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
      /* Cada renglón mide una parte exacta de lo que deja el separador. */
      .pagina__items > .casilla {
        flex: 0 0 calc((100cqh - 22px - 8px - (var(--k, 1) - 1) * 8px) / var(--k, 1));
        min-height: 0; display: flex; flex-direction: column;
      }
      .pagina__items > .casilla ::ng-deep .renglon { flex: 1 1 auto; justify-content: center; }
      /* Lugar para un nombre de hasta dos renglones; si es más largo, "…". */
      .pagina__items > .casilla ::ng-deep .renglon__datos b {
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }

      :host ::ng-deep .renglon { padding: 5px 11px !important; }
      :host ::ng-deep .renglon__fila { row-gap: 3px !important; }
      :host ::ng-deep .renglon__fila .renglon__subtotal {
        font-size: clamp(17px, 5vw, 20px) !important;
      }
      :host ::ng-deep .renglon__cantidad {
        min-height: 27px !important; padding: 5px !important;
      }
    `,
  ],
})
export class MozoPedidoDetallePage extends PaginaDeComandas {
  readonly id = input.required<string>();

  protected readonly sectores: { valor: Sector; rotulo: string }[] = [
    { valor: 'COCINA', rotulo: 'Para sector cocina' },
    { valor: 'BAR', rotulo: 'Para sector barra' },
  ];

  protected readonly pedido = computed(() => this.pedidos.porId(this.id()));

  protected readonly confirmado = computed(() => {
    const estado = this.pedido()?.estadoGlobal;
    return (
      estado === 'CONFIRMADO' ||
      estado === 'EN_PREPARACION' ||
      estado === 'LISTO' ||
      estado === 'ENTREGADO' ||
      estado === 'RECIBIDO'
    );
  });

  private itemsDe(sector: Sector): PedidoItem[] {
    const p = this.pedido();
    return p ? p.items.filter((i) => i.sector === sector) : [];
  }

  protected readonly mesa = computed(() => {
    const p = this.pedido();
    return p ? this.numeroMesa(p) : '—';
  });

  protected readonly comensalNombre = computed(() => {
    const p = this.pedido();
    return p ? (this.comensal(p).trim().split(/\s+/)[0] || '') : '';
  });

  protected readonly unidadesTotal = computed(() => {
    const p = this.pedido();
    return p ? this.unidades(p) : 0;
  });

  /** Sectores ya resueltos con sus items: el template no vuelve a filtrar. */
  /** Alto de la lista, para saber cuántos renglones entran enteros por pantalla. */
  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');
  private readonly altoLista = signal(0);

  protected readonly porPagina = computed(() => {
    const libre = this.altoLista() - ALTO_SEPARADOR - ESPACIO;
    return Math.max(1, Math.floor((libre + ESPACIO) / (ALTO_RENGLON + ESPACIO)));
  });

  /** Los sectores partidos en páginas de `porPagina` renglones, cada una con su separador. */
  protected readonly paginas = computed(() => {
    const k = this.porPagina();
    return this.sectoresConItems().flatMap((sector) => {
      const paginas = [];
      for (let i = 0; i < sector.items.length; i += k) {
        paginas.push({ clave: `${sector.valor}-${i}`, rotulo: sector.rotulo, items: sector.items.slice(i, i + k) });
      }
      return paginas;
    });
  });

  constructor() {
    super();
    effect((alLimpiar) => {
      const el = this.lista()?.nativeElement;
      if (!el) return;
      const observador = new ResizeObserver(([entrada]) => this.altoLista.set(entrada.contentRect.height));
      observador.observe(el);
      alLimpiar(() => observador.disconnect());
    });
  }

  protected readonly sectoresConItems = computed(() =>
    this.sectores
      .map((s) => ({ valor: s.valor, rotulo: s.rotulo, items: this.itemsDe(s.valor) }))
      .filter((s) => s.items.length > 0),
  );

  protected readonly iconoSector = computed(() =>
    this.sectoresConItems().some((s) => s.valor === 'COCINA') ? 'skillet' : 'local_bar',
  );

  protected readonly rotuloEstado = computed(() => {
    const p = this.pedido();
    return p ? ROTULO_ESTADO_PEDIDO[p.estadoGlobal] : '';
  });

  protected readonly chip = computed(() => {
    const estado = this.pedido()?.estadoGlobal;
    if (estado === 'RECHAZADO') return 'rechazado';
    if (estado === 'LISTO') return 'aprobado';
    return 'reservada';
  });

  protected async confirmar(): Promise<void> {
    const p = this.pedido();
    if (!p) return;
    const listo = await this.confirmarPedido(p);
    if (listo) this.volver();
  }

  protected volver(): void {
    this.ir(['/mozo/pedidos']);
  }
}
