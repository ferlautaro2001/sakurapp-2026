import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { IconoComponent } from './basicos';
import { Porcion, PuntoSerie } from '../nucleo/servicios/encuestas.service';

/**
 * Gráficos estadísticos de la aplicación.
 *
 * Van dibujados a mano en SVG, sin librería: son tres formas simples y así el
 * paquete no crece ni se rompe el estilo del resto. Los tres viven adentro de
 * una tarjeta nieve, con el color y la tipografía del sistema de diseño.
 */

/** Gráfico de torta (anillo), con la leyenda debajo y el total en el centro. */
@Component({
  selector: 'lm-grafico-torta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="sk-grafico">
      <figcaption class="sk-grafico__titulo">{{ titulo() }}</figcaption>
      @if (bajada()) {
        <p class="sk-grafico__bajada">{{ bajada() }}</p>
      }

      <div class="sk-torta">
        <svg viewBox="0 0 120 120" role="img" [attr.aria-label]="descripcion()">
          @for (arco of arcos(); track arco.rotulo) {
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              [attr.stroke]="arco.color"
              stroke-width="22"
              [attr.stroke-dasharray]="arco.largo + ' ' + (283 - arco.largo)"
              [attr.stroke-dashoffset]="arco.desde"
              transform="rotate(-90 60 60)"
            />
          }
        </svg>
        <span class="sk-torta__centro">
          <b>{{ total() }}</b>
          <small>respuestas</small>
        </span>
      </div>

      <ul class="sk-leyenda">
        @for (porcion of porciones(); track porcion.rotulo) {
          <li>
            <i [style.background]="porcion.color"></i>
            <span class="sk-leyenda__rotulo">{{ porcion.rotulo }}</span>
            <b>{{ porcentaje(porcion.valor) }} %</b>
          </li>
        }
      </ul>
    </figure>
  `,
  styles: [':host{display:block}'],
})
export class GraficoTortaComponent {
  readonly titulo = input.required<string>();
  readonly bajada = input<string | null>(null);
  readonly porciones = input.required<Porcion[]>();

  protected readonly total = computed(() => this.porciones().reduce((t, p) => t + p.valor, 0));

  /** Perímetro del anillo de radio cuarenta y cinco, redondeado. */
  private readonly perimetro = 283;

  protected readonly arcos = computed(() => {
    const total = this.total() || 1;
    let acumulado = 0;
    return this.porciones().map((porcion) => {
      const largo = (porcion.valor / total) * this.perimetro;
      const arco = { ...porcion, largo, desde: -acumulado };
      acumulado += largo;
      return arco;
    });
  });

  protected porcentaje(valor: number): number {
    return Math.round((valor / (this.total() || 1)) * 100);
  }

  protected descripcion(): string {
    return `${this.titulo()}: ${this.porciones().map((p) => `${p.rotulo}, ${p.valor}`).join('; ')}`;
  }
}

/** Gráfico de barras verticales, con el valor arriba de cada barra. */
@Component({
  selector: 'lm-grafico-barras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="sk-grafico">
      <figcaption class="sk-grafico__titulo">{{ titulo() }}</figcaption>
      @if (bajada()) {
        <p class="sk-grafico__bajada">{{ bajada() }}</p>
      }

      <div class="sk-barras">
        @for (punto of puntos(); track punto.rotulo) {
          <div class="sk-barras__columna">
            <span class="sk-barras__valor">{{ punto.valor }}</span>
            <span class="sk-barras__pista">
              <span class="sk-barras__hueco" [style.flex-grow]="maximo() - punto.valor"></span>
              <span class="sk-barras__barra" [style.flex-grow]="punto.valor"></span>
            </span>
            <span class="sk-barras__rotulo">{{ punto.rotulo }}</span>
          </div>
        }
      </div>
    </figure>
  `,
  styles: [':host{display:block}'],
})
export class GraficoBarrasComponent {
  readonly titulo = input.required<string>();
  readonly bajada = input<string | null>(null);
  readonly puntos = input.required<PuntoSerie[]>();

  /**
   * La barra no se dibuja con un alto en porcentaje sino repartiendo el
   * espacio con `flex-grow` contra un hueco: así descuenta sola lo que ocupan
   * el número de arriba y el rótulo de abajo, y nunca se sale de la tarjeta.
   */
  protected readonly maximo = computed(() => Math.max(1, ...this.puntos().map((p) => p.valor)));
}

