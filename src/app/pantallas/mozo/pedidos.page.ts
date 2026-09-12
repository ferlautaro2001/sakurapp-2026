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

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="visibles().length" [bajada]="bajada()">Pedidos</lm-titulo>

        <lm-pestanas [opciones]="pestanas" [valor]="bandeja()" (cambiar)="bandeja.set($any($event))" />

        @if (visibles().length) {
          <div class="lm-list">
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
            {{ textoVacio() }}
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="pedidos" />
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
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

  protected bajada(): string {
    return this.bandeja() === 'REVISAR'
      ? 'Confirmá el pedido o devolvelo con un motivo para que lo modifique el cliente'
      : 'Pedidos ya derivados a la cocina y a la barra';
  }

  protected tituloVacio(): string {
    return this.bandeja() === 'REVISAR' ? 'No hay pedidos para revisar' : 'No hay pedidos en curso';
  }

  protected textoVacio(): string {
    return this.bandeja() === 'REVISAR'
      ? 'Cuando un cliente termine su pedido, aparece acá con la mesa, el nombre y el importe.'
      : 'Los pedidos que confirmes van a quedar acá mientras la cocina y la barra los preparan.';
  }

  protected async confirmar(pedido: Pedido): Promise<void> {
    await this.confirmarPedido(pedido);
  }
}
