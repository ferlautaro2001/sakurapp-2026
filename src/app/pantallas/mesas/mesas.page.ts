import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { EstadoMesa, ROTULO_ESTADO_MESA, ROTULO_TIPO_MESA } from '../../nucleo/modelos/enums';
import { Mesa } from '../../nucleo/modelos/modelos';
import { ModalMesaComponent, ModalMesaQrComponent } from './modal-mesa';

/*
 * Cada filtro tiene su "Todas" al principio: antes el único jeito de apagar
 * un filtro era tocar otra vez la opción activa, y eso no se descubre. El
 * valor de cada opción es el rótulo del modelo, que es como se comparan las
 * mesas; "Todas" vale cadena vacía, que no filtra nada.
 */
const ESTADOS = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Vacía', rotulo: 'Vacías' },
  { valor: 'Ocupada', rotulo: 'Ocupadas' },
  { valor: 'Inactiva', rotulo: 'Inactivas' },
];
const TIPOS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'Estándar', rotulo: 'Estándar' },
  { valor: 'VIP', rotulo: 'VIP' },
  { valor: 'Movilidad reducida', rotulo: 'Accesible' },
];

/** Cómo se lee cada estado en el resumen y con qué color. */
const RESUMEN: { clave: EstadoMesa; singular: string; plural: string }[] = [
  { clave: 'VACIA', singular: 'vacía', plural: 'vacías' },
  { clave: 'OCUPADA', singular: 'ocupada', plural: 'ocupadas' },
  { clave: 'INACTIVA', singular: 'inactiva', plural: 'inactivas' },
];

/**
 * Punto 4 · Grilla y gestión de mesas del salón SakurApp.
 *
 * Muestra el estado operativo de todas las mesas del restaurante en tiempo real.
 * Si el usuario es Dueño o Supervisor, permite dar de alta nuevas mesas.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-mesas',
  imports: [...UI, ModalMesaComponent, ModalMesaQrComponent],
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
          El estado del salón, de un vistazo: cuántas mesas hay libres,
          ocupadas y apagadas. Es la pregunta que trae a esta pantalla, así
          que va arriba de todo, antes que los filtros. Sólo se cuentan las
          mesas que se están viendo, para que el resumen nunca contradiga la
          lista de abajo.
        -->
        @if (resumen().length) {
          <p class="resumen">
            @for (dato of resumen(); track dato.clave) {
              <span class="resumen__dato">
                <span class="resumen__punto resumen__punto--{{ dato.clave }}"></span>
                {{ dato.texto }}
              </span>
            }
          </p>
        }

        <!--
          Dos filtros, uno por pregunta: cómo está la mesa y de qué tipo es.
          El rótulo va en minúsculas y sin tracking: en mayúsculas parecían
          tres títulos más de los que la pantalla necesita.
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
                [mostrarTipo]="!tipo()"
                (presionar)="abrirFicha(mesa)"
                (abrirQr)="abrirQr(mesa)"
                (abrirEdicion)="abrirFicha(mesa)"
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

    <!--
      La ficha de la mesa y su código QR: dos ventanas que se abren desde la
      propia tarjeta, sin dejar el salón.
    -->
    @if (mesaFicha(); as m) {
      <lm-modal-mesa [mesa]="m" (cerrar)="mesaFicha.set(null)" />
    }
    @if (mesaQr(); as m) {
      <lm-modal-mesa-qr [mesa]="m" (cerrar)="mesaQr.set(null)" />
    }
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .grupo { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
      /* En minúsculas y sin tracking: en mayúsculas el rótulo parecía un
         título más y la pantalla necesitaba tres. */
      .grupo__rotulo {
        font: 600 clamp(12.5px, 3.2vw, 14px)/1.2 var(--font-text);
        color: var(--text-sobre-fondo-suave);
      }

      /* El resumen del salón: los mismos tres estados y los mismos tokens que
         los botones de aceptar y rechazar y que la pelotita de cada tarjeta,
         para que el color signifique lo mismo en toda la app. */
      .resumen {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-2) var(--space-4);
        margin: 0;

        font: 600 clamp(14px, 3.7vw, 16px)/1.4 var(--font-text);
        color: var(--text-sobre-fondo-suave);
      }
      .resumen__dato { display: inline-flex; align-items: center; gap: 7px; }
      .resumen__punto {
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: #C9C0C4;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, .85);
      }
      .resumen__punto--VACIA { background: var(--state-success); }
      .resumen__punto--OCUPADA { background: var(--state-error); }
      .resumen__punto--INACTIVA { background: #C9C0C4; }

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

  /** La mesa abierta en la ficha y la abierta en su código QR. */
  protected readonly mesaFicha = signal<Mesa | null>(null);
  protected readonly mesaQr = signal<Mesa | null>(null);

  /**
   * La ficha de la mesa: disponibilidad, comensales y tipo. Se abre tocando
   * la tarjeta o con el lápiz, que es el atajo de quien puede editarla.
   */
  protected abrirFicha(mesa: Mesa): void {
    this.mesaFicha.set(mesa);
  }

  /** El código QR de la mesa, con el botón de la tarjeta. */
  protected abrirQr(mesa: Mesa): void {
    this.mesaQr.set(mesa);
  }

  protected readonly visibles = computed(() =>
    this.mesas
      .todas()
      .filter((m) => !this.estado() || ROTULO_ESTADO_MESA[m.estado] === this.estado())
      .filter((m) => !this.tipo() || ROTULO_TIPO_MESA[m.tipo] === this.tipo()),
  );

  /**
   * El estado del salón en una línea: cuántas mesas hay libres, ocupadas y
   * apagadas. Cuenta las mesas que se están viendo, para que nunca contradiga
   * la lista de abajo, y deja fuera los estados que no hay: con un filtro de
   * "Vacías" pone "8 vacías" y no tres ceros.
   */
  protected readonly resumen = computed(() => {
    const visibles = this.visibles();
    return RESUMEN.map((dato) => {
      const n = visibles.filter((m) => m.estado === dato.clave).length;
      return {
        clave: dato.clave,
        n,
        texto: `${n} ${n === 1 ? dato.singular : dato.plural}`,
      };
    }).filter((dato) => dato.n > 0);
  });


  protected tituloVacio(): string {
    return this.mesas.todas().length ? 'Ninguna mesa entra en el filtro' : 'Todavía no hay mesas cargadas';
  }

  protected textoVacio(): string {
    return this.mesas.todas().length
      ? ''
      : 'Cargá el número, la cantidad de comensales, el tipo y la foto: el código QR se genera solo.';
  }
}
