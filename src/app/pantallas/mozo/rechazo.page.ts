import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { MarcaRechazo, ROTULO_MARCA_MOZO } from '../../nucleo/modelos/enums';
import { ObservacionItem } from '../../nucleo/modelos/modelos';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import {
  largoMinimo,
  marcarEnviado,
  mensajeDe,
  requerido,
} from '../../nucleo/validacion/validadores';
import { UI } from '../../ui';
import { MarcaFicha } from '../../ui/basicos';
import { PaginaConSesion } from '../pagina-base';

/**
 * US-7.2 · punto 13 · el mozo devuelve la comanda para que la modifiquen.
 *
 * Es una pantalla propia y no un modal: el mozo tiene que recorrer la comanda
 * entera marcando renglón por renglón, y eso no entra en una ventana sin
 * dejarla con desplazamiento adentro del velo.
 *
 * El mozo marca producto por producto qué problema tiene cada uno:
 *
 *  - **Amarillo** → hay, pero no tanto: el comensal tiene que bajar la
 *    cantidad. No va a poder reenviar sin haberla bajado.
 *  - **Rojo** → no va: lo cambia por otra cosa o lo saca. No va a poder
 *    reenviar mientras siga en la comanda.
 *
 * Y escribe el **motivo**, que es obligatorio y viaja tal cual al teléfono del
 * comensal ("sólo me quedan tres gyozas"). Si el mozo termina marcando todos
 * los renglones, la modificación queda registrada como total; si marca
 * algunos, como parcial. No hace falta elegirlo a mano.
 */
