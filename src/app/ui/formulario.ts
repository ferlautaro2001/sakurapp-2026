import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
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
          [type]="tipo()"
          [formControl]="control()"
          [placeholder]="marcador()"
          [attr.inputmode]="modo()"
          [attr.maxlength]="largoMaximo()"
          [attr.autocomplete]="autocompletar()"
          [attr.enterkeyhint]="tecla()"
        />
        @if (accesorio()) {
          <ng-content select="[accesorio]" />
        }
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
        [class.lm-photo__marco--rect]="forma() === 'rectangulo'"
        [class.lm-photo__marco--cargada]="!!fuente()"
        [style.width.px]="forma() === 'circulo' ? tamano() : null"
        [style.height.px]="tamano()"
        [style.background-image]="fuente() ? 'url(' + fuente() + ')' : null"
        [style.border-color]="error() ? 'var(--state-error)' : null"
        [attr.aria-label]="fuente() ? 'Reemplazar la foto' : etiqueta()"
        (click)="capturar.emit()"
      >
        @if (!fuente()) {
          <lm-icono nombre="photo_camera" [tamano]="30" [color]="error() ? 'var(--state-error)' : 'var(--action-primary)'" />
        }
      </button>
      <button type="button" class="lm-photo__pie" [class.lm-photo__pie--cargada]="!!fuente()" (click)="capturar.emit()">
        <lm-icono [nombre]="fuente() ? 'cached' : 'add_a_photo'" [tamano]="16" />
        {{ fuente() ? 'Reemplazar foto' : etiqueta() }}
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
  readonly forma = input<'circulo' | 'rectangulo'>('circulo');
  readonly tamano = input(132, { transform: (v: any) => Number(v) || 132 });
  readonly error = input<string | null>(null);
  readonly capturar = output<void>();
}

/** Acceso destacado al escaneo del código del documento, arriba del formulario. */
@Component({
  selector: 'lm-tarjeta-escaneo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <button type="button" class="lm-qrscan" [class.lm-qrscan--scanning]="escaneando()" (click)="escanear.emit()">
      <span class="lm-qrscan__icono">
        <lm-icono nombre="qr_code_scanner" [tamano]="26" color="var(--text-on-primary)" />
      </span>
      <span class="lm-qrscan__texto">
        <b>{{ escaneando() ? 'Escaneando…' : titulo() }}</b>
        <small>{{ escaneando() ? 'Sostené el documento dentro del marco' : ayuda() }}</small>
      </span>
      <lm-icono nombre="chevron_right" [tamano]="22" color="var(--action-primary)" />
    </button>
  `,
  styles: [':host{display:block}'],
})
export class TarjetaEscaneoComponent {
  readonly titulo = input('Escanear el código del documento');
  readonly ayuda = input('Completá los datos automáticamente');
  readonly escaneando = input(false, { transform: booleanAttribute });
  readonly escanear = output<void>();
}

