import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { UI } from '../../ui';
import { Mesa } from '../../nucleo/modelos/modelos';
import { ICONO_TIPO_MESA, ROTULO_TIPO_MESA, TipoMesa } from '../../nucleo/modelos/enums';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { SesionService } from '../../nucleo/servicios/sesion.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';

/** Rango admitido de comensales, el mismo que valida el alta de mesa. */
const MIN_COMENSALES = 1;
const MAX_COMENSALES = 10;

const TIPOS: TipoMesa[] = ['ESTANDAR', 'VIP', 'MOVILIDAD_REDUCIDA'];

/**
 * Los dos modales de una mesa: su ficha y su código QR.
 *
 * Antes eran una pantalla entera —la ficha arriba, el QR abajo y los botones
 * de guardar— y llegar a ella era un paso entero del salón. Ahora son dos
 * ventanas que se abren desde la propia tarjeta: el lápiz abre la ficha y el
 * código QR abre el código. Cada una hace una cosa y se cierra sola.
 *
 * Las dos comparten los mismos estilos y los mismos nombres de clase que
 * usaba la pantalla, así que el aspecto es el de siempre.
 */
const ESTILOS = `
  /* El fondo: tapa la pantalla y se cierra al tocarlo. Va por debajo de la
     ventana de confirmación (que vive en la cáscara de la app) para que al
     guardar los cambios se vea por encima de este modal. */
  .modal-qr-fondo {
    position: fixed;
    inset: 0;
    z-index: 955;
    background: rgba(20, 4, 10, .62);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  @keyframes sk-modal-nitido {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .modal-qr-card {
    position: relative;
    background: #FFFFFF;
    border-radius: 24px;
    padding: 16px 16px 40px;
    width: 100%;
    max-width: min(400px, 100%);
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    text-align: center;
    box-shadow: 0 28px 64px rgba(59, 8, 27, .5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border: 2px solid rgba(255, 255, 255, .65) !important;
    animation: sk-modal-nitido 220ms cubic-bezier(.16, 1, .3, 1) !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    text-rendering: optimizeLegibility !important;
  }

  /* Encabezado compartido por los dos modales: a la izquierda la identidad de
     la mesa (para no dejar la primera fila en blanco) y a la derecha la cruz. */
  .modal-qr-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .modal-qr-identidad {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .modal-qr-identidad__icono {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    background: linear-gradient(180deg, #F04680 0%, #B81F55 100%);
    border: 1.5px solid rgba(255, 255, 255, .65);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .55), 0 0 0 1px rgba(232, 51, 111, .28), 0 4px 10px rgba(94, 12, 44, .2);
    outline: 2px solid #8B0000;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .modal-qr-identidad__titulo {
    margin: 0;
    font: var(--type-card-title);
    font-size: 20px;
    font-weight: 800;
    line-height: 24px;
    color: #6E1234;
  }

  /* La ficha es una grilla de filas: el encabezado en la primera y el resto
     del contenido debajo, cada fila con su aire. */
  .modal-mesa-card {
    display: grid;
    grid-template-columns: 1fr;
    align-content: start;
    align-items: stretch;
    row-gap: 10px;
    padding: 16px 16px 18px;
    text-align: left;
  }

  /* Los dos botones redondos de los modales: cerrar y los del contador. */
  .btn-cerrar-modal,
  .contador__btn {
    background: #FDF2F4;
    border: none;
    border-radius: 50%;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: transform 0.12s ease, background-color 0.12s ease, opacity 0.12s ease;
  }

  .btn-cerrar-modal {
    width: var(--touch-min);
    height: var(--touch-min);
  }

  /* El código escaneable: ocupa el ancho que haya, siempre cuadrado. El PNG
     se genera a 512px, así que siempre se reduce y nunca se agranda. */
  .modal-qr-img {
    width: min(var(--size-qr), 100%);
    aspect-ratio: 1;
    height: auto;
    object-fit: contain;
    display: block;
    margin: 0 auto;
    image-rendering: pixelated;
  }

  .modal-qr-espera {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 200px;
    border-radius: 14px;
    background: #FDF2F4;
    color: #8C3A57;
    font-size: 12px;
  }

  /* La ficha: disponibilidad, comensales y tipo, uno debajo del otro. */
  .ficha__dato {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 14px;
    /* El mismo borde que las opciones de tipo: dentro del modal todas las
       piezas se distinguen por su contorno, no sólo por su relleno. */
    border: 2px solid rgba(255, 255, 255, .65);
    background: #FDF2F4;
    background-clip: padding-box;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, .7),
      0 0 0 1px rgba(232, 51, 111, .3),
      0 4px 10px rgba(59, 8, 27, .16);
    text-align: left;
  }
  .ficha__dato + .ficha__dato { margin-top: 2px; }

  .ficha__icono {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ficha__rotulo {
    font: var(--type-section);
    line-height: 1.15;
    color: #7A2E44;
    word-break: keep-all;
  }
  .ficha__rotulo--grande {
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
    color: #6E1234;
  }

  .ficha__valor {
    margin-left: auto;
    font: var(--type-section);
    color: #6E1234;
  }

  /* Disponibilidad: el estado y el interruptor. */
  .ficha__estado { gap: 10px; }
  .ficha__estado .ficha__titulo {
    flex: 1 1 auto;
    font: var(--type-card-title);
    font-size: 21px;
    font-weight: 800;
    color: var(--state-success);
  }
  .ficha__estado--ocupada .ficha__titulo { color: var(--state-error); }

  .ficha__punto {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--state-success);
  }
  .ficha__punto--ocupada { background: var(--state-error); }

  .switch {
    width: 48px;
    height: 26px;
    border-radius: 999px;
    background: #CED4DA;
    border: none;
    padding: 2px;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    transition: background-color 0.22s ease;
  }
  .switch--on { background: var(--state-error); }

  .switch__perilla {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--state-success);
    box-shadow: 0 0 0 2px #FFFFFF, 0 2px 4px rgba(0, 0, 0, .25);
    transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    transform: translateX(0);
  }
  .switch--on .switch__perilla { transform: translateX(22px); }

  /* Contador de comensales */
  .contador {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }
  .contador__btn {
    width: 42px;
    height: 42px;
    border: 1.5px solid #E7C3D0;
  }
  .contador__btn:active { transform: scale(.92); background: #F8DDE5; }
  .contador__btn:disabled { opacity: .4; cursor: not-allowed; }
  .contador__valor {
    min-width: 34px;
    text-align: center;
    font: var(--type-numeral);
    color: #6E1234;
    font-variant-numeric: tabular-nums;
  }

  /* Opciones de tipo de mesa */
  .modal-mesa__bloque {
    margin-top: 4px;
    text-align: left;
  }
  .modal-mesa__rotulo {
    display: block;
    margin-bottom: 6px;
    font: 750 clamp(13px, 3.4vw, 15px)/1.2 var(--font-text);
    color: #7A2E44;
  }

  .opciones-tipo {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .opcion-tipo {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border: 1.5px solid #EFD7E0;
    border-radius: 14px;
    background: #FFFFFF;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.14s ease, background-color 0.14s ease;
  }
  .opcion-tipo--elegida { border-color: #B92E58; background: #FDF2F4; }
  .opcion-tipo__icono { display: flex; align-items: center; flex-shrink: 0; }
  .opcion-tipo__rotulo {
    flex: 1;
    min-width: 0;
    font: var(--type-body);
    color: #6E1234;
    overflow-wrap: anywhere;
  }

  .ficha__pendiente {
    margin: 4px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    background: var(--state-pending-surface);
    background-clip: padding-box;
    border: 2px solid rgba(255, 255, 255, .65);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, .7),
      0 0 0 1px rgba(232, 51, 111, .3),
      0 3px 8px rgba(59, 8, 27, .16);
    color: var(--state-pending);
    font: 700 15px/1.2 var(--font-text);
  }

  .ficha__acciones { margin-top: 6px; }

  /* Degradado de las tarjetas de la carta en lo que era blanco liso. */
  .modal-qr-card, .opcion-tipo:not(.opcion-tipo--elegida) {
    background-image: var(--surface-card-degradado);
  }
`;

