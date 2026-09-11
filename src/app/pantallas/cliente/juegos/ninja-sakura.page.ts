import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { UI } from '../../../ui';
import { PaginaConSesion } from '../../pagina-base';
import { EsperaService } from '../../../nucleo/servicios/espera.service';
import { SonidoService } from '../../../nucleo/servicios/sonido.service';
import { PedidosService } from '../../../nucleo/servicios/pedidos.service';

/** Una flor cayendo por la cancha. Las posiciones van en píxeles de la cancha. */
interface Flor {
  id: number;
  x: number;
  y: number;
  /** Píxeles por segundo. */
  caida: number;
  /** Vaivén horizontal, para que no caigan en línea recta. */
  fase: number;
  vaiven: number;
  tam: number;
  giro: number;
  velGiro: number;
  imagen: string;
}

type Estado = 'LISTO' | 'JUGANDO' | 'GANADO' | 'PERDIDO';

/** Cuántas flores hay que atrapar y en cuánto tiempo. */
const OBJETIVO = 30;
const SEGUNDOS = 15;
const CADENCIA = 235;
const IMAGENES = ['assets/img/flor-1.png', 'assets/img/flor-2.png', 'assets/img/flor-3.png'];

/**
 * Minijuego · Ninja de Sakura.
 *
 * Caen flores de sakura por la cancha y hay que tocarlas antes de que lleguen abajo.
 * Se gana atrapando treinta en quince segundos.
 */
