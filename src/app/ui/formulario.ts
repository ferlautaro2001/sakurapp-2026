import { ChangeDetectionStrategy, Component, booleanAttribute, input, numberAttribute, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconoComponent } from './basicos';
import { mensajeDe } from '../nucleo/validacion/validadores';

/**
 * Campo de texto de SakurApp: 56px de alto, radio 12,
 * ícono a la izquierda y mensaje de error debajo con ícono y color.
 */
@Component({
  selector: 'lm-campo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconoComponent],
  template: `
    <label class="lm-field" [class.lm-field--error]="error() !== null">
      @if (etiqueta()) {
        <span class="lm-label" style="margin-bottom:6px">{{ etiqueta() }}</span>
      }
      <span class="lm-field__box">
        @if (icono()) {
          <lm-icono [nombre]="icono()!" [tamano]="20" [color]="error() ? 'var(--state-error)' : 'var(--action-primary)'" />
        }
        <input
          [formControl]="control()"
          [type]="tipo()"
          [placeholder]="marcador()"
          [attr.inputmode]="modo()"
          [attr.maxlength]="largoMaximo()"
          [attr.autocomplete]="autocompletar()"
          [attr.enterkeyhint]="tecla()"
        />
        <ng-content select="[accesorio]" />
      </span>
      @if (error()) {
        <span class="lm-field__error">
          <lm-icono nombre="error" [tamano]="16" />
          {{ error() }}
        </span>
      } @else if (ayuda()) {
        <span class="lm-field__hint">{{ ayuda() }}</span>
      }
    </label>
  `,
  styles: [':host{display:block}'],
})
export class CampoComponent {
  readonly control = input.required<FormControl>();
  readonly etiqueta = input<string | null>(null);
  readonly marcador = input('');
  readonly icono = input<string | null>(null);
  readonly tipo = input<'text' | 'password' | 'email' | 'tel' | 'number'>('text');
  readonly modo = input<string | null>(null);
  readonly largoMaximo = input<number | null>(null);
  readonly ayuda = input<string | null>(null);
  readonly autocompletar = input<string | null>('off');
  readonly tecla = input<string | null>('next');
  readonly accesorio = input(false, { transform: booleanAttribute });

  protected error(): string | null {
    return mensajeDe(this.control());
  }
}

/** Campo de varias líneas, para descripciones. Mismo lenguaje visual que el campo simple. */
@Component({
  selector: 'lm-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconoComponent],
  template: `
    <label class="lm-field" [class.lm-field--error]="error() !== null">
      @if (etiqueta()) {
        <span class="lm-label" style="margin-bottom:6px">{{ etiqueta() }}</span>
      }
      <span class="lm-field__box lm-field__box--alto">
        @if (icono()) {
          <lm-icono [nombre]="icono()!" [tamano]="20" [color]="error() ? 'var(--state-error)' : 'var(--action-primary)'" />
        }
        <textarea [formControl]="control()" [placeholder]="marcador()" [rows]="filas()" [attr.maxlength]="largoMaximo()"></textarea>
      </span>
      @if (error()) {
        <span class="lm-field__error">
          <lm-icono nombre="error" [tamano]="16" />
          {{ error() }}
        </span>
      } @else if (ayuda()) {
        <span class="lm-field__hint">{{ ayuda() }}</span>
      }
    </label>
  `,
  styles: [':host{display:block}'],
})
export class AreaComponent {
  readonly control = input.required<FormControl>();
  readonly etiqueta = input<string | null>(null);
  readonly marcador = input('');
  readonly icono = input<string | null>(null);
  readonly filas = input(3, { transform: numberAttribute });
  readonly largoMaximo = input<number | null>(240);
  readonly ayuda = input<string | null>(null);

  protected error(): string | null {
    return mensajeDe(this.control());
  }
}

