import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Usuario } from '../../nucleo/modelos/modelos';
import { PERFILES_EMPLEADO, ROTULO_PERFIL } from '../../nucleo/modelos/enums';
import { FirestoreService } from '../../nucleo/servicios/firestore.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';

@Component({
  selector: 'lm-dueno-empleados',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />
      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="cargandoLista() || errorCarga() ? null : empleados().length">Empleados</lm-titulo>
        <lm-buscador marcador="Buscar por nombre o puesto" [valor]="busqueda()" (cambiar)="busqueda.set($event)" />
        @if (errorCarga()) {
          <lm-banner tono="error" titulo="No pudimos cargar los empleados">Volvé a abrir esta sección para intentar de nuevo.</lm-banner>
        } @else if (cargandoLista()) {
          <p class="lm-parrafo" role="status">Cargando empleados…</p>
        } @else if (visibles().length) {
          <div class="lm-list">
            @for (empleado of visibles(); track empleado.uid || empleado.id) {
              <article class="lm-pending">
                <div class="lm-pending__fila">
                  <img class="lm-avatar" [src]="usuarios.avatarSushi(empleado)" [alt]="usuarios.nombreCompleto(empleado)" />
                  <div class="lm-pending__datos">
                    <b class="lm-pending__nombre">{{ usuarios.nombreCompleto(empleado) }}</b>
                    <span class="lm-pending__meta">{{ roles[empleado.perfil] }}</span>
                    @if (empleado.email) {
                      <span class="lm-pending__meta"><lm-icono nombre="mail" [tamano]="15" /><span>{{ empleado.email }}</span></span>
                    }
                  </div>
                  <lm-chip [estado]="empleado.activo ? 'aprobado' : 'rechazado'">{{ empleado.activo ? 'Activo' : 'Inactivo' }}</lm-chip>
                </div>
              </article>
            }
          </div>
        } @else {
          <lm-vacio icono="groups" [titulo]="busqueda() ? 'No encontramos empleados' : 'Todavía no hay empleados'">
            {{ busqueda() ? 'Probá con otro nombre o puesto.' : 'Los empleados que registres aparecerán acá.' }}
          </lm-vacio>
        }
      </div>
      <lm-barra-inferior [items]="secciones()" activo="empleados" />
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}.lm-avatar{object-fit:cover;flex-shrink:0}'],
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
