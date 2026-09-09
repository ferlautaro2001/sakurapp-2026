import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ROTULO_ESTADO_PEDIDO, sectorDe } from '../../nucleo/modelos/enums';
import { Pedido } from '../../nucleo/modelos/modelos';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

/** Pedidos enviados por los comensales que el mozo debe confirmar. */
@Component({
  selector: 'lm-pedidos-mozo',
  imports: [CurrencyPipe, DatePipe, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />
      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="pedidos.pendientesConfirmacion().length" bajada="Pedidos que esperan confirmación">
          Pedidos del salón
        </lm-titulo>

        @if (pedidos.pendientesConfirmacion().length) {
          <div class="lm-list">
            @for (pedido of pedidos.pendientesConfirmacion(); track pedido.id) {
              <article class="lm-card pedido">
                <header>
                  <span>
                    <b>Mesa {{ pedido.mesaNumero }}</b>
                    <small>{{ pedido.clienteNombre }} · {{ pedido.timestampCreacion | date: 'HH:mm' }}</small>
                  </span>
                  <lm-chip estado="pendiente">{{ rotulo(pedido) }}</lm-chip>
                </header>

                <div class="items">
                  @for (item of pedido.items; track item.id) {
                    <div class="item">
                      <span><b>{{ item.cantidad }} ×</b> {{ item.productoNombre }}</span>
                      <small>{{ sector(item) }}</small>
                    </div>
                  }
                </div>

                <footer>
                  <b>{{ pedido.totalFinal | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}</b>
                  <lm-boton icono="task_alt" [ancho]="false" (presionar)="confirmar(pedido)">
                    Confirmar pedido
                  </lm-boton>
                </footer>
              </article>
            }
          </div>
        } @else {
          <lm-vacio icono="room_service" titulo="No hay pedidos por confirmar">
            Los pedidos enviados por los comensales aparecerán acá automáticamente.
          </lm-vacio>
        }
      </div>
      <lm-barra-inferior [items]="secciones()" activo="pedidos" />
    </div>
  `,
  styles: [`
    :host{display:flex;flex:1;min-height:0}.pedido{padding:16px;display:grid;gap:14px}
    header,footer,.item{display:flex;align-items:center;justify-content:space-between;gap:12px}
    header span{display:grid;gap:2px}header b{font:var(--type-card-title);color:var(--text-title)}
    header small,.item small{font:var(--type-caption);color:var(--text-muted)}
    .items{display:grid;gap:8px;padding-block:12px;border-block:1px solid var(--border-subtle)}
    .item span{font:var(--type-body-small);color:var(--text-body)}.item small{text-transform:capitalize}
    footer>b{font:var(--type-card-title);color:var(--text-title)}
  `],
})
export class PedidosMozoPage extends PaginaConSesion implements OnInit {
  protected readonly pedidos = inject(PedidosService);

  ngOnInit(): void {
    this.pedidos.iniciar();
  }

  protected rotulo(pedido: Pedido): string {
    return ROTULO_ESTADO_PEDIDO[pedido.estadoGlobal];
  }

  protected sector(item: Pedido['items'][number]): string {
    return sectorDe(item.tipo) === 'BAR' ? 'Bar' : 'Cocina';
  }

  protected async confirmar(pedido: Pedido): Promise<void> {
    const usuario = this.usuario();
    if (!usuario) return;
    const seguro = await this.preguntar({
      titulo: '¿Confirmar el pedido?',
      mensaje: 'Los productos se enviarán automáticamente a Cocina y Bar según corresponda.',
      confirmar: 'Confirmar pedido',
      icono: 'task_alt',
      detalle: [
        { rotulo: 'Mesa', valor: String(pedido.mesaNumero) },
        { rotulo: 'Comensal', valor: pedido.clienteNombre },
      ],
    });
    if (!seguro) return;

    try {
      await this.cargando.conEsperaMinima('Confirmando pedido…', () => this.pedidos.confirmar(pedido, usuario), 400);
      this.avisos.exito('Pedido confirmado', 'Cocina y Bar ya recibieron los productos que les corresponden.');
    } catch (error) {
      this.avisos.error('No pudimos confirmar el pedido', mensajeDe(error));
    }
  }
}

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Revisá la conexión e intentá nuevamente.';
}
