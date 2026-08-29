import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UI } from '../../ui';

/**
 * Confirmación del envío del registro para clientes.
 */
@Component({
  selector: 'lm-registro-enviado',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <div class="lm-body lm-body--centrado">
        <lm-logo [conNombre]="false" [tamano]="82" />
        <lm-titulo>Registro enviado</lm-titulo>
        <p class="lm-parrafo">
          El dueño o el supervisor van a revisar tus datos. Te avisamos por correo electrónico en cuanto esté resuelto.
        </p>

        <div class="lm-card tarjeta">
          <lm-icono nombre="hourglass_top" [tamano]="22" color="var(--action-accent)" />
          <span>Revisión de cuenta en proceso — pendiente de aprobación</span>
        </div>

        <lm-separador rotulo="Mientras esperás" />
        <p class="lm-parrafo">
          Podés entrar como invitado mientras el encargado revisa y aprueba tu cuenta.
        </p>
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
      .tarjeta {
        display: flex; align-items: center; gap: 10px; padding: 14px; text-align: left;
        font: var(--type-body-small); color: var(--text-body);
      }
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

