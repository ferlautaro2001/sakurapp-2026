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

      <div class="lm-body lm-body--gap12">
        <lm-titulo bajada="Mientras esperás la mesa o tu pedido, jugá y divertite">Juegos</lm-titulo>

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
                <lm-icono [nombre]="juego.icono" [tamano]="44" color="var(--action-primary)" />
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
                <span class="juego__etiqueta"><lm-icono [nombre]="juego.iconoRitmo" [tamano]="14" aria-hidden="true" />{{ juego.ritmo }}</span>
                <span class="juego__etiqueta"><lm-icono nombre="person" [tamano]="14" aria-hidden="true" />1 jugador</span>
                <span class="juego__etiqueta"><lm-icono nombre="sports_esports" [tamano]="14" aria-hidden="true" />{{ juego.categoria }}</span>
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
      :host { display: flex; flex: 1; min-height: 0; }
      .lista { display: flex; flex-direction: column; gap: 16px; }
      .juego {
        position: relative; isolation: isolate; overflow: hidden;
        display: grid; grid-template-columns: 86px minmax(0, 1fr) 34px;
        align-items: center; column-gap: 12px; row-gap: 12px;
        min-height: 166px; padding: 24px 14px 20px 12px;
        text-align: left; width: 100%; cursor: pointer; font: inherit;
        border: 1px solid rgba(255, 255, 255, .8); border-radius: 22px;
        background: linear-gradient(110deg, #fbd5e4 0%, #fce8ef 48%, #fffaf7 100%);
        box-shadow: 0 8px 20px rgba(104, 17, 51, .17), inset 0 1px 0 rgba(255, 255, 255, .65);
        transition: transform var(--dur-fast), box-shadow var(--dur-fast);
      }
      .juego::before {
        content: ""; position: absolute; top: 2px; right: 5px;
        width: 56px; height: 56px; z-index: -1; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cg%20fill%3D%22%23f5a8c4%22%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(0%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(72%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(144%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(216%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050%20C37%2043%2031%2024%2037%2012%20Q42%206%2050%2014%20Q58%206%2063%2012%20C69%2024%2063%2043%2050%2050Z%22%20transform%3D%22rotate(288%2050%2050)%22%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23ffe7ef%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(0%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(36%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(72%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(108%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(144%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(180%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(216%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(252%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(288%2050%2050)%22%2F%3E%3Cpath%20d%3D%22M50%2050L50%2032%22%20transform%3D%22rotate(324%2050%2050)%22%2F%3E%3C%2Fg%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%222.5%22%20fill%3D%22%23ffe7ef%22%2F%3E%3C%2Fsvg%3E") center / contain no-repeat; opacity: .36;
        transform: rotate(12deg);
      }
      .juego:active:not(:disabled) { transform: scale(.985); }
      .juego:focus-visible { outline: 3px solid var(--action-primary); outline-offset: 3px; }
      .juego--pronto { opacity: .72; cursor: default; }
      .juego__icono {
        grid-column: 1; grid-row: 1 / 3; width: 86px; height: 86px;
        border-radius: 50%; display: grid; place-items: center;
        background: radial-gradient(circle at 32% 22%, #fff2f7 0%, #ffdce9 48%, #f5b4ce 100%);
        border: 1px solid rgba(255, 255, 255, .85);
        box-shadow: inset 0 1px 5px rgba(255, 255, 255, .85), 0 7px 15px rgba(179, 46, 95, .16);
      }
      .juego__icono lm-icono { filter: drop-shadow(0 2px 2px rgba(168, 32, 82, .14)); }
      .juego__texto { grid-column: 2; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
      .juego__nombre { font: 800 17px/1.2 var(--font-display); color: var(--text-title); }
      .juego__bajada { font: 500 13px/1.45 var(--font-text); color: var(--text-muted); text-wrap: pretty; }
      .juego__accion { grid-column: 3; align-self: end; padding-bottom: 5px; }
      .juego__ir {
        width: 34px; height: 34px; display: grid; place-items: center;
        border-radius: 50%; color: var(--action-primary);
        background: linear-gradient(145deg, #ffe7f0, #fbcddd);
        box-shadow: 0 4px 9px rgba(164, 42, 86, .13), inset 0 1px 0 rgba(255, 255, 255, .7);
      }
      .juego__etiquetas { grid-column: 2 / 4; display: flex; flex-wrap: wrap; gap: 5px; }
      .juego__etiqueta {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 5px 8px; border-radius: var(--radius-pill);
        background: rgba(249, 157, 191, .22); color: var(--text-muted);
        font: 500 10px/1.2 var(--font-text); white-space: nowrap;
      }
      @media (max-width: 360px) {
        .juego { grid-template-columns: 68px minmax(0, 1fr) 30px; column-gap: 9px; padding: 20px 10px 16px; }
        .juego__icono { width: 68px; height: 68px; }
        .juego__nombre { font-size: 15px; }
        .juego__bajada { font-size: 12px; }
        .juego__ir { width: 30px; height: 30px; }
        .juego__etiquetas { grid-column: 1 / 4; justify-content: center; }
        .juego__icono { grid-row: 1; }
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
      bajada: 'Atrapá las flores de sakura que caen antes de que se acabe el tiempo.',
      icono: 'local_florist',
      ritmo: 'Rápido',
      iconoRitmo: 'bolt',
      categoria: 'Casual',
      ruta: '/cliente/juegos/ninja-sakura',
    },
    {
      id: 'sushis',
      nombre: 'Emparejando sushis',
      bajada: 'Doce cartas boca abajo: encontrá las seis parejas de sushi contra reloj.',
      icono: 'style',
      ritmo: 'Desafío',
      iconoRitmo: 'schedule',
      categoria: 'Memoria',
      ruta: '/cliente/juegos/emparejando-sushis',
    },
    {
      id: 'tateti',
      nombre: 'Tateti de sushis',
      bajada: 'Tres en línea contra la máquina, cada uno con su pieza de sushi.',
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