/** Contenedor centrado de foto tomada con la cámara. */
@Component({
  selector: 'lm-foto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <div class="lm-photo">
      <button
        type="button"
        class="lm-photo__marco"
        [class.lm-photo__marco--circulo]="forma() === 'circulo'"
        [class.lm-photo__marco--ovalo]="forma() === 'ovalo'"
        [class.lm-photo__marco--rect]="forma() === 'rectangulo'"
        [class.lm-photo__marco--cargada]="!!fuente()"
        [style.width]="forma() === 'ovalo' ? medida(0.88) : forma() === 'circulo' ? medida(1) : null"
        [style.height]="medida(1)"
        [style.background-image]="fuente() ? 'url(' + fuente() + ')' : null"
        [style.border-color]="error() ? 'var(--state-error)' : null"
        [attr.aria-label]="fuente() ? 'Reemplazar la foto' : etiqueta()"
        (click)="capturar.emit()"
      >
        @if (!fuente()) {
          <lm-icono nombre="photo_camera" tamano="clamp(22px, 7vw, 30px)" [color]="error() ? 'var(--state-error)' : 'var(--action-primary)'" />
        }
      </button>
      <button
        type="button"
        class="lm-photo__pie"
        [class.lm-photo__pie--cargada]="!!fuente()"
        [attr.aria-label]="fuente() ? 'Reemplazar la foto' : null"
        (click)="capturar.emit()"
      >
        @if (fuente()) {
          <lm-icono nombre="cached" [tamano]="34" />
        } @else {
          <lm-icono nombre="add_a_photo" [tamano]="16" />
          {{ etiqueta() }}
        }
      </button>
      @if (error()) {
        <span class="lm-field__error" style="margin-top:0">
          <lm-icono nombre="error" [tamano]="16" />
          {{ error() }}
        </span>
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class FotoComponent {
  readonly fuente = input<string | null>(null);
  readonly etiqueta = input('Foto con cámara');
  /**
   * Círculo por omisión: toda foto de persona —registro y perfil— va redonda y
   * llena. El óvalo quedó como opción porque alguna pantalla vieja lo pide por
   * nombre, pero ninguna foto de cara debería usarlo: deformaba el rostro.
   */
  readonly forma = input<'circulo' | 'rectangulo' | 'ovalo'>('circulo');
  readonly tamano = input(140, { transform: (v: any) => Number(v) || 140 });
  readonly error = input<string | null>(null);
  readonly capturar = output<void>();

  /**
   * El marco de la foto ocupaba 140px clavados: sumado al recuadro de la cámara
   * y al pie, en un equipo de 320px se comía la mitad del formulario. El tamaño
   * pedido pasa a ser el techo, y `proporcion` es lo que el óvalo angosta.
   */
  protected medida(proporcion: number): string {
    const techo = this.tamano() * proporcion;
    return `clamp(${Math.round(techo * 0.73)}px, ${(techo / 4.3).toFixed(1)}vw, ${Math.round(techo)}px)`;
  }
}

/**
 * Acceso al escaneo del código del documento. Es un mosaico cuadrado, sólo
 * con el ícono y un rótulo corto, para ir en la misma fila que la foto.
 */
@Component({
  selector: 'lm-tarjeta-escaneo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <button type="button" class="lm-qrscan" [class.lm-qrscan--scanning]="escaneando()" (click)="escanear.emit()">
      <span class="lm-qrscan__icono">
        <lm-icono nombre="document_scanner" tamano="clamp(26px, 8.4vw, 36px)" color="var(--text-on-primary)" />
      </span>
      <span class="lm-qrscan__texto">
        <b>{{ escaneando() ? 'Escaneando…' : titulo() }}</b>
      </span>
    </button>
  `,
  styles: [':host{display:block}'],
})
export class TarjetaEscaneoComponent {
  readonly titulo = input('Escanear documento');
  /** Se conserva por compatibilidad: el mosaico ya no muestra texto de ayuda. */
  readonly ayuda = input('');
  readonly escaneando = input(false, { transform: booleanAttribute });
  readonly escanear = output<void>();
}


/** Buscador de una sola línea, con limpieza a la derecha. */
@Component({
  selector: 'lm-buscador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <span class="lm-search">
      <lm-icono nombre="search" [tamano]="20" color="var(--text-muted)" />
      <input
        type="search"
        [placeholder]="marcador()"
        [value]="valor()"
        (input)="cambiar.emit($any($event.target).value)"
      />
      @if (valor()) {
        <button
          type="button"
          aria-label="Limpiar la búsqueda"
          (click)="cambiar.emit('')"
          style="border:none;background:transparent;cursor:pointer;display:flex"
        >
          <lm-icono nombre="close" [tamano]="18" color="var(--text-muted)" />
        </button>
      }
    </span>
  `,
  styles: [':host{display:block}'],
})
export class BuscadorComponent {
  readonly marcador = input('Buscar');
  readonly valor = input('');
  readonly cambiar = output<string>();
}

/** Filtros reales en fila desplazable. Nunca un combo escondido. */
@Component({
  selector: 'lm-filtros',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <div class="lm-filters">
      @for (opcion of opciones(); track opcion) {
        <button
          type="button"
          class="lm-filter"
          [class.lm-filter--on]="opcion === valor()"
          (click)="cambiar.emit(opcion)"
        >
          @if (opcion === valor()) {
            <lm-icono nombre="check" [tamano]="16" />
          }
          {{ opcion }}
        </button>
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class FiltrosComponent {
  readonly opciones = input.required<string[]>();
  readonly valor = input.required<string>();
  readonly cambiar = output<string>();
}

/** Control segmentado: tipo de mesa, categoría corta. De dos a tres opciones. */
@Component({
  selector: 'lm-segmentado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (etiqueta()) {
      <span class="lm-label" style="margin-bottom:6px">{{ etiqueta() }}</span>
    }
    <!-- Columnas con mínimo cero: de lo contrario ninguna baja del ancho de su
         propio rótulo y el control entero se sale de la pantalla. -->
    <div
      class="lm-segmented"
      [class.lm-segmented--desliza]="opciones().length <= (columnas() ?? opciones().length)"
      [style.grid-template-columns]="'repeat(' + (columnas() ?? opciones().length) + ',minmax(0,1fr))'"
      [style.--n]="opciones().length"
      [class.lm-segmented--sin]="indice() < 0"
      [class.lm-segmented--vidrio]="vidrio()"
      [style.--i]="Math.max(0, indice())"
    >
      <span class="lm-segmented__marca" aria-hidden="true"></span>
      @for (opcion of opciones(); track opcion.valor) {
        <button type="button" [class.on]="opcion.valor === valor()" (click)="cambiar.emit(desactivable() && opcion.valor === valor() ? '' : opcion.valor)">
          {{ opcion.rotulo }}
        </button>
      }
    </div>
  `,
  styles: [':host{display:block}'],
})
export class SegmentadoComponent {
  protected readonly Math = Math;
  /** Tocar de nuevo la opción activa la apaga: sin opción activa no se filtra. */
  readonly desactivable = input(false, { transform: booleanAttribute });
  /** Mismo aspecto que las pestañas: transparente, con la pastilla blanca. */
  readonly vidrio = input(false, { transform: booleanAttribute });
  readonly opciones = input.required<{ valor: string; rotulo: string }[]>();
  readonly valor = input.required<string>();
  readonly etiqueta = input<string | null>(null);
  readonly columnas = input<number | null>(null);
  readonly cambiar = output<string>();

  /** Posición de la opción activa: la pastilla se desliza hasta ahí. */
  protected indice(): number {
    return this.opciones().findIndex((o) => o.valor === this.valor());
  }
}

/** Interruptor de disponibilidad. Fila completa táctil. */
@Component({
  selector: 'lm-interruptor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="lm-toggle" (click)="cambiar.emit(!activo())">
      <span class="lm-toggle__texto">
        <b>{{ etiqueta() }}</b>
        @if (ayuda()) {
          <small>{{ ayuda() }}</small>
        }
      </span>
      <span class="lm-toggle__pista" [class.on]="activo()">
        <span class="lm-toggle__perilla"></span>
      </span>
    </button>
  `,
  styles: [':host{display:block}'],
})
export class InterruptorComponent {
  readonly etiqueta = input.required<string>();
  readonly ayuda = input<string | null>(null);
  readonly activo = input(false, { transform: booleanAttribute });
  readonly cambiar = output<boolean>();
}

