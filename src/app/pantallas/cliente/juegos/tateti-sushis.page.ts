import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { UI } from '../../../ui';
import { PaginaConSesion } from '../../pagina-base';
import { EsperaService } from '../../../nucleo/servicios/espera.service';
import { SonidoService } from '../../../nucleo/servicios/sonido.service';
import { PedidosService } from '../../../nucleo/servicios/pedidos.service';
import { Sushi, SUSHIS, alAzar, imagenDe, mezclar } from './sushis';

/** Quién ocupa un casillero. */
type Ficha = 'VOS' | 'MAQUINA' | null;

type Estado = 'LISTO' | 'JUGANDO' | 'GANASTE' | 'PERDISTE' | 'EMPATE';

/** Las ocho líneas que ganan: tres filas, tres columnas y dos diagonales. */
const LINEAS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** Cuánto se toma la máquina para poner su pieza, en milisegundos. */
const PIENSA = 720;

/**
 * Minijuego · Tateti de sushis.
 */
@Component({
  selector: 'lm-tateti-sushis',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Tateti de sushis" conVolver (volver)="salir()" />

      <div class="lm-body lm-body--fijo lm-body--gap12">
        <div class="marcador">
          <div class="jugador" [class.jugador--turno]="estado() === 'JUGANDO' && turno() === 'VOS'">
            <img [src]="imagen(sushiVos())" alt="" width="40" height="40" />
            <span class="jugador__texto">
              <span class="jugador__nombre">Vos</span>
              <span class="jugador__pieza">{{ sushiVos().nombre }}</span>
            </span>
            @if (estado() === 'JUGANDO' && turno() === 'VOS') {
              <lm-chip estado="libre">Tu turno</lm-chip>
            }
          </div>
          <div class="jugador" [class.jugador--turno]="estado() === 'JUGANDO' && turno() === 'MAQUINA'">
            <img [src]="imagen(sushiMaquina())" alt="" width="40" height="40" />
            <span class="jugador__texto">
              <span class="jugador__nombre">Máquina</span>
              <span class="jugador__pieza">{{ sushiMaquina().nombre }}</span>
            </span>
            @if (estado() === 'JUGANDO' && turno() === 'MAQUINA') {
              <lm-chip estado="reservada">Piensa</lm-chip>
            }
          </div>
        </div>

        <div class="tablero">
          <img class="flor flor--1" src="assets/img/flor-1.png" alt="" width="120" height="120" />
          <img class="flor flor--2" src="assets/img/flor-2.png" alt="" width="120" height="120" />
          <img class="flor flor--3" src="assets/img/flor-3.png" alt="" width="120" height="120" />

          <div class="grilla">
            @for (ficha of tablero(); track $index) {
              <button
                type="button"
                class="celda"
                [class.celda--gana]="ganadoras().includes($index)"
                [attr.aria-label]="rotulo($index, ficha)"
                [disabled]="!sePuedeJugar($index)"
                (click)="jugar($index)"
              >
                @if (ficha) {
                  <img [src]="imagen(ficha === 'VOS' ? sushiVos() : sushiMaquina())" alt="" width="70" height="70" />
                } @else if ($index === 4) {
                  <img class="celda__marca" src="assets/img/logo-badge.png" alt="" width="70" height="70" />
                }
              </button>
            }
          </div>

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

        <p class="pie">{{ pie() }}</p>
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
        display: flex; flex-direction: column; gap: 8px;
        padding: 10px 12px; border-radius: var(--radius-card);
        background: var(--surface-card); box-shadow: var(--shadow-card);
      }
      .jugador {
        display: flex; align-items: center; gap: 10px;
        padding: 5px 8px; border-radius: var(--radius-field);
        border: 2px solid transparent;
      }
      .jugador--turno { border-color: var(--action-primary); background: var(--surface-sunken); }
      .jugador__texto { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
      .jugador__nombre { font: var(--type-card-title); color: var(--text-title); }
      .jugador__pieza { font: var(--type-caption); color: var(--text-muted); text-wrap: pretty; }
      .jugador__pieza::first-letter { text-transform: uppercase; }

      .tablero {
        flex: 1 1 auto; min-height: 0; position: relative;
        display: flex; align-items: center; justify-content: center; padding: 12px;
        border-radius: var(--radius-card); box-shadow: var(--shadow-raised);
        background: linear-gradient(160deg, var(--surface-card), var(--surface-sunken));
        overflow: hidden;
        container-type: size;
      }
      .flor { position: absolute; width: 38%; height: auto; opacity: .34; }
      .flor--1 { top: -6%; left: -8%; }
      .flor--2 { bottom: -8%; right: -7%; }
      .flor--3 { top: 42%; right: -12%; width: 30%; opacity: .26; }

      .grilla {
        position: relative;
        display: grid; gap: 8px;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        width: 100%;
        width: min(100%, 100cqh);
        aspect-ratio: 1;
      }
      .celda {
        min-width: 0; min-height: 0; padding: 4px; border: 0; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        border-radius: var(--radius-thumb);
        background: rgba(255, 255, 255, .58);
        box-shadow: inset 0 0 0 1px var(--border-card);
      }
      .celda[disabled] { cursor: default; }
      .celda img { width: 82%; height: auto; }
      .celda .celda__marca { width: 78%; border-radius: 22%; opacity: .34; }
      .celda--gana {
        background: var(--surface-card);
        box-shadow: inset 0 0 0 3px var(--action-primary);
      }

      .pie {
        flex: 0 0 auto; margin: 0; text-align: center;
        font: var(--type-body-small); color: var(--text-sobre-fondo); text-wrap: pretty;
      }

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
export class TatetiSushisPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly sonido = inject(SonidoService);
  private readonly pedidos = inject(PedidosService);

  protected readonly estado = signal<Estado>('LISTO');
  protected readonly tablero = signal<Ficha[]>(Array<Ficha>(9).fill(null));
  protected readonly turno = signal<'VOS' | 'MAQUINA'>('VOS');
  protected readonly ganadoras = signal<number[]>([]);

  private readonly piezas = signal<[Sushi, Sushi]>(this.sortearPiezas());
  protected readonly sushiVos = computed(() => this.piezas()[0]);
  protected readonly sushiMaquina = computed(() => this.piezas()[1]);

  private pensando = 0;

  constructor() {
    super();
    this.espera.iniciar();
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  protected empezar(): void {
    this.detener();
    this.piezas.set(this.sortearPiezas());
    this.tablero.set(Array<Ficha>(9).fill(null));
    this.ganadoras.set([]);
    this.turno.set(Math.random() < 0.5 ? 'VOS' : 'MAQUINA');
    this.estado.set('JUGANDO');
    if (this.turno() === 'MAQUINA') this.pensarJugada();
  }

  protected sePuedeJugar(casillero: number): boolean {
    return this.estado() === 'JUGANDO' && this.turno() === 'VOS' && !this.tablero()[casillero];
  }

  protected jugar(casillero: number): void {
    if (!this.sePuedeJugar(casillero)) return;
    this.poner(casillero, 'VOS');
    if (this.estado() !== 'JUGANDO') return;
    this.turno.set('MAQUINA');
    this.pensarJugada();
  }

  protected async salir(): Promise<void> {
    if (this.estado() === 'JUGANDO') {
      this.detener();
      const seguro = await this.preguntar({
        titulo: '¿Dejás el juego?',
        mensaje: 'Se pierde la partida que estás jugando contra la máquina.',
        confirmar: 'Salir',
        cancelar: 'Reanudar',
        tono: 'peligro',
        icono: 'close',
      });
      if (!seguro) {
        if (this.turno() === 'MAQUINA') this.pensarJugada();
        return;
      }
      this.estado.set('LISTO');
      this.tablero.set(Array<Ficha>(9).fill(null));
      this.ganadoras.set([]);
    }
    this.ir(['/cliente/juegos']);
  }

  protected imagen(sushi: Sushi): string {
    return imagenDe(sushi);
  }

  protected rotulo(casillero: number, ficha: Ficha): string {
    const fila = Math.floor(casillero / 3) + 1;
    const columna = (casillero % 3) + 1;
    const donde = `fila ${fila}, columna ${columna}`;
    if (ficha === 'VOS') return `Tu ${this.sushiVos().nombre} en la ${donde}`;
    if (ficha === 'MAQUINA') return `El ${this.sushiMaquina().nombre} de la máquina en la ${donde}`;
    return `Poner tu sushi en la ${donde}`;
  }

  protected pie(): string {
    switch (this.estado()) {
      case 'JUGANDO':
        return this.turno() === 'VOS' ? 'Es tu turno: tocá un casillero libre.' : 'La máquina está pensando…';
      case 'GANASTE':
        return 'Hiciste tres en línea.';
      case 'PERDISTE':
        return 'La máquina hizo tres en línea.';
      case 'EMPATE':
        return 'Se llenó el tablero sin que nadie hiciera la línea.';
      default:
        return 'Cada partida sortea las piezas y quién arranca.';
    }
  }

  protected iconoTapa(): string {
    const estado = this.estado();
    if (estado === 'GANASTE') return 'emoji_events';
    if (estado === 'PERDISTE') return 'sentiment_dissatisfied';
    if (estado === 'EMPATE') return 'handshake';
    return 'grid_3x3';
  }

  protected tituloTapa(): string {
    const estado = this.estado();
    if (estado === 'GANASTE') return '¡Ganaste!';
    if (estado === 'PERDISTE') return 'Ganó la máquina';
    if (estado === 'EMPATE') return 'Empate';
    return 'Tres en línea con tu sushi';
  }

  protected textoTapa(): string {
    const estado = this.estado();
    if (estado === 'GANASTE') return `Alineaste tres ${this.sushiVos().nombre} antes que la máquina.`;
    if (estado === 'PERDISTE') return `La máquina alineó tres ${this.sushiMaquina().nombre}. Probá de nuevo.`;
    if (estado === 'EMPATE') return 'Nadie hizo la línea. Otra partida y se define.';
    return 'Cada uno juega con su sushi. Se sortean las piezas y quién arranca, y gana el primero que hace tres en línea.';
  }

  private poner(casillero: number, ficha: Exclude<Ficha, null>): void {
    this.tablero.update((tablero) => tablero.map((otra, i) => (i === casillero ? ficha : otra)));

    const linea = LINEAS.find((posiciones) => posiciones.every((i) => this.tablero()[i] === ficha));
    if (linea) {
      this.ganadoras.set(linea);
      this.terminar(ficha === 'VOS' ? 'GANASTE' : 'PERDISTE');
      return;
    }
    if (this.tablero().every((casilla) => casilla)) this.terminar('EMPATE');
  }

  private pensarJugada(): void {
    this.pensando = window.setTimeout(() => {
      this.pensando = 0;
      if (this.estado() !== 'JUGANDO') return;

      const libres = this.tablero()
        .map((ficha, i) => (ficha ? -1 : i))
        .filter((i) => i >= 0);
      if (!libres.length) return;

      this.poner(alAzar(libres), 'MAQUINA');
      if (this.estado() === 'JUGANDO') this.turno.set('VOS');
    }, PIENSA);
  }

  private terminar(estado: Estado): void {
    this.detener();
    this.estado.set(estado);
    if (estado === 'GANASTE') {
      this.sonido.reproducir('exito');
      this.avisos.exito('¡Tres en línea!', 'Le ganaste el tateti a la máquina.');
      this.consumirIntentoSiAplica(true);
    } else if (estado === 'PERDISTE') {
      this.avisos.error('Ganó la máquina', 'Alineó tres antes que vos. Probá de nuevo.');
      this.consumirIntentoSiAplica(false);
    } else {
      this.avisos.info('Empate', 'Se llenó el tablero sin que nadie hiciera la línea.');
    }
  }

  private consumirIntentoSiAplica(gano: boolean): void {
    const usuario = this.usuario();
    if (!usuario || !this.sesion.tienePerfil('CLIENTE_REGISTRADO')) return;
    const pedido = this.pedidos.activoDe(usuario.id);
    if (!pedido || !this.pedidos.juegosHabilitados(pedido) || pedido.juegoIntentado) return;

    const descuento = gano ? 15 : 0;
    void this.pedidos.jugar(pedido, usuario, descuento).then((pct) => {
      if (pct > 0) {
        this.avisos.exito('¡Premio obtenido!', `¡Felicitaciones! Ganaste un ${pct}% de descuento en tu pedido.`);
      } else {
        this.avisos.info('Intento registrado', 'Esta vez no hubo descuento para este pedido.');
      }
    }).catch(() => undefined);
  }

  private detener(): void {
    if (this.pensando) clearTimeout(this.pensando);
    this.pensando = 0;
  }

  private sortearPiezas(): [Sushi, Sushi] {
    const [una, otra] = mezclar(SUSHIS);
    return [una, otra];
  }
}
