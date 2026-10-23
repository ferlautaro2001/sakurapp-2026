import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
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
}

/**
 * Los juegos de la sala de espera o mesa, para entretenerse y ganar descuento en su pedido.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-cliente-juegos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo>
          Juegos
          <lm-boton
            accion
            variante="secondary"
            icono="info"
            [ancho]="false"
            compacto
            sobreOscuro
            class="como-ganar"
            (presionar)="verComoGanar()"
          >
            Cómo ganar descuentos
          </lm-boton>
        </lm-titulo>

        <!-- Los tres juegos entran juntos en la pantalla: cada uno mide un
             tercio del alto que sobra. En una pantalla baja van de a dos o de
             a uno, con snap, y siempre enteros. -->
        <div class="lista">
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
                tamano="calc(var(--disco) * .55)"
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
                <lm-icono nombre="sports_esports" [tamano]="26" />
              </span>
              } @else {
              <lm-chip estado="inactiva">Pronto</lm-chip>
              }
            </span>
          </button>
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
      /* El título deja el botón de los descuentos centrado con el texto. */
      lm-titulo ::ng-deep .lm-title { align-items: center; }
      .como-ganar ::ng-deep .lm-btn {
        min-height: 40px;
        padding: 0 clamp(10px, 3vw, 14px);
        gap: 6px;
        font-size: clamp(12.5px, 3.5vw, 14px);
        white-space: nowrap;
      }

      /* La lista ocupa el alto que sobra y los juegos se lo reparten por
         tandas: de a tres mientras la descripción entre completa en un tercio,
         de a dos o de a uno si la pantalla es baja. Cada juego mide justo su
         parte y se ancla con snap, así cada parada muestra tarjetas enteras.
         Si aun así el texto no entrara, la tarjeta crece: nunca se corta. */
      .lista {
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        container: juegos / size;
        overflow-y: auto;
        overscroll-behavior: contain;
        scroll-snap-type: y mandatory;
        scrollbar-width: none;
      }
      .lista::-webkit-scrollbar { display: none; }
      .juego {
        --por: 3;
        flex: 0 0 calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por));
        min-height: min-content;
        scroll-snap-align: start;
        scroll-snap-stop: always;
        position: relative;
        isolation: isolate;
        overflow: hidden;
        display: grid;
        /* Las tres columnas ceden con el ancho del equipo en vez de saltar en
           un punto fijo: el disco del juego y la flecha encogen a la par y la
           columna del medio se queda con lo que sobra. El disco además sigue
           al alto de la pantalla, porque la tarjeta mide un tercio de él. */
        grid-template-columns: var(--disco) minmax(0, 1fr) auto;
        --disco: clamp(56px, min(20vw, 11dvh), 96px);
        align-items: center;
        column-gap: var(--space-3);
        padding: var(--space-3) var(--space-4) var(--space-3) var(--space-3);
        background: var(--surface-card-degradado);
        text-align: left;
        width: 100%;
        cursor: pointer;
        font: inherit;
        border: 1px solid rgba(255, 255, 255, 0.8);
        border-radius: 22px;
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
        width: var(--disco);
        height: var(--disco);
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
        gap: clamp(4px, 1dvh, 8px);
      }
      .juego__nombre {
        font: 800 clamp(16px, min(4.6vw, 2.8dvh), 21px)/1.2 var(--font-display);
        color: var(--text-title);
      }
      .juego__bajada {
        font: 550 clamp(12.5px, min(3.6vw, 2.1dvh), 15px)/1.4 var(--font-text);
        color: var(--text-muted);
        text-wrap: pretty;
      }
      /* Pantallas bajas: un tercio ya no alcanza para la descripción entera,
         así que los juegos pasan a ir de a dos, y en una muy baja de a uno.
         En una angosta (un plegable cerrado) el texto ocupa más renglones, así
         que el corte de a dos llega antes. */
      @container juegos (max-height: 330px) { .juego { --por: 2; } }
      @container juegos (max-width: 286px) and (max-height: 480px) { .juego { --por: 2; } }
      @container juegos (max-height: 200px) { .juego { --por: 1; } }
      .juego__accion {
        grid-column: 3;
        align-self: center;
      }
      /* Mismo vidrio que los botones de ícono, pero en rosa fuerte y oscuro
         y todavía traslúcido: forma amplia, contorno claro, brillo interior. */
      .juego__ir {
        width: clamp(40px, 7dvh, 52px); height: clamp(40px, 7dvh, 52px);
        display: grid; place-items: center;
        border-radius: 16px; color: #fff;
        background: linear-gradient(180deg, rgba(226, 48, 108, 0.82) 0%, rgba(168, 28, 78, 0.74) 100%);
        border: 1.5px solid rgba(255, 255, 255, 0.5);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.5),
          inset 0 -6px 12px rgba(94, 12, 44, 0.18),
          0 6px 14px rgba(94, 12, 44, 0.3);
        }
    `,
  ],
})
export class ClienteJuegosPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly pedidos = inject(PedidosService);

  protected readonly juegos: Minijuego[] = [
    {
      id: 'ninja',
      nombre: 'Ninja de Sakura',
      bajada:
        'Atrapá las flores de sakura que caen antes de que se acabe el tiempo.',
      icono: 'local_florist',
      ruta: '/cliente/juegos/ninja-sakura',
    },
    {
      id: 'sushis',
      nombre: 'Emparejando sushis',
      bajada:
        'Doce cartas boca abajo: encontrá las seis parejas de sushi contra reloj.',
      icono: 'style',
      ruta: '/cliente/juegos/emparejando-sushis',
    },
    {
      id: 'tateti',
      nombre: 'Tateti de sushis',
      bajada:
        'Tres en línea contra la máquina, cada uno con su pieza de sushi.',
      icono: 'grid_3x3',
      ruta: '/cliente/juegos/tateti-sushis',
    },
  ];

  protected readonly enEspera = computed(() => {
    const id = this.usuario()?.id;
    return id ? !!this.espera.activaDe(id) : false;
  });

  protected readonly enMesa = computed(() => {
    const id = this.usuario()?.id;
    return !!this.sesion.mesa() || (id ? !!this.pedidos.activoDe(id) : false);
  });

  constructor() {
    super();
    this.espera.iniciar();
    effect(() => {
      // En la fila todavía no se juega: vuelve a su lugar.
      const id = this.usuario()?.id;
      const estado = id ? this.espera.activaDe(id)?.estado : undefined;
      if (estado === 'ESPERANDO' || estado === 'ASIGNADO') {
        void this.router.navigate(['/cliente/espera'], { replaceUrl: true });
        return;
      }
      if (!this.enEspera() && !this.enMesa()) {
        void this.router.navigate(['/cliente/ingreso'], { replaceUrl: true });
      }
    });
  }

  protected abrir(juego: Minijuego): void {
    if (!juego.ruta) return;
    this.ir([juego.ruta]);
  }

  /**
   * Las reglas del descuento, en el modal de ficha (sólo la cruz para cerrar).
   * El porcentaje que se gana es aleatorio, así que no se promete uno por juego.
   */
  protected verComoGanar(): void {
    void this.confirmacion.mostrar({
      titulo: 'Cómo ganar descuentos',
      icono: 'info',
      mensaje:
        'Tenés un solo intento para ganar el descuento. Si ganás tu primera partida de cualquier juego, se le aplicará un descuento a tu pedido. Si perdés, podrás seguir jugando pero no se otorgarán descuentos.',
    });
  }
}
