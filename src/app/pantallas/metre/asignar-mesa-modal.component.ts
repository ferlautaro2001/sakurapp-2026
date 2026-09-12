import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { MesasService } from '../../nucleo/servicios/mesas.service';
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
          <h2 class="lm-modal__titulo">Asignar mesa</h2>
          <p class="lm-modal__texto">
            Seleccioná una mesa disponible para <b>{{ clienteNombre() }}</b>:
          </p>
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
                  <span>Mesa</span>
                  <strong>{{ mesa.numero }}</strong>
                </div>

                <div class="mesa-opcion__info">
                  <span class="mesa-opcion__tipo">
                    <lm-icono [nombre]="iconoTipo(mesa)" [tamano]="14" />
                    {{ rotuloTipo(mesa) }}
                  </span>
                  <span class="mesa-opcion__capacidad">
                    <lm-icono nombre="group" [tamano]="14" />
                    Hasta {{ mesa.cantidadComensales }} personas
                  </span>
                </div>

                @if (mesaSeleccionada()?.id === mesa.id) {
                  <span class="mesa-opcion__check">
                    <lm-icono nombre="check_circle" [tamano]="20" color="var(--action-primary)" />
                  </span>
                }
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

        <div class="lm-modal__acciones">
          <lm-boton variante="ghost" (presionar)="cancelar.emit()">
            Cancelar
          </lm-boton>

          <lm-boton
            variante="primary"
            icono="check"
            [deshabilitado]="!mesaSeleccionada()"
            (presionar)="confirmarAsignacion()"
          >
            Asignar mesa
          </lm-boton>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .lm-modal--ancho {
        max-width: 440px;
        width: 100%;
        max-height: 85vh;
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
        max-height: 320px;
        overflow-y: auto;
        margin: 12px 0;
        padding-right: 4px;
      }

      .mesa-opcion {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: var(--surface-secondary, #f8f6f7);
        border: 2px solid transparent;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.18s ease;
        text-align: left;
        color: inherit;
        font: inherit;
        width: 100%;
      }

      .mesa-opcion:active {
        transform: scale(0.98);
      }

      .mesa-opcion--seleccionada {
        border-color: var(--action-primary, #b92e58);
        background: rgba(185, 46, 88, 0.08);
      }

      .mesa-opcion__numero {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 52px;
        height: 52px;
        background: #ffffff;
        border-radius: 10px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        color: var(--action-primary, #b92e58);
      }

      .mesa-opcion__numero span {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.8;
      }

      .mesa-opcion__numero strong {
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
      }

      .mesa-opcion__info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .mesa-opcion__tipo {
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--text-primary, #2d1822);
      }

      .mesa-opcion__capacidad {
        font-size: 12px;
        color: var(--text-secondary, #6e5c65);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .mesa-opcion__check {
        display: flex;
        align-items: center;
      }
    `,
  ],
})
export class AsignarMesaModalComponent {
  private readonly mesas = inject(MesasService);

  readonly clienteNombre = input.required<string>();
  readonly asignar = output<Mesa>();
  readonly cancelar = output<void>();

  readonly mesaSeleccionada = signal<Mesa | null>(null);

  readonly mesasDisponibles = computed(() =>
    this.mesas.vacias().filter((m) => !m.clienteActualId)
  );

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
