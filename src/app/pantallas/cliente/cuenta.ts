import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { UI } from '../../ui';
import { Pedido } from '../../nucleo/modelos/modelos';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { PROPINAS, QrService } from '../../nucleo/servicios/qr.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';

type Paso = 'PROPINA' | 'DETALLE';

/**
 * Punto 21 · la cuenta, de la propina al detalle, como el cobro de Mercado Pago.
 *
 *  1. Propina: se escanea el código de la mesa. Sin propina no hay cuenta.
 *  2. Detalle: lo pedido con sus precios, el descuento del juego, la propina y
 *     el total, grande y claro.
 *
 * El paso sale del pedido —si ya tiene propina— más lo que el comensal elija
 * adelante o atrás, así al reabrir la aplicación vuelve donde estaba.
 */
@Component({
  selector: 'lm-cliente-cuenta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...UI],
  template: `
    <lm-titulo class="cta__titulo">
      Tu cuenta
    </lm-titulo>

    <div class="cta">
      @switch (paso()) {
        @case ('PROPINA') {
          <!-- 1 · Propina -->
          <div class="lm-card propina">
            <b class="propina__titulo">Dejá tu propina</b>
            <ul class="propina__niveles">
              @for (nivel of propinas; track nivel.porcentaje; let i = $index) {
                <li [attr.data-nivel]="nivel.porcentaje" [class.on]="nivel.porcentaje === pedido().porcentajePropina">
                  <lm-icono [nombre]="caritas[i]" [tamano]="22" />
                  <span>{{ nivel.rotulo }}</span><b>{{ nivel.porcentaje }} %</b>
                </li>
              }
            </ul>

            <!-- El botón es el código: debajo de los niveles, el ícono del QR y qué hacer. -->
            <button type="button" class="propina__escanear" (click)="escanear()">
              <span class="propina__icono"><lm-icono nombre="qr_code_scanner" [tamano]="38" color="#FFFFFF" /></span>
              <span class="propina__leyenda">Escaneá el QR</span>
            </button>
          </div>
          <!-- Seguir a la cuenta: recién con la propina fijada por el código. -->
          <div class="cta__pie">
            <lm-boton variante="success" icono="arrow_forward" [deshabilitado]="!tienePropina()" (presionar)="ir('DETALLE')">
              Siguiente
            </lm-boton>
          </div>
        }

        @case ('DETALLE') {
          <!-- 2 · Detalle de la cuenta -->
          <div class="lm-card total">
            <span>Total a pagar</span>
            <b>{{ total() | pesos }}</b>
          </div>

          <div class="lm-card detalle">
            <ul class="detalle__items">
              @for (item of pedido().items; track item.id) {
                <li>
                  <b class="detalle__nombre">{{ item.cantidad }} × {{ item.productoNombre }}</b>
                  <span class="detalle__linea">
                    <small>{{ item.precioUnitario | pesos }} c/u</small>
                    <span class="detalle__importe">{{ item.subtotal | pesos }}</span>
                  </span>
                </li>
              }
            </ul>

            <div class="detalle__resumen">
              <div><span>Subtotal</span><span>{{ pedido().totalBruto | pesos }}</span></div>
              @if (pedido().montoDescuentoJuego > 0) {
                <div class="detalle__descuento">
                  <span>Descuento ({{ pedido().descuentoJuego }} %)</span>
                  <span>− {{ pedido().montoDescuentoJuego | pesos }}</span>
                </div>
              }
              <div>
                <span>Propina ({{ pedido().porcentajePropina }} %)</span>
                <span>+ {{ pedido().montoPropina ?? 0 | pesos }}</span>
              </div>
              <div class="detalle__total"><span>TOTAL</span><span>{{ total() | pesos }}</span></div>
            </div>
          </div>

          <div class="cta__pie">
            <button type="button" class="cta__atras" (click)="ir('PROPINA')">
              <lm-icono nombre="arrow_back" [tamano]="18" /> Anterior
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex-direction: column; gap: var(--space-3); flex: 1 1 auto; min-height: 0; }
      .cta__titulo { flex: 0 0 auto; }
      .cta__titulo ::ng-deep .lm-title { align-items: center; }
      .cta { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3); }
      .cta__pie { flex: 0 0 auto; display: flex; align-items: center; gap: var(--space-3); margin-top: auto; }
      .cta__pie lm-boton { flex: 1 1 auto; }
      .cta__atras {
        flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px; min-height: var(--touch-min);
        padding: 0 var(--space-3); border: 1.5px solid rgba(255, 255, 255, .6); border-radius: var(--radius-field);
        background: transparent; color: #FFFFFF; font: var(--type-button); cursor: pointer;
      }

      /* 1 · Propina */
      .propina { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-5) var(--space-4); text-align: center; }
      .propina__escanear {
        display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: clamp(28px, 3vh + 12px, 48px);
        padding: 0; border: none; background: none; cursor: pointer;
      }
      .propina__icono {
        width: 76px; height: 76px; border-radius: 24px; display: grid; place-items: center;
        background: var(--action-primary); border: 2px solid rgba(255, 255, 255, .7);
        box-shadow: 0 6px 16px rgba(199, 38, 87, .4);
        transition: transform var(--dur-fast) var(--ease-out-soft);
      }
      .propina__escanear:active .propina__icono { transform: scale(.94); }
      .propina__leyenda { font: var(--type-card-title); color: var(--action-primary); }
      .propina__titulo { font: var(--type-section); color: var(--text-title); margin-bottom: var(--space-3); }
      .propina__niveles { list-style: none; margin: 0; padding: 0; width: 100%; display: grid; gap: 6px; }
      /* Un color por nivel, de verde a rojizo, como la escala del 0 al 10, y la
         carita que le corresponde: se lee de un vistazo que es satisfacción. */
      .propina__niveles li {
        --fondo: var(--surface-sunken); --tinta: var(--text-title);
        display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 14px;
        background: var(--fondo); color: var(--tinta); font: var(--type-body); font-weight: 700;
      }
      .propina__niveles li span { flex: 1 1 auto; text-align: left; }
      .propina__niveles li b { font: 800 16px/1 var(--font-numeric); }
      .propina__niveles li[data-nivel='20'] { --fondo: #D9F2E4; --tinta: #1B6B43; }
      .propina__niveles li[data-nivel='15'] { --fondo: #E8F4D6; --tinta: #3D6510; }
      .propina__niveles li[data-nivel='10'] { --fondo: #FFF0D2; --tinta: #7A4A00; }
      .propina__niveles li[data-nivel='5'] { --fondo: #FFE4D3; --tinta: #93400C; }
      .propina__niveles li[data-nivel='0'] { --fondo: #FFDCD6; --tinta: #9E1D13; }
      .propina__niveles li.on { box-shadow: inset 0 0 0 2.5px var(--tinta); }
      /* En pantallas bajas, con el botón de Siguiente abajo, la tarjeta se aprieta
         sola para que entren el título, los cinco niveles y el código. */
      .propina { container: propina / size; }
      @container propina (max-height: 440px) {
        .propina__titulo { margin-bottom: 0; }
        .propina__niveles li { padding: 6px 14px; }
        .propina__escanear { margin-top: var(--space-3); gap: 4px; }
        .propina__icono { width: 62px; height: 62px; border-radius: 20px; }
      }

      /* El total, grande y claro, como el monto de Mercado Pago. */
      .total { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: var(--space-4); }
      .total span { font: var(--type-body-small); font-weight: 700; color: var(--text-muted); }
      .total b { font: 900 clamp(34px, 11vw, 44px)/1.05 var(--font-numeric); color: var(--action-primary); }
      /* En pantallas bajas el total grande pasa a un renglón: la lista de
         productos nunca baja de un renglón entero (70px, con el nombre en dos). */
      @media (max-height: 660px) {
        .total { flex-direction: row; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); }
        .total b { font-size: clamp(24px, 7vw, 28px); }
      }

      /* 2 · Detalle: los productos se desplazan adentro; el resumen queda fijo abajo. */
      .detalle { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; padding: var(--space-3) var(--space-4); }
      /* Los productos van en tandas exactas, como las otras listas: según el alto
         que haya entran tantos renglones enteros como quepan (cada uno, con el
         nombre en hasta dos renglones, mide como mucho 70px) y cada renglón
         mide justo esa parte. El snap frena en tandas completas: nada cortado. */
      .detalle__items {
        list-style: none; margin: 0; padding: 0; flex: 1 1 0; min-height: 70px;
        display: flex; flex-direction: column; container: detalle / size;
        overflow-y: auto; overscroll-behavior: contain; scroll-snap-type: y mandatory; scrollbar-width: none;
      }
      .detalle__items::-webkit-scrollbar { display: none; }
      .detalle__items li {
        --por: 1;
        flex: 0 0 calc(100cqh / var(--por)); min-height: 0; box-sizing: border-box;
        display: flex; flex-direction: column; justify-content: center; gap: 3px;
        border-bottom: 1px solid var(--border-divider); scroll-snap-align: start; scroll-snap-stop: always;
      }
      @container detalle (min-height: 140px) { .detalle__items li { --por: 2; } }
      @container detalle (min-height: 210px) { .detalle__items li { --por: 3; } }
      @container detalle (min-height: 280px) { .detalle__items li { --por: 4; } }
      @container detalle (min-height: 350px) { .detalle__items li { --por: 5; } }
      @container detalle (min-height: 420px) { .detalle__items li { --por: 6; } }
      @container detalle (min-height: 490px) { .detalle__items li { --por: 7; } }
      .detalle__nombre {
        font: 800 clamp(15px, 4.3vw, 17px)/1.2 var(--font-text); color: var(--text-title);
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }
      .detalle__linea { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-3); }
      .detalle__linea small { font: 650 clamp(13.5px, 3.8vw, 15px)/1.2 var(--font-text); color: var(--text-muted); }
      .detalle__importe { flex: 0 0 auto; font: 900 clamp(16px, 4.6vw, 18px)/1.2 var(--font-numeric); color: var(--text-title); }
      .detalle__resumen { flex: 0 0 auto; display: grid; gap: 6px; padding-top: var(--space-3); }
      .detalle__resumen div { display: flex; justify-content: space-between; gap: var(--space-3); font: 700 clamp(15px, 4.2vw, 16.5px)/1.3 var(--font-text); color: var(--text-body); }
      .detalle__resumen span:last-child { flex: 0 0 auto; font-family: var(--font-numeric); font-weight: 800; }
      .detalle__descuento { color: var(--state-success) !important; }
      .detalle__descuento span:first-child { display: inline-flex; align-items: center; gap: 4px; }
      .detalle__total { padding-top: 8px; border-top: 1.5px solid var(--border-divider); }
      .detalle__total span { font: 900 clamp(20px, 6vw, 24px)/1.1 var(--font-numeric) !important; color: var(--action-primary); }
    `,
  ],
})
export class ClienteCuentaComponent {
  private readonly pedidos = inject(PedidosService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);

