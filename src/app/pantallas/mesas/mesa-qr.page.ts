import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { ROTULO_TIPO_MESA } from '../../nucleo/modelos/enums';

/**
 * Detalle y gestión compacta de Mesa con código QR identificador,
 * estado de disponibilidad y acceso a pantalla completa sin desbordar el viewport móvil.
 */
@Component({
  selector: 'lm-mesa-qr',
  imports: [...UI],
  template: `
    <div class="pantalla-mesa">
      @if (mesa(); as m) {
        <!-- Encabezado con botón volver -->
        <header class="hdr">
          <button type="button" class="hdr__volver" aria-label="Volver a mesas" (click)="volver()">
            <lm-icono nombre="arrow_back" [tamano]="22" color="#FFFFFF" />
          </button>
          <h1 class="hdr__titulo">Mesa {{ m.numero }}</h1>
        </header>

        <main class="contenedor-tarjetas">
          <!-- Tarjeta 1: Información de la mesa -->
          <div class="tarjeta-blanca">
            <div class="tarjeta-blanca__encabezado">
              <lm-icono nombre="table_restaurant" [tamano]="20" color="#6E1234" />
              <h2>Información de la mesa</h2>
            </div>
            <div class="grid-info">
              <div class="subtarjeta-info">
                <div class="subtarjeta-info__icono">
                  <lm-icono nombre="group" [tamano]="22" color="#6E1234" />
                </div>
                <div class="subtarjeta-info__datos">
                  <span class="subtarjeta-info__etiqueta">Comensales</span>
                  <span class="subtarjeta-info__valor">{{ m.cantidadComensales }}</span>
                </div>
              </div>
              <div class="subtarjeta-info">
                <div class="subtarjeta-info__icono">
                  <lm-icono nombre="event_seat" [tamano]="22" color="#6E1234" />
                </div>
                <div class="subtarjeta-info__datos">
                  <span class="subtarjeta-info__etiqueta">Tipo de mesa</span>
                  <span class="subtarjeta-info__valor subtarjeta-info__valor--tipo">{{ tipo() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tarjeta 2: Disponibilidad -->
          <div class="tarjeta-blanca">
            <div class="fila-disponibilidad-top">
              <h2>Disponibilidad</h2>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="ocupada()"
                class="switch"
                [class.switch--on]="ocupada()"
                (click)="toggleOcupada()"
              >
                <span class="switch__perilla"></span>
              </button>
            </div>
            <div class="fila-disponibilidad-estado">
              <span class="dot" [class.dot--ocupada]="ocupada()" [class.dot--libre]="!ocupada()"></span>
              <div class="disponibilidad-texto">
                <span class="disponibilidad-texto__titulo">
                  {{ ocupada() ? 'Mesa ocupada' : 'Mesa libre' }}
                </span>
                <span class="disponibilidad-texto__bajada">
                  {{ ocupada() ? 'Desactivá para liberar la mesa.' : 'Activá para ocupar la mesa.' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tarjeta 3: Código QR de la mesa -->
          <div class="tarjeta-blanca tarjeta-qr">
            <div class="tarjeta-blanca__encabezado">
              <lm-icono nombre="qr_code_2" [tamano]="20" color="#6E1234" />
              <h2>Código QR de la mesa</h2>
            </div>

            <div class="qr-marco">
              @if (fuenteQr() || m.qrCodeUrl) {
                <img
                  [src]="fuenteQr() || m.qrCodeUrl"
                  [alt]="'Código QR de la mesa ' + m.numero"
                  class="qr-imagen"
                />
              } @else {
                <div class="qr-placeholder">
                  <lm-icono nombre="qr_code" [tamano]="36" color="#8C3A57" />
                  <span>Generando QR…</span>
                </div>
              }
            </div>

            <p class="qr-bajada">
              Este código permite a los clientes acceder desde sus dispositivos.
            </p>

            <button type="button" class="btn-fullscreen" (click)="mostrarQrCompleto.set(true)">
              <lm-icono nombre="fullscreen" [tamano]="18" color="#7A1535" />
              <span>Ver en pantalla completa</span>
            </button>
          </div>

          <!-- Botones inferiores de acción -->
          <div class="acciones-inferiores">
            <button type="button" class="btn-guardar" (click)="guardarCambios()">
              <lm-icono nombre="save" [tamano]="20" color="#B92E58" />
              <span>Guardar cambios</span>
            </button>
            <button type="button" class="btn-cancelar" (click)="volver()">
              Cancelar
            </button>
          </div>
        </main>

        <!-- Modal QR en Pantalla Completa -->
        @if (mostrarQrCompleto()) {
          <div class="modal-qr-fondo" (click)="mostrarQrCompleto.set(false)">
            <div class="modal-qr-card" (click)="$event.stopPropagation()">
              <div class="modal-qr-header">
                <h3>Mesa {{ m.numero }}</h3>
                <button type="button" class="btn-cerrar-modal" (click)="mostrarQrCompleto.set(false)">
                  <lm-icono nombre="close" [tamano]="22" color="#6E1234" />
                </button>
              </div>
              <img
                [src]="fuenteQr() || m.qrCodeUrl"
                [alt]="'QR Mesa ' + m.numero"
                class="modal-qr-img"
              />
              <p class="modal-qr-texto">Escaneá este código para ingresar a la mesa.</p>
              <lm-boton variante="primary" (presionar)="mostrarQrCompleto.set(false)">
                Cerrar
              </lm-boton>
            </div>
          </div>
        }
      } @else {
        <div class="pantalla-vacia">
          <lm-vacio icono="table_restaurant" titulo="No encontramos esa mesa">
            Puede que la mesa ya no esté disponible.
            <lm-boton accion variante="secondary" [ancho]="false" (presionar)="volver()">
              Volver a mesas
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
        width: 100%;
        min-height: 0;
        background: #B92E58;
      }

      .pantalla-mesa {
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 100%;
        min-height: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        background: #B92E58;
        padding: 10px 16px 16px;
        box-sizing: border-box;
      }

      .pantalla-vacia {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      /* Header */
      .hdr {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
        padding-top: max(2px, env(safe-area-inset-top));
      }

      .hdr__volver {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.18);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.12s ease, opacity 0.12s ease;
      }

      .hdr__volver:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.28);
      }

      .hdr__titulo {
        margin: 0;
        color: #FFFFFF;
        font: var(--type-title, 700 22px var(--font-display, sans-serif));
        letter-spacing: -0.01em;
      }

      /* Contenedor tarjetas */
      .contenedor-tarjetas {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      /* Tarjetas Blancas */
      .tarjeta-blanca {
        background: #FFFFFF;
        border-radius: 18px;
        padding: 12px 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .tarjeta-blanca__encabezado {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }

      .tarjeta-blanca__encabezado h2 {
        margin: 0;
        font: var(--type-card-title, 700 15px var(--font-display, sans-serif));
        color: #6E1234;
      }

      /* Información de la mesa */
      .grid-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .subtarjeta-info {
        background: #FDF2F4;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .subtarjeta-info__icono {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .subtarjeta-info__datos {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .subtarjeta-info__etiqueta {
        font: var(--type-label, 500 11px var(--font-text, sans-serif));
        color: #7A2E44;
      }

      .subtarjeta-info__valor {
        font: var(--type-section, 800 18px var(--font-display, sans-serif));
        color: #6E1234;
        line-height: 1.15;
      }

      .subtarjeta-info__valor--tipo {
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Disponibilidad */
      .fila-disponibilidad-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .fila-disponibilidad-top h2 {
        margin: 0;
        font: var(--type-card-title, 700 15px var(--font-display, sans-serif));
        color: #6E1234;
      }

      /* Switch */
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
        transition: background-color 0.22s ease;
      }

      .switch--on {
        background: #C72657;
      }

      .switch__perilla {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #FFFFFF;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
        transform: translateX(0);
      }

      .switch--on .switch__perilla {
        transform: translateX(22px);
      }

      .fila-disponibilidad-estado {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-top: 4px;
        flex-shrink: 0;
      }

      .dot--ocupada {
        background: #D6336C;
      }

      .dot--libre {
        background: #1B7A4C;
      }

      .disponibilidad-texto {
        display: flex;
        flex-direction: column;
      }

      .disponibilidad-texto__titulo {
        font: var(--type-body-small, 700 13px var(--font-text, sans-serif));
        color: #6E1234;
      }

      .disponibilidad-texto__bajada {
        font: var(--type-caption, 400 11px var(--font-text, sans-serif));
        color: #7A2E44;
        margin-top: 1px;
      }

      /* Tarjeta QR */
      .tarjeta-qr {
        text-align: center;
        padding-bottom: 14px;
      }

      .qr-marco {
        width: 140px;
        height: 140px;
        margin: 4px auto 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qr-imagen {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        image-rendering: pixelated;
      }

      .qr-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 10px;
        background: #FDF2F4;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: #8C3A57;
        font-size: 12px;
      }

      .qr-bajada {
        margin: 0 auto 10px;
        max-width: 250px;
        font: var(--type-caption, 400 12px/1.3 var(--font-text, sans-serif));
        color: #7A2E44;
      }

      .btn-fullscreen {
        width: 100%;
        border: 1.5px solid #8C2549;
        background: transparent;
        border-radius: 12px;
        padding: 9px 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: #7A1535;
        font: var(--type-button, 700 13px var(--font-text, sans-serif));
        cursor: pointer;
        transition: background-color 0.12s ease;
      }

      .btn-fullscreen:active {
        background: #FDF2F4;
      }

      /* Acciones inferiores */
      .acciones-inferiores {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }

      .btn-guardar {
        width: 100%;
        background: #FFFFFF;
        color: #B92E58;
        border: none;
        border-radius: 16px;
        padding: 13px 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font: var(--type-button, 800 15px var(--font-text, sans-serif));
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
        transition: transform 0.12s ease, opacity 0.12s ease;
      }

      .btn-guardar:active {
        transform: scale(0.98);
        opacity: 0.92;
      }

      .btn-cancelar {
        background: transparent;
        border: none;
        color: #FFFFFF;
        padding: 8px;
        font: var(--type-button, 700 14px var(--font-text, sans-serif));
        cursor: pointer;
        transition: opacity 0.12s ease;
      }

      .btn-cancelar:active {
        opacity: 0.75;
      }

      /* Modal Pantalla Completa QR */
      .modal-qr-fondo {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: lm-slide-down 0.2s ease-out;
      }

      .modal-qr-card {
        background: #FFFFFF;
        border-radius: 24px;
        padding: 20px 24px 24px;
        width: 100%;
        max-width: 320px;
        text-align: center;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .modal-qr-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .modal-qr-header h3 {
        margin: 0;
        font: var(--type-title, 800 19px var(--font-display, sans-serif));
        color: #6E1234;
      }

      .btn-cerrar-modal {
        background: #FDF2F4;
        border: none;
        border-radius: 50%;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .modal-qr-img {
        width: 230px;
        height: 230px;
        object-fit: contain;
        display: block;
        margin: 8px auto 12px;
        image-rendering: pixelated;
      }

      .modal-qr-texto {
        font: var(--type-body-small, 500 13px var(--font-text, sans-serif));
        color: #7A2E44;
        margin: 0 0 14px;
      }
    `,
  ],
})
export class MesaQrPage extends PaginaConSesion implements OnInit {
  private readonly mesas = inject(MesasService);
  private readonly qr = inject(QrService);

