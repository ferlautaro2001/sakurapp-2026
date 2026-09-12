import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input, numberAttribute, output, signal } from '@angular/core';
import { Mesa, Producto, Usuario } from '../nucleo/modelos/modelos';
import {
  ICONO_TIPO_MESA,
  ROTULO_ESTADO_MESA,
  ROTULO_ESTADO_USUARIO,
  ROTULO_PERFIL,
  ROTULO_TIPO_MESA,
} from '../nucleo/modelos/enums';
import { UsuariosService } from '../nucleo/servicios/usuarios.service';
import { BotonComponent, ChipComponent, IconoBotonComponent, IconoComponent } from './basicos';
import { CantidadComponent } from './pedidos';
import { DocumentoPipe, HoraPipe, PesosPipe } from './pesos.pipe';

/** Tarjeta de perfil del ingreso rápido: foto o iniciales, nombre y rol. Nunca un combo. */
@Component({
  selector: 'lm-tarjeta-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="lm-profile" (click)="presionar.emit()">
      <span class="lm-profile__avatar">
        <img [src]="usuarios.avatarSushi(usuario())" [alt]="usuario().nombre" width="34" height="34" />
      </span>
      <span class="lm-profile__texto">
        <b>{{ soloNombre() ? usuarios.nombrePropio(usuario().nombre) : usuarios.nombreCompleto(usuario()) }}</b>
        <small>{{ rotulo() }}</small>
      </span>
    </button>
  `,
  styles: [
    `
      :host { display: block; }
      .lm-profile {
        display: flex; align-items: center; gap: 10px; width: 100%;
        min-height: 46px; padding: 4px 10px; text-align: left; cursor: pointer;
        border-radius: var(--radius-field); background: var(--surface-card);
        border: 1.5px solid var(--border-field);
        box-shadow: 0 1px 3px rgba(110, 18, 52, 0.05);
        transition: transform var(--dur-fast), border-color var(--dur-fast);
      }
      .lm-profile:active {
        border-color: var(--action-primary);
        box-shadow: var(--shadow-card);
        transform: scale(0.98);
      }
      .lm-profile__avatar {
        width: 38px; height: 38px; flex: 0 0 auto; border-radius: 50%;
        background: #FFFFFF;
        border: 1.5px solid rgba(185, 46, 88, 0.18);
        display: grid; place-items: center;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(110, 18, 52, 0.08);
      }
      .lm-profile__avatar img {
        width: 28px; height: 28px; object-fit: contain; display: block;
      }
      .lm-profile__texto { flex: 1; min-width: 0; }
      .lm-profile__texto b {
        display: block;
        font: 700 13.5px/1.2 var(--font-display, inherit);
        color: var(--text-title);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lm-profile__texto small {
        display: block;
        font: 500 11.5px/1.2 var(--font-text, inherit);
        color: var(--text-muted);
      }
    `,
  ],
})
export class TarjetaPerfilComponent {
  protected readonly usuarios = inject(UsuariosService);
  readonly usuario = input.required<Usuario>();
  readonly soloNombre = input(false, { transform: booleanAttribute });
  readonly presionar = output<void>();

  protected rotulo(): string {
    return ROTULO_PERFIL[this.usuario().perfil];
  }
}


/**
 * Fila de un comensal pendiente de aprobación.
 *
 * La foto va grande y a la izquierda, pegada a los nombres y apellidos, para
 * que nunca haya dudas de qué cara corresponde a qué registro. Aceptar y
 * rechazar viven dentro de la fila, no en una barra global: la decisión es por
 * persona. Van separados veinte píxeles y con colores opuestos, para que sea
 * imposible confundirlos de un toque.
 */
@Component({
  selector: 'lm-fila-pendiente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, ChipComponent, BotonComponent, DocumentoPipe],
  template: `
    <div class="lm-pending">
      <button type="button" class="lm-pending__fila fila" (click)="abrir.emit()">
        <span class="lm-avatar" [style.background-image]="'url(' + usuarios.avatarSushi(cliente()) + ')'"></span>
        <span class="lm-pending__datos">
          <span class="lm-pending__nombre">{{ usuarios.nombreCompleto(cliente()) }}</span>
          <span class="lm-pending__meta">
            <lm-icono nombre="badge" [tamano]="15" />
            DNI: {{ cliente().dni | documento }}
          </span>
          <span class="lm-pending__meta">
            <lm-icono nombre="mail" [tamano]="15" />
            <span>{{ cliente().email ?? 'Sin correo' }}</span>
          </span>
        </span>
        <lm-chip [estado]="cliente().estado.toLowerCase()">{{ rotuloEstado() }}</lm-chip>
      </button>
      @if (cliente().estado === 'PENDIENTE' && conAcciones()) {
        <div class="lm-pending__acciones">
          <lm-boton variante="danger" icono="close" (presionar)="rechazar.emit()">Rechazar</lm-boton>
          <lm-boton variante="success" icono="check" (presionar)="aceptar.emit()">Aceptar</lm-boton>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      /*
       * La fila entera abre la ficha ampliada: la foto de la lista es chica y
       * la decisión merece ver bien la cara. Es un botón, no un div con click,
       * para que también se llegue con el teclado.
       */
      .fila {
        width: 100%;
        border: none;
        background: transparent;
        padding: 0;
        text-align: left;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }
      .fila:active { opacity: 0.7; }
    `,
  ],
})
export class FilaPendienteComponent {
  protected readonly usuarios = inject(UsuariosService);
  readonly cliente = input.required<Usuario>();
  readonly conAcciones = input(true, { transform: booleanAttribute });
  readonly aceptar = output<void>();
  readonly rechazar = output<void>();
  /** Toque sobre la fila: abre la ficha ampliada de la persona. */
  readonly abrir = output<void>();

  protected rotuloEstado(): string {
    return ROTULO_ESTADO_USUARIO[this.cliente().estado];
  }
}

/**
 * Tarjeta de mesa para SakurApp.
 * Todas iguales y del mismo alto: la foto real de la mesa arriba, el número
 * en una placa, la capacidad, el tipo y la disponibilidad.
 */
@Component({
  selector: 'lm-tarjeta-mesa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, ChipComponent],
  template: `
<button
  type="button"
  class="lm-mesa"
  (click)="presionar.emit()"
>
  <!-- FOTO -->
<span class="lm-mesa__foto">

  <span
    class="lm-mesa__imagen"
    [class.lm-mesa__imagen--sinfoto]="!mesa().fotoUrl"
    [style.background-image]="
      mesa().fotoUrl
        ? 'url(' + mesa().fotoUrl + ')'
        : null
    "
  ></span>

  <span class="lm-mesa__tipo">
    <lm-icono
      [nombre]="iconoTipo()"
      [tamano]="14"
    />
    {{ rotuloTipo() }}
  </span>

  <span class="lm-mesa__numero">
    {{ mesa().numero }}
  </span>

</span>

  <!-- CUERPO -->
  <span class="lm-mesa__cuerpo">

    <span class="lm-mesa__cabecera">
      <span class="lm-mesa__datos">
        <span class="lm-mesa__rotulo">
          Mesa {{ mesa().numero }}
        </span>

        <span class="lm-mesa__meta">
          <lm-icono
            nombre="group"
            [tamano]="16"
          />
          {{ mesa().cantidadComensales }} personas
        </span>
      </span>

      <span class="lm-mesa__flecha">
        <lm-icono
          nombre="chevron_right"
          [tamano]="19"
        />
      </span>
    </span>

    <!-- ESTADO -->
    <span
      class="lm-mesa__estado"
      [class.lm-mesa__estado--vacia]="mesa().estado.toLowerCase() === 'vacia'"
      [class.lm-mesa__estado--ocupada]="mesa().estado.toLowerCase() === 'ocupada'"
      [class.lm-mesa__estado--inactiva]="mesa().estado.toLowerCase() === 'inactiva'"
    >
      <span class="lm-mesa__estado-punto"></span>

      {{ rotuloEstado() }}
    </span>

  </span>
</button>
  `,
  styles: [':host{display:block;height:100%}'],
})
export class TarjetaMesaComponent {
  readonly mesa = input.required<Mesa>();
  readonly presionar = output<void>();

  protected iconoTipo(): string {
    return ICONO_TIPO_MESA[this.mesa().tipo];
  }
  protected rotuloTipo(): string {
    return ROTULO_TIPO_MESA[this.mesa().tipo];
  }
  protected rotuloEstado(): string {
    return ROTULO_ESTADO_MESA[this.mesa().estado];
  }
}

/** Placa con el código QR listo para mirar o imprimir. */
@Component({
  selector: 'lm-placa-qr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-qrplate">
      <img [src]="fuente()" [alt]="'Código QR de ' + rotulo()" />
      <span class="lm-qrplate__pie">{{ rotulo() }}</span>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class PlacaQrComponent {
  readonly fuente = input.required<string>();
  readonly rotulo = input.required<string>();
}

/**
 * Fila de producto de la carta: miniatura, nombre, descripción, precio y tiempo.
 * Con controles de cantidad para el comensal.
 */
@Component({
  selector: 'lm-fila-producto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, ChipComponent, CantidadComponent, PesosPipe],
  template: `
    <div
      class="lm-product-fila"
      [class.lm-product-fila--carrito]="conCarrito()"
      [class.lm-product-fila--pedido]="conCarrito() && cantidad() > 0"
    >
      <button type="button" class="lm-product" (click)="presionar.emit()">
        <span
          class="lm-product__thumb"
          [class.lm-product__thumb--apagado]="!producto().disponible"
          [style.background-image]="portada() ? 'url(' + portada() + ')' : null"
        >
          @if (!portada()) {
            <lm-icono [nombre]="glifo()" [tamano]="26" color="var(--action-accent)" />
          }

          <span class="lm-product__flores" aria-hidden="true">
            <img src="assets/img/flor-2.png" alt="" />
            <img src="assets/img/flor-2.png" alt="" />
          </span>
        </span>

        <span class="lm-product__datos">
          <span class="lm-product__nombre">
            <span class="lm-product__nombre-texto">{{ producto().nombre }}</span>
            @if (!producto().disponible) {
              <lm-chip estado="rechazado">Sin stock</lm-chip>
            }
          </span>

          <span class="lm-product__desc">{{ producto().descripcion }}</span>

          <span class="lm-product__pie">
            <span class="lm-product__dato">
              <span class="lm-product__dato-icono">
                <lm-icono nombre="payments" [tamano]="18" />
              </span>
              <span class="lm-product__precio">{{ producto().precio | pesos }}</span>
            </span>

            <span class="lm-product__dato">
              <span class="lm-product__dato-icono">
                <lm-icono nombre="schedule" [tamano]="18" />
              </span>
              <span class="lm-product__tiempo">
                {{ producto().tiempoElaboracion }} minutos
              </span>
            </span>
          </span>
        </span>

        <span class="lm-product__ir" aria-hidden="true">
          <lm-icono nombre="chevron_right" [tamano]="22" />
        </span>
      </button>

      @if (conCarrito()) {
        <div class="lm-product__carrito">
          <lm-cantidad
            [cantidad]="cantidad()"
            [nombre]="producto().nombre"
            [permitirAgregar]="permitirAgregar()"
            (agregar)="agregar.emit()"
            (quitar)="quitar.emit()"
          />
          <span class="lm-product__subtotal">
            {{ cantidad() > 0 ? (producto().precio * cantidad() | pesos) : '' }}
          </span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .lm-product-fila--carrito {
        display: flex; align-items: center; gap: 6px;
        border-radius: var(--radius-card); background: var(--surface-card);
        box-shadow: var(--shadow-card); overflow: hidden;
        transition: box-shadow var(--dur-fast) var(--ease-standard);
      }
      .lm-product-fila--pedido { box-shadow: 0 0 0 2px var(--action-primary), var(--shadow-card); }
      .lm-product-fila--carrito .lm-product { flex: 1 1 auto; min-width: 0; box-shadow: none; }
      .lm-product__carrito {
        flex: 0 0 98px; width: 98px; box-sizing: border-box;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 4px; padding: 8px 8px 8px 0;
      }
      .lm-product__subtotal {
        min-height: 13px;
        font: 800 13px/1 var(--font-numeric); color: var(--action-primary); white-space: nowrap;
      }
    `,
  ],
})
export class FilaProductoComponent {
  readonly producto = input.required<Producto>();
  readonly conCarrito = input(false, { transform: booleanAttribute });
  readonly cantidad = input(0, { transform: numberAttribute });
  readonly permitirAgregar = input(true, { transform: booleanAttribute });
  readonly presionar = output<void>();
  readonly agregar = output<void>();
  readonly quitar = output<void>();

  protected portada(): string | null {
    return this.producto().fotos[0] ?? null;
  }
  protected glifo(): string {
    const tipo = this.producto().tipo;
    return tipo === 'BEBIDA' ? 'local_bar' : tipo === 'POSTRE' ? 'icecream' : 'restaurant';
  }
}

/**
 * Fila de la lista de espera con asignación y baja de mesa.
 */
@Component({
  selector: 'lm-fila-espera',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, IconoBotonComponent, HoraPipe],
  template: `
    <div class="lm-wait">
      <span class="lm-wait__pos">{{ posicion() }}</span>
      <span
        class="lm-avatar lm-avatar--sm"
        [style.background-image]="cliente().fotoUrl ? 'url(' + cliente().fotoUrl + ')' : null"
      >
        @if (!cliente().fotoUrl) {
          {{ usuarios.iniciales(cliente()) }}
        }
      </span>
      <span class="lm-wait__datos">
        <b>{{ usuarios.nombreCompleto(cliente()) }}</b>
        <small>
          <lm-icono nombre="schedule" [tamano]="15" />
          Llegó {{ desde() | hora }} · {{ comensales() }} personas
        </small>
      </span>
      <span class="lm-wait__acciones">
        <lm-icono-boton
          icono="table_restaurant"
          [rotulo]="'Asignarle una mesa a ' + usuarios.nombreCompleto(cliente())"
          tono="primario"
          (presionar)="asignar.emit()"
        />
        <lm-icono-boton
          icono="person_remove"
          [rotulo]="'Quitar a ' + usuarios.nombreCompleto(cliente()) + ' de la lista'"
          tono="peligro"
          (presionar)="quitar.emit()"
        />
      </span>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class FilaEsperaComponent {
  protected readonly usuarios = inject(UsuariosService);
  readonly cliente = input.required<Usuario>();
  readonly posicion = input.required<number>();
  readonly desde = input.required<string>();
  readonly comensales = input.required<number>();
  readonly asignar = output<void>();
  readonly quitar = output<void>();
}

/**
 * Carrusel de fotos centrado.
 */
@Component({
  selector: 'lm-carrusel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <div>
      <div
        class="lm-carousel__marco"
        [style.height.px]="alto()"
        [style.background-image]="actual() ? 'url(' + actual() + ')' : null"
      >
        @if (!actual()) {
          <span class="lm-carousel__vacio">
            <lm-icono nombre="add_a_photo" [tamano]="30" color="var(--action-accent)" />
            <span>Foto {{ indice() + 1 }} de {{ cantidad() }} · sin cargar</span>
          </span>
        }
        @if (cantidad() > 1) {
          <button type="button" class="lm-carousel__flecha" style="left:10px" aria-label="Foto anterior" (click)="mover(-1)">
            <lm-icono nombre="chevron_left" [tamano]="24" color="var(--action-primary)" />
          </button>
          <button type="button" class="lm-carousel__flecha" style="right:10px" aria-label="Foto siguiente" (click)="mover(1)">
            <lm-icono nombre="chevron_right" [tamano]="24" color="var(--action-primary)" />
          </button>
        }
      </div>
      @if (cantidad() > 1) {
        <div class="lm-carousel__puntos">
          @for (foto of fotos(); track $index) {
            <button
              type="button"
              class="sk-flor"
              [class.on]="$index === indice()"
              [attr.aria-label]="'Ver la foto ' + ($index + 1)"
              (click)="irA($index)"
            >
              <img src="assets/img/flor-2.png" alt="" />
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class CarruselComponent {
  readonly fotos = input.required<string[]>();
  readonly alto = input(226, { transform: numberAttribute });
  private readonly posicion = signal(0);

  protected indice(): number {
    return Math.min(this.posicion(), Math.max(0, this.cantidad() - 1));
  }
  protected cantidad(): number {
    return Math.max(1, this.fotos().length);
  }
  protected actual(): string | null {
    return this.fotos()[this.indice()] ?? null;
  }
  protected mover(paso: number): void {
    const n = this.cantidad();
    this.posicion.set((this.indice() + paso + n) % n);
  }
  protected irA(indice: number): void {
    this.posicion.set(indice);
  }
}