  readonly pedido = input.required<Pedido>();

  protected readonly propinas = PROPINAS;
  /** La carita de cada nivel de propina, de Excelente a Malo. */
  protected readonly caritas = [
    'sentiment_very_satisfied',
    'sentiment_satisfied',
    'sentiment_neutral',
    'sentiment_dissatisfied',
    'sentiment_very_dissatisfied',
  ];

  /** A dónde fue el comensal con los botones de adelante y atrás. */
  private readonly elegido = signal<Paso | null>(null);

  protected readonly tienePropina = computed(() => {
    const pct = this.pedido().porcentajePropina;
    return pct !== null && pct !== undefined;
  });

  /** Sin propina no hay cuenta: el primer paso es siempre escanearla. */
  protected readonly paso = computed<Paso>(() => (this.tienePropina() ? (this.elegido() ?? 'DETALLE') : 'PROPINA'));

  protected readonly total = computed(() => this.pedidos.totalAPagar(this.pedido()));
  protected ir(paso: Paso): void {
    this.elegido.set(paso);
  }

  /** Lee el código de propina de la mesa: es lo único que fija el porcentaje. */
  protected async escanear(): Promise<void> {
    if (!this.escaner.disponible()) {
      this.avisos.info(
        'El lector funciona en el teléfono',
        'Instalá la aplicación en Android para escanear el código de propina de tu mesa.',
      );
      return;
    }

    const leido = await this.escaner.leer('QR');
    if (!leido) return;

    const contenido = this.qr.interpretar(leido);
    if (contenido.tipo !== 'PROPINA') {
      this.avisos.error('Ese no es un código de propina', 'Buscá en tu mesa el código que dice cómo te atendimos.');
      return;
    }

    const p = this.pedido();
    const monto = Math.round((p.totalFinal * contenido.porcentaje) / 100);
    const seguro = await this.confirmacion.pedir({
      titulo: '¿Dejás esta propina?',
      mensaje: '',
      confirmar: 'Dejar propina',
      tono: 'exito',
      icono: 'volunteer_activism',
      detalle: [
        { rotulo: 'Atención', valor: contenido.rotulo },
        { rotulo: 'Propina', valor: `${contenido.porcentaje} % · $ ${monto.toLocaleString('es-AR')}` },
      ],
    });
    if (!seguro) return;

    try {
      await this.cargando.conEsperaMinima('Sumando la propina…', () =>
        this.pedidos.elegirPropina(p.id, contenido.porcentaje),
      );
    } catch (err) {
      this.avisos.error('No se pudo sumar la propina', err instanceof Error ? err.message : 'Probá de nuevo.');
      return;
    }
    this.elegido.set('DETALLE');
  }
}
