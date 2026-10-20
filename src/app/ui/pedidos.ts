import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { IconoComponent, ChipComponent, DecisionComponent, BotonComponent } from './basicos';
import { FechaHoraPipe, HoraPipe, PesosPipe } from './pesos.pipe';
import { Pedido, PedidoItem } from '../nucleo/modelos/modelos';
import { MarcaRechazo, ROTULO_ESTADO_PEDIDO, ROTULO_MARCA_RECHAZO } from '../nucleo/modelos/enums';
import { UsuariosService } from '../nucleo/servicios/usuarios.service';
import { ProductosService } from '../nucleo/servicios/productos.service';

/**
 * Resumen del pedido, siempre a la vista.
 * Total acumulado visible en grande y el tiempo estimado al lado.
 */
@Component({
  selector: 'lm-resumen-pedido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, PesosPipe],
  template: `
    <div class="lm-resumen" [class.lm-resumen--tira]="tira()">
      @if (hayDescuento() && !tira()) {
        <div class="lm-resumen__desglose">
          <span class="lm-resumen__linea">
            <small>Subtotal</small>
            <b>{{ subtotal() | pesos }}</b>
          </span>
          <span class="lm-resumen__linea lm-resumen__linea--descuento">
            <small>
              <lm-icono nombre="redeem" [tamano]="15" color="var(--state-success)" />
              Descuento aplicado
              @if (porcentaje() > 0) {
                <i>{{ porcentaje() }}%</i>
              }
            </small>
            <b>&minus; {{ descuento() | pesos }}</b>
          </span>
        </div>
      }
      <div class="lm-resumen__cifras">
        <span class="lm-resumen__tiempo">
          <lm-icono nombre="schedule" [tamano]="16" color="var(--action-primary)" />
          {{ tiempo() }}'
          <small>
            @if (tira()) {
              &middot;
            }
            {{ unidades() }} {{ unidades() === 1 ? 'producto' : (tira() ? 'prod.' : 'productos') }}
          </small>
        </span>
        <span class="lm-resumen__total">
          <small>Total</small>
          {{ total() | pesos }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; min-width: 0; }
      .lm-resumen {
        display: flex; flex-direction: column; gap: 10px;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-card);
        background: var(--surface-card);
        box-shadow: var(--shadow-raised);
      }
      /* El desglose se apoya sobre el total con una línea divisoria: el ojo
         baja del subtotal al descuento y aterriza en la cifra final, que es
         la que importa. */
      .lm-resumen__desglose {
        display: flex; flex-direction: column; gap: 6px;
        padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-divider);
      }
      .lm-resumen__linea {
        display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
        font: 800 clamp(13.5px, 3.5vw, 15px)/1.1 var(--font-numeric); color: var(--text-title);
      }
      .lm-resumen__linea small {
        display: inline-flex; align-items: center; gap: 5px;
        font: var(--type-caption); font-weight: 650; color: var(--text-muted);
      }
      .lm-resumen__linea--descuento,
      .lm-resumen__linea--descuento small { color: var(--state-success); }
      .lm-resumen__linea--descuento i {
        font-style: normal; font-weight: 800;
        padding: 1px 6px; border-radius: var(--radius-pill);
        background: var(--state-success-surface); color: var(--state-success);
      }
      .lm-resumen__cifras { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-3); }
      .lm-resumen__total {
        display: flex; flex-direction: column; align-items: flex-end; text-align: right;
        font: 900 clamp(19px, 6vw, 26px)/1 var(--font-numeric); color: var(--action-primary);
      }
      .lm-resumen__total small {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px;
      }
      .lm-resumen__tiempo {
        display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; justify-content: flex-start;
        font: 800 clamp(13.5px, 3.5vw, 15px)/1.1 var(--font-numeric); color: var(--text-title);
        padding: 0; /* liso: sin aro de vidrio, el tiempo y la cantidad se leen como texto */
      }
      .lm-resumen__tiempo small { font: var(--type-caption); color: var(--text-muted); width: 100%; text-align: left; }

      /* Tira: el importe y el tiempo en una sola línea baja, sin tarjeta. Para
         las barras de acción donde el alto es el recurso escaso y una tarjeta
         entera se come un cuarto de la pantalla. Es variante del propio
         componente —la pide cada pantalla con [tira]— y no un reestilizado
         desde afuera. Va después de las reglas base porque comparte
         especificidad con ellas. */
      .lm-resumen--tira {
        flex-direction: row; align-items: center; justify-content: space-between;
        gap: var(--space-3); padding: 6px 14px; border-radius: var(--radius-pill);
        background: rgba(110, 18, 52, .26);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .22);
      }
      .lm-resumen--tira .lm-resumen__cifras { display: contents; }
      .lm-resumen--tira .lm-resumen__total {
        display: flex; flex-direction: row; align-items: baseline; gap: 6px;
        font-size: clamp(15px, 4.4vw, 19px);
      }
      .lm-resumen--tira .lm-resumen__total small {
        margin-bottom: 0; font: var(--type-label); text-transform: uppercase;
        letter-spacing: var(--tracking-label); color: var(--text-muted);
      }
      .lm-resumen--tira .lm-resumen__tiempo {
        flex-wrap: nowrap; gap: 5px; padding: 0; border: none; background: none;
        box-shadow: none; font: var(--type-body-small); color: var(--text-muted);
      }
      .lm-resumen--tira .lm-resumen__tiempo small { width: auto; text-align: left; }
    `,
  ],
})
export class ResumenPedidoComponent {
  readonly total = input.required<number>();
  readonly tiempo = input.required<number>();
  readonly unidades = input.required<number>();
  /** Importe antes de descuentos. En nulo, el resumen muestra sólo el total. */
  readonly subtotal = input<number | null>(null);
  /** Monto descontado, en pesos. */
  readonly descuento = input(0);
  /** Porcentaje del descuento, para rotular la línea. */
  readonly porcentaje = input(0);
  /**
   * Importe y tiempo en una sola tira baja, sin tarjeta. Lo piden las barras
   * de acción con poco alto: el desglose del descuento se oculta porque no
   * cabe en una línea.
   */
  readonly tira = input(false, { transform: booleanAttribute });

