import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { IconoComponent, BotonComponent } from './basicos';
import { AvisosService } from '../nucleo/servicios/avisos.service';
import {
  CARITAS,
  DefinicionEncuesta,
  PreguntaEncuesta,
  RespuestasEncuesta,
  ValorRespuesta,
  estaRespondida,
  respuestasIniciales,
} from '../nucleo/datos/encuestas';

/**
 * Punto 20 · la encuesta de satisfacción, una pregunta por pantalla.
 *
 * Cinco pasos que entran enteros: la pregunta ocupa la tarjeta entera y su
 * control crece para llenarla; el último, el multiple choice, reparte sus
 * casillas en todo el alto. Lo que falta responder se marca recién al
 * intentar avanzar, nunca antes.
 *
 * Con `soloLectura` es "Mis respuestas": el mismo recorrido, con lo que
 * respondió en esa visita y todos los controles bloqueados.
 */
@Component({
  selector: 'lm-encuesta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, BotonComponent],
  template: `
    <div class="enc" [class.enc--bloqueada]="soloLectura()">
      <span class="enc__paso">Pregunta {{ indice() + 1 }}/{{ definicion().pasos.length }}</span>

      @for (pregunta of paso().preguntas; track pregunta.id) {
        <section
          class="lm-card enc__pregunta"
          [class.enc__pregunta--error]="errores().has(pregunta.id)"
          [class.enc__pregunta--multiple]="pregunta.tipo === 'multiple'"
          [attr.aria-disabled]="soloLectura() || null"
        >
          <b class="enc__titulo">{{ pregunta.titulo }}</b>
          @if (pregunta.opcional) {
            <span class="enc__opcional">{{ pregunta.opcional }}</span>
          }

          @switch (pregunta.tipo) {
            @case ('estrellas') {
              <div class="escala" role="radiogroup" [attr.aria-label]="pregunta.titulo">
                @for (n of cinco; track n) {
                  <button type="button" class="escala__icono" role="radio" [attr.aria-checked]="valor(pregunta) === n"
                    [attr.aria-label]="n + ' de 5'" [disabled]="soloLectura()" (click)="poner(pregunta, n)">
                    <span class="material-symbols-rounded" [class.lleno]="numero(pregunta) >= n">star</span>
                  </button>
                }
              </div>
              <span class="enc__lectura">{{ numero(pregunta) ? caritas[numero(pregunta) - 1].rotulo : 'Tocá una estrella' }}</span>
            }
            @case ('corazones') {
              <div class="escala" role="radiogroup" [attr.aria-label]="pregunta.titulo">
                @for (n of cinco; track n) {
                  <button type="button" class="escala__icono escala__icono--corazon" role="radio"
                    [attr.aria-checked]="valor(pregunta) === n" [attr.aria-label]="n + ' de 5'"
                    [disabled]="soloLectura()" (click)="poner(pregunta, n)">
                    <span class="material-symbols-rounded" [class.lleno]="numero(pregunta) >= n">favorite</span>
                  </button>
                }
              </div>
              <span class="enc__lectura">{{ numero(pregunta) ? caritas[numero(pregunta) - 1].rotulo : 'Tocá un corazón' }}</span>
            }
            @case ('caritas') {
              <div class="caritas" role="radiogroup" [attr.aria-label]="pregunta.titulo">
                @for (c of caritas; track c.icono; let n = $index) {
                  <button type="button" class="carita" role="radio" [class.on]="valor(pregunta) === n + 1"
                    [attr.aria-checked]="valor(pregunta) === n + 1" [disabled]="soloLectura()"
                    (click)="poner(pregunta, n + 1)">
                    <span class="material-symbols-rounded">{{ c.icono }}</span>
                    <small>{{ c.rotulo }}</small>
                  </button>
                }
              </div>
            }
            @case ('deslizador') {
              <div class="deslizador">
                <output class="deslizador__valor">{{ valor(pregunta) }}</output>
                <input type="range" [min]="pregunta.min ?? 1" [max]="pregunta.max ?? 5" [step]="pregunta.paso ?? 1"
                  [value]="valor(pregunta)" [disabled]="soloLectura()" [attr.aria-label]="pregunta.titulo"
                  (input)="poner(pregunta, +$any($event.target).value)" />
                @if (pregunta.extremos) {
                  <span class="deslizador__extremos"><small>{{ pregunta.extremos[0] }}</small><small>{{ pregunta.extremos[1] }}</small></span>
                }
              </div>
            }
            @case ('nps') {
              <!-- Una barra corrediza del 0 al 10, pintada por franja. Hasta que se
                   toca, la perilla está apagada: la pregunta no se da por respondida. -->
              <div class="nps" [class.nps--vacia]="valor(pregunta) === null"
                [attr.data-franja]="valor(pregunta) === null ? null : franja(numero(pregunta))">
                <input type="range" min="0" max="10" step="1" [value]="valor(pregunta) ?? 5"
                  [disabled]="soloLectura()" [attr.aria-label]="pregunta.titulo"
                  [attr.aria-valuetext]="valor(pregunta) === null ? 'Sin elegir' : valor(pregunta) + ' de 10'"
                  (input)="poner(pregunta, +$any($event.target).value)"
                  (click)="poner(pregunta, +$any($event.target).value)" />
                <span class="nps__marcas" aria-hidden="true">
                  @for (n of once; track n) {
                    <span [class.on]="valor(pregunta) === n">{{ n }}</span>
                  }
                </span>
              </div>
              <span class="deslizador__extremos"><small>Nada probable</small><small>Muy probable</small></span>
            }
            @case ('opciones') {
              <div class="opciones" role="radiogroup" [attr.aria-label]="pregunta.titulo">
                @for (o of pregunta.opciones; track o) {
                  <button type="button" class="opcion" role="radio" [class.on]="valor(pregunta) === o"
                    [attr.aria-checked]="valor(pregunta) === o" [disabled]="soloLectura()" (click)="elegir(pregunta, o)">
                    <span class="opcion__punto"></span>{{ o }}
                  </button>
                }
              </div>
            }
            @case ('interruptor') {
              <button type="button" class="llave" role="switch" [class.on]="valor(pregunta) === true"
                [attr.aria-checked]="valor(pregunta) === true" [attr.aria-label]="pregunta.titulo"
                [disabled]="soloLectura()" (click)="poner(pregunta, valor(pregunta) !== true)">
                <span class="llave__pista"><span class="llave__perilla"></span></span>
                <span class="llave__rotulo">{{ valor(pregunta) === true ? 'Sí, se lo recomendaría' : 'No, por ahora no' }}</span>
              </button>
            }
            @case ('sino') {
              <div class="sino">
                <button type="button" class="sino__b" [class.on]="valor(pregunta) === true" [disabled]="soloLectura()"
                  (click)="poner(pregunta, true)">
                  <span class="material-symbols-rounded">thumb_up</span> Sí
                </button>
                <button type="button" class="sino__b sino__b--no" [class.on]="valor(pregunta) === false"
                  [disabled]="soloLectura()" (click)="poner(pregunta, false)">
                  <span class="material-symbols-rounded">thumb_down</span> No
                </button>
              </div>
            }
            @case ('multiple') {
              <span class="enc__ayuda">Podés elegir varias</span>
              <div class="multiple">
                @for (o of pregunta.opciones; track o) {
                  <button type="button" class="marca" role="checkbox" [class.on]="elegida(pregunta, o)"
                    [attr.aria-checked]="elegida(pregunta, o)" [disabled]="soloLectura()" (click)="alternar(pregunta, o)">
                    <span class="marca__caja">
                      @if (elegida(pregunta, o)) {
                        <span class="material-symbols-rounded">check</span>
                      }
                    </span>
                    {{ o }}
                  </button>
                }
              </div>
            }
          }

          @if (errores().has(pregunta.id)) {
            <span class="enc__error">
              <lm-icono nombre="error" [tamano]="16" />
              {{ pregunta.tipo === 'multiple' ? 'Elegí al menos una opción' : 'Respondé esta pregunta para seguir' }}
            </span>
          }
        </section>
      }

      <!-- El avance, justo arriba del botón que lo mueve. -->
      <span class="enc__petalos" aria-hidden="true">
        @for (p of definicion().pasos; track $index) {
          <img src="assets/img/flor-2.png" alt="" [class.on]="$index === indice()" [class.hecho]="$index < indice()" />
        }
      </span>

      <footer class="enc__pie">
        @if (indice() > 0) {
          <button type="button" class="enc__atras" (click)="atras()">
            <lm-icono nombre="arrow_back" [tamano]="18" /> Anterior
          </button>
        }
        @if (!ultimo()) {
          <lm-boton icono="arrow_forward" (presionar)="siguiente()">Siguiente</lm-boton>
        } @else if (soloLectura()) {
          <lm-boton icono="insights" (presionar)="cerrar.emit()">Volver a los resultados</lm-boton>
        } @else {
          <lm-boton variante="success" icono="send" (presionar)="enviar()">Enviar encuesta</lm-boton>
        }
      </footer>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1 1 auto; min-height: 0; }
      .enc { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3); }

      .enc__paso {
        flex: 0 0 auto; text-align: center; font: var(--type-label); font-size: clamp(14px, 4vw, 16px);
        letter-spacing: var(--tracking-label); text-transform: uppercase; color: #FFFFFF;
      }

      /* La pregunta se queda con todo el alto que sobra: nada se desplaza. */
      .enc__pregunta {
        flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; justify-content: center; align-items: stretch;
        gap: var(--space-5); padding: var(--space-5) var(--space-4); border: 2px solid transparent;
      }
      .enc__pregunta--multiple { justify-content: flex-start; gap: var(--space-3); }
      .enc__pregunta--error { border-color: var(--state-error); background: #FFE6E1; }
      .enc__titulo { font: var(--type-section); color: var(--text-title); text-align: center; text-wrap: balance; }
      .enc__pregunta--multiple .enc__titulo { font: var(--type-card-title); text-align: left; }
      .enc__ayuda { font: var(--type-caption); color: var(--text-muted); margin-top: -6px; }
      .enc__opcional { margin-top: calc(var(--space-5) * -1 + 6px); text-align: center; font: var(--type-body-small); color: var(--text-muted); text-wrap: balance; }
      .enc__lectura { align-self: center; font: var(--type-body-small); font-weight: 700; color: var(--text-muted); }
      .enc__error {
        align-self: center; display: inline-flex; align-items: center; gap: 4px;
        font: var(--type-caption); font-weight: 700; color: var(--state-error);
      }

      /* Estrellas y corazones, grandes. */
      .escala { display: flex; justify-content: center; gap: 2px; }
      .escala__icono { flex: 0 1 auto; min-height: 64px; border: none; background: none; cursor: pointer; padding: 0 2px; color: #E6A23C; }
      .escala__icono--corazon { color: var(--action-primary); }
      .escala__icono .material-symbols-rounded { font-size: clamp(46px, 14vw, 58px); font-variation-settings: 'FILL' 0; transition: transform var(--dur-fast) var(--ease-out-soft); }
      .escala__icono .lleno { font-variation-settings: 'FILL' 1; transform: scale(1.06); }

      /* Caritas: cinco fichas altas. */
      .caritas { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
      .carita {
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 96px;
        padding: 8px 2px; border: 2px solid transparent; border-radius: 16px; background: var(--surface-sunken);
        color: var(--text-muted); cursor: pointer;
      }
      .carita .material-symbols-rounded { font-size: clamp(32px, 10vw, 42px); }
      .carita small { font: var(--type-caption); font-size: 11px; white-space: nowrap; }
      .carita.on { border-color: var(--action-primary); background: #FFFFFF; color: var(--action-primary); font-weight: 700; }

      /* Deslizador, con el número bien grande. */
      .deslizador { display: flex; flex-direction: column; gap: 8px; }
      .deslizador__valor { align-self: center; font: 900 clamp(52px, 16vw, 68px)/1 var(--font-numeric); color: var(--action-primary); }
      .deslizador input { width: 100%; accent-color: var(--action-primary); height: 40px; }
      .deslizador__extremos { display: flex; justify-content: space-between; font: var(--type-caption); color: var(--text-muted); }
      .deslizador__extremos small { font: var(--type-body-small); font-weight: 650; color: var(--text-muted); }

      /* Del 0 al 10, una barra corrediza pintada por franja, como el gráfico de
         resultados: rojizo del 0 al 6, ámbar el 7 y el 8, verde el 9 y el 10.
         La perilla toma el color de la franja en la que quedó. */
      .nps { --perilla: 30px; --color: #8F4B00; display: flex; flex-direction: column; gap: 8px; }
      .nps[data-franja='bajo'] { --color: #C0261A; }
      .nps[data-franja='medio'] { --color: #8F4B00; }
      .nps[data-franja='alto'] { --color: #1B7A4C; }
      .nps input { -webkit-appearance: none; appearance: none; width: 100%; height: 40px; margin: 0; background: transparent; cursor: pointer; }
      .nps input::-webkit-slider-runnable-track {
        height: 14px; border-radius: 7px;
        background: linear-gradient(90deg, #E5533F 0%, #E5533F 58%, #E8A23A 66%, #E8A23A 74%, #2FA36B 84%, #2FA36B 100%);
      }
      .nps input::-moz-range-track {
        height: 14px; border-radius: 7px;
        background: linear-gradient(90deg, #E5533F 0%, #E5533F 58%, #E8A23A 66%, #E8A23A 74%, #2FA36B 84%, #2FA36B 100%);
      }
      .nps input::-webkit-slider-thumb {
        -webkit-appearance: none; width: var(--perilla); height: var(--perilla); margin-top: -8px; border-radius: 50%;
        background: #FFFFFF; border: 5px solid var(--color); box-shadow: 0 3px 8px rgba(94, 12, 44, .35);
      }
      .nps input::-moz-range-thumb {
        width: var(--perilla); height: var(--perilla); border-radius: 50%; box-sizing: border-box;
        background: #FFFFFF; border: 5px solid var(--color); box-shadow: 0 3px 8px rgba(94, 12, 44, .35);
      }
      /* Sin tocar todavía: la perilla, apagada en el medio. */
      .nps--vacia input::-webkit-slider-thumb { border-color: #C9B9BF; opacity: .7; }
      .nps--vacia input::-moz-range-thumb { border-color: #C9B9BF; opacity: .7; }
      /* Los números, cada uno debajo de su posición: el primero y el último
         quedan a media perilla de los bordes, como el centro de la perilla. */
      .nps__marcas { display: flex; justify-content: space-between; padding-inline: calc(var(--perilla) / 2 - 10px); }
      .nps__marcas span { width: 20px; text-align: center; font: 700 14px/1 var(--font-numeric); color: var(--text-muted); }
      .nps__marcas span.on { color: var(--color); font-size: 18px; font-weight: 900; }

      /* Una sola opción: una lista de renglones anchos. */
      .opciones { display: flex; flex-direction: column; gap: 8px; }
      .opcion {
        display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 8px 16px; text-align: left;
        border: 2px solid transparent; border-radius: 16px; cursor: pointer;
        background: var(--surface-sunken); color: var(--text-body); font: var(--type-body);
      }
      .opcion__punto { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--text-muted); flex: 0 0 auto; }
      .opcion.on { border-color: var(--action-primary); background: #FFFFFF; color: var(--action-primary); font-weight: 700; }
      .opcion.on .opcion__punto { border-color: var(--action-primary); background: radial-gradient(var(--action-primary) 45%, transparent 50%); }

      /* La llave grande del sí o no. */
      .llave {
        align-self: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
        border: none; background: none; cursor: pointer; padding: 0;
      }
      .llave__pista {
        position: relative; width: 112px; height: 60px; border-radius: 30px; background: var(--surface-sunken);
        box-shadow: inset 0 2px 6px rgba(94, 12, 44, .18); transition: background var(--dur-base) var(--ease-standard);
      }
      .llave__perilla {
        position: absolute; top: 6px; left: 6px; width: 48px; height: 48px; border-radius: 50%; background: #FFFFFF;
        box-shadow: 0 2px 6px rgba(94, 12, 44, .3); transition: transform var(--dur-base) var(--ease-out-soft);
      }
      .llave.on .llave__pista { background: var(--state-success); }
      .llave.on .llave__perilla { transform: translateX(52px); }
      .llave__rotulo { font: var(--type-card-title); color: var(--text-title); }

      /* Sí o no, en dos fichas altas. */
      .sino { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
      .sino__b {
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 120px;
        border: 2px solid transparent; border-radius: 20px; cursor: pointer;
        background: var(--surface-sunken); color: var(--text-title); font: var(--type-section);
      }
      .sino__b .material-symbols-rounded { font-size: 40px; }
      .sino__b.on { background: var(--state-success); color: #FFFFFF; }
      .sino__b--no.on { background: var(--state-error); }

      /* El multiple choice llena el paso: diez casillas en dos columnas que se reparten el alto. */
      .multiple {
        flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: 1fr; gap: 8px;
      }
      .marca {
        display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 6px 10px; text-align: left;
        border: 2px solid transparent; border-radius: 14px; cursor: pointer;
        background: var(--surface-sunken); color: var(--text-body); font: var(--type-body-small);
      }
      .marca__caja {
        flex: 0 0 auto; width: 20px; height: 20px; border-radius: 6px; display: grid; place-items: center;
        border: 2px solid var(--text-muted); background: #FFFFFF; color: #FFFFFF;
      }
      .marca__caja .material-symbols-rounded { font-size: 16px; font-weight: 700; }
      .marca.on { border-color: var(--action-primary); background: #FFFFFF; color: var(--action-primary); font-weight: 700; }
      .marca.on .marca__caja { border-color: var(--action-primary); background: var(--action-primary); }

      /* Bloqueada: se ve tal cual quedó, pero nada responde al toque. */
      .enc--bloqueada .enc__pregunta button:disabled,
      .enc--bloqueada .enc__pregunta input:disabled { cursor: default; opacity: 1; }

      /* Pétalos de avance: el paso actual es más grande, como en los carruseles. */
      .enc__petalos { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 28px; }
      .enc__petalos img { width: 15px; height: 15px; opacity: .5; transition: all var(--dur-base) var(--ease-standard); }
      .enc__petalos img.hecho { opacity: .9; }
      .enc__petalos img.on { width: 28px; height: 28px; opacity: 1; filter: drop-shadow(0 1px 2px rgba(94, 12, 44, .45)); }

      .enc__pie { flex: 0 0 auto; display: flex; align-items: center; gap: var(--space-3); }
      .enc__pie lm-boton { flex: 1 1 auto; }
      .enc__atras {
        flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px; min-height: var(--touch-min);
        padding: 0 var(--space-3); border: 1.5px solid rgba(255, 255, 255, .6); border-radius: var(--radius-field);
        background: transparent; color: #FFFFFF; font: var(--type-button); cursor: pointer;
      }
    `,
  ],
})
export class EncuestaComponent {
  private readonly avisos = inject(AvisosService);

