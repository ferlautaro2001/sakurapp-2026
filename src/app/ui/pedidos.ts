import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { IconoComponent, BotonComponent, ChipComponent } from './basicos';
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
    <div class="lm-resumen">
      <div class="lm-resumen__cifras">
        <span class="lm-resumen__total">
          <small>Total</small>
          {{ total() | pesos }}
        </span>
        <span class="lm-resumen__tiempo">
          <lm-icono nombre="schedule" [tamano]="16" color="var(--action-primary)" />
          {{ tiempo() }} min
          <small>{{ unidades() }} {{ unidades() === 1 ? 'producto' : 'productos' }}</small>
        </span>
      </div>
    </div>
    <ng-content />
  `,
  styles: [
    `
      :host { display: flex; flex-direction: column; gap: 14px; }
      .lm-resumen {
        display: flex; flex-direction: column; gap: 10px;
        padding: 12px 14px;
        border-radius: var(--radius-card);
        background: var(--surface-card);
        box-shadow: var(--shadow-raised);
      }
      .lm-resumen__cifras { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
      .lm-resumen__total {
        display: flex; flex-direction: column;
        font: 900 26px/1 var(--font-numeric); color: var(--action-primary);
      }
      .lm-resumen__total small {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px;
      }
      .lm-resumen__tiempo {
        display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; justify-content: flex-end;
        font: 800 15px/1.1 var(--font-numeric); color: var(--text-title);
      }
      .lm-resumen__tiempo small { font: var(--type-caption); color: var(--text-muted); width: 100%; text-align: right; }
    `,
  ],
})
export class ResumenPedidoComponent {
  readonly total = input.required<number>();
  readonly tiempo = input.required<number>();
  readonly unidades = input.required<number>();
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
        display: inline-flex; align-items: center; gap: 2px;
        padding: 3px; border-radius: var(--radius-pill);
        background: var(--surface-sunken);
      }
      .paso {
        width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
        display: grid; place-items: center;
      }
      .paso--menos { background: var(--surface-card); color: var(--text-title); box-shadow: var(--shadow-card); }
      .paso--mas { background: var(--action-primary); color: #FFFFFF; }
      .paso--mas:disabled { background: var(--surface-sunken); color: var(--text-muted); cursor: not-allowed; }
      .paso:active:not(:disabled) { transform: scale(0.92); }
      .numero {
        min-width: 20px; text-align: center;
        font: 800 15px/1 var(--font-numeric); color: var(--text-title);
      }
      .agregar {
        width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
        display: grid; place-items: center;
        background: var(--action-primary); color: #FFFFFF;
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
        <div class="renglon__datos">
          <b>{{ nombre() }}</b>
          <small>
            <lm-icono [nombre]="sector() === 'BAR' ? 'local_bar' : 'restaurant'" [tamano]="14" />
            {{ precioUnitario() | pesos }} c/u · {{ tiempo() }} min
          </small>
        </div>

        <div class="renglon__pie">
          <lm-cantidad
            [cantidad]="cantidad()"
            [nombre]="nombre()"
            [permitirAgregar]="marca() !== 'CANTIDAD'"
            (agregar)="agregar.emit()"
            (quitar)="quitar.emit()"
          />
          <span class="renglon__subtotal">{{ subtotal() | pesos }}</span>
        </div>
      } @else {
        <div class="renglon__fila">
          <span class="renglon__cantidad"><small>×</small>{{ cantidad() }}</span>
          <span class="renglon__datos">
            <b>{{ nombre() }}</b>
            <small>
              <lm-icono [nombre]="sector() === 'BAR' ? 'local_bar' : 'restaurant'" [tamano]="14" />
              {{ precioUnitario() | pesos }} c/u · {{ tiempo() }} min
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
        padding-left: 30px;
        overflow: hidden;
      }
      .renglon--cantidad::before,
      .renglon--cambiar::before {
        content: "";
        position: absolute; left: -16px; top: 12px;
        width: 64px; height: 9px;
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
      .renglon--cambiar .renglon__datos b { padding-right: 30px; }
      .renglon__datos { min-width: 0; }
      .renglon__datos b {
        display: block; font: var(--type-card-title); color: var(--text-title); text-wrap: pretty;
      }
      .renglon__datos small {
        display: inline-flex; align-items: center; gap: 4px;
        font: var(--type-caption); color: var(--text-muted);
      }
      .renglon__pie { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .renglon__fila { display: flex; align-items: center; gap: 10px; }
      .renglon__fila .renglon__datos { flex: 1 1 auto; }
      .renglon__cantidad {
        flex: 0 0 auto; width: 42px; height: 30px; padding: 0;
        border-radius: 10px; display: inline-flex; align-items: baseline; justify-content: center; gap: 1px;
        background: var(--action-primary); color: #FFFFFF;
        font: 800 15px/30px var(--font-numeric);
      }
      .renglon__cantidad small { font: 700 11px/1 var(--font-numeric); opacity: .8; }
      .renglon__subtotal {
        flex: 0 0 auto; font: 800 16px/1 var(--font-numeric); color: var(--text-title); text-align: right;
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

/**
 * Fila de comanda del mozo.
 */
@Component({
  selector: 'lm-fila-pedido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, BotonComponent, ChipComponent, PesosPipe, HoraPipe],
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

        <span class="pedido__lineas">
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
          @if (restantes() > 0) {
            <span class="linea linea--mas">
              y {{ restantes() }} {{ restantes() === 1 ? 'producto más' : 'productos más' }}
            </span>
          }
        </span>

        <span class="pedido__pie">
          <span class="pedido__cuenta">
            {{ unidades() }} {{ unidades() === 1 ? 'producto' : 'productos' }} · {{ pedido().tiempoEstimado }} min
          </span>
          <span class="pedido__total">{{ pedido().totalFinal | pesos }}</span>
        </span>
      </button>

      @if (conAcciones()) {
        <div class="pedido__acciones">
          <lm-boton compacto variante="success" icono="thumb_up" (presionar)="aceptar.emit()">Confirmar</lm-boton>
          <lm-boton compacto variante="danger" icono="edit_note" (presionar)="rechazar.emit()">Devolver</lm-boton>
        </div>
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
        padding: 12px 14px 10px;
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
        padding: 10px 14px;
        border-top: 1px solid var(--surface-sunken);
        border-bottom: 1px solid var(--surface-sunken);
        background: rgba(255, 215, 223, 0.24);
      }
      .linea { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .linea__cantidad {
        flex: 0 0 auto; min-width: 30px;
        font: 800 13px/1 var(--font-numeric); font-style: normal; color: var(--action-primary);
      }
      .linea__nombre {
        flex: 1 1 auto; min-width: 0; font: var(--type-body-small); color: var(--text-title);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .linea--mas { font: var(--type-caption); color: var(--text-muted); padding-left: 38px; }
      .pedido__pie {
        display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
        padding: 10px 14px 12px;
      }
      .pedido__cuenta { font: var(--type-caption); color: var(--text-muted); }
      .pedido__total { font: 900 19px/1 var(--font-numeric); color: var(--action-primary); }
      .pedido__acciones {
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;
        padding: 0 14px 14px;
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
  readonly presionar = output<void>();
  readonly aceptar = output<void>();
  readonly rechazar = output<void>();

  protected cliente(): string {
    const p = this.pedido();
    if (p.clienteNombre) return p.clienteNombre;
    if (this.usuarios && p.clienteId) {
      const persona = this.usuarios.porId(p.clienteId);
      if (persona) return this.usuarios.nombreCompleto(persona);
    }
    return 'Cliente';
  }

  protected visibles(): PedidoItem[] {
    return this.pedido().items.slice(0, this.TOPE);
  }

  protected restantes(): number {
    return Math.max(0, this.pedido().items.length - this.TOPE);
  }

  protected unidades(): number {
    return this.pedido().items.reduce((total, i) => total + i.cantidad, 0);
  }

  protected rotuloEstado(): string {
    return ROTULO_ESTADO_PEDIDO[this.pedido().estadoGlobal] || this.pedido().estadoGlobal;
  }

  protected chip(): string {
    const estado = this.pedido().estadoGlobal;
    if (estado === 'RECHAZADO') return 'rechazado';
    if (estado === 'LISTO') return 'aprobado';
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
