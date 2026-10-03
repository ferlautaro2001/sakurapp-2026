import { Component, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { ROTULO_ESTADO_MESA, ROTULO_TIPO_MESA } from '../../nucleo/modelos/enums';

const ESTADOS = ['Vacía', 'Ocupada', 'Inactiva'].map((r) => ({ valor: r, rotulo: r }));
const TIPOS = ['Estándar', 'VIP', 'Movilidad reducida'].map((r) => ({ valor: r, rotulo: r }));

/**
 * Punto 4 · Grilla y gestión de mesas del salón SakurApp.
 *
 * Muestra el estado operativo de todas las mesas del restaurante en tiempo real.
 * Si el usuario es Dueño o Supervisor, permite dar de alta nuevas mesas.
 */
@Component({
  selector: 'lm-mesas',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()">
        @if (puedeAgregar()) {
          <lm-icono-boton
            accion
            icono="add"
            rotulo="Agregar una mesa"
            tono="primario"
            (presionar)="ir(['/admin/alta-mesa'])"
          />
        }
      </lm-encabezado>

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="visibles().length">Mesas del salón</lm-titulo>

        <!--
          Ocho chips seguidos con el mismo peso no dejan ver que son dos
          preguntas distintas: el rótulo de arriba de cada tira dice cuál se
          está respondiendo, y de paso recupera el dato de disponibilidad que
          antes repetía el pill del encabezado.
        -->
        <div class="grupo">
          <span class="grupo__rotulo">Disponibilidad</span>
          <lm-segmentado desactivable vidrio [opciones]="estados" [valor]="estado()" (cambiar)="estado.set($event)" />
        </div>
        <div class="grupo">
          <span class="grupo__rotulo">Tipo de mesa</span>
          <lm-segmentado desactivable vidrio [opciones]="tipos" [valor]="tipo()" (cambiar)="tipo.set($event)" />
        </div>

        @if (visibles().length) {
          <div class="lm-lista-uno">
            @for (mesa of visibles(); track mesa.id) {
              <lm-tarjeta-mesa
                [mesa]="mesa"
                [conEdicion]="puedeEditar()"
                [mostrarEstado]="!estado()"
                [mostrarTipo]="!tipo()"
                (presionar)="ir(['/mesas', mesa.id])"
                (abrirQr)="ir(['/mesas', mesa.id, 'qr'])"
                (abrirEdicion)="editarMesa(mesa.id)"
              />
            }
          </div>
        } @else {
          <lm-vacio icono="table_restaurant" [titulo]="tituloVacio()">
            {{ textoVacio() }}
            @if (puedeAgregar()) {
              <lm-boton accion variante="secondary" icono="add" [ancho]="false" (presionar)="ir(['/admin/alta-mesa'])">
                Agregar una mesa
              </lm-boton>
            }
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="mesas" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .grupo { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
      .grupo__rotulo {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-sobre-fondo-suave);
      }
    
      /* De a dos mesas por pantalla (de a una si hay una o dos, o si la pantalla
         es baja): la tarjeta toma todo el alto de su casilla y la foto la llena. */
      @media (max-height: 700px) { .lm-lista-uno:has(> :nth-child(3)) { --por: 1; } }
      .lm-lista-uno > lm-tarjeta-mesa { display: flex; flex-direction: column; }
      .lm-lista-uno > lm-tarjeta-mesa ::ng-deep .lm-mesa { aspect-ratio: auto; width: 100%; height: 100%; flex: 1 1 auto; }
    `,
  ],
})
export class MesasPage extends PaginaConSesion {
  protected readonly mesas = inject(MesasService);

  protected readonly estados = ESTADOS;
  protected readonly tipos = TIPOS;
  protected readonly estado = signal('');
  protected readonly tipo = signal('');

  protected readonly puedeAgregar = computed(() => this.sesion.esAdministrador());
  /** Dueño y supervisor son los únicos que editan comensales y tipo de mesa. */
  protected readonly puedeEditar = computed(() => this.sesion.esAdministrador());

  /**
   * El lápiz lleva a la pantalla del código, que es donde vive la edición, y
   * le avisa por la dirección que abra los campos ya desplegados. Entrar por
   * la tarjeta lleva a la misma pantalla pero sin resaltar nada.
   */
  protected editarMesa(id: string): void {
    void this.router.navigate(['/mesas', id, 'qr'], { queryParams: { editar: 1 } });
  }

  protected readonly visibles = computed(() =>
    this.mesas
      .todas()
      .filter((m) => !this.estado() || ROTULO_ESTADO_MESA[m.estado] === this.estado())
      .filter((m) => !this.tipo() || ROTULO_TIPO_MESA[m.tipo] === this.tipo()),
  );


  protected tituloVacio(): string {
    return this.mesas.todas().length ? 'Ninguna mesa entra en el filtro' : 'Todavía no hay mesas cargadas';
  }

  protected textoVacio(): string {
    return this.mesas.todas().length
      ? 'Probá con otro estado o con otro tipo de mesa.'
      : 'Cargá el número, la cantidad de comensales, el tipo y la foto: el código QR se genera solo.';
  }
}
