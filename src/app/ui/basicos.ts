import { ChangeDetectionStrategy, Component, booleanAttribute, input, numberAttribute, output } from '@angular/core';

/** Ícono de Material Symbols Rounded, relleno. Nunca se escribe la clase a mano. */
@Component({
  selector: 'lm-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="material-symbols-rounded"
    aria-hidden="true"
    [style.font-size.px]="tamano()"
    [style.color]="color()"
    >{{ nombre() }}</span
  >`,
  styles: [':host{display:inline-flex;align-items:center}'],
})
export class IconoComponent {
  readonly nombre = input.required<string>();
  readonly tamano = input(22, { transform: numberAttribute });
  readonly color = input('currentColor');
}

/** Acción de pantalla. Una sola primaria por pantalla, ancha, en el tercio inferior. */
@Component({
  selector: 'lm-boton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <button
      type="button"
      class="lm-btn"
      [class.lm-btn--primary]="variante() === 'primary'"
      [class.lm-btn--secondary]="variante() === 'secondary'"
      [class.lm-btn--ghost]="variante() === 'ghost'"
      [class.lm-btn--danger]="variante() === 'danger'"
      [class.lm-btn--success]="variante() === 'success'"
      [class.lm-btn--auto]="!ancho()"
      [class.lm-btn--sobre-oscuro]="sobreOscuro()"
      [disabled]="deshabilitado()"
      (click)="presionar.emit()"
    >
      @if (icono()) {
        <lm-icono [nombre]="icono()!" [tamano]="20" />
      }
      <ng-content />
    </button>
  `,
  styles: [':host{display:block}:host([auto]){display:inline-block}'],
})
export class BotonComponent {
  readonly variante = input<'primary' | 'secondary' | 'ghost' | 'danger' | 'success'>('primary');
  readonly icono = input<string | null>(null);
  readonly ancho = input(true, { transform: booleanAttribute });
  readonly deshabilitado = input(false, { transform: booleanAttribute });
  readonly sobreOscuro = input(false, { transform: booleanAttribute });
  readonly presionar = output<void>();
}

/** Acción secundaria en texto: no compite en color con la primaria. */
@Component({
  selector: 'lm-texto-boton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="lm-textbtn"
      [class.lm-textbtn--high]="enfasis() === 'alto'"
      [class.lm-textbtn--danger]="enfasis() === 'peligro'"
      [class.lm-textbtn--sobre-oscuro]="enfasis() === 'claro'"
      (click)="presionar.emit()"
    >
      <ng-content />
    </button>
  `,
  styles: [':host{display:block}:host > button{width:100%}'],
})
export class TextoBotonComponent {
  readonly enfasis = input<'medio' | 'alto' | 'peligro' | 'claro'>('medio');
  readonly presionar = output<void>();
}

/** Acción compacta de cuarenta y ocho píxeles: siempre cumple el área táctil mínima. */
@Component({
  selector: 'lm-icono-boton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <button
      type="button"
      class="lm-iconbtn"
      [class.lm-iconbtn--primary]="tono() === 'primario'"
      [class.lm-iconbtn--danger]="tono() === 'peligro'"
      [class.lm-iconbtn--success]="tono() === 'exito'"
      [class.lm-iconbtn--claro]="tono() === 'claro'"
      [class.lm-iconbtn--atras]="pegadoIzquierda()"
      [attr.aria-label]="rotulo()"
      (click)="presionar.emit()"
    >
      <lm-icono [nombre]="icono()" [tamano]="tamano()" />
    </button>
  `,
  styles: [':host{display:inline-flex}'],
})
export class IconoBotonComponent {
  readonly icono = input.required<string>();
  readonly rotulo = input.required<string>();
  readonly tono = input<'neutro' | 'primario' | 'peligro' | 'exito' | 'claro'>('neutro');
  readonly tamano = input(22, { transform: numberAttribute });
  readonly pegadoIzquierda = input(false, { transform: booleanAttribute });
  readonly presionar = output<void>();
}

/** Píldora de estado. El color hace la mitad del trabajo; el texto la otra mitad. */
@Component({
  selector: 'lm-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="lm-chip lm-chip--{{ estado() }}"><ng-content /></span>`,
  styles: [':host{display:inline-flex}'],
})
export class ChipComponent {
  /** vacia · libre · ocupada · inactiva · reservada · pendiente · aprobado · rechazado */
  readonly estado = input.required<string>();
}

