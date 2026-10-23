import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { ReservasService } from '../../nucleo/servicios/reservas.service';
import { Mesa } from '../../nucleo/modelos/modelos';
import { ICONO_TIPO_MESA, ROTULO_TIPO_MESA } from '../../nucleo/modelos/enums';
import { UI } from '../../ui';

/**
 * Modal de selección y asignación de mesas libres para el Metre (TASK-5.3.1.1).
 *
 * - Lista las mesas disponibles en estado VACIA.
 * - Integra retroalimentación háptica táctil en la selección y confirmación (@capacitor/haptics).
 * - Permite al personal del salón asignar la ubicación exacta al comensal en espera.
 */
@Component({
  selector: 'lm-asignar-mesa-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...UI],
  template: `
    <div class="lm-modal__fondo" (click)="cancelar.emit()">
      <div
        class="lm-modal lm-modal--ancho"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Asignar mesa a ' + clienteNombre()"
        (click)="$event.stopPropagation()"
      >
        <div class="modal-cabecera">
          <span class="lm-modal__icono lm-modal__icono--primario">
            <lm-icono nombre="table_restaurant" [tamano]="28" color="#FFFFFF" />
          </span>
          <h2 class="lm-modal__titulo">Asignar mesa a {{ clienteNombre() }}</h2>
        </div>

        @if (mesasDisponibles().length) {
          <div class="mesas-grilla">
            @for (mesa of mesasDisponibles(); track mesa.id) {
              <button
                type="button"
                class="mesa-opcion"
                [class.mesa-opcion--seleccionada]="mesaSeleccionada()?.id === mesa.id"
                (click)="seleccionarMesa(mesa)"
              >
                <div class="mesa-opcion__numero">
                  <strong>{{ mesa.numero }}</strong>
                </div>

                <div class="mesa-opcion__info">
                  <span class="mesa-opcion__tipo" [attr.aria-label]="rotuloTipo(mesa)" [title]="rotuloTipo(mesa)">
                    <lm-icono [nombre]="iconoTipo(mesa)" [tamano]="23" />
                  </span>
                  <span class="mesa-opcion__separador" aria-hidden="true">|</span>
                  <span class="mesa-opcion__capacidad" [attr.aria-label]="'Hasta ' + mesa.cantidadComensales + ' personas'" [title]="'Hasta ' + mesa.cantidadComensales + ' personas'">
                    <lm-icono nombre="group" [tamano]="23" />
                    {{ mesa.cantidadComensales }}
                  </span>
                </div>

                <!-- Siempre presente (oculto) para que la tarjeta no cambie de ancho al elegirla. -->
                <span class="mesa-opcion__check" [style.visibility]="mesaSeleccionada()?.id === mesa.id ? 'visible' : 'hidden'">
                  <lm-icono nombre="check_circle" [tamano]="23" color="var(--state-success)" />
                </span>
              </button>
            }
          </div>
        } @else {
          <lm-vacio
            icono="table_restaurant"
            titulo="No hay mesas libres"
          >
            Todas las mesas del salón se encuentran ocupadas o asignadas en este momento.
          </lm-vacio>
        }

        <lm-decision
          class="lm-modal__acciones"
          rotuloAceptar="Asignar mesa"
          [deshabilitado]="!mesaSeleccionada()"
          (rechazar)="cancelar.emit()"
          (aceptar)="confirmarAsignacion()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      /* El tope de 440px sólo levanta el del sistema: el ancho sigue siendo
         100% del hueco que deja el fondo del modal, que ya reserva
         --gutter-screen a cada lado, así que en un equipo de 320 entra con su
         margen. El alto va en dvh porque con vh la barra de direcciones del
         navegador del celular dejaba el pie del modal abajo de la pantalla. */
      .lm-modal--ancho {
        max-width: 440px;
        width: 100%;
        max-height: 85dvh;
        display: flex;
        flex-direction: column;
      }

      .modal-cabecera {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .mesas-grilla {
        display: flex;
        flex-direction: column;
        gap: 8px;
        /* En un equipo bajo, 320px de lista dejaban los dos botones fuera de
           la pantalla: la lista cede primero y se desplaza por dentro. */
        max-height: min(44dvh, 320px);
        overflow-y: auto;
        /* Sigue desplazable con el dedo, sin la barra a la vista. */
        scrollbar-width: none;
        margin: var(--space-3) 0;
        padding-right: 4px;
      }

      .mesas-grilla::-webkit-scrollbar {
        display: none;
      }

      .mesa-opcion {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: 6px var(--space-4);
        background: var(--surface-secondary, #f8f6f7);
        /* Sin borde: sólo el halo rosa del box-shadow. */
        border: none !important;
        /* Aire para que la grilla (overflow) no recorte la sombra. */
        margin: 4px 8px;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, .7),
          0 0 0 1px rgba(232, 51, 111, .3),
          0 4px 12px rgba(59, 8, 27, .22) !important;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.18s ease;
        text-align: left;
        color: inherit;
        font: inherit;
        /* Sin width 100%: con margen se pasaba del contenedor. */
      }

      .mesa-opcion:active {
        transform: scale(0.98);
      }

      .mesa-opcion--seleccionada {
        /* Sin border: el aro verde va en el halo del box-shadow, junto al tilde. */
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, .7),
          0 0 0 2px var(--state-success),
          0 4px 12px rgba(59, 8, 27, .22) !important;
        background: rgba(185, 46, 88, 0.08);
      }

      .mesa-opcion__numero {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: clamp(40px, 11vw, 46px);
        min-height: clamp(40px, 11vw, 46px);
        box-sizing: border-box;
        /* Vidrio como los botones de ícono, con contorno crema para no perderse sobre el blanco. */
        background: linear-gradient(180deg, rgba(255, 255, 255, .85) 0%, rgba(255, 215, 223, .8) 100%);
        border: 1.5px solid rgba(255, 79, 139, .45);
        border-radius: 14px;
        box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 8px rgba(94, 12, 44, .14);
        -webkit-backdrop-filter: blur(6px);
        backdrop-filter: blur(6px);
        color: var(--action-primary, #b92e58);
      }

      .mesa-opcion__numero strong {
        font-size: clamp(14px, 4.2vw, 18px);
        font-weight: 700;
        line-height: 1;
      }

      .mesa-opcion__info {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 6px;
        flex: 1;
        white-space: nowrap;
        height: clamp(40px, 11vw, 46px);
      }

      .mesa-opcion__tipo {
        font-size: clamp(13px, 3.3vw, 14px);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--text-primary, #2d1822);
      }

      /* Línea del alto de los íconos (23px) en vez del carácter. */
      .mesa-opcion__separador { font-size: 0; width: 1.5px; height: 23px; align-self: center; background: currentColor; opacity: .5; }

      .mesa-opcion__capacidad {
        font-size: clamp(13px, 3.3vw, 14px);
        font-weight: 600;
        color: var(--text-primary, #2d1822);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .mesa-opcion__check {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
      }
    
      /* Las opciones de mesa se acomodan enteras, una a una. */
      .mesas-grilla { scroll-snap-type: y mandatory; scroll-padding: 4px; overscroll-behavior: contain; }
      .mesa-opcion { scroll-snap-align: start; scroll-snap-stop: always; flex-shrink: 0; }
      /* La lista muestra una cantidad exacta de opciones enteras: con alto de
         opción fijo, tres (dos en pantallas bajas) entran sin cortar ninguna. */
      .mesa-opcion { box-sizing: border-box; height: 64px; }
      .mesas-grilla { max-height: calc(3 * 72px + 2 * 8px); padding-bottom: 0; }
      @media (max-height: 700px) { .mesas-grilla { max-height: calc(2 * 72px + 8px); } }
      .mesa-opcion:not(.mesa-opcion--seleccionada) { background-image: var(--surface-card-degradado); }
    `,
  ],
})
export class AsignarMesaModalComponent {
  private readonly mesas = inject(MesasService);
  private readonly espera = inject(EsperaService);
  private readonly reservas = inject(ReservasService);