@Component({
  selector: 'lm-ninja-sakura',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Ninja de Sakura" conVolver (volver)="salir()" />

      <div class="lm-body lm-body--fijo lm-body--gap12">
        <div class="marcador">
          <div class="marcador__dato">
            <span class="marcador__rotulo">Atrapadas</span>
            <span class="marcador__valor">{{ atrapadas() }}<small>/{{ objetivo }}</small></span>
          </div>
          <div class="marcador__barra" aria-hidden="true">
            <span [style.width.%]="avance()"></span>
          </div>
          <div class="marcador__dato" [class.marcador__dato--poco]="restante() <= 5">
            <span class="marcador__rotulo">Tiempo</span>
            <span class="marcador__valor">{{ restante() }}<small>s</small></span>
          </div>
        </div>

        <div #cancha class="cancha">
          <svg class="paisaje" viewBox="0 0 375 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#FFE2D4" />
                <stop offset="34%" stop-color="#FFD5D6" />
                <stop offset="72%" stop-color="#FFC6D6" />
                <stop offset="100%" stop-color="#FFB2C7" />
              </linearGradient>
              <linearGradient id="agua" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#F2AEC4" />
                <stop offset="100%" stop-color="#FFD3DF" />
              </linearGradient>
              <radialGradient id="resplandor" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FF7665" stop-opacity=".42" />
                <stop offset="100%" stop-color="#FF7665" stop-opacity="0" />
              </radialGradient>
            </defs>

            <rect width="375" height="560" fill="url(#cielo)" />

            <circle cx="256" cy="152" r="128" fill="url(#resplandor)" />
            <circle cx="256" cy="152" r="54" fill="#FF7665" opacity=".82" />

            <g stroke="#FE666F" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".55">
              <path d="M74 128 q11 -9 21 0" />
              <path d="M95 128 q11 -9 21 0" />
              <path d="M120 168 q8 -7 16 0" />
              <path d="M136 168 q8 -7 16 0" />
            </g>

            <path d="M-40 336 Q40 300 92 224 Q100 213 108 224 Q150 292 214 336 Z" fill="#E07390" opacity=".46" />
            <path d="M60 336 Q160 296 214 178 Q224 158 234 178 Q292 296 400 336 Z" fill="#F093A8" opacity=".86" />
            <path
              d="M196 214 Q214 172 224 160 Q234 172 252 214 Q243 205 236 213 Q228 222 220 210 Q210 200 204 212 Q200 216 196 214 Z"
              fill="#FFF4F7"
              opacity=".92"
            />

            <path d="M0 336 H375 V560 H0 Z" fill="url(#agua)" />
            <path d="M0 336 Q90 328 180 336 Q270 344 375 334 V346 H0 Z" fill="#DA5279" opacity=".26" />
            <g fill="#FF7665" opacity=".3">
              <path d="M232 356 h50 q-6 7 -50 7 Z" />
              <path d="M240 372 h36 q-5 6 -36 6 Z" />
              <path d="M246 388 h26 q-4 5 -26 5 Z" />
            </g>
            <g stroke="#DA5279" stroke-width="3" stroke-linecap="round" opacity=".22">
              <path d="M28 392 H104" />
              <path d="M232 378 H316" />
              <path d="M64 452 H150" />
              <path d="M214 486 H310" />
              <path d="M44 520 H118" />
            </g>

            <g fill="#FE666F" opacity=".64">
              <path d="M84 300 h72 v7 h-72 Z" />
              <path d="M78 292 q42 -9 84 0 v8 q-42 -8 -84 0 Z" />
              <path d="M96 307 h8 v52 h-8 Z" />
              <path d="M136 307 h8 v52 h-8 Z" />
              <path d="M92 318 h56 v6 h-56 Z" />
            </g>
          </svg>

          @for (flor of flores(); track flor.id) {
            <button
              type="button"
              class="flor"
              aria-label="Atrapar la flor"
              [style.transform]="'translate3d(' + flor.x + 'px,' + flor.y + 'px,0) rotate(' + flor.giro + 'deg)'"
              [style.width.px]="flor.tam"
              [style.height.px]="flor.tam"
              (pointerdown)="atrapar(flor.id)"
            >
              <img [src]="flor.imagen" alt="" [width]="flor.tam" [height]="flor.tam" />
            </button>
          }

          @if (estado() !== 'JUGANDO') {
            <div class="tapa">
              <div class="tapa__ficha">
                <span class="tapa__icono">
                  <lm-icono [nombre]="iconoTapa()" [tamano]="34" color="var(--action-primary)" />
                </span>
                <span class="tapa__titulo">{{ tituloTapa() }}</span>
                <span class="tapa__texto">{{ textoTapa() }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="lm-actionbar">
        @if (estado() === 'JUGANDO') {
          <lm-boton icono="close" variante="secondary" (presionar)="salir()">Dejar el juego</lm-boton>
        } @else {
          <lm-boton [icono]="estado() === 'LISTO' ? 'play_arrow' : 'replay'" (presionar)="empezar()">
            {{ estado() === 'LISTO' ? 'Empezar a jugar' : 'Jugar de nuevo' }}
          </lm-boton>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }

      .marcador {
        flex: 0 0 auto;
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px; border-radius: var(--radius-card);
        background: var(--surface-card); box-shadow: var(--shadow-card);
      }
      .marcador__dato { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 62px; }
      .marcador__rotulo {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-muted);
      }
      .marcador__valor { font: var(--type-price); color: var(--action-primary); }
      .marcador__valor small { font-size: 13px; }
      .marcador__dato--poco .marcador__valor { color: var(--state-error); }
      .marcador__barra {
        flex: 1 1 auto; height: 10px; border-radius: var(--radius-pill);
        background: var(--surface-sunken); overflow: hidden;
      }
      .marcador__barra span {
        display: block; height: 100%; border-radius: var(--radius-pill);
        background: var(--action-primary); transition: width var(--dur-fast) var(--ease-standard);
      }

      .cancha {
        flex: 1 1 auto; min-height: 0; position: relative; overflow: hidden;
        border-radius: var(--radius-card); box-shadow: var(--shadow-raised);
        background: var(--surface-card);
        touch-action: manipulation;
      }
      .paisaje { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

      .flor {
        position: absolute; top: 0; left: 0; padding: 0; border: 0; background: none;
        cursor: pointer; will-change: transform; touch-action: manipulation;
        filter: drop-shadow(0 2px 4px rgba(59, 8, 27, .22));
      }
      .flor img { display: block; width: 100%; height: 100%; pointer-events: none; }

      .tapa {
        position: absolute; inset: 0; display: flex;
        align-items: center; justify-content: center; padding: 18px;
        background: linear-gradient(160deg, rgba(255, 118, 101, .42), rgba(253, 82, 124, .34));
        border-radius: var(--radius-card);
      }
      .tapa__ficha {
        display: flex; flex-direction: column; align-items: center; gap: 7px;
        padding: 20px 22px; max-width: 32ch; text-align: center;
        border-radius: var(--radius-card); background: var(--surface-card);
        box-shadow: var(--shadow-raised);
      }
      .tapa__icono {
        width: 62px; height: 62px; border-radius: var(--radius-pill);
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--surface-sunken);
      }
      .tapa__titulo { font: var(--type-section); color: var(--text-title); text-wrap: balance; }
      .tapa__texto { font: var(--type-body-small); color: var(--text-muted); text-wrap: pretty; }
    `,
  ],
})
export class NinjaSakuraPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly sonido = inject(SonidoService);
  private readonly pedidos = inject(PedidosService);
  private readonly cancha = viewChild.required<ElementRef<HTMLElement>>('cancha');

  protected readonly objetivo = OBJETIVO;
  protected readonly estado = signal<Estado>('LISTO');
  protected readonly atrapadas = signal(0);
  protected readonly restante = signal(SEGUNDOS);
  protected readonly flores = signal<Flor[]>([]);

  protected readonly avance = computed(() => Math.min(100, (this.atrapadas() / OBJETIVO) * 100));

  private cuadro = 0;
  private anterior = 0;
  private desdeLaUltima = 0;
  private milisegundos = 0;
  private siguienteId = 1;
  private ancho = 0;
  private alto = 0;

  private readonly entradaEnLista = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.espera.activaDe(id) : undefined;
  });

  constructor() {
    super();
    this.espera.iniciar();
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  protected empezar(): void {
    this.medirCancha();
    this.atrapadas.set(0);
    this.restante.set(SEGUNDOS);
    this.flores.set([]);
    this.milisegundos = 0;
    this.desdeLaUltima = CADENCIA;
    this.anterior = 0;
    this.estado.set('JUGANDO');
    this.detener();
    this.cuadro = requestAnimationFrame((ahora) => this.animar(ahora));
  }

  protected atrapar(id: number): void {
    if (this.estado() !== 'JUGANDO') return;
    const antes = this.flores();
    const quedan = antes.filter((flor) => flor.id !== id);
    if (quedan.length === antes.length) return;

    this.flores.set(quedan);
    const total = this.atrapadas() + 1;
    this.atrapadas.set(total);
    if (total >= OBJETIVO) this.terminar('GANADO');
  }

  protected async salir(): Promise<void> {
    if (this.estado() === 'JUGANDO') {
      this.detener();
      const seguro = await this.preguntar({
        titulo: '¿Dejás el juego?',
        mensaje: `Vas ${this.atrapadas()} de ${OBJETIVO} flores y se pierde lo que llevás jugado. El reloj está frenado.`,
        confirmar: 'Salir',
        cancelar: 'Reanudar',
        tono: 'peligro',
        icono: 'close',
      });
      if (!seguro) {
        this.reanudar();
        return;
      }
      this.estado.set('LISTO');
      this.flores.set([]);
    }
    this.ir(['/cliente/juegos']);
  }

  private reanudar(): void {
    if (this.estado() !== 'JUGANDO' || this.cuadro) return;
    this.anterior = 0;
    this.cuadro = requestAnimationFrame((ahora) => this.animar(ahora));
  }

  protected iconoTapa(): string {
    const estado = this.estado();
    if (estado === 'GANADO') return 'emoji_events';
    if (estado === 'PERDIDO') return 'timer_off';
    return 'local_florist';
  }

  protected tituloTapa(): string {
    const estado = this.estado();
    if (estado === 'GANADO') return '¡Ganaste!';
    if (estado === 'PERDIDO') return 'Se acabó el tiempo';
    return 'Atrapá las flores que caen';
  }

  protected textoTapa(): string {
    const estado = this.estado();
    if (estado === 'GANADO') return `Atrapaste las ${OBJETIVO} flores antes de que se acabara el tiempo.`;
    if (estado === 'PERDIDO') return `Llegaste a ${this.atrapadas()} de ${OBJETIVO} flores. Probá de nuevo.`;
    return `Tocá ${OBJETIVO} flores de sakura en ${SEGUNDOS} segundos. Cada una que tocás suma un punto y desaparece.`;
  }

  private animar(ahora: number): void {
    if (this.estado() !== 'JUGANDO') return;

    const delta = this.anterior ? Math.min(64, ahora - this.anterior) : 16;
    this.anterior = ahora;
    this.milisegundos += delta;

    const segundos = Math.max(0, SEGUNDOS - Math.floor(this.milisegundos / 1000));
    if (segundos !== this.restante()) this.restante.set(segundos);

    this.desdeLaUltima += delta;
    const flores = this.flores()
      .map((flor) => this.mover(flor, delta))
      .filter((flor) => flor.y < this.alto);

    if (this.desdeLaUltima >= CADENCIA) {
      this.desdeLaUltima = 0;
      flores.push(this.nueva());
    }
    this.flores.set(flores);

    if (segundos === 0) {
      this.terminar('PERDIDO');
      return;
    }
    this.cuadro = requestAnimationFrame((siguiente) => this.animar(siguiente));
  }

  private mover(flor: Flor, delta: number): Flor {
    const fase = flor.fase + delta / 460;
    return {
      ...flor,
      fase,
      y: flor.y + (flor.caida * delta) / 1000,
      x: flor.x + Math.sin(fase) * flor.vaiven * (delta / 1000),
      giro: flor.giro + (flor.velGiro * delta) / 1000,
    };
  }

  private nueva(): Flor {
    const tam = 42 + Math.round(Math.random() * 20);
    return {
      id: this.siguienteId++,
      x: entre(8, Math.max(8, this.ancho - tam - 8)),
      y: -tam,
      caida: 96 + Math.random() * 74,
      fase: Math.random() * Math.PI * 2,
      vaiven: 18 + Math.random() * 26,
      tam,
      giro: Math.random() * 360,
      velGiro: (Math.random() - 0.5) * 90,
      imagen: IMAGENES[Math.floor(Math.random() * IMAGENES.length)],
    };
  }

  private terminar(estado: Estado): void {
    this.detener();
    this.estado.set(estado);
    this.flores.set([]);
    if (estado === 'GANADO') {
      this.sonido.reproducir('exito');
      this.avisos.exito('¡Ninja de sakura!', `Atrapaste ${OBJETIVO} flores en menos de ${SEGUNDOS} segundos.`);
    } else {
      this.avisos.error('Se acabó el tiempo', `Te faltaron ${OBJETIVO - this.atrapadas()} flores. Probá de nuevo.`);
    }
    this.consumirIntentoSiAplica(estado === 'GANADO');
  }

  private consumirIntentoSiAplica(gano: boolean): void {
    const usuario = this.usuario();
    if (!usuario || !this.sesion.tienePerfil('CLIENTE_REGISTRADO')) return;
    const pedido = this.pedidos.activoDe(usuario.id);
    if (!pedido || !this.pedidos.juegosHabilitados(pedido) || pedido.juegoIntentado) return;

    const descuento = gano ? 20 : 0;
    void this.pedidos.jugar(pedido, usuario, descuento).then((pct) => {
      if (pct > 0) {
        this.avisos.exito('¡Premio obtenido!', `¡Felicitaciones! Ganaste un ${pct}% de descuento en tu pedido.`);
      } else {
        this.avisos.info('Intento registrado', 'Esta vez no hubo descuento para este pedido.');
      }
    }).catch(() => undefined);
  }

  private detener(): void {
    if (this.cuadro) cancelAnimationFrame(this.cuadro);
    this.cuadro = 0;
  }

  private medirCancha(): void {
    const nodo = this.cancha().nativeElement;
    this.ancho = nodo.clientWidth;
    this.alto = nodo.clientHeight;
  }
}

function entre(desde: number, hasta: number): number {
  return Math.round(desde + Math.random() * Math.max(0, hasta - desde));
}
