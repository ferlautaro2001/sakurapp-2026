import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UI } from '../../ui';

/**
 * Confirmación del envío del registro para clientes.
 *
 * Es la misma tarjeta que ve el comensal cuando manda el pedido y espera al
 * mozo: título, reloj y las dos líneas que cuentan qué está pasando. Los dos
 * momentos son el mismo —mandó algo y depende de que alguien lo revise—, así
 * que se leen igual. Acá el reloj va más grande, al tamaño de la ficha de
 * "estado de tu cuenta", porque esta pantalla no tiene nada más que mirar.
 */
@Component({
  selector: 'lm-registro-enviado',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <div class="lm-body lm-body--centrado">
        <lm-logo [conNombre]="false" [tamano]="82" />

        <div class="lm-card espera">
          <h1 class="espera__titulo">Registro enviado</h1>
          <span class="espera__reloj">
            <lm-icono nombre="hourglass_top" [tamano]="46" color="var(--action-primary)" />
          </span>
          <b>El dueño o el supervisor van a revisar tus datos</b>
          <small>
            Te avisamos por correo electrónico en cuanto esté resuelto. Mientras tanto podés
            entrar como invitado.
          </small>
        </div>
      </div>

      <div class="lm-actionbar">
        <lm-boton variante="secondary" icono="person" (presionar)="invitado()">Ingresar como invitado</lm-boton>
        <lm-texto-boton (presionar)="login()">Volver al inicio</lm-texto-boton>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .espera {
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        padding: 24px 18px; text-align: center;
      }
      .espera__titulo {
        margin: 0 0 6px; font: var(--type-title); letter-spacing: var(--tracking-tight);
        color: var(--text-title); text-wrap: balance;
      }
      /* El reloj es lo único que se mira acá, así que va al tamaño de la ficha
         de estado de cuenta y no al de la tarjeta del pedido. */
      .espera__reloj {
        width: 88px; height: 88px; border-radius: 50%; display: grid; place-items: center;
        background: var(--surface-sunken);
      }
      .espera b { font: var(--type-card-title); color: var(--text-title); text-wrap: pretty; }
      .espera small { font: var(--type-body-small); color: var(--text-muted); text-wrap: pretty; }
    `,
  ],
})
export class RegistroEnviadoPage {
  private readonly router = inject(Router);

  protected invitado(): void {
    void this.router.navigate(['/registro-invitado']);
  }
  protected login(): void {
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}
