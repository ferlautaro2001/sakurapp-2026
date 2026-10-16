import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { UI } from '../../ui';

/**
 * Por qué el usuario no puede ingresar: la cuenta está en revisión o fue
 * rechazada.
 *
 * Es la misma tarjeta que ve el comensal cuando manda el pedido y espera al
 * mozo, y la misma con la que se despide el registro: título, el círculo
 * grande con el ícono, la línea que dice qué pasa y la que dice qué sigue.
 * Los tres momentos son el mismo —mandó algo y depende de que alguien lo
 * revise—, así que se leen igual.
 *
 * Lo único que cambia entre los dos estados es el color del círculo y el
 * ícono: el reloj en ámbar mientras se revisa, el bloqueo en rojo si no entró.
 */
@Component({
  selector: 'lm-estado-cuenta',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Estado de tu cuenta" conVolver (volver)="login()" />

      <div class="lm-body lm-body--centrado">
        <div class="lm-card espera">
          <h1 class="espera__titulo">{{ titulo() }}</h1>

          <span class="espera__reloj" [style.background]="color()">
            <lm-icono [nombre]="glifo()" tamano="clamp(46px, 17vw, 84px)" color="#FFFFFF" />
          </span>

          <div class="espera__mensaje">
            <b>{{ detalle() }}</b>
            <span class="espera__correo">
              <lm-icono nombre="outgoing_mail" [tamano]="18" color="var(--text-muted)" />
              <span class="espera__subtexto">{{ siguiente() }}</span>
            </span>
          </div>
        </div>
      </div>

      @if (!pendiente()) {
        <div class="lm-actionbar">
          <lm-boton variante="secondary" icono="person" (presionar)="invitado()">Ingresar como invitado</lm-boton>
          <lm-texto-boton (presionar)="login()">Volver al login</lm-texto-boton>
        </div>
      }
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
      /* El color lo pone el estado: ámbar mientras se revisa, rojo si no entró.
         El ícono va en blanco, que contra los dos se lee. */
      .espera__reloj {
        width: clamp(96px, 36vw, 156px); height: clamp(96px, 36vw, 156px); border-radius: 50%; display: grid; place-items: center;
      }
      .espera__mensaje {
        display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%;
      }
      .espera b { font: var(--type-section); color: var(--text-title); text-wrap: pretty; }
      .espera__correo {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        padding-top: 12px; width: 100%;
        border-top: 1px solid var(--border-divider);
      }
      .espera__subtexto {
        font: var(--type-body); color: var(--text-muted); text-wrap: pretty;
      }
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
  protected glifo(): string {
    return this.pendiente() ? 'hourglass_top' : 'block';
  }
  protected titulo(): string {
    return this.pendiente() ? 'Revisión en proceso' : 'Acceso denegado';
  }
  protected detalle(): string {
    return this.pendiente()
      ? 'Tu registro está pendiente de aprobación'
      : 'Tu cuenta fue rechazada, así que no podés entrar con estos datos';
  }
  protected siguiente(): string {
    return this.pendiente()
      ? 'Cuando seas aprobado te llegará un correo electrónico'
      : 'Podés entrar como invitado con foto y nombre.';
  }

  protected login(): void {
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
  protected invitado(): void {
    void this.router.navigate(['/registro-invitado']);
  }
}
