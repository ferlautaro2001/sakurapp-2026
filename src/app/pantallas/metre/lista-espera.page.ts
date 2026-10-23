import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Espera, Mesa } from '../../nucleo/modelos/modelos';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { AsignarMesaModalComponent } from './asignar-mesa-modal.component';

/** Lista de espera en tiempo real para el metre. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-metre-lista-espera',
  imports: [DatePipe, AsignarMesaModalComponent, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="visibles().length">
          Lista de espera
        </lm-titulo>

        <lm-buscador marcador="Buscar comensal" [valor]="busqueda()" (cambiar)="busqueda.set($event)" />

        @if (visibles().length) {
          <div class="espera__lista">
            @for (entrada of visibles(); track entrada.id; let posicion = $index) {
              <div class="lm-wait">
                <span class="lm-wait__pos">{{ posicion + 1 }}</span>
                <span
                  class="lm-avatar lm-avatar--sm"
                  [style.background-image]="entrada.clienteFotoUrl ? 'url(' + entrada.clienteFotoUrl + ')' : null"
                >
                  @if (!entrada.clienteFotoUrl) {
                    {{ iniciales(entrada.clienteNombre) }}
                  }
                </span>
                <span class="lm-wait__datos">
                  <b>{{ entrada.clienteNombre }}</b>
                  <span class="lm-wait__llegada">
                    <lm-icono nombre="schedule" [tamano]="22" />
                    <span>
                      <small>Llegada</small>
                      <small>{{ entrada.timestamp | date: 'dd/MM - HH:mm' }}</small>
                    </span>
                  </span>
                </span>
                <span class="lm-wait__acciones">
                  <lm-icono-boton
                    icono="table_restaurant"
                    [rotulo]="'Asignar mesa a ' + entrada.clienteNombre"
                    tono="primario"
                    (presionar)="abrirAsignacion(entrada)"
                  />
                  <lm-icono-boton
                    icono="delete"
                    [rotulo]="'Quitar a ' + entrada.clienteNombre + ' de la lista'"
                    tono="peligro"
                    (presionar)="quitar(entrada)"
                  />
                </span>
              </div>
            }
          </div>
        } @else {
          <lm-vacio icono="hourglass_empty" [titulo]="busqueda() ? 'No encontramos a nadie' : 'Nadie esperando'">
            {{
              busqueda()
                ? 'Probá con otro nombre.'
                : 'Los clientes aparecerán acá cuando escaneen el código de ingreso.'
            }}
          </lm-vacio>
        }
      </div>

      @if (entradaParaAsignar(); as seleccionada) {
        <lm-asignar-mesa-modal animate.leave="sk-modal-host-sale"
          [clienteNombre]="seleccionada.clienteNombre"
          (asignar)="confirmarAsignacion(seleccionada, $event)"
          (cancelar)="entradaParaAsignar.set(null)"
        />
      }

      <lm-barra-inferior [items]="secciones()" activo="espera" />
    </div>
  `,

  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }

      /* Casillas de alto natural: entran todas las que caben enteras y la que
         no entra queda para la próxima parada del snap (anclado al tope). */
      /* Tandas exactas: cada tarjeta mide justo una parte de la lista y se ancla
         entera. Se muestran de a tres; si la pantalla es muy baja, de a dos o de a uno. */
      .espera__lista {
        flex: 1 1 0 !important; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3);
        container: espera / size; overflow-y: auto; overscroll-behavior: contain;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0; scrollbar-width: none;
      }
      .espera__lista::-webkit-scrollbar { display: none; }
      .espera__lista > .lm-wait {
        --por: 1;
        flex: 0 0 calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por));
        min-height: min-content; scroll-snap-align: start; scroll-snap-stop: always;
        /* Turno y foto apilados a la izquierda; nombre y llegada a la derecha,
           con todo el ancho que deja la columna. */
        /* La foto crece con la casilla: lo que queda después del turno (34px),
           el espacio entre ambos y el relleno (unos 70px), entre 60 y 104px. */
        --foto: clamp(60px, min(26vw, calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por) - 70px)), 104px);
        display: grid; grid-template-columns: max(66px, var(--foto)) minmax(0, 1fr) auto; grid-template-rows: auto auto;
        align-content: center; align-items: center; column-gap: 12px; row-gap: 6px;
      }
      @container espera (min-height: 260px) { .espera__lista > .lm-wait { --por: 2; } }
      @container espera (min-height: 396px) { .espera__lista > .lm-wait { --por: 3; } }

      /* Tarjeta en tres zonas: quién (foto con su puesto encima), datos y
         acciones apiladas que ocupan el alto. Todas las piezas comparten el
         mismo radio y aro de vidrio rosa que los botones de ícono. */
      .lm-wait { position: relative; gap: 14px; padding: 12px 14px; justify-content: flex-start !important; }
      /* Mismo aro de vidrio que el botón de cerrar sesión del encabezado. */
      .lm-wait {
        border: 1.5px solid rgba(255, 255, 255, .5) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .55), inset 0 -6px 12px rgba(255, 255, 255, .06), 0 4px 10px rgba(94, 12, 44, .16) !important;
      }
      .lm-wait__pos, .lm-wait .lm-avatar, .lm-wait__acciones ::ng-deep .lm-iconbtn {
        border-radius: 14px !important;
        border: 1.5px solid rgba(255, 79, 139, .45) !important;
        box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 8px rgba(94, 12, 44, .14) !important;
      }
      .lm-wait .lm-avatar { grid-column: 1; grid-row: 2; justify-self: center; width: var(--foto); height: var(--foto); position: relative; }
      .lm-wait__pos {
        /* Turno arriba de la foto, en la columna izquierda. */
        grid-column: 1; grid-row: 1; justify-self: center;
        width: 34px; height: 34px; border-radius: 12px !important; font-size: 20px;
        background: linear-gradient(180deg, rgba(255, 255, 255, .95), rgba(255, 215, 223, .95));
      }
      /* Mismo alto que la foto: el nombre arranca en su borde superior y la fecha termina en el inferior. */
      .lm-wait__datos { grid-column: 2; grid-row: 1 / span 2; display: flex; flex-direction: column; justify-content: center; gap: 4px; min-width: 0; }
      .lm-wait__datos b, .lm-wait__datos small { line-height: 1.2; }
      /* El nombre entero: si no entra en un renglón, baja a dos. */
      .lm-wait__datos b { white-space: normal; overflow: visible; text-overflow: clip; text-wrap: balance; }
      /* El reloj abarca los dos renglones (rótulo y fecha), que quedan a su derecha. */
      .lm-wait__llegada { display: flex; align-items: center; gap: 6px; margin-top: 8px; color: var(--text-muted); }
      .lm-wait__llegada > span { display: flex; flex-direction: column; gap: 6px; }
      .lm-wait__llegada small { font-size: 14px; white-space: nowrap; }
      .lm-wait__llegada small:first-child { justify-content: center; }
      .lm-wait__datos b { font-size: 17px; }
      /* El reloj acompaña a la primera línea aunque la fecha baje a dos renglones. */
      .lm-wait__datos small { align-items: flex-start; }
      .lm-wait__datos small lm-icono { display: flex; align-items: center; height: 1lh; flex: 0 0 auto; }
      .lm-wait__acciones { grid-column: 3; grid-row: 1 / span 2; flex-direction: column; justify-content: center; gap: 8px !important; }
      /* Quitar de la lista: tacho blanco sobre fondo rojo. */
      .lm-wait__acciones ::ng-deep .lm-iconbtn--danger { background: var(--state-error); color: #FFFFFF; border-color: transparent; }
    `,
  ],
})
export class MetreListaEsperaPage extends PaginaConSesion implements OnInit {
  private readonly espera = inject(EsperaService);
  protected readonly busqueda = signal('');
  protected readonly entradaParaAsignar = signal<Espera | null>(null);

  protected readonly visibles = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');
    return this.espera.esperando().filter((entrada) =>
      !texto || entrada.clienteNombre.toLocaleLowerCase('es-AR').includes(texto),
    );
  });


  ngOnInit(): void {
    void this.espera.iniciar();
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toLocaleUpperCase('es-AR');
  }

  protected async quitar(entrada: Espera): Promise<void> {
    const confirmado = await this.preguntar({
      titulo: '¿Quitar de la lista?',
      mensaje: '',
      confirmar: 'Quitar de la lista',
      tono: 'peligro',
      icono: 'person_remove',
      detalle: [{ rotulo: 'Comensal', valor: entrada.clienteNombre }],
    });
    if (!confirmado) return;

    await this.cargando.conEsperaMinima('Actualizando la lista…', () => this.espera.quitar(entrada.id), 350);
    this.avisos.info(`${entrada.clienteNombre} salió de la lista`, 'Su turno quedó cancelado.');
  }

  protected abrirAsignacion(entrada: Espera): void {
    this.entradaParaAsignar.set(entrada);
  }

  protected async confirmarAsignacion(entrada: Espera, mesa: Mesa): Promise<void> {
    this.entradaParaAsignar.set(null);
    try {
      await this.cargando.conEsperaMinima(
        `Asignando mesa ${mesa.numero}…`,
        () => this.espera.asignarMesa(entrada, mesa),
        400,
      );
      this.avisos.exito(
        `Mesa ${mesa.numero} asignada`,
        `Se le notificó a ${entrada.clienteNombre} y se bloqueó la mesa.`,
      );
    } catch (err: any) {
      this.avisos.error(
        'No se pudo asignar la mesa',
        err?.message || 'La mesa ya fue tomada o no se encuentra disponible.',
      );
    }
  }
}

