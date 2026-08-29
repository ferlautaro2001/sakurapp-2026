import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { UI } from '../../ui';

/**
 * Pantalla que indica por qué el usuario no puede ingresar (Pendiente o Rechazado).
 */
@Component({
  selector: 'lm-estado-cuenta',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Estado de tu cuenta" conVolver (volver)="login()" />

      <div class="lm-body">
        <div class="ficha" [style.background]="fondo()" [style.border-color]="color()">
          <span class="ficha__icono" [style.background]="color()">
            <lm-icono [nombre]="glifo()" [tamano]="46" color="var(--lm-surface, #FFFFFF)" />
          </span>
          <span class="ficha__titulo">{{ titulo() }}</span>
          <lm-chip [estado]="pendiente() ? 'pendiente' : 'rechazado'">
            {{ pendiente() ? 'Pendiente' : 'Rechazado' }}
          </lm-chip>
          <span class="ficha__texto">{{ detalle() }}</span>
        </div>

        <lm-separador [rotulo]="pendiente() ? 'Qué pasa ahora' : 'Qué podés hacer'" />
        <p class="lm-parrafo">{{ siguiente() }}</p>

        <div class="lm-card aviso">
          <lm-icono nombre="outgoing_mail" [tamano]="22" color="var(--action-primary)" />
          <span>
            {{
              pendiente()
                ? 'Cuando el dueño o el supervisor resuelvan, te llega un correo electrónico automático.'
                : 'Te enviamos un correo electrónico con el motivo del rechazo.'
            }}
          </span>
        </div>
      </div>

      <div class="lm-actionbar">
        @if (pendiente()) {
          <lm-boton variante="secondary" icono="home" (presionar)="login()">Volver al inicio</lm-boton>
        } @else {
          <lm-boton variante="secondary" icono="person" (presionar)="invitado()">Ingresar como invitado</lm-boton>
          <lm-texto-boton (presionar)="login()">Volver al login</lm-texto-boton>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .ficha {
        display: flex; flex-direction: column; align-items: center; gap: 14px;
        padding: 30px 20px; border-radius: var(--radius-card); border: 1px solid; text-align: center;
      }
      .ficha__icono { width: 88px; height: 88px; border-radius: 50%; display: grid; place-items: center; }
      .ficha__titulo { font: var(--type-title); color: var(--text-title); }
      .ficha__texto { font: var(--type-body); color: var(--text-muted); text-wrap: pretty; }
      .aviso { display: flex; align-items: center; gap: 10px; padding: 14px; font: var(--type-body-small); color: var(--text-body); }
    `,
  ],
})
export class EstadoCuentaPage {
  private readonly router = inject(Router);

  /** 'pendiente' o 'rechazado', tomado de la ruta. */
  readonly estado = input<string>('pendiente');

  protected readonly pendiente = computed(() => this.estado() !== 'rechazado');

  protected color(): string {
    return this.pendiente() ? 'var(--action-accent)' : 'var(--state-error)';
  }
  protected fondo(): string {
    return this.pendiente() ? 'var(--state-pending-surface)' : 'var(--state-error-surface)';
  }
  protected glifo(): string {
    return this.pendiente() ? 'hourglass_top' : 'block';
  }
  protected titulo(): string {
    return this.pendiente() ? 'Revisión de cuenta en proceso' : 'Acceso denegado';
  }
  protected detalle(): string {
    return this.pendiente()
      ? 'Tu registro está pendiente de aprobación. Todavía no podés entrar a la aplicación.'
      : 'Tu cuenta fue rechazada, así que no podés entrar con estos datos.';
  }
  protected siguiente(): string {
    return this.pendiente()
      ? 'La revisión suele resolverse en el día. No hace falta volver a registrarse.'
      : 'Podés entrar como invitado con foto y nombre.';
  }

  protected login(): void {
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
  protected invitado(): void {
    void this.router.navigate(['/registro-invitado']);
  }
}