/**
 * Modal con el código QR de la mesa.
 *
 * Es el código que escanea el comensal para abrir el chat de la mesa, así que
 * va grande y con el encabezado de la mesa arriba junto al botón de cerrar.
 */
@Component({
  selector: 'lm-modal-mesa-qr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...UI],
  template: `
    <div class="modal-qr-fondo" animate.leave="sk-fondo-sale" (click)="cerrar.emit()">
      <div class="modal-qr-card" animate.leave="sk-modal-sale" (click)="$event.stopPropagation()">
        <div class="modal-qr-header">
          <div class="modal-qr-identidad">
            <span class="modal-qr-identidad__icono">
              <lm-icono [nombre]="iconoTipo()" [tamano]="22" color="#FFFFFF" />
            </span>
            <h3 class="modal-qr-identidad__titulo">Mesa {{ mesa().numero }}</h3>
          </div>

          <button type="button" class="btn-cerrar-modal" aria-label="Cerrar" (click)="cerrar.emit()">
            <lm-icono nombre="close" [tamano]="24" color="#FFFFFF" />
          </button>
        </div>

        @if (fuente()) {
          <img
            [src]="fuente()"
            [alt]="'Código QR de la mesa ' + mesa().numero"
            class="modal-qr-img"
            decoding="async"
          />
        } @else {
          <div class="modal-qr-espera">
            <lm-icono nombre="qr_code" [tamano]="36" color="#8C3A57" />
            <span>Generando QR…</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [ESTILOS],
})
export class ModalMesaQrComponent {
  readonly mesa = input.required<Mesa>();
  readonly cerrar = output<void>();

  private readonly qr = inject(QrService);

  protected readonly fuente = signal('');

  protected iconoTipo(): string {
    return ICONO_TIPO_MESA[this.mesa().tipo];
  }

  constructor() {
    effect((onCleanup) => {
      const m = this.mesa();
      if (!m) return;

      // La mesa ya trae el QR subido; sólo se genera cuando falta.
      if (m.qrCodeUrl) {
        this.fuente.set(m.qrCodeUrl);
        return;
      }

      let vigente = true;
      onCleanup(() => (vigente = false));
      void this.qr.generarDeMesa(m.id, m.numero).then((f) => {
        if (vigente) this.fuente.set(f);
      });
    });
  }
}

/**
 * Modal con la ficha de la mesa: si está libre u ocupada, cuántos comensales
 * tiene y de qué tipo es.
 *
 * Los datos viven en un borrador y se aplican con el ✓: el salón ve el cambio
 * sólo cuando se confirma, y el ✕ lo descarta. La disponibilidad la puede
 * cambiar cualquiera; comensales y tipo, sólo dueño y supervisor.
 */
@Component({
  selector: 'lm-modal-mesa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...UI],
  template: `
    <div class="modal-qr-fondo" animate.leave="sk-fondo-sale" (click)="cerrar.emit()">
      <div class="modal-qr-card modal-mesa-card" animate.leave="sk-modal-sale" (click)="$event.stopPropagation()">
        <div class="modal-qr-header">
          <div class="modal-qr-identidad">
            <span class="modal-qr-identidad__icono">
              <lm-icono [nombre]="iconoTipo()" [tamano]="22" color="#FFFFFF" />
            </span>
            <h3 class="modal-qr-identidad__titulo">Mesa {{ mesa().numero }}</h3>
          </div>

          <button type="button" class="btn-cerrar-modal" aria-label="Cerrar" (click)="cerrar.emit()">
            <lm-icono nombre="close" [tamano]="24" color="#FFFFFF" />
          </button>
        </div>

        <!-- Lo que más importa de la mesa: si está libre u ocupada. -->
        <div class="ficha__dato ficha__estado" [class.ficha__estado--ocupada]=\"ocupada()\">
          <span class="ficha__punto" [class.ficha__punto--ocupada]=\"ocupada()\"></span>
          <span class="ficha__titulo">{{ ocupada() ? 'Mesa ocupada' : 'Mesa libre' }}</span>
          <button
            type="button"
            role="switch"
            [attr.aria-checked]=\"ocupada()\"
            aria-label="Marcar la mesa como ocupada"
            class="switch"
            [class.switch--on]=\"ocupada()\"
            (click)=\"toggleOcupada()\"
          >
            <span class="switch__perilla"></span>
          </button>
        </div>

        <div class="ficha__dato">
          <span class="ficha__icono">
            <lm-icono nombre="group" [tamano]="28" color="#6E1234" />
          </span>
          <span class="ficha__rotulo ficha__rotulo--grande">{{ comensales() }}</span>
          @if (puedeEditar()) {
            <div class="contador">
              <button
                type="button"
                class="contador__btn"
                aria-label="Quitar un comensal"
                [disabled]=\"comensales() <= minComensales\"
                (click)=\"ajustarComensales(-1)\"
              >
                <lm-icono nombre="remove" [tamano]="20" color="#7A1535" />
              </button>
              <span class="contador__valor">{{ comensales() }}</span>
              <button
                type="button"
                class="contador__btn"
                aria-label="Sumar un comensal"
                [disabled]=\"comensales() >= maxComensales\"
                (click)=\"ajustarComensales(1)\"
              >
                <lm-icono nombre="add" [tamano]="20" color="#7A1535" />
              </button>
            </div>
          } @else {
            <span class="ficha__valor">{{ comensales() }}</span>
          }
        </div>

        @if (puedeEditar()) {
          <div class="modal-mesa__bloque">
            <span class="modal-mesa__rotulo">Tipo de mesa</span>
            <div class="opciones-tipo" role="radiogroup" aria-label="Tipo de mesa">
              @for (opcion of tipos; track opcion) {
                <button
                  type="button"
                  role="radio"
                  class="opcion-tipo"
                  [class.opcion-tipo--elegida]=\"tipoMesa() === opcion\"
                  [attr.aria-checked]=\"tipoMesa() === opcion\"
                  (click)=\"tipoMesa.set(opcion)\"
                >
                  <span class="opcion-tipo__icono">
                    <lm-icono [nombre]=\"iconoDe(opcion)\" [tamano]="20" color="#6E1234" />
                  </span>
                  <span class="opcion-tipo__rotulo">{{ rotuloDe(opcion) }}</span>
                  @if (tipoMesa() === opcion) {
                    <lm-icono nombre="check_circle" [tamano]="20" color="#B92E58" />
                  }
                </button>
              }
            </div>
          </div>
        } @else {
          <div class="ficha__dato">
            <span class="ficha__icono">
              <lm-icono [nombre]="iconoTipo()" [tamano]="20" color="#6E1234" />
            </span>
            <span class="ficha__rotulo">Tipo</span>
            <span class="ficha__valor">{{ tipo() }}</span>
          </div>
        }

        @if (hayCambios()) {
          <p class="ficha__pendiente">
            <lm-icono nombre="edit_note" [tamano]="20" color="var(--state-pending)" />
            <span>Tenés cambios sin guardar.</span>
          </p>
        }

        <lm-decision
          class="ficha__acciones"
          rotuloAceptar="Guardar cambios"
          (rechazar)="cerrar.emit()"
          (aceptar)="guardar()"
        />
      </div>
    </div>
  `,
  styles: [ESTILOS],
})
export class ModalMesaComponent {
  readonly mesa = input.required<Mesa>();
  readonly cerrar = output<void>();

  private readonly mesas = inject(MesasService);
  private readonly sesion = inject(SesionService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);

  protected readonly tipos = TIPOS;
  protected readonly minComensales = MIN_COMENSALES;
  protected readonly maxComensales = MAX_COMENSALES;

  /** Borrador: lo que se ve en pantalla, todavía sin aplicar. */
  protected readonly ocupada = signal(false);
  protected readonly comensales = signal(0);
  protected readonly tipoMesa = signal<TipoMesa>('ESTANDAR');

  /** Dueño y supervisor editan comensales y tipo; el resto sólo availability. */
  protected readonly puedeEditar = computed(() => this.sesion.esAdministrador());

  protected readonly hayCambios = computed(() => {
    const m = this.mesa();
    if (!m) return false;
    return (
      m.estado !== (this.ocupada() ? 'OCUPADA' : 'VACIA') ||
      m.cantidadComensales !== this.comensales() ||
      m.tipo !== this.tipoMesa()
    );
  });

  /**
   * Mesa ya volcada a los campos de pantalla.
   *
   * La sincronización en vivo reescribe la mesa cada tanto: sin esta marca,
   * un cambio a medio editar se perdería solo.
   */
  private volcada = '';

  constructor() {
    effect(() => {
      const m = this.mesa();
      if (m && this.volcada !== m.id) {
        this.volcada = m.id;
        this.ocupada.set(m.estado === 'OCUPADA');
        this.comensales.set(m.cantidadComensales);
        this.tipoMesa.set(m.tipo);
      }
    });
  }

  protected tipo(): string {
    return ROTULO_TIPO_MESA[this.tipoMesa()];
  }

  protected iconoTipo(): string {
    return ICONO_TIPO_MESA[this.tipoMesa()];
  }

  protected rotuloDe(tipo: TipoMesa): string {
    return ROTULO_TIPO_MESA[tipo];
  }

  protected iconoDe(tipo: TipoMesa): string {
    return ICONO_TIPO_MESA[tipo];
  }

  protected toggleOcupada(): void {
    this.ocupada.update((v) => !v);
  }

  protected ajustarComensales(paso: number): void {
    this.comensales.update((v) => Math.min(MAX_COMENSALES, Math.max(MIN_COMENSALES, v + paso)));
  }

  protected async guardar(): Promise<void> {
    const m = this.mesa();
    if (!m) return;

    if (!this.hayCambios()) {
      this.avisos.info('Sin cambios', 'No modificaste ningún dato de la mesa.');
      this.cerrar.emit();
      return;
    }

    const nuevoEstado = this.ocupada() ? 'OCUPADA' : 'VACIA';
    const cambiaEstado = m.estado !== nuevoEstado;
    const cambiaComensales = m.cantidadComensales !== this.comensales();
    const cambiaTipo = m.tipo !== this.tipoMesa();

    // Sin ventana de por medio: el ✓ del modal ya es la confirmación. Pedir
    // otra vez "¿guardás?" encima del modal era una pregunta sobre una
    // pregunta.
    await this.cargando.conEsperaMinima('Guardando los cambios…', async () => {
      if (cambiaComensales || cambiaTipo) {
        await this.mesas.editar(m.id, {
          cantidadComensales: this.comensales(),
          tipo: this.tipoMesa(),
        });
      }
      if (cambiaEstado) {
        await this.mesas.cambiarEstado(m.id, nuevoEstado);
      }
    });

    // Sin cuerpo: el aviso dice una sola cosa —la mesa quedó lista— y esa
    // cosa se escribe grande.
    this.avisos.exito(`Mesa ${m.numero} actualizada`);
    this.cerrar.emit();
  }
}
