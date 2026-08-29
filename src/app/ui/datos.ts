import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input, output } from '@angular/core';
import { Usuario } from '../nucleo/modelos/modelos';
import { ROTULO_PERFIL } from '../nucleo/modelos/enums';
import { UsuariosService } from '../nucleo/servicios/usuarios.service';

/** Tarjeta de perfil del ingreso rápido: foto o iniciales, nombre y rol. Nunca un combo. */
@Component({
  selector: 'lm-tarjeta-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="lm-profile" (click)="presionar.emit()">
      <span class="lm-profile__avatar">
        <img [src]="usuarios.avatarSushi(usuario())" [alt]="usuario().nombre" width="34" height="34" />
      </span>
      <span class="lm-profile__texto">
        <b>{{ soloNombre() ? usuario().nombre : usuarios.nombreCompleto(usuario()) }}</b>
        <small>{{ rotulo() }}</small>
      </span>
    </button>
  `,
  styles: [
    `
      :host { display: block; }
      .lm-profile {
        display: flex; align-items: center; gap: 10px; width: 100%;
        min-height: 52px; padding: 7px 10px; text-align: left; cursor: pointer;
        border-radius: var(--radius-field); background: var(--surface-card);
        border: 1.5px solid var(--border-field);
        box-shadow: 0 1px 3px rgba(110, 18, 52, 0.05);
        transition: transform var(--dur-fast), border-color var(--dur-fast);
      }
      .lm-profile:active {
        border-color: var(--action-primary);
        box-shadow: var(--shadow-card);
        transform: scale(0.98);
      }
      .lm-profile__avatar {
        width: 38px; height: 38px; flex: 0 0 auto; border-radius: 50%;
        background: #FFFFFF;
        border: 1.5px solid rgba(185, 46, 88, 0.18);
        display: grid; place-items: center;
        overflow: hidden;
        box-shadow: 0 2px 5px rgba(110, 18, 52, 0.08);
      }
      .lm-profile__avatar img {
        width: 28px; height: 28px; object-fit: contain; display: block;
      }
      .lm-profile__texto { flex: 1; min-width: 0; }
      .lm-profile__texto b {
        display: block;
        font: 700 13.5px/1.2 var(--font-display, inherit);
        color: var(--text-title);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lm-profile__texto small {
        display: block;
        font: 500 11.5px/1.2 var(--font-text, inherit);
        color: var(--text-muted);
      }
    `,
  ],
})
export class TarjetaPerfilComponent {
  protected readonly usuarios = inject(UsuariosService);
  readonly usuario = input.required<Usuario>();
  readonly soloNombre = input(false, { transform: booleanAttribute });
  readonly presionar = output<void>();

  protected rotulo(): string {
    return ROTULO_PERFIL[this.usuario().perfil];
  }
}

