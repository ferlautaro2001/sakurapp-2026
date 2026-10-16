import { Component, computed, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaDeComandas } from './comandas-base';
import { Pedido } from '../../nucleo/modelos/modelos';

type Bandeja = 'REVISAR' | 'EN_CURSO';

/**
 * Listado de pedidos para el mozo, con pestañas "Para revisar" y "En curso".
 */
@Component({
  selector: 'lm-mozo-pedidos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="visibles().length">Pedidos</lm-titulo>

        <lm-pestanas [opciones]="pestanas" [valor]="bandeja()" (cambiar)="bandeja.set($any($event))" />

        @if (visibles().length) {
          <div class="pedidos__lista" [class.pedidos__lista--revisar]="bandeja() === 'REVISAR'">
            @for (pedido of visibles(); track pedido.id) {
              <lm-fila-pedido
                [pedido]="pedido"
                [numeroMesa]="$any(numeroMesa(pedido))"
                [conAcciones]="bandeja() === 'REVISAR'"
                (presionar)="ir(['/mozo/pedidos', pedido.id])"
                (aceptar)="confirmar(pedido)"
                (rechazar)="ir(['/mozo/pedidos', pedido.id, 'rechazar'])"
              />
            }
          </div>
        } @else {
          <lm-vacio icono="receipt_long" [titulo]="tituloVacio()">
            @if (textoVacio(); as texto) {
              {{ texto }}
            }
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="pedidos" />
    </div>
  `,
  styles: [
    `
      :host{display:flex;flex:1;min-height:0}
      /* Pedidos en tandas exactas: cada tarjeta mide justo una parte de la lista
         y se ancla entera. Una tarjeta de pedido ronda los 280px, así que de a
         dos sólo entran en pantallas altas; si no, de a una. */
      .pedidos__lista {
        flex: 1 1 0 !important; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3);
        container: pedidos / size; overflow-y: auto; overscroll-behavior: contain;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0; scrollbar-width: none;
      }
      .pedidos__lista::-webkit-scrollbar { display: none; }
      .pedidos__lista > lm-fila-pedido {
        --por: 1;
        flex: 0 0 calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por));
        min-height: min-content; display: flex; flex-direction: column; justify-content: center;
        scroll-snap-align: start; scroll-snap-stop: always;
      }
      /* Una tarjeta de pedido mide hasta ~230px: de a dos entran en pantallas
         comunes y de a tres sólo en las altas. */
      @container pedidos (min-height: 470px) { .pedidos__lista > lm-fila-pedido { --por: 2; } }
      @container pedidos (min-height: 700px) { .pedidos__lista > lm-fila-pedido { --por: 3; } }
      /* "Para revisar" trae los botones de confirmar y devolver: la tarjeta mide
         ~283px, así que de a dos sólo entra con una lista alta; si no, de a una. */
      @container pedidos (min-height: 470px) { .pedidos__lista--revisar > lm-fila-pedido { --por: 1; } }
      @container pedidos (min-height: 600px) { .pedidos__lista--revisar > lm-fila-pedido { --por: 2; } }
      @container pedidos (min-height: 700px) { .pedidos__lista--revisar > lm-fila-pedido { --por: 2; } }
      /* La tarjeta abierta ocupa toda la lista, como el correo abierto. */
      .pedidos__lista > lm-fila-pedido.fila-pedido--abierto { flex: 0 0 100cqh !important; }
    `,
  ],
})
export class MozoPedidosPage extends PaginaDeComandas {
  protected readonly bandeja = signal<Bandeja>('REVISAR');

  protected readonly pestanas = [
    { valor: 'REVISAR', rotulo: 'Para revisar' },
    { valor: 'EN_CURSO', rotulo: 'En curso' },
  ];

  protected readonly visibles = computed<Pedido[]>(() => {
    const todos = this.pedidos.todos();
    if (this.bandeja() === 'REVISAR') {
      return todos.filter((p) => p.estadoGlobal === 'PENDIENTE_CONFIRMACION');
    }
    return todos.filter((p) =>
      ['CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'RECIBIDO'].includes(p.estadoGlobal),
    );
  });


  protected tituloVacio(): string {
    return this.bandeja() === 'REVISAR' ? 'No hay pedidos para revisar' : 'No hay pedidos en curso';
  }

  protected textoVacio(): string {
    return this.bandeja() === 'REVISAR'
      ? ''
      : 'Los pedidos que confirmes van a quedar acá mientras la cocina y la barra los preparan.';
  }

  protected async confirmar(pedido: Pedido): Promise<void> {
    await this.confirmarPedido(pedido);
  }
}