  readonly definicion = input.required<DefinicionEncuesta>();
  /** Lo que ya respondió: en "Mis respuestas", todo; respondiendo, nada. */
  readonly respuestas = input<RespuestasEncuesta | null>(null);
  readonly soloLectura = input(false, { transform: booleanAttribute });
  /** Terminó el último paso con todo respondido. */
  readonly terminar = output<RespuestasEncuesta>();
  /** En "Mis respuestas", el último paso vuelve a los resultados. */
  readonly cerrar = output<void>();

  protected readonly cinco = [1, 2, 3, 4, 5];
  protected readonly once = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected readonly caritas = CARITAS;

  protected readonly indice = signal(0);
  protected readonly valores = signal<RespuestasEncuesta>({});
  /** Preguntas sin responder del paso, marcadas recién al intentar avanzar. */
  protected readonly errores = signal<Set<string>>(new Set());

  protected readonly paso = computed(() => this.definicion().pasos[this.indice()]);
  protected readonly ultimo = computed(() => this.indice() === this.definicion().pasos.length - 1);

  constructor() {
    effect(() => {
      this.valores.set({ ...respuestasIniciales(this.definicion()), ...(this.respuestas() ?? {}) });
      this.indice.set(0);
      this.errores.set(new Set());
    });
  }

