import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Usuario } from '../../nucleo/modelos/modelos';
import { PERFILES_EMPLEADO, ROTULO_PERFIL } from '../../nucleo/modelos/enums';
import { FirestoreService } from '../../nucleo/servicios/firestore.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-dueno-empleados',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()">
        <lm-icono-boton
          accion
          icono="person_add"
          rotulo="Dar de alta un empleado"
          tono="primario"
          (presionar)="ir(['/dueno/alta-empleado'])"
        />
      </lm-encabezado>
      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="cargandoLista() || errorCarga() ? null : empleados().length">Empleados</lm-titulo>
        <lm-buscador marcador="Buscar por nombre o puesto" [valor]="busqueda()" (cambiar)="busqueda.set($event)" />
        @if (errorCarga()) {
          <lm-banner tono="error" titulo="No pudimos cargar los empleados">Volvé a abrir esta sección para intentar de nuevo.</lm-banner>
        } @else if (cargandoLista()) {
          <p class="lm-parrafo" role="status">Cargando empleados…</p>
        } @else if (visibles().length) {
          <div class="empleados__lista">
            @for (empleado of visibles(); track empleado.uid || empleado.id) {
              <article class="lm-pending empleado">
                <img class="lm-avatar" [src]="usuarios.avatarSushi(empleado)" [alt]="usuarios.nombreCompleto(empleado)" loading="lazy" decoding="async" />
                <b class="lm-pending__nombre">{{ usuarios.nombreCompleto(empleado) }}</b>
                <span class="lm-pending__meta"><lm-icono nombre="badge" [tamano]="18" />{{ roles[empleado.perfil] }}</span>
                @if (correo(empleado); as partes) {
                  <!-- Si no entra en un renglón, parte justo antes del "@". -->
                  <span class="lm-pending__meta lm-pending__meta--correo">
                    <lm-icono nombre="mail" [tamano]="18" />
                    <span class="correo"><span class="correo__parte">{{ partes.usuario }}</span><wbr /><span class="correo__parte">{{ partes.dominio }}</span></span>
                  </span>
                }
                <lm-chip [estado]="empleado.activo ? 'aprobado' : 'rechazado'">{{ empleado.activo ? 'Activo' : 'Inactivo' }}</lm-chip>
              </article>
            }
          </div>
        } @else {
          <lm-vacio icono="groups" [titulo]="busqueda() ? 'No encontramos empleados' : 'Todavía no hay empleados'">
            {{ busqueda() ? 'Probá con otro nombre o puesto.' : 'Los empleados que registres aparecerán acá.' }}
            @if (!busqueda()) {
              <lm-boton
                accion
                variante="secondary"
                icono="person_add"
                [ancho]="false"
                (presionar)="ir(['/dueno/alta-empleado'])"
              >
                Dar de alta un empleado
              </lm-boton>
            }
          </lm-vacio>
        }
      </div>
      <lm-barra-inferior [items]="secciones()" activo="empleados" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      /* La misma tarjeta que Registros: centrada, de arriba hacia abajo. */
      .empleado {
        min-width: 0; display: flex; flex-direction: column; align-items: center;
        justify-content: center; text-align: center; gap: 6px;
      }
      .lm-avatar { object-fit: cover; flex-shrink: 0; width: clamp(56px, 16vw, 72px); border-radius: 18px; }
      .lm-pending__nombre { font-size: clamp(16px, 4.6vw, 18px); }
      .lm-pending__meta { font-size: clamp(13px, 3.9vw, 15px); justify-content: center; max-width: 100%; }
      .lm-pending__meta--correo { align-items: flex-start; }
      .lm-pending__meta--correo .correo { text-align: left; min-width: 0; white-space: normal; overflow: visible; }
      .correo__parte {
        display: inline-block; max-width: 100%; vertical-align: top;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      /* Tandas exactas, como en Registros: cada tarjeta mide justo una parte del
         alto de la lista y el snap ancla tarjetas enteras, sin huecos. */
      .empleados__lista {
        flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3);
        container: empleados / size; overflow-y: auto; overscroll-behavior: contain;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0; scrollbar-width: none;
      }
      .empleados__lista::-webkit-scrollbar { display: none; }
      .empleados__lista > .empleado {
        --por: 1;
        flex: 0 0 calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por));
        min-height: min-content; scroll-snap-align: start; scroll-snap-stop: always;
      }
      @container empleados (min-height: 342px) { .empleados__lista > .empleado { --por: 2; } }
      @container empleados (min-height: 519px) { .empleados__lista > .empleado { --por: 3; } }
      @container empleados (min-height: 696px) { .empleados__lista > .empleado { --por: 4; } }
      @container empleados (max-width: 286px) and (max-height: 367px) { .empleados__lista > .empleado { --por: 1; } }
      @container empleados (max-width: 286px) and (min-height: 519px) and (max-height: 557px) { .empleados__lista > .empleado { --por: 2; } }
      @container empleados (max-width: 286px) and (min-height: 696px) and (max-height: 747px) { .empleados__lista > .empleado { --por: 3; } }
    `,
  ],
})
export class DuenoEmpleadosPage extends PaginaConSesion {
  protected readonly usuarios = inject(UsuariosService);
  private readonly firestore = inject(FirestoreService);
  protected readonly roles = ROTULO_PERFIL;
  protected readonly busqueda = signal('');
  protected readonly cargandoLista = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly empleados = signal<Usuario[]>([]);
  protected readonly visibles = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');
    return this.empleados().filter((u) =>
      `${this.usuarios.nombreCompleto(u)} ${this.roles[u.perfil]}`.toLocaleLowerCase('es-AR').includes(texto),
    );
  });

  /** El correo en dos mitades para poder partirlo antes del "@". */
  protected correo(empleado: Usuario): { usuario: string; dominio: string } | null {
    const email = empleado.email?.trim();
    if (!email) return null;
    const arroba = email.lastIndexOf('@');
    return arroba > 0
      ? { usuario: email.slice(0, arroba), dominio: email.slice(arroba) }
      : { usuario: email, dominio: '' };
  }

  constructor() {
    super();
    const cancelar = this.firestore.escucharUsuarios((usuarios) => {
      this.empleados.set(usuarios.filter((u) => PERFILES_EMPLEADO.includes(u.perfil))
        .sort((a, b) => this.usuarios.nombreCompleto(a).localeCompare(this.usuarios.nombreCompleto(b), 'es-AR')));
      this.cargandoLista.set(false);
      this.errorCarga.set(false);
    }, () => {
      this.cargandoLista.set(false);
      this.errorCarga.set(true);
    });
    inject(DestroyRef).onDestroy(cancelar);
  }
}