  /** El desglose aparece sólo cuando hay algo que desglosar. */
  protected hayDescuento(): boolean {
    return this.descuento() > 0 && this.subtotal() !== null;
  }
}

/**
 * Barra de acción de un pedido: el resumen y la decisión, en una sola pieza.
 *
 * Antes cada pantalla armaba esto a mano con un `div.lm-actionbar` y le
 * proyectaba los botones adentro del resumen, así que el componente del
 * resumen terminaba siendo también el contenedor del layout. Acá la barra es
 * una unidad: trae el resumen, trae la acción y decide cómo se acomodan
 * (apilados o en la misma fila).
 */
@Component({
  selector: 'lm-barra-pedido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecisionComponent, ResumenPedidoComponent],
  template: `
    <div class="barra" [class.barra--fila]="enFila()" [class.barra--compacta]="compacta()">
      <lm-resumen-pedido
        [total]="total()"
        [tiempo]="tiempo()"
        [unidades]="unidades()"
        [subtotal]="subtotal()"
        [descuento]="descuento()"
        [porcentaje]="porcentaje()"
        [tira]="tira()"
      />

      @if (decision()) {
        <lm-decision
          [rotuloRechazar]="rotuloDevolver()"
          [rotuloAceptar]="rotuloConfirmar()"
          (rechazar)="devolver.emit()"
          (aceptar)="confirmar.emit()"
        />
      } @else {
        <ng-content />
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      /*
       * La barra es la que manda el layout. Apilada por omisión (el resumen
       * arriba, la decisión abajo, que es como se lee un total); en fila el
       * resumen toma el ancho que sobra y la acción queda a la derecha, con el
       * mismo alto. Todo lo que antes vivía en .resumen--con-enviar sobre el
       * host del resumen, con su !important, ahora es de la barra.
       */
      .barra {
        display: flex; flex-direction: column; gap: var(--space-2);
        padding: var(--space-4) var(--gutter-screen) calc(var(--space-4) + var(--safe-bottom));
        background: linear-gradient(to top, var(--bg-app) 62%, rgba(185, 46, 88, 0));
      }
      .barra--fila { flex-direction: row; align-items: stretch; gap: var(--space-2); }
      /* Barra apretada: menos aire arriba y entre resumen y acción, y botones
         algo más bajos. Para las pantallas donde la lista tiene que entrar
         entera y cada píxel de la barra es un píxel de lista. La barra lo
         resuelve por su cuenta; la pantalla no mete la mano adentro. */
      .barra--compacta {
        padding-top: var(--space-2);
        gap: var(--space-2);
      }
      :host ::ng-deep .barra--compacta .dec {
        min-height: 56px !important; border-radius: 16px !important;
      }

      /* El botón proyectado (Pedir, Reenviar) mide lo mismo que el total y lleva
         la flecha de enviar debajo del rótulo. */
      :host ::ng-deep .barra--fila > lm-boton { display: flex; flex: 0 0 auto; }
      :host ::ng-deep .barra--fila > lm-boton .lm-btn {
        height: 100%; min-width: 0; flex-direction: column; gap: 2px;
        padding-inline: 8px !important; font-size: 13.5px;
      }
      :host ::ng-deep .barra--fila > lm-boton .lm-btn lm-icono { order: 1; }

      /* El resumen toma el ancho que sobra; la acción, el que necesita. */
      .barra--fila lm-resumen-pedido { flex: 1 1 auto; min-width: 0; }
      .barra--fila lm-decision, .barra--fila > .accion { flex: 0 0 auto; display: flex; }

      /* En fila el resumen se aplana un poco: la acción se lleva el ancho. */
      :host ::ng-deep .barra--fila .lm-resumen {
        flex: 1 1 auto; min-width: 0;
        padding: var(--space-3); justify-content: center;
      }
      /* Con el botón al lado, el resumen va en dos filas y no en dos columnas: arriba el
         tiempo y la cantidad, abajo el total. Así ninguna cifra se parte en dos renglones
         aunque el teléfono sea angosto. */
      :host ::ng-deep .barra--fila .lm-resumen .lm-resumen__cifras {
        flex-direction: column; align-items: stretch; justify-content: center; gap: 5px;
      }
      :host ::ng-deep .barra--fila .lm-resumen .lm-resumen__tiempo {
        display: flex; flex-wrap: nowrap; align-items: center; justify-content: flex-start;
        gap: 6px; text-align: left; white-space: nowrap; align-self: stretch;
      }
      /* Con un nivel más de selector: gana a los estilos propios del resumen. El reloj con el tiempo, pegado a la izquierda; la cantidad de productos, a la derecha. */
      :host ::ng-deep .barra--fila .lm-resumen .lm-resumen__tiempo small {
        display: inline; width: auto; white-space: nowrap; margin-left: auto;
      }
      :host ::ng-deep .barra--fila .lm-resumen .lm-resumen__total {
        flex-direction: row; align-items: baseline; justify-content: space-between; gap: 8px;
        font-size: clamp(17px, 5.4vw, 22px); white-space: nowrap;
      }
      :host ::ng-deep .barra--fila .lm-resumen .lm-resumen__total small { margin-bottom: 0; }
    `,
  ],
})
export class BarraPedidoComponent {
  readonly total = input.required<number>();
  readonly tiempo = input.required<number>();
  readonly unidades = input.required<number>();
  /** Importe antes de descuentos. En nulo, el resumen muestra sólo el total. */
  readonly subtotal = input<number | null>(null);
  /** Monto descontado, en pesos. */
  readonly descuento = input(0);
  /** Porcentaje del descuento, para rotular la línea. */
  readonly porcentaje = input(0);
  /** El total y el tiempo en una sola tira baja, sin tarjeta. */
  readonly tira = input(false, { transform: booleanAttribute });
  /** Resumen y acción en la misma fila, en vez de apilados. */
  readonly enFila = input(false, { transform: booleanAttribute });
  /** Menos aire en la barra: para cuando la lista de arriba tiene que entrar entera. */
  readonly compacta = input(false, { transform: booleanAttribute });

