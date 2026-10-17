import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UI } from '../../ui';
import { PaginaDeComandas } from './comandas-base';
import { ROTULO_ESTADO_PEDIDO, Sector } from '../../nucleo/modelos/enums';
import { PedidoItem } from '../../nucleo/modelos/modelos';

/**
 * Detalle completo de la comanda para revisión y auditoría del mozo.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-mozo-pedido-detalle',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Pedido" conVolver (volver)="volver()" />

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

          @for (sector of sectoresConItems(); track sector.valor) {
            <lm-separador flor [rotulo]="sector.rotulo" />
            <div class="lm-list">
              @for (item of sector.items; track item.id) {
                <lm-renglon-pedido [item]="item" />
              }
            </div>
          }
        </div>

        <div class="lm-actionbar">
          <lm-resumen-pedido [total]="p.totalFinal" [tiempo]="p.tiempoEstimado" [unidades]="unidadesTotal()">
            @if (p.estadoGlobal === 'PENDIENTE_CONFIRMACION') {
              <lm-decision
                rotuloRechazar="Devolver"
                rotuloAceptar="Confirmar"
                (rechazar)="ir(['/mozo/pedidos', p.id, 'rechazar'])"
                (aceptar)="confirmar()"
              />
            }
          </lm-resumen-pedido>
        </div>
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
      /* Snap y desplazamiento: ningún renglón ni tarjeta queda cortado por la mitad sobre la barra de acción */
      .lm-body {
        scroll-snap-type: y mandatory;
        scroll-padding-top: var(--space-3);
        scroll-padding-bottom: calc(var(--space-6) + var(--safe-bottom));
        overscroll-behavior-y: contain;
      }
      .mesa, .devuelto {
        scroll-snap-align: start;
        scroll-snap-stop: always;
      }
      lm-separador {
        scroll-snap-align: none !important;
      }
      :host ::ng-deep .lm-list {
        scroll-snap-align: none;
      }
      :host ::ng-deep .lm-list > lm-renglon-pedido {
        scroll-snap-align: start;
        scroll-snap-stop: always;
      }
      :host ::ng-deep .lm-list > lm-renglon-pedido:last-child:not(:only-child),
      :host ::ng-deep .lm-list:last-of-type > lm-renglon-pedido:last-child {
        scroll-snap-align: end;
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
