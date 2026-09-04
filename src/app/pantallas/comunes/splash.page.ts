import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SonidoService } from '../../nucleo/servicios/sonido.service';
import { GRUPO } from '../../nucleo/grupo';

/**
 * Cuánto dura el splash si el audio no llega a cargar.
 *
 * Alcanza para leer el nombre del grupo y los integrantes, que es lo que la
 * consigna pide mostrar acá.
 */
const DURACION_POR_DEFECTO = 2400;

/**
 * Pantalla de presentación animada (Splash Dinámica).
 *
 * Cumple con los requerimientos excluyentes:
 * - Ícono de la aplicación en el centro
 * - Nombre del grupo
 * - Apellidos y nombres de los cuatro integrantes
 * - Animación con pétalos y barra de avance
 * - Sonido gong de inicio
 * - Transición automática a la pantalla de presentación estática
 */
@Component({
  selector: 'lm-splash',
  template: `
    <div class="splash">
      <div class="petalos" aria-hidden="true">
        @for (petalo of petalos; track $index) {
          <i
            [style.left.%]="petalo.x"
            [style.width.px]="petalo.tamano"
            [style.height.px]="petalo.tamano"
            [style.animation-delay.ms]="petalo.retraso"
            [style.animation-duration.ms]="petalo.duracion"
          ></i>
        }
      </div>

      <div class="centro">
        <span class="sk-placa marca">
          <img src="assets/img/logo-animado.gif" width="120" height="120" alt="Ícono de SakurApp" />
        </span>
        <div class="nombre">
          <div class="titulo">SakurApp</div>
          <div class="bajada">Gestión Gastronómica</div>
        </div>
        <div class="barra"><span [style.animation-duration.ms]="duracion()"></span></div>
      </div>

      <div class="equipo">
        <div class="equipo__grupo">{{ grupo.nombre }}</div>
        <ul class="equipo__lista">
          @for (integrante of grupo.integrantes; track integrante) {
            <li>{{ integrante }}</li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .splash {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: calc(36px + env(safe-area-inset-top)) 24px calc(28px + env(safe-area-inset-bottom));
        text-align: center;
        overflow: hidden;
        background: var(--gradiente-marca);
      }
      .petalos { position: absolute; inset: 0; pointer-events: none; }
      .petalos i {
        position: absolute;
        top: 0;
        display: block;
        background: url("/assets/img/flor-2.png") center / contain no-repeat;
        opacity: 0;
        animation-name: sk-caer;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
      .centro {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        z-index: 1;
      }
      .marca { animation: lm-rise 700ms var(--ease-out-soft) both; }
      .nombre { animation: lm-rise 900ms var(--ease-out-soft) both; }
      .titulo {
        font: 900 44px/1 var(--font-display);
        letter-spacing: var(--tracking-tight);
        color: #FFFFFF;
        text-shadow: 0 3px 10px rgba(110, 18, 52, .34);
      }
      .bajada {
        font: var(--type-body-medium);
        color: rgba(255, 255, 255, .9);
        margin-top: 6px;
      }
      .barra {
        width: 160px;
        height: 5px;
        border-radius: 3px;
        background: rgba(255, 255, 255, .3);
        overflow: hidden;
        margin-top: 8px;
      }
      .barra span {
        display: block;
        height: 100%;
        background: #FFFFFF;
        animation: avance var(--ease-standard) both;
      }
      .equipo {
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        animation: lm-rise 1100ms var(--ease-out-soft) both;
      }
      .equipo__grupo {
        font: 700 15px/1.2 var(--font-display);
        color: #FFFFFF;
        letter-spacing: var(--tracking-wide);
        text-transform: uppercase;
      }
      .equipo__lista {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .equipo__lista li {
        font: var(--type-body-small);
        color: rgba(255, 255, 255, .82);
      }
      @keyframes avance { from { width: 4%; } to { width: 100%; } }
    `,
  ],
})
export class SplashPage implements OnInit {
  private readonly router = inject(Router);
  private readonly sonido = inject(SonidoService);
  protected readonly grupo = GRUPO;

  /**
   * La pantalla dura lo que dura el gong de inicio.
   *
   * No es un número fijo: se lee del propio archivo de audio, así que si
   * mañana se cambia el sonido, la animación de la barra y la transición a la
   * presentación se acomodan solas.
   */
  protected readonly duracion = signal(DURACION_POR_DEFECTO);

  protected readonly petalos = [
    { x: 8, tamano: 26, retraso: 0, duracion: 3200 },
    { x: 22, tamano: 18, retraso: 420, duracion: 3900 },
    { x: 38, tamano: 32, retraso: 900, duracion: 3000 },
    { x: 54, tamano: 20, retraso: 200, duracion: 4200 },
    { x: 70, tamano: 28, retraso: 1200, duracion: 3400 },
    { x: 86, tamano: 22, retraso: 640, duracion: 3700 },
  ];

  async ngOnInit(): Promise<void> {
    this.sonido.reproducir('inicio');

    const duracion = await this.sonido.duracion('inicio', DURACION_POR_DEFECTO);
    this.duracion.set(duracion);

    setTimeout(() => void this.router.navigate(['/presentacion'], { replaceUrl: true }), duracion);
  }
}

