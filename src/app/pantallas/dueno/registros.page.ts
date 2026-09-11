import { Component, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Usuario } from '../../nucleo/modelos/modelos';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';

/**
 * Los cuatro estados, en las mismas pestañas que usan la carta y los sectores:
 * entran los cuatro en el ancho de la pantalla, sin desplazamiento lateral.
 */
const FILTROS = [
  { valor: 'Todos', rotulo: 'Todos' },
  { valor: 'Pendiente', rotulo: 'Pendientes' },
  { valor: 'Aprobado', rotulo: 'Aprobados' },
  { valor: 'Rechazado', rotulo: 'Rechazados' },
];

/**
 * Punto 6 · Listado de clientes pendientes de aprobación.
 *
 * Aceptar y rechazar viven dentro de la fila, no en una barra global: la
 * decisión es por persona. Van separados veinte píxeles y con colores
 * opuestos, para que sea imposible confundirlos de un toque. El alta de
 * empleado es un ícono en el encabezado, no un botón flotante que taparía la
 * última fila.
 */
@Component({
  selector: 'lm-dueno-registros',
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

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="pendientes().length" bajada="Tocá aceptar o rechazar en la fila de cada persona">
          Registros pendientes
        </lm-titulo>

        @if (avisoPush()) {
          <lm-push
            variante="interno"
            [titulo]="avisoPush()!.titulo"
            [cuerpo]="avisoPush()!.cuerpo"
            (presionar)="marcarLeidos()"
          />
        }

        <lm-buscador
          marcador="Buscar por nombre o documento"
          [valor]="busqueda()"
          (cambiar)="busqueda.set($event)"
        />
        <lm-pestanas [opciones]="filtros" [valor]="filtro()" (cambiar)="filtro.set($event)" />

        @if (visibles().length) {
          <div class="lm-list">
            @for (cliente of visibles(); track cliente.id) {
              <lm-fila-pendiente
                [cliente]="cliente"
                (aceptar)="resolver(cliente, 'aprobado')"
                (rechazar)="resolver(cliente, 'rechazado')"
              />
            }
          </div>
        } @else {
          <lm-vacio icono="how_to_reg" [titulo]="tituloVacio()">
            {{ textoVacio() }}
            <lm-boton
              accion
              variante="secondary"
              icono="person_add"
              [ancho]="false"
              (presionar)="ir(['/dueno/alta-empleado'])"
            >
              Dar de alta un empleado
            </lm-boton>
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="registros" />
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
})
export class DuenoRegistrosPage extends PaginaConSesion {
  private readonly usuarios = inject(UsuariosService);
  private readonly notificaciones = inject(NotificacionesService);

  protected readonly filtros = FILTROS;
  protected readonly filtro = signal('Pendiente');
  protected readonly busqueda = signal('');

  protected readonly pendientes = computed(() => this.usuarios.pendientes());

  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');

    return this.usuarios
      .todos()
      .filter((u) => u.perfil === 'CLIENTE_REGISTRADO')
      .filter((u) => filtro === 'Todos' || this.rotulo(u) === filtro)
      .filter((u) => {
        if (!texto) return true;
        const nombre = this.usuarios.nombreCompleto(u).toLocaleLowerCase('es-AR');
        return nombre.includes(texto) || (u.dni ?? '').includes(texto);
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });

  protected avisoPush() {
    const id = this.usuario()?.id;
    return id ? (this.notificaciones.pendientesDe(id)[0] ?? null) : null;
  }

  protected marcarLeidos(): void {
    const id = this.usuario()?.id;
    if (id) this.notificaciones.marcarLeidos(id);
  }

  /** Puntos 7 y 8 · la decisión abre la pantalla de resultado, que dispara el correo. */
  protected resolver(cliente: Usuario, decision: 'aprobado' | 'rechazado'): void {
    this.ir(['/dueno/resultado', cliente.id, decision]);
  }

  protected tituloVacio(): string {
    if (this.busqueda().trim()) return 'No encontramos a nadie con esa búsqueda';
    if (this.filtro() === 'Pendiente') return 'No hay registros pendientes';
    if (this.filtro() === 'Todos') return 'Todavía no hay registros';
    return `No hay registros en estado ${this.filtro().toLocaleLowerCase('es-AR')}`;
  }

  protected textoVacio(): string {
    if (this.busqueda().trim()) return 'Probá con otro nombre o con el número de documento completo.';
    return 'Cuando alguien se registre desde la aplicación, su solicitud aparece acá para que la apruebes o la rechaces.';
  }

  private rotulo(usuario: Usuario): string {
    return usuario.estado.charAt(0) + usuario.estado.slice(1).toLocaleLowerCase('es-AR');
  }
}