@Component({
  selector: 'lm-mozo-rechazo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Devolver el pedido" conVolver (volver)="volver()">
        <!-- La mesa va arriba a la derecha y no en un renglón propio: el lugar es para el detalle. -->
        @if (pedido(); as p) {
          <span accion class="mesa">Mesa {{ p.mesaNumero }}</span>
        }
      </lm-encabezado>

      @if (pedido(); as p) {
        <div class="lm-body lm-body--gap12 lm-body--pantalla">

          <lm-separador flor rotulo="Marcá los afectados" />

          <div class="lm-card leyenda">
            <span class="leyenda__item">
              <i class="leyenda__sello leyenda__sello--cantidad">
                <lm-icono nombre="warning" [tamano]="20" color="#FFFFFF" />
              </i>
              Bajo stock
            </span>
            <span class="leyenda__item">
              <i class="leyenda__sello leyenda__sello--cambiar">
                <lm-icono nombre="block" [tamano]="20" color="#FFFFFF" />
              </i>
              Agotado
            </span>
          </div>

          <lm-separador flor rotulo="Detalle" />

          <div class="devolver__lista">
            @for (item of p.items; track item.id) {
              <div
                class="marcar"
                [class.marcar--cantidad]="marcaDe(item.productoId) === 'CANTIDAD'"
                [class.marcar--cambiar]="marcaDe(item.productoId) === 'CAMBIAR'"
              >
                <div class="marcar__datos">
                  <b>{{ item.productoNombre }}</b>
                  <small>
                    {{ item.cantidad }} ×
                    {{ item.precioUnitario | currency: 'ARS' : 'symbol-narrow' : '1.0-0' }}
                  </small>
                </div>

                <div class="marcar__botones">
                  <button
                    type="button"
                    class="marca marca--cantidad"
                    [class.marca--activa]="marcaDe(item.productoId) === 'CANTIDAD'"
                    [attr.aria-pressed]="marcaDe(item.productoId) === 'CANTIDAD'"
                    [attr.aria-label]="'Hay menos ' + item.productoNombre + ' del que pidió'"
                    (click)="alternar(item.productoId, 'CANTIDAD')"
                  >
                    <lm-icono nombre="warning" [tamano]="20" />
                  </button>
                  <button
                    type="button"
                    class="marca marca--cambiar"
                    [class.marca--activa]="marcaDe(item.productoId) === 'CAMBIAR'"
                    [attr.aria-pressed]="marcaDe(item.productoId) === 'CAMBIAR'"
                    [attr.aria-label]="'No podemos preparar ' + item.productoNombre"
                    (click)="alternar(item.productoId, 'CAMBIAR')"
                  >
                    <lm-icono nombre="block" [tamano]="20" />
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- El motivo ocupa un solo renglón para dejarle el lugar al detalle; al
               tocarlo se abre una ventana para escribirlo y leerlo entero. -->
          <div class="motivo" [class.lm-field--error]="error() !== null">
            <button type="button" class="lm-field__box motivo__boton" (click)="abrirMotivo()">
              <lm-icono nombre="notes" [tamano]="20" [color]="error() ? 'var(--state-error)' : 'var(--action-primary)'" />
              <span class="motivo__texto" [class.motivo__texto--vacio]="!formulario.controls.motivo.value">
                {{ formulario.controls.motivo.value || 'Motivo de la devolución' }}
              </span>
              <lm-icono nombre="edit" [tamano]="18" color="var(--action-primary)" />
            </button>
            <!-- El lugar del error está siempre reservado: si apareciera de golpe,
                 achicaría la lista y le cambiaría la tanda al detalle. -->
            <span class="lm-field__error motivo__error" [class.motivo__error--oculto]="error() === null" [attr.aria-hidden]="error() === null">
              <lm-icono nombre="error" [tamano]="16" />
              {{ error() ?? 'Escribí por qué devolvés el pedido' }}
            </span>
          </div>
        </div>

        @if (editandoMotivo()) {
          <div class="lm-modal__fondo" (click)="cerrarMotivo()">
            <div class="lm-modal motivo-modal" role="dialog" aria-modal="true" aria-label="Motivo de la devolución" (click)="$event.stopPropagation()">
              <h2 class="lm-modal__titulo">Motivo de la devolución</h2>
              <textarea
                #areaMotivo
                class="motivo-modal__area"
                rows="6"
                maxlength="240"
                placeholder="Sólo me quedan tres gyozas…"
                [value]="borradorMotivo()"
                (input)="borradorMotivo.set($any($event.target).value)"
              ></textarea>
              <span class="motivo-modal__cuenta">{{ borradorMotivo().length }}/240</span>
              <lm-decision class="lm-modal__acciones" rotuloRechazar="Cancelar" rotuloAceptar="Guardar el motivo"
                (rechazar)="cerrarMotivo()" (aceptar)="guardarMotivo()" />
            </div>
          </div>
        }

        <div class="lm-actionbar acciones">
          <lm-boton variante="danger" icono="close" (presionar)="volver()">Cancelar</lm-boton>
          <lm-boton variante="success" icono="edit_note" (presionar)="rechazar()">Devolver el pedido</lm-boton>
        </div>
      } @else {
        <div class="lm-body">
          <lm-vacio icono="receipt_long" titulo="No encontramos ese pedido">
            Puede que el comensal lo haya modificado desde su teléfono.
            <lm-boton accion variante="secondary" [ancho]="false" (presionar)="volver()">
              Volver a los pedidos
            </lm-boton>
          </lm-vacio>
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* Cancelar y devolver lado a lado, con el aro de vidrio del botón de volver. */
      .acciones { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
      .acciones ::ng-deep .lm-btn {
        background-clip: padding-box !important;
        border: 1.5px solid rgba(255, 255, 255, .5) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, .55),
          inset 0 -6px 12px rgba(255, 255, 255, .06),
          0 4px 10px rgba(94, 12, 44, .16) !important;
      }
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      /* La comanda corta dejaba media pantalla de color vacía abajo. Con los
         márgenes automáticos el aire sobrante se reparte arriba y abajo, y
         cuando la comanda es larga se resuelven en cero solos: el
         desplazamiento sigue arrancando en el primer renglón en vez de
         recortarlo, que es lo que pasaría con justify-content. */
      .lm-body > :first-child {
        margin-top: auto;
      }

      .lm-body > :last-child {
        margin-bottom: auto;
      }

      .mesa {
        flex: 0 0 auto; padding: 6px 12px; border-radius: var(--radius-pill);
        background: var(--surface-card); color: var(--action-primary);
        font: var(--type-label); font-size: 13px; letter-spacing: var(--tracking-label);
        text-transform: uppercase; white-space: nowrap;
        box-shadow: 0 0 0 1px rgba(232, 51, 111, .25), 0 3px 8px rgba(59, 8, 27, .16);
      }


      .leyenda {
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 10px;
        padding: var(--space-2) var(--space-3);
      }

      .leyenda__item {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        text-align: center;
        font-weight: 800;
        color: var(--text-body);
        font: var(--type-body-small);
        text-wrap: pretty;
      }

      /* El mismo sello que llevan las tarjetas de abajo. */
      .leyenda__sello {
        display: grid;
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        place-items: center;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, .6);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .7), 0 3px 8px rgba(94, 12, 44, .14);
      }

      .leyenda__sello--cantidad {
        background: var(--state-pending);
      }

      .leyenda__sello--cambiar {
        background: var(--state-error);
      }

      /* Sólo el detalle se desplaza, en tandas exactas: cada producto mide justo
         una parte de la lista y se ancla entero. El resto de la pantalla queda fijo. */
      .devolver__lista {
        flex: 1 1 0 !important; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3);
        container: devolver / size; overflow-y: auto; overscroll-behavior: contain;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0; scrollbar-width: none;
      }
      .devolver__lista::-webkit-scrollbar { display: none; }
      .devolver__lista > .marcar {
        --por: 1;
        flex: 0 0 calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por));
        min-height: min-content; scroll-snap-align: start; scroll-snap-stop: always;
      }
      @container devolver (min-height: 210px) { .devolver__lista > .marcar { --por: 2; } }
      @container devolver (min-height: 318px) { .devolver__lista > .marcar { --por: 3; } }
      @container devolver (min-height: 426px) { .devolver__lista > .marcar { --por: 4; } }

      /* Tarjeta en grilla: el nombre ocupa la fila de arriba a todo el ancho;
         abajo, a la izquierda la cantidad con el precio y a la derecha los
         botones de stock. */
      .marcar {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        column-gap: 10px;
        row-gap: 6px;
        overflow: hidden;
        padding: 8px var(--space-3);
        border-radius: var(--radius-card);
        background: var(--surface-card);
        box-shadow: var(--shadow-card);
      }

      /* La barra maciza es lo que hace que el marcado se vea de lejos: el
         tinte del fondo tiene que quedarse claro para no tapar el texto. */
      .marcar--cantidad,
      .marcar--cambiar {
        padding-left: clamp(24px, 7vw, 30px);
      }

      /* Bandita diagonal cruzando la esquina de arriba a la izquierda, de
         punta a punta: la tarjeta la recorta contra sus bordes, así que se lee
         como una cinta que la atraviesa, con tarjeta a los dos lados. */
      .marcar--cantidad::before,
      .marcar--cambiar::before {
        content: '';
        position: absolute;
        top: 12px;
        left: -16px;
        width: 64px;
        height: 9px;
        transform: rotate(-45deg);
      }

      .marcar--cantidad::before {
        background: var(--state-pending);
      }

      .marcar--cambiar::before {
        background: var(--state-error);
      }

      /* El renglón marcado se tiñe igual que como lo va a ver el comensal. */
      .marcar--cantidad {
        background: var(--state-pending-surface);
        box-shadow: 0 0 0 2px var(--state-pending), var(--shadow-card);
      }

      .marcar--cambiar {
        background: var(--state-error-surface);
        box-shadow: 0 0 0 2px var(--state-error), var(--shadow-card);
      }

      .marcar__datos { display: contents; }
      /* Con prioridad alta: el nombre siempre ocupa la fila de arriba entera. */
      .devolver__lista > .marcar > .marcar__datos > b { grid-column: 1 / -1 !important; grid-row: 1 !important; min-width: 0; text-align: center; }
      .devolver__lista > .marcar > .marcar__datos > small { grid-column: 1 !important; grid-row: 2 !important; min-width: 0; }
      .devolver__lista > .marcar > .marcar__datos > .marcar__rotulo { grid-column: 1 / -1 !important; grid-row: 3 !important; }
      .devolver__lista > .marcar > .marcar__botones { grid-column: 2 !important; grid-row: 2 !important; }

      /* Un escalón por encima del resto de las tarjetas de la aplicación: esta
         lista se lee de parado, con el teléfono a la altura de la cintura. */
      .marcar__datos b {
        display: block;
        color: var(--text-title);
        font: var(--type-section);
        text-wrap: pretty;
      }

      .marcar__datos small {
        display: block;
        color: var(--text-muted);
        font: 600 clamp(15px, 4.2vw, 17px)/1.3 var(--font-text);
      }

      .marcar__rotulo {
        display: block;
        font: var(--type-body-small);
        font-weight: 800;
      }

      .marcar--cantidad .marcar__rotulo {
        color: var(--state-pending);
      }

      .marcar--cambiar .marcar__rotulo {
        color: var(--state-error);
      }

      .marcar__botones {
        display: flex;
        gap: 6px;
      }

      /* Apagados van en borde; encendidos, en color pleno. Así se ve de un
         vistazo cuáles marcó, sin tener que leer. */
      /* Los dos sellos son lo único que se toca en esta pantalla y están
         pegados uno al otro: no bajan del área táctil mínima ni cuando el
         nombre del producto pide todo el ancho. */
      .marca {
        display: grid;
        width: var(--touch-min);
        height: var(--touch-min);
        place-items: center;
        border-radius: 50%;
        background: var(--surface-card);
        cursor: pointer;
      }

      .marca--cantidad {
        border: 2px solid var(--state-pending);
        color: var(--state-pending);
      }

      .marca--cambiar {
        border: 2px solid var(--state-error);
        color: var(--state-error);
      }

      .marca--cantidad.marca--activa {
        background: var(--state-pending);
        color: #ffffff;
      }

      .marca--cambiar.marca--activa {
        background: var(--state-error);
        color: #ffffff;
      }

      .marca:active {
        transform: scale(0.94);
      }

      .motivo__boton {
        width: 100%; cursor: pointer; text-align: left; font: inherit;
        min-height: 46px; gap: 10px;
      }
      /* Los íconos no ceden ancho: el texto largo se recorta con "…" entre ellos. */
      .motivo__boton lm-icono { flex: 0 0 auto; display: grid; place-items: center; }
      .motivo__texto {
        flex: 1 1 auto; min-width: 0; color: var(--text-title); font: var(--type-body-medium);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .motivo__texto--vacio { color: var(--text-muted); }
      .motivo.lm-field--error .motivo__boton { border-color: var(--state-error); }
      .motivo__error--oculto { visibility: hidden; }

      /* La ventana del motivo: el texto se escribe y se relee completo. */
      .motivo-modal { gap: var(--space-3); }
      .motivo-modal__area {
        width: 100%; box-sizing: border-box; min-height: 140px; padding: var(--space-3);
        border-radius: var(--radius-field); border: 2px solid rgba(255, 79, 139, .35);
        background: #FFFFFF; color: var(--text-title); font: var(--type-body-medium);
        resize: none; outline: none;
      }
      .motivo-modal__area:focus { border-color: var(--action-primary); }
      .motivo-modal__cuenta { align-self: flex-end; font: var(--type-caption); color: var(--text-muted); }

      .motivo .lm-field__hint {
        font: var(--type-body-small);
      }
    `,
  ],
})
export class MozoRechazoPage extends PaginaConSesion {
  private readonly fb = inject(FormBuilder);
  private readonly pedidos = inject(PedidosService);

  readonly id = input.required<string>();

  /** Qué marcó el mozo, por producto. Sin entrada, el renglón va como está. */
  protected readonly marcas = signal<Record<string, MarcaRechazo>>({});
  private latido = false;

  /** La ventana para escribir el motivo y lo que se lleva escrito en ella. */
  protected readonly editandoMotivo = signal(false);
  protected readonly borradorMotivo = signal('');
  private readonly areaMotivo = viewChild<ElementRef<HTMLTextAreaElement>>('areaMotivo');

  protected readonly formulario = this.fb.nonNullable.group({
    motivo: [
      '',
      [
        requerido('Escribí por qué devolvés el pedido'),
        largoMinimo(6, 'Contá un poco más qué cambiar'),
      ],
    ],
  });

  protected readonly pedido = computed(() => this.pedidos.porId(this.id()));

  protected marcaDe(productoId: string): MarcaRechazo | null {
    return this.marcas()[productoId] ?? null;
  }

  /**
   * En la pantalla del mozo el rótulo va en su idioma —lo que él vio en la
   * cocina—, no en el del comensal: "sin stock", no "no lo podemos preparar".
   */
  protected rotuloMarca(marca: MarcaRechazo): string {
    return ROTULO_MARCA_MOZO[marca];
  }

  /** Tocar la marca que ya estaba puesta la saca; tocar la otra la cambia. */
  protected alternar(productoId: string, marca: MarcaRechazo): void {
    this.marcas.update((actual) => {
      const siguiente = { ...actual };
      if (siguiente[productoId] === marca) delete siguiente[productoId];
      else siguiente[productoId] = marca;
      return siguiente;
    });
    void Haptics.selectionChanged().catch(() => undefined);
  }

  protected error(): string | null {
    return mensajeDe(this.formulario.controls.motivo);
  }

  private hayMotivo(): boolean {
    return this.formulario.controls.motivo.value.trim().length >= 6;
  }

  protected abrirMotivo(): void {
    this.borradorMotivo.set(this.formulario.controls.motivo.value);
    this.editandoMotivo.set(true);
    setTimeout(() => this.areaMotivo()?.nativeElement.focus(), 60);
  }

  protected cerrarMotivo(): void {
    this.editandoMotivo.set(false);
  }

  protected guardarMotivo(): void {
    const control = this.formulario.controls.motivo;
    control.setValue(this.borradorMotivo().trim());
    control.markAsDirty();
    this.editandoMotivo.set(false);
    this.latir();
  }

  /** Un solo golpecito, cuando el motivo pasa a ser suficiente. */
  protected latir(): void {
    if (!this.hayMotivo() || this.latido) return;
    this.latido = true;
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
  }

  private observaciones(): ObservacionItem[] {
    const p = this.pedido();
    if (!p) return [];
    return p.items
      .filter((item) => this.marcaDe(item.productoId) !== null)
      .map((item) => ({
        productoId: item.productoId,
        marca: this.marcaDe(item.productoId)!,
        cantidadAlMarcar: item.cantidad,
      }));
  }

  /**
   * Lo marcado, un renglón por producto, para la ficha del modal.
   *
   * Cada uno lleva el mismo sello que tenía su tarjeta acá arriba —amarillo
   * con la advertencia, rojo con el bloqueo—, así el mozo reconoce de un
   * vistazo lo que acaba de marcar en vez de releer una lista separada por
   * comas.
   */
  private marcasAfectadas(): MarcaFicha[] {
    const p = this.pedido();
    if (!p) return [];
    return this.observaciones().map((observacion) => {
      const nombre =
        p.items.find((item) => item.productoId === observacion.productoId)?.productoNombre ?? '';
      return {
        icono: observacion.marca === 'CANTIDAD' ? 'warning' : 'block',
        tono: observacion.marca === 'CANTIDAD' ? ('pendiente' as const) : ('peligro' as const),
        // Ícono y nombre del producto; el motivo de la marca no se repite acá.
        texto: nombre,
      };
    });
  }

  protected async rechazar(): Promise<void> {
    const p = this.pedido();
    const usuario = this.usuario();
    if (!p || !usuario) return;

    marcarEnviado(this.formulario);

    if (this.formulario.invalid) {
      void Haptics.notification({ type: NotificationType.Error }).catch(() => undefined);
      this.avisos.error('Falta el motivo', 'Escribí qué hay que modificar antes de devolverlo.');
      return;
    }

    const motivo = this.formulario.controls.motivo.value.trim();
    const marcado = this.marcasAfectadas();

    const detalleConIconos = [
      { rotulo: 'Mesa', valor: String(p.mesaNumero), icono: 'table_restaurant' },
      { rotulo: 'Comensal', valor: p.clienteNombre, icono: 'person' },
      ...(marcado.length
        ? [{ rotulo: 'Afectados', valor: '', icono: 'remove_shopping_cart', marcas: marcado }]
        : []),
      { rotulo: 'Motivo', valor: motivo, icono: 'notes' },
    ];

    const seguro = await this.preguntar({
      titulo: '¿Devolvés el pedido?',
      confirmar: 'Devolver',
      tono: 'peligro',
      icono: 'edit_note',
      // Cuatro renglones de texto plano se leen como un párrafo. El ícono de
      // cada uno dice de qué habla la fila antes de leer el rótulo, que es lo
      // que hace falta cuando se confirma algo que no tiene vuelta atrás.
      detalle: detalleConIconos,
    });
    if (!seguro) return;

    try {
      void Haptics.notification({ type: NotificationType.Warning }).catch(() => undefined);
      await this.cargando.conEsperaMinima(
        'Devolviendo el pedido…',
        () => this.pedidos.rechazar(p, usuario, motivo, this.observaciones()),
        400,
      );
      this.avisos.info(
        `Mesa ${p.mesaNumero} avisada`,
        'El comensal ya puede corregir su pedido y volver a enviarlo.',
      );
      this.volver();
    } catch (error) {
      this.avisos.error('No pudimos devolver el pedido', textoDe(error));
    }
  }

  protected volver(): void {
    this.ir(['/mozo/pedidos']);
  }
}

function textoDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Revisá la conexión e intentá nuevamente.';
}
