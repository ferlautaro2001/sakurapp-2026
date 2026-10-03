import { Component, computed, effect, inject } from '@angular/core';
import { UI } from '../../../ui';
import { PaginaConSesion } from '../../pagina-base';
import { EsperaService } from '../../../nucleo/servicios/espera.service';
import { PedidosService } from '../../../nucleo/servicios/pedidos.service';

/** Un minijuego de la sala de espera, tal como se lista en la pantalla. */
interface Minijuego {
  id: string;
  nombre: string;
  bajada: string;
  icono: string;
  ruta: string | null;
  ritmo: string;
  iconoRitmo: string;
  categoria: string;
  /**
   * Porcentaje que paga ganar este juego. Espeja el valor que cada pantalla
   * de juego le pasa a `PedidosService.jugar`; si allá cambia, cambia acá.
   */
  premio: number;
}

/**
 * Los juegos de la sala de espera o mesa, para entretenerse y ganar descuento en su pedido.
 */
@Component({
  selector: 'lm-cliente-juegos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo
          >Juegos</lm-titulo
        >

        <div class="lista lm-lista-fija">
          @for (juego of juegos; track juego.id) {
          <button
            type="button"
            class="lm-card juego"
            [class.juego--pronto]="!juego.ruta"
            [disabled]="!juego.ruta"
            (click)="abrir(juego)"
          >
            <span class="juego__icono" aria-hidden="true">
              <lm-icono
                [nombre]="juego.icono"
                [tamano]="72"
                color="var(--action-primary)"
              />
            </span>
            <span class="juego__texto">
              <span class="juego__nombre">{{ juego.nombre }}</span>
              <span class="juego__bajada">{{ juego.bajada }}</span>
            </span>
            <span class="juego__accion">
              @if (juego.ruta) {
              <span class="juego__ir" aria-hidden="true">
                <lm-icono nombre="chevron_right" [tamano]="26" />
              </span>
              } @else {
              <lm-chip estado="inactiva">Pronto</lm-chip>
              }
            </span>
            <span class="juego__etiquetas">
              <span class="juego__etiqueta"
                ><lm-icono
                  [nombre]="juego.iconoRitmo"
                  [tamano]="14"
                  aria-hidden="true"
                />{{ juego.ritmo }}</span
              >
              <span class="juego__etiqueta"
                ><lm-icono nombre="person" [tamano]="14" aria-hidden="true" />1
                jugador</span
              >
              <span class="juego__etiqueta"
                ><lm-icono
                  nombre="sports_esports"
                  [tamano]="14"
                  aria-hidden="true"
                />{{ juego.categoria }}</span
              >
            </span>
          </button>
          }

        <!--
          El premio no es obvio y no se puede deshacer: se juega una sola vez
          por pedido y sólo paga si esa partida se gana. Decirlo acá evita que
          alguien queme el intento sin saberlo, y aclara lo otro que no se
          adivina: que después puede seguir jugando igual.
        -->
        <!-- El @if hace que Angular cree esta tarjeta después de las de los
             juegos: si naciera antes, el navegador la recordaría como la
             tarjeta "actual" del snap y abriría la pantalla en la última. -->
        @if (juegos.length) {
        <section class="dto">
          <span class="dto__icono" aria-hidden="true">
            <lm-icono
              nombre="redeem"
              [tamano]="72"
              color="var(--state-success)"
            />
          </span>
          @if (intentoUsado() && descuentoGanado() > 0) {
          <span class="dto__titulo dto__titulo--ganado"
            >¡Ganaste tu {{ descuentoGanado() }}% de descuento!</span
          >
          } @else {
          <span class="dto__titulo">Cómo funciona el descuento</span>
          }

          @if (intentoUsado()) { @if (descuentoGanado() > 0) {
          <p class="dto__texto">
            Ya está aplicado en el total de tu compra. El intento de este pedido
            está usado, así que seguí jugando las veces que quieras: ahora es
            sólo por diversión.
          </p>
          } @else {
          <p class="dto__texto">
            Esta vez no hubo premio, y era el único intento de esta comanda.
            Igual podés seguir jugando todo lo que quieras mientras esperás.
          </p>
          } } @else {
          <p class="dto__texto">
            Tenés <b>un solo intento por pedido</b> y vale la primera partida
            que termines, en cualquiera de los tres juegos. Si la ganás, el
            descuento se aplica solo en tu comanda; si la perdés, el intento se
            usa igual y no hay premio. Después podés seguir jugando las veces
            que quieras, sólo que ya por diversión.
          </p>

          <span class="dto__premios">
            @for (juego of juegos; track juego.id) {
            <span class="dto__premio"
              ><b>{{ juego.premio }}%</b>{{ juego.nombre }}</span
            >
            }
          </span>

          @if (!intentoDisponible()) {
          <span class="dto__nota">
            <lm-icono nombre="info" [tamano]="15" />
            El intento se habilita cuando el mozo confirma tu pedido.
          </span>
          } }
        </section>
        }
        </div>
      </div>

      <lm-barra-inferior [items]="secciones()" activo="juegos" />
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }
      .lista {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .juego {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        display: grid;
        /* Las tres columnas ceden con el ancho del equipo en vez de saltar en
           un punto fijo: el disco del juego y la flecha encogen a la par y la
           columna del medio se queda con lo que sobra. */
        grid-template-columns: clamp(64px, 20vw, 86px) minmax(0, 1fr) clamp(30px, 9vw, 34px);
        align-items: center;
        column-gap: var(--space-3);
        row-gap: var(--space-3);
        min-height: clamp(132px, 20dvh, 190px);
        padding: var(--space-6) var(--space-4) var(--space-5) var(--space-3);
        text-align: left;
        width: 100%;
        cursor: pointer;
        font: inherit;
        border: 1px solid rgba(255, 255, 255, 0.8);
        border-radius: 22px;
        background: linear-gradient(
          110deg,
          #fbd5e4 0%,
          #fce8ef 48%,
          #fffaf7 100%
        );
        box-shadow: 0 8px 20px rgba(104, 17, 51, 0.17),
          inset 0 1px 0 rgba(255, 255, 255, 0.65);
        transition: transform var(--dur-fast), box-shadow var(--dur-fast);
      }
      .juego::before {
        content: '';
        position: absolute;
        top: 2px;
        right: 5px;
        width: 56px;
        height: 56px;
        z-index: -1;
        pointer-events: none;
        background: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cg%20fill%3D%22%23f5a8c4%22%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(0%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(72%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(144%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(216%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(288%2050%2050)%22%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23ffe7ef%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(0%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(36%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(72%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(108%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(144%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(180%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(216%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(252%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(288%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(324%2050%2050)%22%2F%3E%3C%2Fg%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%222.5%22%20fill%3D%22%23ffe7ef%22%2F%3E%3C%2Fsvg%3E')
          center / contain no-repeat;
        opacity: 0.36;
        transform: rotate(12deg);
      }
      .juego:active:not(:disabled) {
        transform: scale(0.985);
      }
      .juego:focus-visible {
        outline: 3px solid var(--action-primary);
        outline-offset: 3px;
      }
      .juego--pronto {
        opacity: 0.72;
        cursor: default;
      }
      .juego__icono {
        grid-column: 1;
        grid-row: 1 / 3;
        width: clamp(64px, 20vw, 86px);
        height: clamp(64px, 20vw, 86px);
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: radial-gradient(
          circle at 32% 22%,
          #fff2f7 0%,
          #ffdce9 48%,
          #f5b4ce 100%
        );
        border: 1px solid rgba(255, 255, 255, 0.85);
        box-shadow: inset 0 1px 5px rgba(255, 255, 255, 0.85),
          0 7px 15px rgba(179, 46, 95, 0.16);
      }
      .juego__icono lm-icono {
        filter: drop-shadow(0 2px 2px rgba(168, 32, 82, 0.14));
      }
      .juego__texto {
        grid-column: 2;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .juego__nombre {
        font: 800 clamp(15px, 4vw, 17px)/1.2 var(--font-display);
        color: var(--text-title);
      }
      .juego__bajada {
        font: 500 clamp(12px, 3.1vw, 13px)/1.45 var(--font-text);
        color: var(--text-muted);
        text-wrap: pretty;
      }
      .juego__accion {
        grid-column: 3;
        align-self: end;
        padding-bottom: 5px;
      }
      .juego__ir {
        width: clamp(30px, 9vw, 34px);
        height: clamp(30px, 9vw, 34px);
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: var(--action-primary);
        background: linear-gradient(145deg, #ffe7f0, #fbcddd);
        box-shadow: 0 4px 9px rgba(164, 42, 86, 0.13),
          inset 0 1px 0 rgba(255, 255, 255, 0.7);
      }
      .juego__etiquetas {
        grid-column: 2 / 4;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .juego__etiqueta {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 5px 8px;
        border-radius: var(--radius-pill);
        background: rgba(249, 157, 191, 0.22);
        color: var(--text-muted);
        font: var(--type-label);
        white-space: nowrap;
      }
      .dto {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 16px 16px 18px;
        border-radius: 22px;
        border: 1px solid rgba(255, 255, 255, 0.85);
        background: linear-gradient(150deg, #ffffff 0%, #fff5f8 100%);
        box-shadow: 0 8px 20px rgba(104, 17, 51, 0.13),
          inset 0 1px 0 rgba(255, 255, 255, 0.7);
      }
      .dto__titulo {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font: 800 clamp(13.5px, 3.5vw, 15px)/1.2 var(--font-display);
        color: var(--text-title);
      }
      .dto__texto {
        margin: 0;
        font: 500 clamp(12px, 3.1vw, 13px)/1.5 var(--font-text);
        color: var(--text-muted);
        text-wrap: pretty;
      }
      .dto__texto b {
        color: var(--text-title);
        font-weight: 800;
      }
      .dto__premios {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .dto__premio {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 9px;
        border-radius: var(--radius-pill);
        background: var(--state-success-surface);
        color: var(--state-success);
        font: 600 clamp(10.5px, 2.6vw, 11px)/1.2 var(--font-text);
        white-space: nowrap;
      }
      .dto__premio b {
        font: 800 clamp(11px, 2.9vw, 12px)/1.25 var(--font-numeric);
      }
      .dto__nota {
        display: inline-flex;
        align-items: flex-start;
        gap: 6px;
        font: 500 clamp(11px, 2.9vw, 12px)/1.4 var(--font-text);
        color: var(--text-muted);
      }

      /* Un juego por pantalla, centrado: la lista (lm-lista-fija) mide el alto
         que sobra y cada juego mide exactamente eso. El disco, el nombre y los
         textos crecen con el alto disponible para no dejar huecos. */
      .lista { gap: var(--space-3); overflow-anchor: none; }
      .lista .juego {
        display: flex; flex-direction: column; align-items: center; justify-content: space-evenly;
        text-align: center; min-height: 0; height: 100%;
        padding: var(--space-5) var(--space-4);
        background: var(--surface-card-degradado);
      }
      .lista .juego__icono {
        /* Círculo perfecto: la proporción 1:1 manda y el disco no crece ni se
           encoge en la columna (antes el alto se estiraba y salía un óvalo). */
        order: 1; width: clamp(88px, 17dvh, 150px); height: auto; aspect-ratio: 1 / 1;
        flex: 0 0 auto; align-self: center; min-height: 0; max-height: none;
      }
      .lista .juego__texto { order: 2; align-items: center; gap: var(--space-3); }
      .lista .juego__nombre { font: var(--type-title-xl); }
      .lista .juego__bajada { font: var(--type-body); text-wrap: balance; }
      .lista .juego__etiquetas { order: 3; justify-content: center; align-items: center; align-content: center; flex: 0 0 auto; height: auto; }
      .lista .juego__etiqueta { flex: 0 0 auto; height: auto; }
      .lista .juego__etiqueta { font: var(--type-body-small); font-weight: 700; padding: 7px 12px; }
      /* Mismo contorno de vidrio que los botones de ícono, en rosa claro porque
         van sobre la tarjeta: borde fino, brillo interior y sombra suave. */
      .lista .juego__etiqueta {
        border-radius: 14px; gap: 6px; color: var(--action-primary);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 215, 223, 0.8) 100%);
        border: 1.5px solid rgba(255, 79, 139, 0.45);
        box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 8px rgba(94, 12, 44, 0.14);
      }
      .lista .juego__accion { order: 4; padding: 0; align-self: center; }
      /* Mismo vidrio que los botones de ícono, pero en rosa fuerte y oscuro
         y todavía traslúcido: forma amplia, contorno claro, brillo interior. */
      .lista .juego__ir {
        width: clamp(52px, 8dvh, 68px); height: clamp(52px, 8dvh, 68px);
        border-radius: 22px; color: #fff;
        background: linear-gradient(180deg, rgba(226, 48, 108, 0.82) 0%, rgba(168, 28, 78, 0.74) 100%);
        border: 1.5px solid rgba(255, 255, 255, 0.5);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.5),
          inset 0 -6px 12px rgba(94, 12, 44, 0.18),
          0 6px 14px rgba(94, 12, 44, 0.3);
        -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
      }
      /* "Cómo funciona el descuento" es la última tarjeta de la lista: ocupa
         la pantalla igual que un juego, y si el texto es más largo se desplaza
         por dentro sin soltar el anclaje. */
      .lista .dto {
        height: 100%; justify-content: center; gap: var(--space-4);
        overflow-y: auto; padding: var(--space-5);
        background: var(--surface-card-degradado);
      }
      /* El ícono es el mismo disco que el de los juegos: círculo perfecto del
         mismo tamaño, y la información va debajo, centrada y más grande. */
      .dto__icono {
        flex: 0 0 auto; align-self: center; display: grid; place-items: center;
        width: clamp(88px, 17dvh, 150px); height: auto; aspect-ratio: 1 / 1;
        border-radius: 50%;
        background: radial-gradient(circle at 32% 22%, #f2fff8 0%, #cdf1de 52%, #8fd5b0 100%);
        border: 1px solid rgba(255, 255, 255, 0.85);
        box-shadow: 0 8px 18px rgba(27, 122, 76, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.9);
      }
      .dto__icono lm-icono { filter: drop-shadow(0 2px 2px rgba(10, 100, 60, 0.18)); }
      .lista .dto { align-items: center; text-align: center; justify-content: safe center; gap: var(--space-3); padding: var(--space-4); }
      .lista .dto__titulo { font: var(--type-title); text-align: center; text-wrap: balance; }
      .lista .dto__titulo--ganado { color: var(--state-success); }
      .lista .dto__texto { font: 500 clamp(14.5px, 3.9vw, 17px)/1.4 var(--font-text); text-align: center; text-wrap: pretty; }
      .lista .dto__premios { justify-content: center; gap: 8px; }
      .lista .dto__premio { font: 700 clamp(13px, 3.5vw, 15.5px)/1.2 var(--font-text); padding: 6px 12px; }
      .lista .dto__premio b { font-size: clamp(14.5px, 4vw, 18px); }
      .lista .dto__nota { font: 500 clamp(13px, 3.5vw, 15px)/1.35 var(--font-text); text-align: left; }
    `,
  ],
})
export class ClienteJuegosPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly pedidos = inject(PedidosService);

  protected readonly juegos: Minijuego[] = [
    {
      id: 'ninja',
      premio: 20,
      nombre: 'Ninja de Sakura',
      bajada:
        'Atrapá las flores de sakura que caen antes de que se acabe el tiempo.',
      icono: 'local_florist',
      ritmo: 'Rápido',
      iconoRitmo: 'bolt',
      categoria: 'Casual',
      ruta: '/cliente/juegos/ninja-sakura',
    },
    {
      id: 'sushis',
      premio: 10,
      nombre: 'Emparejando sushis',
      bajada:
        'Doce cartas boca abajo: encontrá las seis parejas de sushi contra reloj.',
      icono: 'style',
      ritmo: 'Desafío',
      iconoRitmo: 'schedule',
      categoria: 'Memoria',
      ruta: '/cliente/juegos/emparejando-sushis',
    },
    {
      id: 'tateti',
      premio: 15,
      nombre: 'Tateti de sushis',
      bajada:
        'Tres en línea contra la máquina, cada uno con su pieza de sushi.',
      icono: 'grid_3x3',
      ritmo: 'Estrategia',
      iconoRitmo: 'psychology',
      categoria: 'Lógica',
      ruta: '/cliente/juegos/tateti-sushis',
    },
  ];

  protected readonly enEspera = computed(() => {
    const id = this.usuario()?.id;
    return id ? !!this.espera.activaDe(id) : false;
  });

  /** El pedido que el intento descuenta, si hay uno en curso. */
  protected readonly pedidoActivo = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.pedidos.activoDe(id) : undefined;
  });

  protected readonly intentoUsado = computed(
    () => this.pedidoActivo()?.juegoIntentado === true
  );
  protected readonly descuentoGanado = computed(
    () => this.pedidoActivo()?.descuentoJuego ?? 0
  );
  protected readonly intentoDisponible = computed(() => {
    const pedido = this.pedidoActivo();
    return (
      !!pedido &&
      this.pedidos.juegosHabilitados(pedido) &&
      !pedido.juegoIntentado
    );
  });

  protected readonly enMesa = computed(() => {
    const id = this.usuario()?.id;
    return !!this.sesion.mesa() || (id ? !!this.pedidos.activoDe(id) : false);
  });

  constructor() {
    super();
    this.espera.iniciar();
    effect(() => {
      if (!this.enEspera() && !this.enMesa()) {
        void this.router.navigate(['/cliente/ingreso'], { replaceUrl: true });
      }
    });
  }

  protected abrir(juego: Minijuego): void {
    if (!juego.ruta) return;
    this.ir([juego.ruta]);
  }
}
