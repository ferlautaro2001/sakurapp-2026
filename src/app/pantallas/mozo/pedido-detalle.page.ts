import { Component, computed, input } from '@angular/core';
import { UI } from '../../ui';
import { PaginaDeComandas } from './comandas-base';
import { ROTULO_ESTADO_PEDIDO, Sector } from '../../nucleo/modelos/enums';
import { PedidoItem } from '../../nucleo/modelos/modelos';

/**
 * Detalle completo de la comanda para revisión y auditoría del mozo.
 */
@Component({
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
              <b>Mesa {{ numeroMesa(p) }}</b>
              <small>Pedido de {{ comensal(p) }}</small>
            </div>
            <lm-chip class="mesa__estado" [estado]="chip()">
              @if (confirmado()) {
                <lm-icono [nombre]="itemsDe('COCINA').length ? 'skillet' : 'local_bar'" [tamano]="18" />
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

          @for (sector of sectores; track sector.valor) {
            @if (itemsDe(sector.valor).length) {
              <lm-separador flor [rotulo]="sector.rotulo" />
              <div class="lm-list">
                @for (item of itemsDe(sector.valor); track item.id) {
                  <lm-renglon-pedido [item]="item" />
                }
              </div>
            }
          }
        </div>

        <div class="lm-actionbar">
          <lm-resumen-pedido [total]="p.totalFinal" [tiempo]="p.tiempoEstimado" [unidades]="unidades(p)">
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
      .mesa__estado ::ng-deep .lm-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 15px; padding: 6px 12px; }
      /* Tarjetas, resumen y botones de decisión con el aro de vidrio del botón de volver. */
      .lm-card, :host ::ng-deep .renglon,
      :host ::ng-deep .lm-resumen, :host ::ng-deep lm-decision .dec {
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
      .mesa__datos small { display: block; font: var(--type-body-small); color: var(--text-muted); }
      .devuelto { padding: var(--space-4); border-left: 4px solid var(--state-error); }
      .devuelto b { display: block; font: var(--type-card-title); color: var(--state-error); }
      .devuelto p { margin: 6px 0 0; font: var(--type-body); color: var(--text-body); text-wrap: pretty; }
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

  protected itemsDe(sector: Sector): PedidoItem[] {
    const p = this.pedido();
    return p ? p.items.filter((i) => i.sector === sector) : [];
  }

  protected rotuloEstado(): string {
    const p = this.pedido();
    return p ? ROTULO_ESTADO_PEDIDO[p.estadoGlobal] : '';
  }

  protected chip(): string {
    const estado = this.pedido()?.estadoGlobal;
    if (estado === 'RECHAZADO') return 'rechazado';
    if (estado === 'LISTO') return 'aprobado';
    return 'reservada';
  }

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
