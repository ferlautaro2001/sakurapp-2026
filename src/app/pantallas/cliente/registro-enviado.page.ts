import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UI } from '../../ui';

/**
 * Confirmación del envío del registro para clientes.
 *
 * Es la misma tarjeta que ve el comensal cuando manda el pedido y espera al
 * mozo: título, reloj y una línea que cuenta qué está pasando. Los dos
 * momentos son el mismo —mandó algo y depende de que alguien lo revise—, así
 * que se leen igual. Acá el reloj va más grande, al tamaño de la ficha de
 * "estado de tu cuenta", porque esta pantalla no tiene nada más que mirar.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-registro-enviado',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <!-- Sólo la flecha: acá todavía no hay sesión, así que no va el nombre ni cerrar sesión. -->
      <header class="lm-header">
        <div class="lm-header__fila">
          <lm-icono-boton icono="arrow_back" rotulo="Volver" pegadoIzquierda (presionar)="login()" />
        </div>
      </header>

      <div class="lm-body lm-body--centrado">
        <div class="lm-card espera">
          <h1 class="espera__titulo">Registro enviado</h1>
          <span class="espera__reloj">
            <lm-icono nombre="hourglass_top" tamano="clamp(46px, 17vw, 84px)" color="var(--action-primary)" />
          </span>
          <b>Te enviaremos un correo electrónico cuando verifiquemos los datos de tu registro</b>
        </div>
      </div>

      <div class="lm-actionbar">
        <lm-texto-boton (presionar)="login()">Volver al inicio</lm-texto-boton>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .espera {
        flex: 1 1 auto;
        display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; gap: var(--space-3);
        padding: var(--space-6) var(--space-5); text-align: center;
      }
      .espera__titulo {
        margin: 0 0 6px; font: var(--type-title-xl); letter-spacing: var(--tracking-tight);
        color: var(--text-title); text-wrap: balance;
      }
      /* El reloj es lo único que se mira acá, así que va al tamaño de la ficha
         de estado de cuenta y no al de la tarjeta del pedido. */
      .espera__reloj {
        width: clamp(96px, 36vw, 156px); height: clamp(96px, 36vw, 156px); border-radius: 50%; display: grid; place-items: center;
        background: var(--surface-sunken);
        border: 1.5px solid rgba(255, 255, 255, .6);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), 0 3px 8px rgba(94, 12, 44, .14);
      }
      .espera b { font: var(--type-section); color: var(--text-title); text-wrap: pretty; }
    `,
  ],
})
export class RegistroEnviadoPage {
  private readonly router = inject(Router);

  protected login(): void {
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}
