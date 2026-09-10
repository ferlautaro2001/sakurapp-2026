import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ROTULO_ESTADO_PEDIDO } from '../../nucleo/modelos/enums';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

/** Seguimiento en vivo del pedido del comensal. */
@Component({
  selector: 'lm-estado-pedido',
  imports: [CurrencyPipe, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />
      <div class="lm-body lm-body--gap12">
        <lm-titulo bajada="Actualización automática de Cocina y Bar">Estado de mi pedido</lm-titulo>

        @if (pedido(); as actual) {
          <section class="lm-card estado">
            <span class="estado__icono"><lm-icono nombre="receipt_long" [tamano]="34" /></span>
            <div>
              <small>ESTADO GENERAL</small>
              <h2>{{ rotulo() }}</h2>
              <p>Mesa {{ actual.mesaNumero }} · {{ actual.items.length }} productos</p>
            </div>
          </section>

          <div class="lm-grid2">
            <section class="lm-card sector">
              <lm-icono nombre="skillet" [tamano]="28" />
              <small>COCINA</small><b>{{ rotuloSector(actual.estadoCocina) }}</b>
            </section>
            <section class="lm-card sector">
              <lm-icono nombre="local_bar" [tamano]="28" />
              <small>BAR</small><b>{{ rotuloSector(actual.estadoBar) }}</b>
            </section>
          </div>

          <section class="lm-card total">
            <span>Total del pedido</span>
            <b>{{ actual.totalFinal | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}</b>
          </section>

          @if (pedidos.juegosHabilitados(actual) && !actual.juegoIntentado) {
            <lm-boton icono="sports_esports" (presionar)="ir(['/juegos'])">Jugar por un descuento</lm-boton>
          } @else if (actual.juegoIntentado) {
            <lm-banner icono="redeem" [titulo]="actual.descuentoJuego ? 'Descuento aplicado' : 'Intento utilizado'">
              {{ actual.descuentoJuego ? 'Ganaste un ' + actual.descuentoJuego + '% para este pedido.' : 'Esta vez no hubo premio.' }}
            </lm-banner>
          }
        } @else {
          <lm-vacio icono="receipt_long" titulo="Todavía no hay un pedido activo">
            Cuando envíes un pedido vas a poder seguir su preparación desde acá.
          </lm-vacio>
        }
      </div>
      <lm-barra-inferior [items]="secciones()" activo="pedido" />
    </div>
  `,
  styles: [`
    :host{display:flex;flex:1;min-height:0}.estado{padding:18px;display:flex;align-items:center;gap:14px}
    .estado__icono{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:var(--action-primary);color:var(--text-on-primary)}
    .estado small,.sector small{font:var(--type-label);letter-spacing:var(--tracking-label);color:var(--text-muted)}
    .estado h2{margin:3px 0;font:var(--type-section-title);color:var(--text-title)}.estado p{margin:0;color:var(--text-muted)}
    .sector{padding:16px;display:grid;gap:5px;color:var(--action-primary)}.sector b{color:var(--text-title)}
    .total{padding:16px;display:flex;justify-content:space-between;align-items:center}.total b{font:var(--type-card-title);color:var(--text-title)}
  `],
})
export class EstadoPedidoPage extends PaginaConSesion implements OnInit {
  protected readonly pedidos = inject(PedidosService);
  protected readonly pedido = computed(() => this.pedidos.activoDe(this.usuario()));
  protected readonly rotulo = computed(() => {
    const pedido = this.pedido();
    return pedido ? ROTULO_ESTADO_PEDIDO[pedido.estadoGlobal] : '';
  });

  ngOnInit(): void {
    this.pedidos.iniciar();
  }

  protected rotuloSector(estado: string): string {
    const rotulos: Record<string, string> = {
      NO_APLICA: 'Sin productos', PENDIENTE: 'Pendiente', EN_PREPARACION: 'En preparación', LISTO: 'Listo',
    };
    return rotulos[estado] ?? estado;
  }
}