/** Separador de marca: tres cortes al bies entre dos hairlines. */
@Component({
  selector: 'lm-separador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-rule">
      <span class="lm-rule__linea"></span>
      @if (rotulo()) {
        <span class="lm-rule__centro">
          <span class="lm-rule__marca"><i></i><i></i><i></i></span>
          <span class="lm-label">{{ rotulo() }}</span>
        </span>
      } @else {
        <span class="lm-rule__marca"><i></i><i></i><i></i></span>
      }
      <span class="lm-rule__linea"></span>
    </div>
  `,
  styles: [':host{display:block}'],
})
export class SeparadorComponent {
  readonly rotulo = input<string | null>(null);
}

/**
 * Marca de SakurApp: el ícono sobre su placa blanca más el nombre.
 * La placa no es decorativa: el ícono tiene fondo rosado propio y sin ella se
 * confunde con el fondo de la aplicación.
 */
@Component({
  selector: 'lm-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-logo">
      <span class="sk-placa">
        <img src="assets/img/logo-badge.png" alt="SakurApp" [width]="tamano()" [height]="tamano()" />
      </span>
      @if (conNombre()) {
        <span class="lm-logo__nombre">SakurApp</span>
      }
      @if (bajada()) {
        <span class="lm-logo__bajada">{{ bajada() }}</span>
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class LogoComponent {
  readonly tamano = input(74, { transform: numberAttribute });
  readonly conNombre = input(true, { transform: booleanAttribute });
  readonly bajada = input<string | null>(null);
}

/** Espera con el logo de SakurApp en el centro. Toda espera de la aplicación usa esto. */
@Component({
  selector: 'lm-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-spinner">
      <span class="lm-spinner__anillo" [style.width.px]="tamano()" [style.height.px]="tamano()">
        <img src="assets/img/logo-badge.png" alt="" [width]="interior()" [height]="interior()" />
      </span>
      @if (rotulo()) {
        <span class="lm-spinner__rotulo">{{ rotulo() }}</span>
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class SpinnerComponent {
  readonly tamano = input(96, { transform: numberAttribute });
  readonly rotulo = input<string | null>('Cargando…');
  protected interior(): number {
    return Math.round(this.tamano() * 0.54);
  }
}

/** Título de pantalla, con contador opcional y una acción a la derecha. */
@Component({
  selector: 'lm-titulo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-title">
      <div class="lm-title__texto">
        <h1>
          <ng-content />
          @if (contador() !== null) {
            <span class="lm-title__contador">({{ contador() }})</span>
          }
        </h1>
        @if (bajada()) {
          <p>{{ bajada() }}</p>
        }
      </div>
      <ng-content select="[accion]" />
    </div>
  `,
  styles: [':host{display:block}'],
})
export class TituloComponent {
  readonly contador = input<number | null>(null);
  readonly bajada = input<string | null>(null);
}