  constructor() {
    this.reservas.iniciar();
  }

  readonly clienteNombre = input.required<string>();
  readonly asignar = output<Mesa>();
  readonly cancelar = output<void>();

  readonly mesaSeleccionada = signal<Mesa | null>(null);

  // Libre = VACIA, sin una reserva viva (otra entrada ASIGNADO con esta mesa)
  // y sin una reserva agendada confirmada en horario (US-13.1).
  // No se mira clienteActualId: hay mesas con uno viejo que nunca se limpió.
  readonly mesasDisponibles = computed(() => {
    const reservadas = new Set(
      this.espera.lista().filter((e) => e.estado === 'ASIGNADO').map((e) => e.mesaAsignadaId),
    );
    const agendadas = this.reservas.mesasBloqueadas();
    return this.mesas.vacias().filter((m) => !reservadas.has(m.id) && !agendadas.has(m.id));
  });

  protected iconoTipo(mesa: Mesa): string {
    return ICONO_TIPO_MESA[mesa.tipo];
  }

  protected rotuloTipo(mesa: Mesa): string {
    return ROTULO_TIPO_MESA[mesa.tipo];
  }

  protected seleccionarMesa(mesa: Mesa): void {
    this.mesaSeleccionada.set(mesa);
    void Haptics.selectionChanged().catch(() => undefined);
  }

  protected confirmarAsignacion(): void {
    const mesa = this.mesaSeleccionada();
    if (!mesa) return;
    void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
    this.asignar.emit(mesa);
  }
}
