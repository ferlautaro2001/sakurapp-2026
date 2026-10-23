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
import { ChipComponent, DecisionComponent, IconoBotonComponent, IconoComponent } from './basicos';
import { CantidadComponent } from './pedidos';
import { DocumentoPipe, HoraPipe, PesosPipe } from './pesos.pipe';

/** Tarjeta de perfil del ingreso rápido: foto o iniciales, nombre y rol. Nunca un combo. */
@Component({
  selector: 'lm-tarjeta-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="lm-profile" (click)="presionar.emit()">
      <span class="lm-profile__avatar">
        <img [src]="usuarios.avatarSushi(usuario())" [alt]="usuario().nombre" width="34" height="34" loading="lazy" decoding="async" />
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
      .lm-pending__estado { display: block; margin-top: 4px; }
      .lm-profile {
        display: flex; align-items: center; gap: 10px; width: 100%;
        min-height: var(--touch-min); padding: 4px 10px; text-align: left; cursor: pointer;
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
        /* Como no se encoge, el lado tiene que bajar solo con el ancho del
           equipo o se come el renglón del nombre. La proporción va clavada en
           uno para que el círculo no se vuelva óvalo si el alto de la fila
           empuja. */
        width: clamp(30px, 8.8vw, 38px); aspect-ratio: 1; height: auto;
        flex: 0 0 auto; border-radius: 50%;
        background: #FFFFFF;
        border: 1.5px solid rgba(185, 46, 88, 0.18);
        display: grid; place-items: center;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(110, 18, 52, 0.08);
      }
      /* La imagen llena el círculo: acá entra tanto el sushi de reserva como la
         foto real de la persona, y contenida al 74% la foto quedaba chica y
         con aire a los costados. Recorta desde el centro, que es donde está la
         cara; el sushi es cuadrado, así que no pierde nada. */
      .lm-profile__avatar img {
        width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;
      }
      .lm-profile__texto { flex: 1; min-width: 0; }
      .lm-profile__texto b {
        display: block;
        font: 700 clamp(12.5px, 3.1vw, 13.5px)/1.2 var(--font-display, inherit);
        color: var(--text-title);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lm-profile__texto small {
        display: block;
        font: 500 clamp(10.5px, 2.7vw, 11.5px)/1.2 var(--font-text, inherit);
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
 * Ficha de un comensal pendiente de aprobación.
 *
 * La tarjeta es una sola columna, de arriba hacia abajo: el nombre como título
 * centrado, la foto en el medio, los datos debajo y las dos decisiones al pie,
 * una a cada lado como en el resto de las pantallas. Así la cara se mira a gusto
 * antes de decidir. Aceptar y rechazar viven dentro de la tarjeta, no en una
 * barra global: la decisión es por persona.
 */
@Component({
  selector: 'lm-fila-pendiente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, DecisionComponent, DocumentoPipe],
  template: `
    <div class="lm-pending">
      <!-- El nombre manda: es el título de la tarjeta, centrado arriba de todo.
           Es un botón porque toda la tarjeta abre la ficha ampliada. -->
      <h3 class="lm-pending__titulo">
        <button type="button" class="lm-pending__nombre" (click)="abrir.emit()">
          {{ nombreCorto() }}
        </button>
        @if (mostrarEstado()) {
          <span
            class="lm-pending__estado-badge"
            [class.lm-pending__estado-badge--pendiente]="cliente().estado === 'PENDIENTE'"
            [class.lm-pending__estado-badge--aprobado]="cliente().estado === 'APROBADO'"
            [class.lm-pending__estado-badge--rechazado]="cliente().estado === 'RECHAZADO'"
            [attr.aria-label]="rotuloEstado()"
            [title]="rotuloEstado()"
          >
            <lm-icono [nombre]="iconoEstado()" [tamano]="24" />
          </span>
        }
      </h3>

      <!-- La foto, en el medio y cuadrada: un botón propio con el mismo destino
           que los datos, para que el gesto de abrir la ficha valga en cualquier
           lado de la tarjeta. -->
      <button
        type="button"
        class="lm-pending__foto"
        [attr.aria-label]="'Ver la ficha de ' + usuarios.nombreCompleto(cliente())"
        (click)="abrir.emit()"
      >
        <span class="lm-avatar" [style.background-image]="'url(' + usuarios.avatarSushi(cliente()) + ')'"></span>
      </button>

      <button type="button" class="lm-pending__fila fila" (click)="abrir.emit()">
        <span class="lm-pending__datos">
          <span class="lm-pending__meta">
            <lm-icono nombre="badge" [tamano]="20" />
            DNI: {{ cliente().dni | documento }}
          </span>
          <span class="lm-pending__meta lm-pending__meta--correo">
            <lm-icono nombre="mail" [tamano]="20" />
            @if (correo(); as partes) {
              <!-- Si no entra en un renglón, parte justo antes del "@" y nunca
                   en el medio del usuario o del dominio. -->
              <span class="correo"><span class="correo__parte">{{ partes.usuario }}</span><wbr /><span class="correo__parte">{{ partes.dominio }}</span></span>
            } @else {
              <span>Sin correo</span>
            }
          </span>
        </span>
      </button>
      <!-- El estado va ahora como un círculo junto al nombre: ocupa el alto del
           título y no le roba espacio a la foto. -->
      @if (cliente().estado === 'PENDIENTE' && conAcciones()) {
        <lm-decision
          compacto
          class="lm-pending__acciones"
          rotuloRechazar="Rechazar"
          (rechazar)="rechazar.emit()"
          (aceptar)="aceptar.emit()"
        />
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      /*
       * El nombre, la foto y los datos abren la ficha ampliada: la foto de la
       * lista es chica y la decisión merece ver bien la cara. Son botones, no
       * divs con click, para que también se llegue con el teclado.
       *
       * El aspecto de la tarjeta —la grilla, el título, la foto y los datos—
       * vive en el sistema de diseño, en .lm-pending, porque la comparten los
       * registros y los empleados. Acá queda sólo lo que es de este botón: que
       * no se vea como botón y que el teclado lo alcance.
       */
      .fila,
      .lm-pending__foto {
        border: none;
        background: transparent;
        padding: 0;
        text-align: center;
        cursor: pointer;
        font: inherit;
        color: inherit;
        -webkit-tap-highlight-color: transparent;
      }
      /* El nombre no hereda tipografía ni color: los pone el sistema de diseño
         con su propia regla, y heredar acá la pisaría. */
      .lm-pending__nombre {
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .lm-pending__titulo {
       display: grid; grid-template-columns: var(--touch-min) 1fr var(--touch-min);
       align-items: start; width: 100%;
     }
     .lm-pending__nombre { grid-column: 2; text-align: center; }
     .lm-pending__estado-badge {
       grid-column: 3; justify-self: center;
       display: inline-flex; align-items: center; justify-content: center;
       width: var(--touch-min); height: var(--touch-min); border-radius: 50%;
       line-height: 1;
       border: 1.5px solid rgba(255, 255, 255, .6);
       box-shadow:
         inset 0 1px 0 rgba(255, 255, 255, .7),
         0 3px 8px rgba(94, 12, 44, .14);
     }
     .lm-pending__estado-badge--pendiente { background: var(--state-pending); color: #FFFFFF; }
     .lm-pending__estado-badge--aprobado { background: var(--state-success); color: #FFFFFF; }
     .lm-pending__estado-badge--rechazado { background: var(--state-error); color: #FFFFFF; }
     .fila:active, .lm-pending__foto:active, .lm-pending__nombre:active { opacity: 0.7; }
      .fila:focus-visible,
      .lm-pending__foto:focus-visible,
      .lm-pending__nombre:focus-visible { outline: 3px solid #FFFFFF; outline-offset: 3px; }

      /* Los datos van adentro del botón que abre la ficha, así que el botón es
         el que ocupa la fila de la grilla y se estira a todo el ancho. */
      .fila { grid-area: datos; width: 100%; display: flex; justify-content: center; }
      .lm-pending__acciones ::ng-deep .dec { width: auto; min-height: 0; height: 54px; border-radius: 16px; }
    `,
  ],
})
export class FilaPendienteComponent {
  protected readonly usuarios = inject(UsuariosService);
  readonly cliente = input.required<Usuario>();
  readonly conAcciones = input(true, { transform: booleanAttribute });
  /** Con un filtro de estado activo el estado ya es obvio: se oculta. */
  readonly mostrarEstado = input(true, { transform: booleanAttribute });
  readonly aceptar = output<void>();
  readonly rechazar = output<void>();
  /** Toque sobre la fila: abre la ficha ampliada de la persona. */
  readonly abrir = output<void>();

  protected rotuloEstado(): string {
    return ROTULO_ESTADO_USUARIO[this.cliente().estado];
  }

  protected iconoEstado(): string {
    switch (this.cliente().estado) {
      case 'APROBADO':
        return 'check';
      case 'RECHAZADO':
        return 'close';
      default:
        return 'schedule';
    }
  }

  protected nombreCorto(): string {
    const nombre = this.usuarios.nombrePropio(this.cliente().nombre).split(/\s+/)[0] ?? '';
    const apellido = this.usuarios.nombrePropio(this.cliente().apellido).split(/\s+/)[0] ?? '';
    return `${nombre} ${apellido}`.trim();
  }

  /** El correo en dos mitades para poder partirlo antes del "@". */
  protected correo(): { usuario: string; dominio: string } | null {
    const email = this.cliente().email?.trim();
    if (!email) return null;
    const arroba = email.lastIndexOf('@');
    return arroba > 0
      ? { usuario: email.slice(0, arroba), dominio: email.slice(arroba) }
      : { usuario: email, dominio: '' };
  }
}

/**
 * Tarjeta de mesa para SakurApp.
 *
 * La foto es el fondo de la tarjeta y los datos van abajo, en una banda
 * sólida: el número de la mesa y su estado son lo que hay que leer de un
 * vistazo, y encima de una foto el texto nunca gana. El estado dice su
 * nombre —Vacía, Ocupada, Inactiva— y además lleva su color: el punto de
 * color solo no se entendía y parecía un botón de grabar.
 */
@Component({
  selector: 'lm-tarjeta-mesa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
<button
  type="button"
  class="lm-mesa"
  [attr.aria-label]="
    'Mesa ' +
    mesa().numero +
    ', ' +
    rotuloEstado().toLowerCase() +
    ', ' +
    mesa().cantidadComensales +
    ' personas'
  "
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
  >
    <!-- Sin foto, el ícono del tipo en el centro: así cada mesa se distingue
         de las demás aunque no tenga imagen. -->
    @if (!mesa().fotoUrl) {
      <span class="lm-mesa__sinfoto">
        <lm-icono [nombre]="iconoTipo()" [tamano]="52" />
      </span>
    }
  </span>

  <!--
    Arriba a la izquierda, pegada a la esquina: el número de la mesa y, a su
    derecha, la pelotita del estado. Es como se llama a una mesa en el salón, y
    desde lejos se lee el color antes que el número.
  -->
  <span class="lm-mesa__identidad">
    <span class="lm-mesa__numero">{{ mesa().numero }}</span>
    <span class="lm-mesa__pipe" aria-hidden="true">|</span>
    <span
      class="lm-mesa__punto"
      [class.lm-mesa__punto--vacia]="mesa().estado.toLowerCase() === 'vacia'"
      [class.lm-mesa__punto--ocupada]="mesa().estado.toLowerCase() === 'ocupada'"
      [class.lm-mesa__punto--inactiva]="mesa().estado.toLowerCase() === 'inactiva'"
      aria-hidden="true"
    ></span>
  </span>

  <!-- Tipo (sólo el ícono) y comensales en una sola píldora arriba a la derecha. -->
  <span
    class="lm-mesa__arriba lm-mesa__meta"
    [attr.aria-label]="(mostrarTipo() ? rotuloTipo() + ', ' : '') + mesa().cantidadComensales + ' personas'"
  >
    @if (mostrarTipo()) {
      <span class="lm-mesa__tipo">
        <lm-icono [nombre]="iconoTipo()" [tamano]="18" />
      </span>
      <span class="lm-mesa__pipe" aria-hidden="true">|</span>
    }
    <lm-icono nombre="group" [tamano]="20" />
    {{ mesa().cantidadComensales }}
  </span>

  <!--
    Los atajos van con el rol de botón y no como un elemento button, porque la
    tarjeta entera ya es uno y el HTML no permite anidarlos; por eso cada uno
    frena la propagación, para que tocar el lápiz no abra además la ficha que
    hay detrás.
  -->
  <span class="lm-mesa__abajo">
    <span
      class="lm-mesa__atajo lm-mesa__atajo--qr"
      role="button"
      tabindex="0"
      [attr.aria-label]="'Ver el código QR de la mesa ' + mesa().numero"
      (click)="verQr($event)"
      (keydown.enter)="verQr($event)"
      (keydown.space)="verQr($event)"
    >
      <lm-icono nombre="qr_code_2" [tamano]="20" />
    </span>

    @if (conEdicion()) {
      <span
        class="lm-mesa__atajo lm-mesa__atajo--editar"
        role="button"
        tabindex="0"
        [attr.aria-label]="'Editar la mesa ' + mesa().numero"
        (click)="editar($event)"
        (keydown.enter)="editar($event)"
        (keydown.space)="editar($event)"
      >
        <lm-icono nombre="edit" [tamano]="20" />
      </span>
    }
  </span>
</span>
</button>
  `,
  styles: [':host{display:block;height:100%}'],
})
export class TarjetaMesaComponent {
  readonly mesa = input.required<Mesa>();
  /** El lápiz sólo lo ven los perfiles que pueden editar la mesa. */
  readonly conEdicion = input(false, { transform: booleanAttribute });
  /** Con un filtro de tipo activo, ese dato ya es obvio: se oculta. */
  readonly mostrarTipo = input(true, { transform: booleanAttribute });
  readonly presionar = output<void>();
  readonly abrirQr = output<void>();
  readonly abrirEdicion = output<void>();

  protected verQr(evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.abrirQr.emit();
  }
  protected editar(evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.abrirEdicion.emit();
  }

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
            <lm-icono [nombre]="glifo()" tamano="clamp(19px, 6vw, 26px)" color="var(--action-accent)" />
          }
          <span
            class="lm-product__info-badge"
            role="button"
            tabindex="0"
            [attr.aria-label]="'Ver información de ' + producto().nombre"
            (click)="$event.stopPropagation(); presionar.emit()"
            (keydown.enter)="$event.stopPropagation(); presionar.emit()"
            (keydown.space)="$event.stopPropagation(); presionar.emit()"
          >
            <lm-icono nombre="info" [tamano]="22" />
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
                {{ producto().tiempoElaboracion }}'
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
        flex: 0 0 auto; width: clamp(78px, 23vw, 98px); box-sizing: border-box;
        display: flex; align-items: center; justify-content: center;
        padding: 8px 12px 8px 0;
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
        [style.height]="altoCss()"
        [style.background-image]="actual() ? 'url(' + actual() + ')' : null"
      >
        @if (!actual()) {
          <span class="lm-carousel__vacio">
            <lm-icono nombre="add_a_photo" tamano="clamp(22px, 7vw, 30px)" color="var(--action-accent)" />
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
              <img src="assets/img/flor-2.png" alt="" loading="lazy" decoding="async" />
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

  /**
   * El alto pedido es el techo, no una medida clavada: en un equipo angosto el
   * marco de la foto se quedaba con más de la mitad de la pantalla y empujaba
   * los pétalos del pie fuera de la vista.
   */
  protected altoCss(): string {
    const techo = this.alto();
    return `clamp(${Math.round(techo * 0.73)}px, ${(techo / 4.3).toFixed(1)}vw, ${techo}px)`;
  }

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