/** Aviso dentro de la pantalla. Nunca una alerta del sistema. */
@Component({
  selector: 'lm-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <div
      role="status"
      class="lm-banner"
      [class.lm-banner--success]="tono() === 'success'"
      [class.lm-banner--info]="tono() === 'info'"
    >
      <lm-icono [nombre]="glifo()" [tamano]="22" [color]="colorTono()" />
      <div class="lm-banner__texto">
        @if (titulo()) {
          <span class="lm-banner__titulo" [style.color]="colorTono()">{{ titulo() }}</span>
        }
        <span class="lm-banner__cuerpo"><ng-content /></span>
      </div>
      @if (cerrable()) {
        <button type="button" class="lm-banner__cerrar" aria-label="Cerrar aviso" (click)="cerrar.emit()">
          <lm-icono nombre="close" [tamano]="18" [color]="colorTono()" />
        </button>
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class BannerComponent {
  readonly tono = input<'error' | 'success' | 'info'>('error');
  readonly titulo = input<string | null>(null);
  readonly cerrable = input(false, { transform: booleanAttribute });
  readonly cerrar = output<void>();

  protected glifo(): string {
    return this.tono() === 'success' ? 'check_circle' : this.tono() === 'info' ? 'info' : 'error';
  }
  protected colorTono(): string {
    return this.tono() === 'success'
      ? 'var(--state-success)'
      : this.tono() === 'info'
        ? 'var(--action-primary)'
        : 'var(--state-error)';
  }
}

/** Estado vacío: ocupa la pantalla con contenido útil, no con un hueco. */
@Component({
  selector: 'lm-vacio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <div class="lm-empty">
      <span class="lm-empty__icono">
        <lm-icono [nombre]="icono()" [tamano]="34" color="var(--action-accent)" />
      </span>
      <span class="lm-empty__titulo">{{ titulo() }}</span>
      <span class="lm-empty__texto"><ng-content /></span>
      <ng-content select="[accion]" />
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}:host > div{width:100%}'],
})
export class VacioComponent {
  readonly icono = input('inbox');
  readonly titulo = input.required<string>();
}

/** Notificación automática: aviso del sistema o banner interno con la aplicación abierta. */
@Component({
  selector: 'lm-push',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <button type="button" class="lm-push" [class.lm-push--system]="variante() === 'sistema'" (click)="presionar.emit()">
      <span class="sk-placa sk-placa--chica">
        <img src="assets/img/logo-badge.png" alt="" width="34" height="34" />
      </span>
      <span class="lm-push__cuerpo">
        <span class="lm-push__marca">
          <b>SakurApp</b>
          <small>{{ hora() }}</small>
        </span>
        <span class="lm-push__titulo">{{ titulo() }}</span>
        @if (cuerpo()) {
          <span class="lm-push__texto">{{ cuerpo() }}</span>
        }
      </span>
      @if (variante() === 'interno') {
        <lm-icono nombre="chevron_right" [tamano]="20" color="var(--action-primary)" />
      }
    </button>
  `,
  styles: [':host{display:block}'],
})
export class PushComponent {
  readonly titulo = input.required<string>();
  readonly cuerpo = input<string | null>(null);
  readonly hora = input('ahora');
  readonly variante = input<'interno' | 'sistema'>('interno');
  readonly presionar = output<void>();
}

/**
 * Ventana modal de confirmación.
 *
 * La dibuja una sola vez la cáscara de la aplicación, alimentada por
 * `ConfirmacionService`. Cancelar va primero y sin color; la acción que
 * confirma va segunda, teñida según lo que hace: verde para aceptar, rojo
 * para lo destructivo.
 */
@Component({
  selector: 'lm-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, BotonComponent],
  template: `
    <div class="lm-modal__fondo" (click)="cancelar.emit()">
      <div
        class="lm-modal"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-label]="titulo()"
        (click)="$event.stopPropagation()"
      >
        @if (foto()) {
          <span class="modal-foto">
            <img [src]="foto()" [alt]="titulo()" width="112" height="112" />
          </span>
        } @else {
          <span class="lm-modal__icono lm-modal__icono--{{ tono() }}">
            <lm-icono [nombre]="icono()" [tamano]="30" color="#FFFFFF" />
          </span>
        }
        <h2 class="lm-modal__titulo">{{ titulo() }}</h2>
        <p class="lm-modal__texto">{{ mensaje() }}</p>

        @if (detalle().length) {
          <dl class="lm-modal__detalle">
            @for (dato of detalle(); track dato.rotulo) {
              <div>
                <dt>{{ dato.rotulo }}</dt>
                <dd>{{ dato.valor }}</dd>
              </div>
            }
          </dl>
        }

        <div class="lm-modal__acciones" [class.lm-modal__acciones--unica]="!conCancelar()">
          @if (conCancelar()) {
            <lm-boton variante="ghost" (presionar)="cancelar.emit()">{{ rotuloCancelar() }}</lm-boton>
          }
          <lm-boton [variante]="varianteConfirmar()" [icono]="icono()" (presionar)="confirmar.emit()">
            {{ rotuloConfirmar() }}
          </lm-boton>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: contents; }
      /*
       * Cuando se decide sobre una persona, la cara va primero y grande, y va
       * sola: cualquier sello encima tapa parte del rostro, que es justo lo
       * que hay que mirar. El color del botón y el título ya dicen si se está
       * aprobando o rechazando.
       */
      .modal-foto {
        width: 116px; height: 116px; flex: 0 0 auto;
        border-radius: 50%; background: #ffffff;
        border: 3px solid rgba(185, 46, 88, 0.22);
        box-shadow: 0 4px 12px rgba(110, 18, 52, 0.14);
        /*
         * En bloque, no en grilla: con display grid la imagen estira la fila
         * hasta su altura natural y una foto vertical (la típica captura de
         * pantalla de 1320x2868) se desborda del círculo y se ve corrida. En
         * bloque, el 100% de alto se mide contra los 116px del contenedor y el
         * recorte queda siempre centrado.
         */
        display: block; overflow: hidden;
      }
      .modal-foto img {
        width: 100%; height: 100%; display: block;
        object-fit: cover; object-position: center;
      }
      /* Sin decisión que tomar, el único botón ocupa todo el ancho. */
      .lm-modal__acciones--unica { grid-template-columns: minmax(0, 1fr); }
    `,
  ],
})
export class ModalComponent {
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly rotuloConfirmar = input.required<string>();
  readonly rotuloCancelar = input('Cancelar');
  readonly tono = input<'exito' | 'peligro' | 'primario'>('primario');
  readonly icono = input('help');
  readonly detalle = input<{ rotulo: string; valor: string }[]>([]);
  /** Fotografía de la persona sobre la que se decide, si la decisión es sobre alguien. */
  readonly foto = input<string | null>(null);
  /** En falso, el modal es una ficha para mirar: un solo botón, sin decisión. */
  readonly conCancelar = input(true, { transform: booleanAttribute });
  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  protected varianteConfirmar(): 'primary' | 'success' | 'danger' {
    const tono = this.tono();
    return tono === 'exito' ? 'success' : tono === 'peligro' ? 'danger' : 'primary';
  }
}
