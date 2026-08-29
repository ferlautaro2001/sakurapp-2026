import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UI } from '../../ui';
import { GRUPO } from '../../nucleo/grupo';

/**
 * Pantalla de presentación estática (Splash Estática).
 *
 * Cumple con los requerimientos excluyentes:
 * - Ícono de la aplicación en el centro
 * - Nombre del grupo
 * - Apellidos y nombres de los cuatro integrantes
 * - Botón de acceso a la pantalla de ingreso
 */
@Component({
  selector: 'lm-presentacion',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <div class="lm-body lm-body--fijo cuerpo">
        <div class="marca">
          <span class="sk-placa">
            <img src="assets/img/logo-badge.png" width="124" height="124" alt="Ícono de SakurApp" />
          </span>
          <h1 class="titulo">SakurApp</h1>
          <p class="bajada">Gestión Gastronómica</p>
        </div>

        <div class="equipo">
          <span class="flor">
            <span class="flor__linea"></span>
            <img src="assets/img/flor-2.png" width="18" height="18" alt="" />
            <span class="flor__linea"></span>
          </span>

          <span class="equipo__grupo">{{ grupo.nombre }}</span>
          <ul class="equipo__lista">
            @for (integrante of grupo.integrantes; track integrante) {
              <li>{{ integrante }}</li>
            }
          </ul>
        </div>
      </div>

      <div class="lm-actionbar">
        <lm-boton icono="login" (presionar)="entrar()">Ingresar a SakurApp</lm-boton>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .cuerpo {
        position: relative;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding-top: calc(24px + env(safe-area-inset-top));
      }
      .marca {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      .titulo {
        margin: 0;
        font: 900 46px/1 var(--font-display);
        letter-spacing: var(--tracking-tight);
        color: #FFFFFF;
        text-shadow: 0 3px 10px rgba(110, 18, 52, .3);
      }
      .bajada {
        margin: 0;
        font: var(--type-body-medium);
        color: rgba(255, 255, 255, .88);
      }
      .flor {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
      }
      .flor__linea {
        height: 1px;
        flex: 1;
        max-width: 96px;
        background: rgba(255, 255, 255, .38);
      }
      .flor img { display: block; opacity: .9; }

      .equipo {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .equipo__grupo {
        font: 700 16px/1.2 var(--font-display);
        color: var(--text-sobre-fondo);
        letter-spacing: var(--tracking-wide);
        text-transform: uppercase;
      }
      .equipo__lista {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .equipo__lista li {
        font: var(--type-body-small);
        color: var(--text-sobre-fondo-suave);
      }
    `,
  ],
})
export class PresentacionPage {
  private readonly router = inject(Router);
  protected readonly grupo = GRUPO;

  protected entrar(): void {
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}

