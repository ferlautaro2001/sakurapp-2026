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

      <div class="lm-body lm-body--fijo lm-body--gap12">
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
              <span class="juego__icono">
                <lm-icono [nombre]="juego.icono" [tamano]="30" color="var(--action-primary)" />
              </span>
              <span class="juego__texto">
                <span class="juego__nombre">{{ juego.nombre }}</span>
                <span class="juego__bajada">{{ juego.bajada }}</span>
              </span>
              @if (juego.ruta) {
                <lm-icono nombre="chevron_right" [tamano]="24" color="var(--action-primary)" />
              } @else {
                <lm-chip estado="inactiva">Pronto</lm-chip>
              }
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
      .lista { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 12px; }
      .juego {
        flex: 1 1 0; min-height: 0;
        display: flex; align-items: center; gap: 13px;
        text-align: left; width: 100%; border: 0; cursor: pointer;
        font: inherit;
      }
      .juego--pronto { opacity: .72; cursor: default; }
      .juego__icono {
        flex: 0 0 auto; width: 52px; height: 52px; border-radius: var(--radius-pill);
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--surface-sunken);
      }
      .juego__texto { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
      .juego__nombre { font: var(--type-card-title); color: var(--text-title); }
      .juego__bajada { font: var(--type-body-small); color: var(--text-muted); text-wrap: pretty; }
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
      ruta: '/cliente/juegos/ninja-sakura',
    },
    {
      id: 'sushis',
      nombre: 'Emparejando sushis',
      bajada: 'Doce cartas boca abajo: encontrá las seis parejas de sushi contra reloj.',
      icono: 'style',
      ruta: '/cliente/juegos/emparejando-sushis',
    },
    {
      id: 'tateti',
      nombre: 'Tateti de sushis',
      bajada: 'Tres en línea contra la máquina, cada uno con su pieza de sushi.',
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
