import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input, output } from '@angular/core';
import { IconoComponent, IconoBotonComponent } from './basicos';
import { SesionService } from '../nucleo/servicios/sesion.service';
import { UsuariosService } from '../nucleo/servicios/usuarios.service';
import { ROTULO_PERFIL } from '../nucleo/modelos/enums';

/**
 * Encabezado con avatar, nombre, rol visible y botón de cerrar sesión.
 */
@Component({
  selector: 'lm-encabezado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, IconoBotonComponent],
  template: `
    <header class="lm-header">
      <div class="lm-header__fila">
        @if (conVolver()) {
          <lm-icono-boton icono="arrow_back" rotulo="Volver" pegadoIzquierda (presionar)="volver.emit()" />
        } @else if (usuario()) {
          <span class="lm-header__avatar">
            <img [src]="usuarios.avatarSushi(usuario())" [alt]="usuario()?.nombre ?? 'Avatar'" width="30" height="30" />
          </span>
        }
        <div class="lm-header__texto">
          <span class="lm-header__nombre">{{ titulo() ?? usuarios.nombreCompleto(usuario()) }}</span>
          @if (!titulo() && usuario()) {
            <span class="lm-header__rol">
              <lm-icono nombre="badge" [tamano]="13" />
              {{ rotulo() }}
            </span>
          }
        </div>
        <ng-content select="[accion]" />
        @if (!titulo()) {
          <lm-icono-boton icono="logout" rotulo="Cerrar sesión" (presionar)="cerrarSesion.emit()" />
        }
      </div>
    </header>
  `,
  styles: [':host{display:block;flex:0 0 auto}'],
})
export class EncabezadoComponent {
  protected readonly usuarios = inject(UsuariosService);
  private readonly sesion = inject(SesionService);

  readonly titulo = input<string | null>(null);
  readonly conVolver = input(false, { transform: booleanAttribute });
  readonly volver = output<void>();
  readonly cerrarSesion = output<void>();

  protected usuario() {
    return this.sesion.usuario();
  }
  protected rotulo(): string {
    const u = this.sesion.usuario();
    return u ? ROTULO_PERFIL[u.perfil] : '';
  }
}

