import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { UI } from '../../../ui';
import { PaginaConSesion } from '../../pagina-base';
import { EsperaService } from '../../../nucleo/servicios/espera.service';
import { SonidoService } from '../../../nucleo/servicios/sonido.service';
import { PedidosService } from '../../../nucleo/servicios/pedidos.service';
import { Sushi, SUSHIS, imagenDe, mezclar } from './sushis';

/** Una carta del tablero. Dos cartas con el mismo sushi son pareja. */
interface Carta {
  id: number;
  sushi: Sushi;
  vuelta: boolean;
  emparejada: boolean;
}

const PAREJAS = 6;
const SEGUNDOS = 60;
const ESPERA = 780;

type Estado = 'LISTO' | 'JUGANDO' | 'GANADO' | 'PERDIDO';

/**
 * Minijuego · Emparejando sushis.
 */
@Component({
  selector: 'lm-emparejando-sushis',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Emparejando sushis" conVolver (volver)="salir()" />

      <div class="lm-body lm-body--fijo lm-body--gap12">
        <div class="marcador">
          <div class="marcador__dato">
            <span class="marcador__rotulo">Parejas</span>
            <span class="marcador__valor">{{ encontradas() }}<small>/{{ parejas }}</small></span>
          </div>
          <div class="marcador__barra" aria-hidden="true">
            <span [style.width.%]="avance()"></span>
          </div>
          <div class="marcador__dato" [class.marcador__dato--poco]="restante() <= 10">
            <span class="marcador__rotulo">Tiempo</span>
            <span class="marcador__valor">{{ restante() }}<small>s</small></span>
          </div>
        </div>

        <div class="tablero">
          @for (carta of cartas(); track carta.id) {
            <button
              type="button"
              class="carta"
              [class.carta--vuelta]="carta.vuelta || carta.emparejada"
              [class.carta--lista]="carta.emparejada"
              [attr.aria-label]="rotulo(carta)"
              [disabled]="estado() !== 'JUGANDO'"
              (click)="tocar(carta)"
            >
              <span class="carta__giro">
                <span class="carta__cara carta__cara--dorso">
                  <img class="carta__petalo carta__petalo--alta" src="assets/img/flor-3.png" alt="" width="70" height="70" />
                  <img class="carta__petalo carta__petalo--baja" src="assets/img/flor-3.png" alt="" width="70" height="70" />
                  <span class="sk-placa sk-placa--chica">
                    <img src="assets/img/logo-badge.png" alt="" width="54" height="54" />
                  </span>
                </span>
                <span class="carta__cara carta__cara--frente">
                  <img [src]="imagen(carta.sushi)" alt="" width="76" height="76" />
                </span>
              </span>
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
        background: var(--action-primary); transition: width var(--dur-base) var(--ease-standard);
      }

      .tablero {
        flex: 1 1 auto; min-height: 0; position: relative;
        display: grid; gap: 10px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(4, minmax(0, 1fr));
      }

      .carta {
        min-width: 0; min-height: 0; padding: 0; border: 0; background: none;
        perspective: 800px; cursor: pointer;
      }
      .carta[disabled] { cursor: default; }
      .carta__giro {
        position: relative; display: block; width: 100%; height: 100%;
        transform-style: preserve-3d;
        transition: transform var(--dur-slow) var(--ease-out-soft);
      }
      .carta--vuelta .carta__giro { transform: rotateY(180deg); }
      .carta__cara {
        position: absolute; inset: 0; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
        border-radius: var(--radius-thumb);
        backface-visibility: hidden; -webkit-backface-visibility: hidden;
        box-shadow: var(--shadow-card);
        transition: opacity 0s linear 160ms;
      }
      .carta__cara--frente { opacity: 0; }
      .carta--vuelta .carta__cara--dorso { opacity: 0; }
      .carta--vuelta .carta__cara--frente { opacity: 1; }
      .carta__cara--dorso { background: var(--gradiente-marca); }
      .carta__petalo { position: absolute; width: 58%; height: auto; opacity: .5; }
      .carta__petalo--baja { right: -14px; bottom: -14px; }
      .carta__petalo--alta { left: -14px; top: -14px; }
      .carta__cara--dorso .sk-placa { position: relative; }
      .carta__cara--frente {
        transform: rotateY(180deg);
        background: var(--surface-sunken);
        border: 1px solid var(--border-card);
      }
      .carta__cara--frente img { width: 78%; height: auto; }
      .carta--lista .carta__cara--frente {
        border-color: var(--action-primary);
        background: var(--sk-petalo-tenue);
        opacity: .88;
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
export class EmparejandoSushisPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly sonido = inject(SonidoService);
  private readonly pedidos = inject(PedidosService);

  protected readonly parejas = PAREJAS;
  protected readonly estado = signal<Estado>('LISTO');
  protected readonly restante = signal(SEGUNDOS);
  protected readonly cartas = signal<Carta[]>(this.repartir());

  protected readonly encontradas = computed(
    () => this.cartas().filter((carta) => carta.emparejada).length / 2,
  );
  protected readonly avance = computed(() => (this.encontradas() / PAREJAS) * 100);

  private resolviendo = false;
  private reloj = 0;
  private vuelta = 0;

  constructor() {
    super();
    this.espera.iniciar();
    inject(DestroyRef).onDestroy(() => this.detener());
  }

  protected empezar(): void {
    this.detener();
    this.cartas.set(this.repartir());
    this.restante.set(SEGUNDOS);
    this.resolviendo = false;
    this.estado.set('JUGANDO');
    this.arrancarReloj();
  }

  private arrancarReloj(): void {
    if (!this.reloj) this.reloj = window.setInterval(() => this.segundo(), 1000);
  }

  private pararReloj(): void {
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = 0;
  }

  protected tocar(carta: Carta): void {
    if (this.estado() !== 'JUGANDO' || this.resolviendo) return;
    if (carta.vuelta || carta.emparejada) return;

    this.cambiar(carta.id, { vuelta: true });
    const abiertas = this.cartas().filter((otra) => otra.vuelta && !otra.emparejada);
    if (abiertas.length < 2) return;

    const [una, otra] = abiertas;
    if (una.sushi.archivo === otra.sushi.archivo) {
      this.cambiar(una.id, { vuelta: false, emparejada: true });
      this.cambiar(otra.id, { vuelta: false, emparejada: true });
      if (this.encontradas() === PAREJAS) this.terminar('GANADO');
      return;
    }

    this.resolviendo = true;
    this.vuelta = window.setTimeout(() => {
      this.cambiar(una.id, { vuelta: false });
      this.cambiar(otra.id, { vuelta: false });
      this.resolviendo = false;
    }, ESPERA);
  }

  protected async salir(): Promise<void> {
    if (this.estado() === 'JUGANDO') {
      this.pararReloj();
      const seguro = await this.preguntar({
        titulo: '¿Dejás el juego?',
        mensaje: `Llevás ${this.encontradas()} de ${PAREJAS} parejas y se pierde lo que jugaste. El reloj está frenado.`,
        confirmar: 'Salir',
        cancelar: 'Reanudar',
        tono: 'peligro',
        icono: 'close',
      });
      if (!seguro) {
        this.arrancarReloj();
        return;
      }
      this.detener();
      this.estado.set('LISTO');
      this.cartas.set(this.repartir());
      this.restante.set(SEGUNDOS);
    }
    this.ir(['/cliente/juegos']);
  }

  protected imagen(sushi: Sushi): string {
    return imagenDe(sushi);
  }

  protected rotulo(carta: Carta): string {
    if (carta.emparejada) return `Pareja encontrada: ${carta.sushi.nombre}`;
    if (carta.vuelta) return carta.sushi.nombre;
    return 'Carta tapada: tocá para darla vuelta';
  }

  protected iconoTapa(): string {
    const estado = this.estado();
    if (estado === 'GANADO') return 'emoji_events';
    if (estado === 'PERDIDO') return 'timer_off';
    return 'style';
  }

  protected tituloTapa(): string {
    const estado = this.estado();
    if (estado === 'GANADO') return '¡Ganaste!';
    if (estado === 'PERDIDO') return 'Se acabó el tiempo';
    return 'Encontrá las parejas de sushi';
  }

  protected textoTapa(): string {
    const estado = this.estado();
    if (estado === 'GANADO') {
      return `Encontraste las ${PAREJAS} parejas en ${SEGUNDOS - this.restante()} de los ${SEGUNDOS} segundos.`;
    }
    if (estado === 'PERDIDO') {
      return `Llegaste a ${this.encontradas()} de ${PAREJAS} parejas. Probá de nuevo.`;
    }
    return `Doce cartas y ${PAREJAS} parejas de sushi. Dala vuelta de a dos: si son iguales quedan destapadas, y si no, se vuelven a tapar. Tenés ${SEGUNDOS} segundos.`;
  }

  private segundo(): void {
    const quedan = this.restante() - 1;
    this.restante.set(Math.max(0, quedan));
    if (quedan <= 0) this.terminar('PERDIDO');
  }

  private terminar(estado: Estado): void {
    this.detener();
    this.estado.set(estado);
    if (estado === 'GANADO') {
      this.sonido.reproducir('exito');
      this.avisos.exito('¡Memoria de chef!', `Encontraste las ${PAREJAS} parejas antes de que se acabara el tiempo.`);
    } else {
      this.avisos.error(
        'Se acabó el tiempo',
        `Te faltaron ${PAREJAS - this.encontradas()} parejas. Probá de nuevo.`,
      );
    }
    this.consumirIntentoSiAplica(estado === 'GANADO');
  }

  private consumirIntentoSiAplica(gano: boolean): void {
    const usuario = this.usuario();
    if (!usuario || !this.sesion.tienePerfil('CLIENTE_REGISTRADO')) return;
    const pedido = this.pedidos.activoDe(usuario.id);
    if (!pedido || !this.pedidos.juegosHabilitados(pedido) || pedido.juegoIntentado) return;

    const descuento = gano ? 10 : 0;
    void this.pedidos.jugar(pedido, usuario, descuento).then((pct) => {
      if (pct > 0) {
        this.avisos.exito('¡Premio obtenido!', `¡Felicitaciones! Ganaste un ${pct}% de descuento en tu pedido.`);
      } else {
        this.avisos.info('Intento registrado', 'Esta vez no hubo descuento para este pedido.');
      }
    }).catch(() => undefined);
  }

  private detener(): void {
    this.pararReloj();
    if (this.vuelta) clearTimeout(this.vuelta);
    this.vuelta = 0;
  }

  private repartir(): Carta[] {
    const elegidos = mezclar(SUSHIS).slice(0, PAREJAS);
    const cartas = elegidos.flatMap((sushi) => [sushi, sushi]);
    return mezclar(cartas).map((sushi, indice) => ({
      id: indice,
      sushi,
      vuelta: false,
      emparejada: false,
    }));
  }

  private cambiar(id: number, cambios: Partial<Carta>): void {
    this.cartas.update((cartas) =>
      cartas.map((carta) => (carta.id === id ? { ...carta, ...cambios } : carta)),
    );
  }
}
