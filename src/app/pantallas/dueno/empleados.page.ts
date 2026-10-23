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
        <lm-buscador marcador="Buscar por nombre" [valor]="busqueda()" (cambiar)="busqueda.set($event)" />
        <lm-pestanas [opciones]="filtrosRol" [valor]="filtroRol()" (cambiar)="filtroRol.set($event)" />
        @if (errorCarga()) {
          <lm-banner tono="error" titulo="No pudimos cargar los empleados">Volvé a abrir esta sección para intentar de nuevo.</lm-banner>
        } @else if (cargandoLista()) {
          <p class="lm-parrafo" role="status">Cargando empleados…</p>
        } @else if (visibles().length) {
          <div class="empleados__lista">
            @for (empleado of visibles(); track empleado.uid || empleado.id) {
              <article class="lm-pending empleado">
                <h3 class="lm-pending__titulo">
                  <span class="lm-pending__nombre">{{ usuarios.nombreCompleto(empleado) }}</span>
                </h3>
                <span class="lm-pending__foto">
                  <img class="lm-avatar" [src]="usuarios.avatarSushi(empleado)" [alt]="usuarios.nombreCompleto(empleado)" loading="lazy" decoding="async" />
                </span>
                <span class="lm-pending__datos">
                  <span class="lm-pending__meta"><lm-icono nombre="badge" [tamano]="20" />{{ roles[empleado.perfil] }}</span>
                  @if (correo(empleado); as partes) {
                    <!-- Si no entra en un renglón, parte justo antes del "@". -->
                    <span class="lm-pending__meta lm-pending__meta--correo">
                      <lm-icono nombre="mail" [tamano]="20" />
                      <span class="correo"><span class="correo__parte">{{ partes.usuario }}</span><wbr /><span class="correo__parte">{{ partes.dominio }}</span></span>
                    </span>
                  }
                </span>
                <lm-chip class="lm-pending__estado" [estado]="empleado.activo ? 'aprobado' : 'rechazado'">{{ empleado.activo ? 'Activo' : 'Inactivo' }}</lm-chip>
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
      /* La tarjeta es la misma que la de Registros —el aspecto vive en el
         sistema de diseño, en .lm-pending—; acá sólo se decide cuánto mide y
         cuánto de ese alto se lleva la foto. Una por pantalla: el nombre, la
         foto grande y los datos no entran dos veces sin cortarse. */
      .empleados__lista {
        flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3);
        container: empleados / size; overflow-y: auto; overscroll-behavior: contain;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0; scrollbar-width: none;
      }
      .empleados__lista::-webkit-scrollbar { display: none; }
      .empleados__lista > .empleado {
        flex: 0 0 100cqh;
        min-height: min-content; scroll-snap-align: start; scroll-snap-stop: always;
        /* El chip de estado va en su propia fila, bajo el nombre. La grilla base
           de .lm-pending no la declara y sin ella el chip rompía la tarjeta. */
        grid-template-areas: "titulo" "estado" "foto" "datos";
        grid-template-rows: auto auto minmax(min-content, 1fr) auto;
      }
      /* Sin decisiones al pie sobra más alto que en Registros, y lo toma la
         foto: del alto de la tarjeta se descuentan el título, el chip de
         estado, el puesto, el correo, los huecos y el relleno (unos 170px). El
         único techo real es el ancho de la tarjeta: 300px. */
      .empleados__lista > .empleado .lm-pending__foto {
        width: min(100%, clamp(104px, calc(100cqh - 170px), 300px));
      }
    `,
  ],
})
export class DuenoEmpleadosPage extends PaginaConSesion {
  protected readonly usuarios = inject(UsuariosService);
  private readonly firestore = inject(FirestoreService);
  protected readonly roles = ROTULO_PERFIL;
  protected readonly busqueda = signal('');
  protected readonly filtroRol = signal('Todos');
  /** "Todos" va al final de la fila; sigue siendo el filtro inicial. */
  protected readonly filtrosRol = [ROTULO_PERFIL['CANTINERO'], ...PERFILES_EMPLEADO.filter((p) => p !== 'CANTINERO').map((p) => ROTULO_PERFIL[p]), 'Todos']
    .map((r) => ({ valor: r, rotulo: r }));
  protected readonly cargandoLista = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly empleados = signal<Usuario[]>([]);
  protected readonly visibles = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');
    const rol = this.filtroRol();
    return this.empleados().filter((u) =>
      (rol === 'Todos' || this.roles[u.perfil] === rol) &&
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
