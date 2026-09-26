import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { ICONO_TIPO_MESA, ROTULO_TIPO_MESA, TipoMesa } from '../../nucleo/modelos/enums';

/** Rango admitido de comensales, el mismo que valida el alta de mesa. */
const MIN_COMENSALES = 1;
const MAX_COMENSALES = 30;

const TIPOS: TipoMesa[] = ['ESTANDAR', 'VIP', 'MOVILIDAD_REDUCIDA'];

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
          <div class="tarjeta-blanca" [class.tarjeta-blanca--resaltada]="resaltar()">
            <div class="tarjeta-blanca__encabezado">
              <lm-icono nombre="table_restaurant" [tamano]="20" color="#6E1234" />
              <h2>Información de la mesa</h2>
            </div>

            <!-- El número identifica la mesa y su QR: no se edita nunca. -->
            <div class="subtarjeta-info subtarjeta-info--fija">
              <div class="subtarjeta-info__icono">
                <lm-icono nombre="tag" [tamano]="22" color="#6E1234" />
              </div>
              <div class="subtarjeta-info__datos">
                <span class="subtarjeta-info__etiqueta">Número de mesa</span>
                <span class="subtarjeta-info__valor">{{ m.numero }}</span>
              </div>
              <span class="candado" aria-label="El número de mesa no se puede editar">
                <lm-icono nombre="lock" [tamano]="15" color="#A2708A" />
              </span>
            </div>

            <div class="grid-info">
              <div class="subtarjeta-info" [class.subtarjeta-info--tocada]="comensales() !== m.cantidadComensales">
                <div class="subtarjeta-info__icono">
                  <lm-icono nombre="group" [tamano]="22" color="#6E1234" />
                </div>
                <div class="subtarjeta-info__datos">
                  <span class="subtarjeta-info__etiqueta">Comensales</span>
                  <span class="subtarjeta-info__valor">{{ comensales() }}</span>
                </div>
                @if (puedeEditar()) {
                  <button
                    type="button"
                    class="lapiz"
                    aria-label="Editar la cantidad de comensales"
                    (click)="abrirEdicionComensales()"
                  >
                    <lm-icono nombre="edit" [tamano]="16" color="#FFFFFF" />
                  </button>
                }
              </div>

              <div class="subtarjeta-info" [class.subtarjeta-info--tocada]="tipoMesa() !== m.tipo">
                <div class="subtarjeta-info__icono">
                  <lm-icono [nombre]="iconoTipo()" [tamano]="22" color="#6E1234" />
                </div>
                <div class="subtarjeta-info__datos">
                  <span class="subtarjeta-info__etiqueta">Tipo de mesa</span>
                  <span class="subtarjeta-info__valor subtarjeta-info__valor--tipo">{{ tipo() }}</span>
                </div>
                @if (puedeEditar()) {
                  <button
                    type="button"
                    class="lapiz"
                    aria-label="Editar el tipo de mesa"
                    (click)="abrirEdicionTipo()"
                  >
                    <lm-icono nombre="edit" [tamano]="16" color="#FFFFFF" />
                  </button>
                }
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

            @if (puedeEditar()) {
              <p class="qr-fijo">
                <lm-icono nombre="lock" [tamano]="13" color="#A2708A" />
                <span>El código ya generado no se edita: sigue siendo válido con los datos nuevos.</span>
              </p>
            }

            <button type="button" class="btn-fullscreen" (click)="mostrarQrCompleto.set(true)">
              <lm-icono nombre="fullscreen" [tamano]="18" color="#7A1535" />
              <span>Ver en pantalla completa</span>
            </button>
          </div>

          <!-- Botones inferiores de acción -->
          <div class="acciones-inferiores">
            @if (hayCambios()) {
              <p class="pendiente">
                <lm-icono nombre="edit_note" [tamano]="16" color="#FFFFFF" />
                <span>Tenés cambios sin guardar.</span>
              </p>
            }
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

        <!-- Modal de edición: comensales -->
        @if (editando() === 'comensales') {
          <div class="modal-qr-fondo" (click)="cerrarEdicion()">
            <div class="modal-qr-card modal-editar" (click)="$event.stopPropagation()">
              <div class="modal-qr-header">
                <h3>Comensales</h3>
                <button type="button" class="btn-cerrar-modal" aria-label="Cerrar" (click)="cerrarEdicion()">
                  <lm-icono nombre="close" [tamano]="22" color="#6E1234" />
                </button>
              </div>

              <p class="modal-editar__bajada">
                ¿Cuánta gente entra en la mesa {{ m.numero }}?
              </p>

              <div class="contador">
                <button
                  type="button"
                  class="contador__btn"
                  aria-label="Quitar un comensal"
                  [disabled]="borradorComensales() <= minComensales"
                  (click)="ajustarComensales(-1)"
                >
                  <lm-icono nombre="remove" [tamano]="22" color="#7A1535" />
                </button>
                <span class="contador__valor">{{ borradorComensales() }}</span>
                <button
                  type="button"
                  class="contador__btn"
                  aria-label="Sumar un comensal"
                  [disabled]="borradorComensales() >= maxComensales"
                  (click)="ajustarComensales(1)"
                >
                  <lm-icono nombre="add" [tamano]="22" color="#7A1535" />
                </button>
              </div>

              <p class="modal-editar__limite">
                Entre {{ minComensales }} y {{ maxComensales }} personas.
              </p>

              <div class="modal-editar__acciones">
                <lm-boton variante="ghost" (presionar)="cerrarEdicion()">Cancelar</lm-boton>
                <lm-boton variante="primary" icono="check" (presionar)="aplicarComensales()">Aplicar</lm-boton>
              </div>
            </div>
          </div>
        }

        <!-- Modal de edición: tipo de mesa -->
        @if (editando() === 'tipo') {
          <div class="modal-qr-fondo" (click)="cerrarEdicion()">
            <div class="modal-qr-card modal-editar" (click)="$event.stopPropagation()">
              <div class="modal-qr-header">
                <h3>Tipo de mesa</h3>
                <button type="button" class="btn-cerrar-modal" aria-label="Cerrar" (click)="cerrarEdicion()">
                  <lm-icono nombre="close" [tamano]="22" color="#6E1234" />
                </button>
              </div>

              <p class="modal-editar__bajada">
                Definí cómo se ofrece la mesa {{ m.numero }} en el salón.
              </p>

              <div class="opciones-tipo" role="radiogroup" aria-label="Tipo de mesa">
                @for (opcion of tipos; track opcion) {
                  <button
                    type="button"
                    role="radio"
                    class="opcion-tipo"
                    [class.opcion-tipo--elegida]="borradorTipo() === opcion"
                    [attr.aria-checked]="borradorTipo() === opcion"
                    (click)="borradorTipo.set(opcion)"
                  >
                    <span class="opcion-tipo__icono">
                      <lm-icono [nombre]="iconoDe(opcion)" [tamano]="20" color="#6E1234" />
                    </span>
                    <span class="opcion-tipo__rotulo">{{ rotuloDe(opcion) }}</span>
                    @if (borradorTipo() === opcion) {
                      <lm-icono nombre="check_circle" [tamano]="20" color="#B92E58" />
                    }
                  </button>
                }
              </div>

              <div class="modal-editar__acciones">
                <lm-boton variante="ghost" (presionar)="cerrarEdicion()">Cancelar</lm-boton>
                <lm-boton variante="primary" icono="check" (presionar)="aplicarTipo()">Aplicar</lm-boton>
              </div>
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
        padding-top: max(2px, var(--safe-top));
      }

      .hdr__volver {
        width: var(--touch-min);
        height: var(--touch-min);
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
        font: var(--type-title);
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
        font: var(--type-card-title);
        color: #6E1234;
      }

      /*
       * Cuando el lápiz llega desde el salón, la tarjeta de datos se anuncia
       * sola con un latido corto: es la que se vino a tocar.
       */
      .tarjeta-blanca--resaltada {
        animation: latido-edicion 1.5s ease-out 2;
      }

      @keyframes latido-edicion {
        0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
        45% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 0 0 4px rgba(255, 255, 255, 0.55); }
      }

      @media (prefers-reduced-motion: reduce) {
        .tarjeta-blanca--resaltada { animation: none; }
      }

      /* Información de la mesa */
      /*
       * Comensales y tipo van lado a lado mientras cada columna tenga lugar
       * para el valor más el lápiz; por debajo de eso pasan uno arriba del
       * otro solos. Va con auto-fit y no con una consulta de medios porque
       * el corte depende del ancho que le queda a la tarjeta, no del modelo
       * del equipo: la misma regla sirve dentro del modal, que es más angosto.
       */
      .grid-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 132px), 1fr));
        gap: var(--space-3);
      }

      .subtarjeta-info {
        background: #FDF2F4;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.18s ease, box-shadow 0.18s ease;
      }

      /* El dato quedó tocado y todavía no se guardó. */
      .subtarjeta-info--tocada {
        background: #FCE8EE;
        box-shadow: inset 0 0 0 1.5px rgba(185, 46, 88, 0.45);
      }

      .subtarjeta-info--fija {
        margin-bottom: 10px;
      }

      .candado {
        margin-left: auto;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      /* Lápiz de cada dato editable.
         El círculo se queda en 30px porque a más tamaño desequilibra la fila
         del dato, pero el blanco que recibe el toque se estira con un
         pseudoelemento hasta el mínimo accesible. Sólo crece a lo alto y a lo
         ancho de su propia fila, así que no pisa al lápiz de la fila de al
         lado, que está separado por el alto completo del dato. */
      .lapiz {
        position: relative;
        margin-left: auto;
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border: none;
        border-radius: 50%;
        background: #B92E58;
        display: grid;
        place-items: center;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(185, 46, 88, 0.34);
        transition: transform 0.12s ease, background-color 0.12s ease;
      }

      .lapiz::after {
        content: "";
        position: absolute;
        top: calc((var(--touch-min) - 100%) / -2);
        bottom: calc((var(--touch-min) - 100%) / -2);
        left: calc((var(--touch-min) - 100%) / -2);
        right: calc((var(--touch-min) - 100%) / -2);
      }

      .lapiz:hover,
      .lapiz:focus-visible {
        background: #A32649;
      }

      .lapiz:active {
        transform: scale(0.92);
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

      /* "Comensales" y "Número de mesa" viven en media columna. Son rótulos y
         no texto de lectura, así que antes de partirse al medio prefieren
         encogerse; el corte de emergencia de la base los dejaba como
         "Comensale" y abajo la "s". */
      .subtarjeta-info__etiqueta {
        font: var(--type-label);
        font-size: clamp(10px, 2.9vw, 13px);
        color: #7A2E44;
        overflow-wrap: normal;
        word-break: keep-all;
        hyphens: none;
      }

      .subtarjeta-info__valor {
        font: var(--type-section);
        color: #6E1234;
        line-height: 1.15;
      }

      .subtarjeta-info__valor--tipo {
        font-size: clamp(13px, 3.3vw, 14px);
        font-weight: 700;
        /* Sin recorte: el texto largo pasa de renglon, nunca a puntos suspensivos. */
        overflow-wrap: anywhere;
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
        font: var(--type-card-title);
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

      /* La pastilla mide 26px de alto porque a más tamaño deja de leerse como
         un interruptor, así que el blanco que recibe el dedo se estira aparte
         hasta el mínimo accesible. Estira sólo a lo alto: a lo ancho ya mide
         48px y no hay ningún otro control en la fila con el que pueda pisarse. */
      .switch::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: calc((var(--touch-min) - 100%) / -2);
        bottom: calc((var(--touch-min) - 100%) / -2);
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
        font: var(--type-body-small);
        color: #6E1234;
      }

      .disponibilidad-texto__bajada {
        font: var(--type-caption);
        color: #7A2E44;
        margin-top: 1px;
      }

      /* Tarjeta QR */
      .tarjeta-qr {
        text-align: center;
        padding-bottom: 14px;
      }

      /* La vista previa se queda en 140px por diseño —el código escaneable es
         el del modal, a un toque— pero cede ancho en los equipos angostos en
         vez de empujar la tarjeta. */
      .qr-marco {
        width: min(44vw, 140px);
        aspect-ratio: 1;
        height: auto;
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
        font-size: clamp(11px, 2.9vw, 12px);
      }

      .btn-fullscreen {
        width: 100%;
        border: 1.5px solid #8C2549;
        background: transparent;
        border-radius: 12px;
        min-height: var(--touch-min);
        padding: var(--space-2) var(--space-4);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: #7A1535;
        font: var(--type-button);
        cursor: pointer;
        transition: background-color 0.12s ease;
      }

      .btn-fullscreen:active {
        background: #FDF2F4;
      }

      .qr-fijo {
        margin: 8px auto 0;
        max-width: min(280px, 100%);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        gap: 5px;
        text-align: left;
        font: var(--type-caption);
        color: #A2708A;
      }

      /* Acciones inferiores */
      .acciones-inferiores {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }

      .pendiente {
        margin: 0 0 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
        color: #FFFFFF;
        font: var(--type-caption);
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
        font: var(--type-button);
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
        min-height: var(--touch-min);
        padding: var(--space-2) var(--space-3);
        font: var(--type-button);
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
        max-width: min(320px, 100%);
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
        font: var(--type-title);
        color: #6E1234;
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

      /* Este sí es el código que se escanea: ocupa el ancho que haya, siempre
         cuadrado. El PNG se genera a 512px, así que siempre se reduce y nunca
         se agranda. */
      .modal-qr-img {
        width: min(var(--size-qr), 100%);
        aspect-ratio: 1;
        height: auto;
        object-fit: contain;
        display: block;
        margin: 8px auto 12px;
        image-rendering: pixelated;
      }

      .modal-qr-texto {
        font: var(--type-body-small);
        color: #7A2E44;
        margin: 0 0 14px;
      }

      /* Modales de edición de un solo dato */
      .modal-editar {
        max-width: min(340px, 100%);
        /* En pantallas bajas el modal scrollea solo, nunca se corta. */
        max-height: calc(100dvh - 40px);
        overflow-y: auto;
      }

      .modal-editar__bajada {
        margin: 0 0 14px;
        font: var(--type-body-small);
        color: #7A2E44;
      }

      .modal-editar__limite {
        margin: 10px 0 0;
        font: var(--type-caption);
        color: #A2708A;
      }

      .modal-editar__acciones {
        width: 100%;
        margin-top: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        align-items: center;
      }

      /* Contador de comensales */
      .contador {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 18px;
      }

      .contador__btn {
        width: 46px;
        height: 46px;
        border: 1.5px solid #E7C3D0;
      }

      .contador__btn:active {
        transform: scale(0.92);
        background: #F8DDE5;
      }

      .contador__btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .contador__valor {
        min-width: 62px;
        text-align: center;
        font: var(--type-numeral);
        color: #6E1234;
        font-variant-numeric: tabular-nums;
      }

      /* Opciones de tipo de mesa */
      .opciones-tipo {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .opcion-tipo {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 13px;
        border: 1.5px solid #EFD7E0;
        border-radius: 14px;
        background: #FFFFFF;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.14s ease, background-color 0.14s ease;
      }

      .opcion-tipo--elegida {
        border-color: #B92E58;
        background: #FDF2F4;
      }

      .opcion-tipo__icono {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .opcion-tipo__rotulo {
        flex: 1;
        min-width: 0;
        font: var(--type-body-small);
        color: #6E1234;
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class MesaQrPage extends PaginaConSesion implements OnInit {
  private readonly mesas = inject(MesasService);
  private readonly qr = inject(QrService);

  readonly id = input.required<string>();

  /** Se abre con ?editar=1 desde el lápiz del salón. */
  readonly editar = input<string | undefined>(undefined);

  protected readonly mesa = computed(() => this.mesas.porId(this.id()));
  protected readonly fuenteQr = signal('');
  protected readonly ocupada = signal(false);
  protected readonly mostrarQrCompleto = signal(false);

  /** Dueño y supervisor editan comensales y tipo; el resto sólo mira. */
  protected readonly puedeEditar = computed(() => this.sesion.esAdministrador());

  protected readonly tipos = TIPOS;
  protected readonly minComensales = MIN_COMENSALES;
  protected readonly maxComensales = MAX_COMENSALES;

  /** Valores en pantalla: se tocan con el lápiz y recién viajan al guardar. */
  protected readonly comensales = signal(0);
  protected readonly tipoMesa = signal<TipoMesa>('ESTANDAR');

  protected readonly editando = signal<'comensales' | 'tipo' | null>(null);
  protected readonly borradorComensales = signal(0);
  protected readonly borradorTipo = signal<TipoMesa>('ESTANDAR');
  protected readonly resaltar = signal(false);

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
    super();
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

  async ngOnInit(): Promise<void> {
    const mesa = this.mesa();
    if (!mesa) return;

    this.volcada = mesa.id;
    this.ocupada.set(mesa.estado === 'OCUPADA');
    this.comensales.set(mesa.cantidadComensales);
    this.tipoMesa.set(mesa.tipo);

    if (this.editar() && this.puedeEditar()) {
      this.resaltar.set(true);
    }

    this.fuenteQr.set(await this.qr.generarDeMesa(mesa.id, mesa.numero));
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

  protected abrirEdicionComensales(): void {
    this.borradorComensales.set(this.comensales());
    this.editando.set('comensales');
  }

  protected abrirEdicionTipo(): void {
    this.borradorTipo.set(this.tipoMesa());
    this.editando.set('tipo');
  }

  protected cerrarEdicion(): void {
    this.editando.set(null);
  }

  protected ajustarComensales(paso: number): void {
    this.borradorComensales.update((v) =>
      Math.min(MAX_COMENSALES, Math.max(MIN_COMENSALES, v + paso)),
    );
  }

  protected aplicarComensales(): void {
    this.comensales.set(this.borradorComensales());
    this.cerrarEdicion();
  }

  protected aplicarTipo(): void {
    this.tipoMesa.set(this.borradorTipo());
    this.cerrarEdicion();
  }

  protected async guardarCambios(): Promise<void> {
    const m = this.mesa();
    if (!m) return;

    if (!this.hayCambios()) {
      this.avisos.info('Sin cambios', 'No modificaste ningún dato de la mesa.');
      this.volver();
      return;
    }

    const nuevoEstado = this.ocupada() ? 'OCUPADA' : 'VACIA';
    const cambiaEstado = m.estado !== nuevoEstado;
    const cambiaComensales = m.cantidadComensales !== this.comensales();
    const cambiaTipo = m.tipo !== this.tipoMesa();

    // En el modal va sólo lo que cambia: así se lee de un vistazo qué se toca.
    const detalle = [{ rotulo: 'Mesa', valor: String(m.numero) }];
    if (cambiaComensales) {
      detalle.push({ rotulo: 'Comensales', valor: `${m.cantidadComensales} → ${this.comensales()}` });
    }
    if (cambiaTipo) {
      detalle.push({
        rotulo: 'Tipo',
        valor: `${ROTULO_TIPO_MESA[m.tipo]} → ${ROTULO_TIPO_MESA[this.tipoMesa()]}`,
      });
    }
    if (cambiaEstado) {
      detalle.push({ rotulo: 'Queda', valor: this.ocupada() ? 'Ocupada' : 'Vacía' });
    }

    const seguro = await this.preguntar({
      titulo: '¿Guardás los cambios de la mesa?',
      mensaje: 'El salón ve los datos nuevos al instante. El número y el código QR no cambian.',
      confirmar: 'Guardar cambios',
      icono: 'save',
      detalle,
    });
    if (!seguro) return;

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

    this.avisos.exito(
      `Mesa ${m.numero} actualizada`,
      cambiaEstado
        ? `Quedó marcada como ${this.ocupada() ? 'ocupada' : 'libre'}.`
        : 'Los datos nuevos ya están en el salón.',
    );
    this.volver();
  }

  protected volver(): void {
    this.ir(['/mesas']);
  }
}