  /** La franja de la escala del 0 al 10, la misma del gráfico de resultados. */
  protected franja(n: number): 'bajo' | 'medio' | 'alto' {
    return n >= 9 ? 'alto' : n >= 7 ? 'medio' : 'bajo';
  }

  protected valor(pregunta: PreguntaEncuesta): ValorRespuesta {
    return this.valores()[pregunta.id] ?? null;
  }

  protected numero(pregunta: PreguntaEncuesta): number {
    return Number(this.valor(pregunta)) || 0;
  }

  protected elegida(pregunta: PreguntaEncuesta, opcion: string): boolean {
    const v = this.valor(pregunta);
    return Array.isArray(v) && v.includes(opcion);
  }

  protected poner(pregunta: PreguntaEncuesta, valor: ValorRespuesta): void {
    if (this.soloLectura()) return;
    this.valores.update((v) => ({ ...v, [pregunta.id]: valor }));
    if (this.errores().has(pregunta.id)) {
      this.errores.update((e) => {
        const siguiente = new Set(e);
        siguiente.delete(pregunta.id);
        return siguiente;
      });
    }
  }

  /** En la opcional, tocar de nuevo lo elegido lo desmarca: puede quedar sin responder. */
  protected elegir(pregunta: PreguntaEncuesta, opcion: string): void {
    this.poner(pregunta, pregunta.opcional && this.valor(pregunta) === opcion ? null : opcion);
  }

  protected alternar(pregunta: PreguntaEncuesta, opcion: string): void {
    const actuales = (this.valor(pregunta) as string[] | null) ?? [];
    this.poner(pregunta, actuales.includes(opcion) ? actuales.filter((o) => o !== opcion) : [...actuales, opcion]);
  }

  protected atras(): void {
    this.errores.set(new Set());
    this.indice.update((i) => Math.max(0, i - 1));
  }

  protected siguiente(): void {
    if (!this.soloLectura() && !this.pasoCompleto()) return;
    this.indice.update((i) => Math.min(this.definicion().pasos.length - 1, i + 1));
  }

  protected enviar(): void {
    if (!this.pasoCompleto()) return;
    this.terminar.emit(this.valores());
  }

  /** Marca lo que falta del paso actual; si no falta nada, deja avanzar. */
  private pasoCompleto(): boolean {
    const faltan = this.paso()
      .preguntas.filter((p) => !estaRespondida(p, this.valores()[p.id]))
      .map((p) => p.id);
    this.errores.set(new Set(faltan));
    if (faltan.length) {
      this.avisos.error('Te falta responder', 'Elegí una respuesta para seguir.');
      return false;
    }
    return true;
  }
}
