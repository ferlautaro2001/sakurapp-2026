import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input, output } from '@angular/core';
import { Usuario } from '../nucleo/modelos/modelos';
import { ROTULO_ESTADO_USUARIO, ROTULO_PERFIL } from '../nucleo/modelos/enums';
import { UsuariosService } from '../nucleo/servicios/usuarios.service';
import { BotonComponent, ChipComponent, IconoComponent } from './basicos';
import { DocumentoPipe } from './documento.pipe';

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


/**
 * Fila de un comensal pendiente de aprobación.
 *
 * La foto va grande y a la izquierda, pegada a los nombres y apellidos, para
 * que nunca haya dudas de qué cara corresponde a qué registro. Aceptar y
 * rechazar viven dentro de la fila, no en una barra global: la decisión es por
 * persona. Van separados veinte píxeles y con colores opuestos, para que sea
 * imposible confundirlos de un toque.
 */
@Component({
  selector: 'lm-fila-pendiente',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, ChipComponent, BotonComponent, DocumentoPipe],
  template: `
    <div class="lm-pending">
      <button type="button" class="lm-pending__fila fila" (click)="abrir.emit()">
        <span class="lm-avatar" [style.background-image]="'url(' + usuarios.avatarSushi(cliente()) + ')'"></span>
        <span class="lm-pending__datos">
          <span class="lm-pending__nombre">{{ usuarios.nombreCompleto(cliente()) }}</span>
          <span class="lm-pending__meta">
            <lm-icono nombre="badge" [tamano]="15" />
            DNI: {{ cliente().dni | documento }}
          </span>
          <span class="lm-pending__meta">
            <lm-icono nombre="mail" [tamano]="15" />
            <span>{{ cliente().email ?? 'Sin correo' }}</span>
          </span>
        </span>
        <lm-chip [estado]="cliente().estado.toLowerCase()">{{ rotuloEstado() }}</lm-chip>
      </button>
      @if (cliente().estado === 'PENDIENTE' && conAcciones()) {
        <div class="lm-pending__acciones">
          <lm-boton variante="danger" icono="close" (presionar)="rechazar.emit()">Rechazar</lm-boton>
          <lm-boton variante="success" icono="check" (presionar)="aceptar.emit()">Aceptar</lm-boton>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      /*
       * La fila entera abre la ficha ampliada: la foto de la lista es chica y
       * la decisión merece ver bien la cara. Es un botón, no un div con click,
       * para que también se llegue con el teclado.
       */
      .fila {
        width: 100%;
        border: none;
        background: transparent;
        padding: 0;
        text-align: left;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }
      .fila:active { opacity: 0.7; }
    `,
  ],
})
export class FilaPendienteComponent {
  protected readonly usuarios = inject(UsuariosService);
  readonly cliente = input.required<Usuario>();
  readonly conAcciones = input(true, { transform: booleanAttribute });
  readonly aceptar = output<void>();
  readonly rechazar = output<void>();
  /** Toque sobre la fila: abre la ficha ampliada de la persona. */
  readonly abrir = output<void>();

  protected rotuloEstado(): string {
    return ROTULO_ESTADO_USUARIO[this.cliente().estado];
  }
}