  /**
   * Botones de confirmar y devolver, en lugar de una acción propia. Cuando es
   * falso la barra usa lo que le proyecten.
   */
  readonly decision = input(false, { transform: booleanAttribute });
  readonly rotuloDevolver = input('Devolver');
  readonly rotuloConfirmar = input('Confirmar');
  readonly confirmar = output<void>();
  readonly devolver = output<void>();
}

/**
 * Control de cantidad del pedido.
 */
@Component({
  selector: 'lm-cantidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    @if (cantidad() > 0) {
      <div class="pastilla">
        <button type="button" class="paso paso--menos" [attr.aria-label]="'Quitar uno de ' + nombre()" (click)="quitar.emit()">
          <lm-icono nombre="remove" [tamano]="18" />
        </button>
        <span class="numero" aria-live="polite">{{ cantidad() }}</span>
        <button
          type="button"
          class="paso paso--mas"
          [disabled]="!permitirAgregar()"
          [attr.aria-label]="
            permitirAgregar() ? 'Agregar otro ' + nombre() : 'No hay más ' + nombre() + ' disponible'
          "
          (click)="agregar.emit()"
        >
          <lm-icono nombre="add" [tamano]="18" />
        </button>
      </div>
    } @else {
      <button type="button" class="agregar" [attr.aria-label]="'Agregar ' + nombre() + ' al pedido'" (click)="agregar.emit()">
        <lm-icono nombre="add" [tamano]="20" />
      </button>
    }
  `,
  styles: [
    `
      :host { display: block; flex: 0 0 auto; }
      .pastilla {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px; border-radius: var(--radius-pill);
        background: var(--surface-sunken);
        border: 1.5px solid rgba(224, 115, 144, 0.45);
        box-shadow: inset 0 1px 2px rgba(110, 18, 52, 0.08), 0 2px 6px rgba(110, 18, 52, 0.12);
      }
      .paso {
        position: relative;
        width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
        display: grid; place-items: center;
        transition: transform var(--dur-fast) var(--ease-standard), background var(--dur-fast);
      }
      /*
       * El botón se ve de 32px porque la pastilla vive en una columna compacta,
       * pero lo que recibe el dedo llega a los 44px de alto.
       * Se estira sólo en vertical a propósito: si creciera a los costados, el
       * área de quitar pisaría la de agregar, y son justo los dos toques que no
       * se pueden confundir.
       */
      .paso::after,
      .agregar::after {
        content: ""; position: absolute; left: 0; right: 0;
        top: calc((var(--touch-min) - 100%) / -2); bottom: calc((var(--touch-min) - 100%) / -2);
      }
      .paso--menos {
        background: #FFFFFF;
        color: var(--action-primary);
        border: 1.5px solid rgba(199, 38, 87, 0.3);
        box-shadow: 0 1px 3px rgba(110, 18, 52, 0.14);
      }
      .paso--mas {
        background: var(--action-primary);
        color: #FFFFFF;
        border: 1.5px solid transparent;
        box-shadow: 0 2px 6px rgba(199, 38, 87, 0.35);
      }
      .paso--mas:disabled {
        background: var(--surface-sunken);
        color: var(--text-muted);
        border-color: transparent;
        box-shadow: none;
        cursor: not-allowed;
      }
      .paso:active:not(:disabled) { transform: scale(0.92); }
      .numero {
        min-width: 22px; text-align: center;
        font: 800 clamp(14px, 3.6vw, 16px)/1 var(--font-numeric); color: var(--text-title);
      }
      .agregar {
        position: relative;
        width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
        display: grid; place-items: center;
        background: var(--action-primary); color: #FFFFFF;
        border: 1.5px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 2px 8px rgba(199, 38, 87, .35);
      }
      .agregar:active { transform: scale(0.92); }
    `,
  ],
})
export class CantidadComponent {
  readonly cantidad = input(0, { transform: numberAttribute });
  readonly permitirAgregar = input(true, { transform: booleanAttribute });
  readonly nombre = input('');
  readonly agregar = output<void>();
  readonly quitar = output<void>();
}

/** Renglón del pedido: cantidad, precio unitario, subtotal y controles si es editable. */
@Component({
  selector: 'lm-renglon-pedido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, CantidadComponent, PesosPipe],
  template: `
    <div
      class="renglon"
      [class.renglon--cantidad]="marca() === 'CANTIDAD'"
      [class.renglon--cambiar]="marca() === 'CAMBIAR'"
    >
      @if (marca()) {
        <span class="renglon__insignia" [attr.title]="rotuloMarca()" [attr.aria-label]="rotuloMarca()">
          <lm-icono [nombre]="marca() === 'CANTIDAD' ? 'warning' : 'block'" [tamano]="18" />
        </span>
      }

      @if (editable()) {
        <div class="renglon__datos renglon__datos--editable">
          <b>{{ nombre() }}</b>
          <small>
            <lm-icono [nombre]="sector() === 'BAR' ? 'local_bar' : 'restaurant'" [tamano]="14" />
            {{ precioUnitario() | pesos }} c/u · {{ tiempo() }}'
          </small>
        </div>

        <div class="renglon__pie">
          <span class="renglon__subtotal">{{ subtotal() | pesos }}</span>
          <lm-cantidad
            [cantidad]="cantidad()"
            [nombre]="nombre()"
            [permitirAgregar]="marca() !== 'CANTIDAD'"
            (agregar)="agregar.emit()"
            (quitar)="quitar.emit()"
          />
        </div>
      } @else {
        <div class="renglon__fila">
          <span class="renglon__cantidad"><small>×</small>{{ cantidad() }}</span>
          <span class="renglon__datos">
            <b>{{ nombre() }}</b>
            <small class="renglon__precio">
              <lm-icono [nombre]="sector() === 'BAR' ? 'local_bar' : 'restaurant'" [tamano]="14" />
              {{ precioUnitario() | pesos }} c/u
            </small>
            <small class="renglon__tiempo">
              <lm-icono nombre="schedule" [tamano]="14" />
              {{ tiempo() }}'
            </small>
          </span>
          <span class="renglon__subtotal">{{ subtotal() | pesos }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .renglon {
        position: relative;
        display: flex; flex-direction: column; gap: 6px;
        padding: 10px 12px;
        border-radius: var(--radius-card);
        background: var(--surface-card);
        box-shadow: var(--shadow-card);
      }
      .renglon--cantidad,
      .renglon--cambiar {
        padding-left: var(--space-7);
        overflow: hidden;
      }
      .renglon--cantidad::before,
      .renglon--cambiar::before {
        content: "";
        position: absolute; left: -16px; top: 12px;
        width: clamp(48px, 15vw, 64px); height: 9px;
        transform: rotate(-45deg);
      }
      .renglon--cantidad {
        background: var(--state-pending-surface);
        box-shadow: 0 0 0 2px var(--state-pending), var(--shadow-card);
      }
      .renglon--cantidad::before { background: var(--state-pending); }
      .renglon--cambiar {
        background: var(--state-error-surface);
        box-shadow: 0 0 0 2px var(--state-error), var(--shadow-card);
      }
      .renglon--cambiar::before { background: var(--state-error); }
      .renglon__insignia {
        position: absolute; top: 8px; right: 10px;
        width: 26px; height: 26px; border-radius: 50%;
        display: grid; place-items: center;
      }
      .renglon--cantidad .renglon__insignia { background: var(--state-pending); color: #FFFFFF; }
      .renglon--cambiar .renglon__insignia { background: var(--state-error); color: #FFFFFF; }
      .renglon--cantidad .renglon__datos b,
      .renglon--cambiar .renglon__datos b { padding-right: var(--space-7); }
      .renglon__datos { min-width: 0; }
      .renglon__datos b {
        display: block; font: var(--type-card-title); color: var(--text-title); text-wrap: pretty;
      }
      .renglon__datos small {
        display: inline-flex; align-items: center; gap: 4px;
        font: 500 clamp(13px, 3.7vw, 15px)/1.3 var(--font-text); color: var(--text-muted);
      }
      .renglon__pie { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      /* Pedido enviado en tres filas: arriba el nombre; en el medio, el precio
         unitario a la izquierda y la duración a la derecha; abajo, el total del
         producto alineado con el precio. La cantidad queda a la izquierda. */
      .renglon__fila {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        grid-template-rows: auto auto auto;
        align-items: center;
        column-gap: 10px;
        row-gap: 4px;
      }
      .renglon__fila .renglon__cantidad { grid-column: 1; grid-row: 1 / 4; align-self: center; }
      .renglon__fila .renglon__datos { display: contents; }
      .renglon__fila .renglon__datos b { grid-column: 2 / 4; grid-row: 1; min-width: 0; }
      .renglon__fila .renglon__precio { grid-column: 2; grid-row: 2; min-width: 0; }
      .renglon__fila .renglon__tiempo { grid-column: 3; grid-row: 2; justify-self: end; }
      .renglon__fila .renglon__subtotal {
        grid-column: 2 / 4; grid-row: 3; justify-self: end;
        font: 800 clamp(18px, 5.4vw, 22px)/1 var(--font-numeric); color: var(--action-primary);
      }
      /* Alto mínimo y no fijo: con el alto clavado y el interlineado atado a
         él, una cantidad de tres cifras se salía de la placa por abajo. */
      .renglon__cantidad {
        flex: 0 0 auto; min-width: 42px; min-height: 30px; padding: 7px 6px;
        border-radius: 10px; display: inline-flex; align-items: baseline; justify-content: center; gap: 1px;
        background: var(--action-primary); color: #FFFFFF;
        font: 800 clamp(13.5px, 3.5vw, 15px)/1 var(--font-numeric);
        border: 1.5px solid rgba(255, 255, 255, .6);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), 0 3px 8px rgba(94, 12, 44, .14);
      }
      .renglon__cantidad small { font: 700 11px/1 var(--font-numeric); opacity: .8; }
      .renglon__subtotal {
        flex: 0 0 auto; font: 800 clamp(14.5px, 3.7vw, 16px)/1 var(--font-numeric); color: var(--text-title); text-align: right;
      }
      /* En el renglón editable el precio acompaña el tamaño del botón "+". */
      /* El nombre del producto también un poco más grande en el renglón editable. */
      .renglon__datos--editable b {
        font: 700 clamp(17.5px, 5vw, 21px)/1.25 var(--font-display); color: var(--text-title);
      }
      .renglon__pie .renglon__subtotal {
        font: 800 clamp(19px, 5.6vw, 24px)/1 var(--font-numeric); color: var(--action-primary);
      }
    `,
  ],
})
export class RenglonPedidoComponent {
  private readonly productos = inject(ProductosService, { optional: true });

  readonly item = input.required<any>();
  readonly editable = input(false, { transform: booleanAttribute });
  readonly marca = input<MarcaRechazo | null>(null);
  readonly agregar = output<void>();
  readonly quitar = output<void>();

  protected nombre(): string {
    const i = this.item();
    return i.productoNombre || i.producto?.nombre || i.nombre || 'Producto';
  }

  protected sector(): string {
    const i = this.item();
    return i.sector || i.producto?.sector || 'COCINA';
  }

  protected precioUnitario(): number {
    const i = this.item();
    return i.precioUnitario ?? i.producto?.precio ?? 0;
  }

  protected cantidad(): number {
    const i = this.item();
    return i.cantidad ?? 1;
  }

  protected subtotal(): number {
    const i = this.item();
    return i.subtotal ?? (this.precioUnitario() * this.cantidad());
  }

  protected tiempo(): number {
    const i = this.item();
    if (i.tiempoElaboracion) return i.tiempoElaboracion;
    if (i.producto?.tiempoElaboracion) return i.producto.tiempoElaboracion;
    const prod = this.productos?.porId(i.productoId);
    return prod?.tiempoElaboracion ?? 10;
  }

  protected rotuloMarca(): string {
    const marca = this.marca();
    return marca ? ROTULO_MARCA_RECHAZO[marca] : '';
  }
}

/** El botón de la fila del pedido: lo que dice y su ícono. */
export interface AccionPedido {
  rotulo: string;
  icono: string;
}

/**
 * Fila de comanda del mozo.
 */
@Component({
  selector: 'lm-fila-pedido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.fila-pedido--abierto]': 'abierto()' },
  imports: [IconoComponent, ChipComponent, DecisionComponent, BotonComponent, PesosPipe, HoraPipe],
  template: `
    <div class="pedido">
      <button type="button" class="pedido__cuerpo" (click)="presionar.emit()">
        <span class="pedido__cabecera">
          <span class="pedido__mesa">Mesa {{ numeroMesa() }}</span>
          <span class="pedido__cliente">{{ cliente() }}</span>
          @if (pedido().estadoGlobal !== 'PENDIENTE_CONFIRMACION') {
            <lm-chip [estado]="chip()">{{ rotuloEstado() }}</lm-chip>
          } @else {
            <span class="pedido__hora">{{ pedido().timestampCreacion | hora }}</span>
          }
        </span>

        <span class="pedido__lineas" [class.pedido__lineas--abierto]="abierto()">
          @for (item of visibles(); track item.id) {
            <span class="linea">
              <i class="linea__cantidad">×{{ item.cantidad }}</i>
              <span class="linea__nombre">{{ item.productoNombre }}</span>
              <lm-icono
                [nombre]="item.sector === 'BAR' ? 'local_bar' : 'restaurant'"
                [tamano]="15"
                color="var(--text-muted)"
              />
            </span>
          }
        </span>

        <span class="pedido__pie">
          <span class="pedido__cuenta">
            {{ unidades() }} {{ unidades() === 1 ? 'producto' : 'productos' }} · {{ pedido().tiempoEstimado }}'
          </span>
          <span class="pedido__total">{{ pedido().totalFinal | pesos }}</span>
        </span>
      </button>

      <!-- Fuera del botón de la tarjeta: un botón dentro de otro botón no es
           HTML válido y el navegador lo desarma. -->
      @if (restantes() > 0) {
        <button type="button" class="pedido__mas" [attr.aria-expanded]="abierto()" (click)="alternar()">
          <lm-icono [nombre]="abierto() ? 'expand_less' : 'expand_more'" [tamano]="18" />
          {{
            abierto()
              ? 'Ver menos'
              : 'Ver los ' + restantes() + (restantes() === 1 ? ' producto restante' : ' productos restantes')
          }}
        </button>
      }

      @if (conAcciones()) {
        <lm-decision
          compacto
          class="pedido__acciones"
          rotuloRechazar="Devolver"
          rotuloAceptar="Confirmar"
          (rechazar)="rechazar.emit()"
          (aceptar)="aceptar.emit()"
        />
      }

      @if (accion(); as a) {
        <lm-boton class="pedido__acciones" variante="success" [icono]="a.icono" (presionar)="accionar.emit()">
          {{ a.rotulo }}
        </lm-boton>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .pedido {
        display: flex; flex-direction: column;
        border-radius: var(--radius-card);
        background: var(--surface-card); box-shadow: var(--shadow-raised);
        overflow: hidden;
      }
      .pedido__cuerpo {
        display: flex; flex-direction: column; gap: 0; width: 100%;
        padding: 0; background: none; border: none; text-align: left; cursor: pointer;
      }
      .pedido__cabecera {
        display: flex; align-items: center; gap: 10px;
        padding: var(--space-3) var(--space-4) 10px;
      }
      .pedido__mesa {
        flex: 0 0 auto; padding: 5px 11px; border-radius: var(--radius-pill);
        background: var(--action-primary); color: #FFFFFF;
        font: var(--type-label); letter-spacing: var(--tracking-label); text-transform: uppercase;
      }
      .pedido__cliente {
        flex: 1 1 auto; min-width: 0;
        font: var(--type-body-small); color: var(--text-muted);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .pedido__hora { flex: 0 0 auto; font: var(--type-caption); color: var(--text-muted); }
      .pedido__lineas {
        display: flex; flex-direction: column; gap: 6px;
        padding: 10px var(--space-4);
        border-top: 1px solid var(--surface-sunken);
        border-bottom: 1px solid var(--surface-sunken);
        background: rgba(255, 215, 223, 0.24);
      }
      .linea { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .linea__cantidad {
        flex: 0 0 auto; min-width: 30px;
        font: 800 clamp(12px, 3vw, 13px)/1 var(--font-numeric); font-style: normal; color: var(--action-primary);
      }
      .linea__nombre {
        flex: 1 1 auto; min-width: 0; font: var(--type-body-small); color: var(--text-title);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      /* Abierto, el nombre deja de cortarse: el punto del ítem es leer el
         producto entero, y para eso se abrió. Cerrado sigue en una línea, que
         es lo que mantiene la lista escaneable. */
      .pedido__lineas--abierto .linea { align-items: flex-start; }
      .pedido__lineas--abierto .linea__nombre { white-space: normal; overflow: visible; }
      .pedido__lineas--abierto .linea__cantidad { padding-top: 2px; }
      /* El renglón que abre el resto del pedido. Va ancho completo y con el alto
         táctil mínimo porque el mozo lo toca de parado, con el equipo en una
         mano. */
      .pedido__mas {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        width: 100%; min-height: var(--touch-min); padding: var(--space-2) var(--space-4);
        border: none; border-top: 1px solid var(--surface-sunken);
        background: rgba(255, 215, 223, 0.24); cursor: pointer;
        font: var(--type-body-small); font-weight: 700; color: var(--action-primary);
      }
      .pedido__pie {
        display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
        padding: 10px var(--space-4) var(--space-3);
      }
      .pedido__cuenta { font: var(--type-caption); color: var(--text-muted); }
      .pedido__total { font: 900 clamp(14px, 4.4vw, 19px)/1 var(--font-numeric); color: var(--action-primary); }
      .pedido__acciones {
        padding: 0 var(--space-4) var(--space-4);
      }
    `,
  ],
})
export class FilaPedidoComponent {
  private readonly usuarios = inject(UsuariosService, { optional: true });
  private readonly TOPE = 3;

  readonly pedido = input.required<Pedido>();
  readonly numeroMesa = input.required<number | string>();
  readonly conAcciones = input(false, { transform: booleanAttribute });
  /**
   * El paso que le toca al mozo con este pedido, adentro de la tarjeta para no
   * salir de la lista: entregarlo, habilitar la cuenta o confirmar el pago.
   */
  readonly accion = input<AccionPedido | null>(null);
  readonly presionar = output<void>();
  readonly aceptar = output<void>();
  readonly rechazar = output<void>();
  readonly accionar = output<void>();

  protected cliente(): string {
    const p = this.pedido();
    if (p.clienteNombre) return p.clienteNombre;
    if (this.usuarios && p.clienteId) {
      const persona = this.usuarios.porId(p.clienteId);
      if (persona) return this.usuarios.nombreCompleto(persona);
    }
    return 'Cliente';
  }

  /**
   * La lista de pedidos se mira de un vistazo y de parado: si cada tarjeta
   * listara sus doce ítems, en pantalla entraría un pedido y medio y dejaría de
   * ser una lista. Así que el corte se mantiene, pero ahora se puede abrir en el
   * lugar —sin entrar al detalle y sin perder la posición en la lista— y el
   * renglón dice cuántos falta ver, no sólo que falta algo.
   */
  protected readonly abierto = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected alternar(): void {
    this.abierto.update((v) => !v);
    // Como en los correos: la tarjeta abierta ocupa la lista y se la lleva al
    // tope, para que el pedido entero se lea sin que quede a medias.
    if (this.abierto()) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => this.host.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' })),
      );
    }
  }

  protected visibles(): PedidoItem[] {
    const items = this.pedido().items;
    return this.abierto() ? items : items.slice(0, this.TOPE);
  }

  protected restantes(): number {
    return Math.max(0, this.pedido().items.length - this.TOPE);
  }

  protected unidades(): number {
    return this.pedido().items.reduce((total, i) => total + i.cantidad, 0);
  }

  protected rotuloEstado(): string {
    const p = this.pedido();
    if (p.estadoGlobal === 'CUENTA_SOLICITADA' && p.cuentaHabilitada) return 'Cuenta habilitada';
    return ROTULO_ESTADO_PEDIDO[p.estadoGlobal] || p.estadoGlobal;
  }

  protected chip(): string {
    const estado = this.pedido().estadoGlobal;
    if (estado === 'RECHAZADO') return 'rechazado';
    if (['LISTO', 'ENTREGADO', 'RECIBIDO', 'CUENTA_SOLICITADA', 'PAGO_PENDIENTE'].includes(estado)) return 'aprobado';
    return 'reservada';
  }
}

/** Burbuja de la sala de consultas. */
@Component({
  selector: 'lm-burbuja',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FechaHoraPipe],
  template: `
    <div class="burbuja" [class.burbuja--propia]="propia()">
      <span class="burbuja__autor">{{ autor() }}</span>
      <p class="burbuja__texto">{{ texto() }}</p>
      <!-- Con la fecha y no sólo la hora: una consulta de ayer y una de hoy
           a las tres de la tarde se leían iguales. -->
      <span class="burbuja__hora">{{ hora() | fechaHora }}</span>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .burbuja {
        max-width: 84%; margin-right: auto;
        padding: 9px 12px 7px;
        border-radius: 16px 16px 16px 4px;
        background: var(--surface-card);
        box-shadow: var(--shadow-card);
      }
      .burbuja--propia {
        margin-right: 0; margin-left: auto;
        border-radius: 16px 16px 4px 16px;
        background: var(--surface-sunken);
      }
      .burbuja__autor {
        display: block; font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--action-primary);
      }
      .burbuja__texto { margin: 2px 0 0; font: var(--type-body); color: var(--text-body); text-wrap: pretty; }
      .burbuja__hora { display: block; text-align: right; font: var(--type-caption); color: var(--text-muted); }
    `,
  ],
})
export class BurbujaComponent {
  readonly autor = input.required<string>();
  readonly texto = input.required<string>();
  readonly hora = input.required<string>();
  readonly propia = input(false, { transform: booleanAttribute });
}