  readonly id = input.required<string>();

  protected readonly mesa = computed(() => this.mesas.porId(this.id()));
  protected readonly fuenteQr = signal('');
  protected readonly ocupada = signal(false);
  protected readonly mostrarQrCompleto = signal(false);

  constructor() {
    super();
    effect(() => {
      const m = this.mesa();
      if (m) {
        this.ocupada.set(m.estado === 'OCUPADA');
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const mesa = this.mesa();
    if (mesa) {
      this.ocupada.set(mesa.estado === 'OCUPADA');
      this.fuenteQr.set(await this.qr.generarDeMesa(mesa.id, mesa.numero));
    }
  }

  protected tipo(): string {
    const m = this.mesa();
    return m ? ROTULO_TIPO_MESA[m.tipo] : '';
  }

  protected toggleOcupada(): void {
    this.ocupada.update((v) => !v);
  }

  protected async guardarCambios(): Promise<void> {
    const m = this.mesa();
    if (!m) return;

    const nuevoEstado = this.ocupada() ? 'OCUPADA' : 'VACIA';
    const hayCambioEstado = m.estado !== nuevoEstado;

    if (!hayCambioEstado) {
      this.avisos.info('Sin cambios', 'No modificaste la disponibilidad de la mesa.');
      this.volver();
      return;
    }

    await this.cargando.conEsperaMinima('Guardando disponibilidad…', async () => {
      await this.mesas.cambiarEstado(m.id, nuevoEstado);
    });

    this.avisos.exito(`Mesa ${m.numero} actualizada`, `Quedó marcada como ${this.ocupada() ? 'ocupada' : 'libre'}.`);
    this.volver();
  }

  protected volver(): void {
    this.ir(['/mesas']);
  }
}
