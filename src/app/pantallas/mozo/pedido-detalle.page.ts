import { Component, computed, input } from '@angular/core';
import { UI } from '../../ui';
import { PaginaDeComandas } from './comandas-base';
import { ROTULO_ESTADO_PEDIDO, ROTULO_ESTADO_SECTOR, Sector } from '../../nucleo/modelos/enums';
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
            <lm-chip [estado]="chip()">{{ rotuloEstado() }}</lm-chip>
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
              @if (confirmado()) {
                <div class="lm-card sector">
                  <lm-icono
                    [nombre]="sector.valor === 'BAR' ? 'local_bar' : 'skillet'"
                    [tamano]="20"
                    color="var(--action-primary)"
                  />
                  <span>{{ rotuloSector(sector.valor) }}</span>
                </div>
              }
            }
          }
        </div>

        <div class="lm-actionbar">
          <lm-resumen-pedido [total]="p.totalFinal" [tiempo]="p.tiempoEstimado" [unidades]="unidades(p)">
            @if (p.estadoGlobal === 'PENDIENTE_CONFIRMACION') {
              <div class="lm-actionbar--split">
                <lm-boton variante="success" icono="thumb_up" (presionar)="confirmar()">Confirmar</lm-boton>
                <lm-boton variante="danger" icono="edit_note" (presionar)="ir(['/mozo/pedidos', p.id, 'rechazar'])">
                  Devolver
                </lm-boton>
              </div>
            } @else {
              <lm-boton variante="secondary" icono="list" (presionar)="volver()">Volver a los pedidos</lm-boton>
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
      .mesa { display: flex; align-items: center; gap: 12px; padding: 14px; }
      .mesa__icono {
        flex: 0 0 auto; width: 44px; height: 44px; border-radius: 14px;
        display: grid; place-items: center; background: var(--surface-sunken);
      }
      .mesa__datos { flex: 1 1 auto; min-width: 0; }
      .mesa__datos b { display: block; font: var(--type-section); color: var(--text-title); }
      .mesa__datos small { display: block; font: var(--type-body-small); color: var(--text-muted); }
      .devuelto { padding: 14px; border-left: 4px solid var(--state-error); }
      .devuelto b { display: block; font: var(--type-card-title); color: var(--state-error); }
      .devuelto p { margin: 6px 0 0; font: var(--type-body); color: var(--text-body); text-wrap: pretty; }
      .sector { display: flex; align-items: center; gap: 10px; padding: 12px 14px; font: var(--type-body-small); color: var(--text-body); }
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

  protected rotuloSector(sector: Sector): string {
    const p = this.pedido();
    if (!p) return '';
    const estado = sector === 'COCINA' ? p.estadoCocina : p.estadoBar;
    return (ROTULO_ESTADO_SECTOR as Record<string, string>)[estado] ?? estado;
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