/** Gráfico lineal: una serie con sus puntos marcados. */
@Component({
  selector: 'lm-grafico-linea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="sk-grafico">
      <figcaption class="sk-grafico__titulo">{{ titulo() }}</figcaption>
      @if (bajada()) {
        <p class="sk-grafico__bajada">{{ bajada() }}</p>
      }

      <svg class="sk-linea" viewBox="0 0 300 160" preserveAspectRatio="none" role="img" [attr.aria-label]="descripcion()">
        @for (guia of guias; track guia) {
          <line x1="0" [attr.y1]="guia" x2="300" [attr.y2]="guia" stroke="var(--border-field)" stroke-width="1" />
        }
        <polyline
          [attr.points]="linea()"
          fill="none"
          stroke="var(--action-primary)"
          stroke-width="3"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
        @for (punto of coordenadas(); track punto.rotulo) {
          <circle [attr.cx]="punto.x" [attr.cy]="punto.y" r="5" fill="var(--action-primary)" />
        }
      </svg>

      <ul class="sk-linea__pie">
        @for (punto of puntos(); track punto.rotulo) {
          <li>
            <b>{{ punto.valor }}</b>
            <small>{{ punto.rotulo }}</small>
          </li>
        }
      </ul>
    </figure>
  `,
  styles: [':host{display:block}'],
})
export class GraficoLineaComponent {
  readonly titulo = input.required<string>();
  readonly bajada = input<string | null>(null);
  readonly puntos = input.required<PuntoSerie[]>();
  /** Escala fija: los puntajes van del uno al cinco. */
  readonly minimo = input(1, { transform: numberAttribute });
  readonly maximo = input(5, { transform: numberAttribute });

  protected readonly guias = [20, 60, 100, 140];

  protected readonly coordenadas = computed(() => {
    const lista = this.puntos();
    const paso = lista.length > 1 ? 280 / (lista.length - 1) : 0;
    const rango = Math.max(0.01, this.maximo() - this.minimo());
    return lista.map((punto, i) => ({
      rotulo: punto.rotulo,
      x: 10 + paso * i,
      y: 150 - ((punto.valor - this.minimo()) / rango) * 140,
    }));
  });

  protected linea(): string {
    return this.coordenadas().map((p) => `${p.x},${p.y}`).join(' ');
  }

  protected descripcion(): string {
    return `${this.titulo()}: ${this.puntos().map((p) => `${p.rotulo}, ${p.valor}`).join('; ')}`;
  }
}

/**
 * Diapositivas horizontales.
 *
 * Los resultados de las encuestas no se leen de corrido hacia abajo: se pasan
 * de a uno, como las fotos de un producto. Los pétalos de abajo dicen en cuál
 * estás parado y también sirven de atajo.
 */
@Component({
  selector: 'lm-diapositivas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    <div class="sk-diapos" [class.sk-diapos--alto]="alto()">
      <div class="sk-diapos__pista" #pista (scroll)="alDesplazar()">
        <ng-content />
      </div>

      <div class="sk-diapos__pie">
        <button
          type="button"
          class="sk-diapos__flecha"
          aria-label="Ver el gráfico anterior"
          [disabled]="indice() === 0"
          (click)="mover(-1)"
        >
          <lm-icono nombre="chevron_left" [tamano]="22" />
        </button>

        <span class="sk-diapos__flores">
          @for (etiqueta of etiquetas(); track etiqueta; let i = $index) {
            <button
              type="button"
              class="sk-flor"
              [class.on]="i === indice()"
              [attr.aria-current]="i === indice() ? 'true' : null"
              [attr.aria-label]="'Ver ' + etiqueta + ' · ' + (i + 1) + ' de ' + etiquetas().length"
              (click)="irA(i)"
            >
              <img src="assets/img/flor-2.png" alt="" />
            </button>
          }
        </span>

        <button
          type="button"
          class="sk-diapos__flecha"
          aria-label="Ver el gráfico siguiente"
          [disabled]="indice() >= etiquetas().length - 1"
          (click)="mover(1)"
        >
          <lm-icono nombre="chevron_right" [tamano]="22" />
        </button>
      </div>

    </div>
  `,
  styles: [':host{display:flex;flex-direction:column;min-height:0}'],
})
export class DiapositivasComponent {
  private readonly pista = viewChild.required<ElementRef<HTMLDivElement>>('pista');

  /** Un rótulo por diapositiva: dan el nombre accesible de cada pétalo. */
  readonly etiquetas = input.required<string[]>();

  /**
   * Cuando está en `true` las diapositivas ocupan todo el alto que les deja el
   * contenedor, en vez de crecer con su contenido. Es lo que permite que la
   * pantalla entre entera y no haya que desplazarse.
   */
  readonly alto = input(false, { transform: booleanAttribute });

  protected readonly indice = signal(0);

  protected alDesplazar(): void {
    const el = this.pista().nativeElement;
    this.indice.set(Math.round(el.scrollLeft / this.paso()));
  }

  protected irA(posicion: number): void {
    this.pista().nativeElement.scrollTo({ left: posicion * this.paso(), behavior: 'smooth' });
  }

  protected mover(salto: number): void {
    const ultimo = this.etiquetas().length - 1;
    this.irA(Math.max(0, Math.min(ultimo, this.indice() + salto)));
  }

  /**
   * Ancho de una diapositiva más su separación. Se saca del alto total y no
   * del ancho visible para que la separación entre diapositivas no corra la
   * cuenta.
   */
  private paso(): number {
    const el = this.pista().nativeElement;
    return Math.max(1, el.scrollWidth / Math.max(1, this.etiquetas().length));
  }
}
