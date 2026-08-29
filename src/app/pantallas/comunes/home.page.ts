import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UI } from '../../ui';
import { SesionService } from '../../nucleo/servicios/sesion.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { SonidoService } from '../../nucleo/servicios/sonido.service';
import { Perfil, ROTULO_PERFIL } from '../../nucleo/modelos/enums';

/**
 * Página Principal tras el inicio de sesión.
 *
 * Cumple con los requerimientos de la entrega:
 * - Visualización de los datos del usuario autenticado
 * - Cierre de sesión visible en encabezado y en el cuerpo
 * - Confirmación modal antes de cerrar sesión (sin acciones accidentales de un solo toque)
 * - Borrado total de credenciales del dispositivo al cerrar sesión
 * - Sonido de cierre de la aplicación
 */
@Component({
  selector: 'lm-home',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap14">
        @if (usuario(); as u) {
          <div class="tarjeta-usuario">
            <span class="avatar-grande">
              <img [src]="usuarios.avatarSushi(u)" [alt]="usuarios.nombreCompleto(u)" width="52" height="52" />
            </span>
            <div class="datos-usuario">
              <h2 class="nombre">{{ usuarios.nombreCompleto(u) }}</h2>
              <span class="rol-badge">
                <lm-icono nombre="badge" [tamano]="16" />
                {{ rotuloPerfil(u.perfil) }}
              </span>
              @if (u.email) {
                <p class="correo">{{ u.email }}</p>
              }
            </div>
          </div>

          <div class="ficha-info">
            <h3 class="ficha-titulo">Sesión Activa</h3>
            <div class="ficha-fila">
              <span class="ficha-etiqueta">Estado de la cuenta:</span>
              <lm-chip estado="aprobado">Habilitada</lm-chip>
            </div>
            <div class="ficha-fila">
              <span class="ficha-etiqueta">Identificador:</span>
              <span class="ficha-valor">{{ u.id }}</span>
            </div>
            <div class="ficha-fila">
              <span class="ficha-etiqueta">Permisos asignados:</span>
              <span class="ficha-valor">{{ rotuloPerfil(u.perfil) }}</span>
            </div>
          </div>

          <div class="ficha-info">
            <h3 class="ficha-titulo">Entrega Preliminar (MVP)</h3>
            <p class="ficha-texto">
              Esta versión cubre la conformación del grupo, pantallas de presentación estática y animada,
              ícono de la aplicación, formulario de ingreso con validaciones, accesos rápidos y persistencia
              de credenciales con cierre de sesión.
            </p>
          </div>
        }
      </div>

      <div class="lm-actionbar">
        <lm-boton variante="danger" icono="logout" (presionar)="cerrarSesion()">
          Cerrar sesión
        </lm-boton>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .tarjeta-usuario {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: var(--surface-card);
        border-radius: var(--radius-card);
        border: 1px solid var(--border-card);
        box-shadow: var(--shadow-card);
      }
      .avatar-grande {
        width: 68px;
        height: 68px;
        flex: 0 0 auto;
        border-radius: 50%;
        background: #FFFFFF;
        border: 2px solid rgba(185, 46, 88, 0.2);
        display: grid;
        place-items: center;
        overflow: hidden;
        box-shadow: 0 3px 8px rgba(110, 18, 52, 0.12);
      }
      .avatar-grande img {
        width: 50px;
        height: 50px;
        object-fit: contain;
        display: block;
      }
      .datos-usuario {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .nombre {
        margin: 0;
        font: 800 20px/1.2 var(--font-display);
        color: var(--text-title);
      }
      .rol-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font: 700 13px/1 var(--font-text);
        color: var(--action-primary);
      }
      .correo {
        margin: 0;
        font: var(--type-caption);
        color: var(--text-muted);
      }
      .ficha-info {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 16px;
        background: var(--surface-card);
        border-radius: var(--radius-card);
        border: 1px solid var(--border-card);
      }
      .ficha-titulo {
        margin: 0;
        font: 700 16px/1.2 var(--font-display);
        color: var(--text-title);
      }
      .ficha-fila {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .ficha-etiqueta {
        font: var(--type-body-small);
        color: var(--text-muted);
      }
      .ficha-valor {
        font: 700 13px/1.2 var(--font-text);
        color: var(--text-body);
      }
      .ficha-texto {
        margin: 0;
        font: var(--type-body-small);
        color: var(--text-body);
        line-height: 1.4;
      }
    `,
  ],
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);
  protected readonly usuarios = inject(UsuariosService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly sonido = inject(SonidoService);

  protected readonly usuario = this.sesion.usuario;

  protected rotuloPerfil(perfil: Perfil): string {
    return ROTULO_PERFIL[perfil];
  }

  protected async cerrarSesion(): Promise<void> {
    const nombre = this.usuario()?.nombre ?? '';
    const seguro = await this.confirmacion.pedir({
      titulo: '¿Cerrás la sesión?',
      mensaje: 'Se borrarán las credenciales guardadas en este dispositivo y volverás a la pantalla de ingreso.',
      confirmar: 'Cerrar sesión',
      tono: 'peligro',
      icono: 'logout',
    });

    if (!seguro) return;

    await this.cargando.conEsperaMinima('Cerrando la sesión…', () => this.sesion.cerrar(), 400);
    this.sonido.reproducir('cierre');
    this.avisos.info('Cerraste la sesión', `Hasta luego, ${nombre}. Se borraron las credenciales del dispositivo.`);
    await this.router.navigate(['/login'], { replaceUrl: true });
  }
}

