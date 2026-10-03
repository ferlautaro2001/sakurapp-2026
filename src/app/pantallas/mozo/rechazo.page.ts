import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
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
      <lm-encabezado titulo="Devolver el pedido" conVolver (volver)="volver()" />

      @if (pedido(); as p) {
        <div class="lm-body lm-body--gap12">
          <div class="lm-card mesa">
            <span class="mesa__icono">
              <lm-icono nombre="table_restaurant" [tamano]="24" color="var(--action-primary)" />
            </span>
            <div class="mesa__datos">
              <b>Mesa {{ p.mesaNumero }} - {{ p.clienteNombre }}</b>
            </div>
          </div>

          @if (resumenError()) {
            <lm-banner tono="error" titulo="Falta información">{{ resumenError() }}</lm-banner>
          }

          <lm-separador flor rotulo="Marcá los productos afectados" />

          <div class="lm-card leyenda">
            <span class="leyenda__item">
              <i class="leyenda__sello leyenda__sello--cantidad">
                <lm-icono nombre="warning" [tamano]="30" color="#FFFFFF" />
              </i>
              Bajo stock
            </span>
            <span class="leyenda__item">
              <i class="leyenda__sello leyenda__sello--cambiar">
                <lm-icono nombre="block" [tamano]="30" color="#FFFFFF" />
              </i>
              Agotado
            </span>
          </div>

          <lm-separador flor rotulo="Detalle" />

          <div class="lm-list">
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
                  @if (marcaDe(item.productoId); as marca) {
                    <span class="marcar__rotulo">{{ rotuloMarca(marca) }}</span>
                  }
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

          <lm-separador flor rotulo="Motivo" />

          <label class="lm-field motivo" [class.lm-field--error]="error() !== null">
            <span class="lm-field__box motivo__box">
              <lm-icono
                nombre="notes"
                [tamano]="20"
                [color]="error() ? 'var(--state-error)' : 'var(--action-primary)'"
              />
              <textarea
                rows="3"
                maxlength="240"
                enterkeyhint="done"
                [formControl]="formulario.controls.motivo"
                placeholder="Sólo me quedan tres gyozas…"
                (input)="latir()"
              ></textarea>
            </span>
            @if (error()) {
              <span class="lm-field__error">
                <lm-icono nombre="error" [tamano]="16" />
                {{ error() }}
              </span>
            } @else {
              <span class="lm-field__hint">El comensal lee este texto tal como lo escribís.</span>
            }
          </label>
        </div>

        <div class="lm-actionbar">
          <lm-boton variante="ghost" icono="edit_note" (presionar)="rechazar()">
            Devolver el pedido
          </lm-boton>
          <lm-texto-boton (presionar)="volver()">Cancelar</lm-texto-boton>
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
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
      }

      .mesa__icono {
        display: grid;
        flex: 0 0 auto;
        width: var(--touch-min);
        min-height: var(--touch-min);
        place-items: center;
        border-radius: 14px;
        background: var(--surface-sunken);
      }

      /* El título ocupa todo el ancho que deja el ícono y va centrado; el ícono
         se equilibra con un hueco del mismo ancho a la derecha. */
      .mesa { align-items: center; justify-content: center; }
      .mesa::after { content: ''; flex: 0 0 var(--touch-min); }
      .mesa__datos { flex: 1 1 auto; min-width: 0; text-align: center; }
      .mesa__datos b { text-wrap: balance; overflow-wrap: anywhere; }

      .mesa__datos b {
        display: block;
        color: var(--text-title);
        font: var(--type-section);
      }

      .mesa__datos small {
        display: block;
        color: var(--text-muted);
        font: var(--type-body-small);
      }

      .leyenda {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding: var(--space-4);
      }

      .leyenda__item {
        display: flex;
        flex-direction: column;
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
        width: 56px;
        height: 56px;
        place-items: center;
        border-radius: 50%;
      }

      .leyenda__sello--cantidad {
        background: var(--state-pending);
      }

      .leyenda__sello--cambiar {
        background: var(--state-error);
      }

      .marcar {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        overflow: hidden;
        padding: 10px var(--space-3);
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

      .marcar__datos {
        min-width: 0;
        flex: 1 1 auto;
      }

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
        font: var(--type-body-small);
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
        flex: 0 0 auto;
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

      .motivo__box {
        align-items: flex-start;
        padding-top: 10px;
      }

      /* El motivo viaja tal cual al teléfono del comensal y se revisa antes de
         mandarlo: se escribe y se relee con el mismo cuerpo del texto de
         lectura, no con el del pie de una tarjeta. */
      .motivo textarea {
        width: 100%;
        min-height: 76px;
        border: 0;
        background: transparent;
        color: var(--text-title);
        font: var(--type-body-medium);
        resize: none;
        outline: none;
      }

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

  protected readonly resumenError = signal<string | null>(null);
  /** Qué marcó el mozo, por producto. Sin entrada, el renglón va como está. */
  protected readonly marcas = signal<Record<string, MarcaRechazo>>({});
  private latido = false;

  protected readonly formulario = this.fb.nonNullable.group({
    motivo: [
      '',
      [
        requerido('Escribí por qué devolvés el pedido'),
        largoMinimo(6, 'Contale un poco más para que sepa qué cambiar'),
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
        texto: `${nombre} · ${ROTULO_MARCA_MOZO[observacion.marca].toLowerCase()}`,
      };
    });
  }

  protected async rechazar(): Promise<void> {
    const p = this.pedido();
    const usuario = this.usuario();
    if (!p || !usuario) return;

    this.resumenError.set(null);
    marcarEnviado(this.formulario);

    if (this.formulario.invalid) {
      this.resumenError.set(
        'No se puede devolver un pedido sin decirle al comensal qué tiene que cambiar.',
      );
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
      mensaje:
        'El comensal lo recibe en el momento, con tu motivo. Ve marcados los productos afectados, corrige lo que haga falta y te lo manda de nuevo. No llega a Cocina ni a Bar.',
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
