import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Producto } from '../../nucleo/modelos/modelos';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { CarritoService } from '../../nucleo/servicios/carrito.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { MarcaRechazo } from '../../nucleo/modelos/enums';

@Component({
  selector: 'lm-producto-ficha',
  imports: [...UI],
  template: `
    <div class="lm-screen" [class.producto-screen--gestionable]="puedeGestionar()">
      <lm-encabezado
        titulo="Detalle del producto"
        conVolver
        (volver)="volver()"
      >
        @if (mesaActiva(); as mesa) {
          <span accion class="mesa-activa">
            <lm-icono
              nombre="table_restaurant"
              [tamano]="18"
              color="#FFFFFF"
            />
            Mesa {{ mesa.numero }}
          </span>
        }
      </lm-encabezado>

      <div class="lm-body producto-body">
        @if (producto(); as producto) {
          <section
            class="producto-fotos"
            aria-label="Fotografías del producto"
          >
            <div
              class="lm-carousel__marco sk-carrusel-fotos"
              [style.background-image]="
                fotoActual()
                  ? 'url(' + fotoActual() + ')'
                  : null
              "
              (pointerdown)="iniciarSwipe($event)"
              (pointerup)="terminarSwipe($event)"
              (pointercancel)="cancelarSwipe()"
            >
              @if (!fotoActual()) {
                <span class="lm-carousel__vacio">
                  <lm-icono
                    nombre="add_a_photo"
                    [tamano]="30"
                    color="var(--action-accent)"
                  />
                  <span>El producto no tiene fotografías</span>
                </span>
              }

              @if (cantidadFotos() > 1) {
                <button
                  type="button"
                  class="lm-carousel__flecha lm-carousel__flecha--izquierda"
                  aria-label="Foto anterior"
                  (click)="moverFoto(-1)"
                >
                  <lm-icono
                    nombre="chevron_left"
                    [tamano]="26"
                    color="var(--action-primary)"
                  />
                </button>

                <button
                  type="button"
                  class="lm-carousel__flecha lm-carousel__flecha--derecha"
                  aria-label="Foto siguiente"
                  (click)="moverFoto(1)"
                >
                  <lm-icono
                    nombre="chevron_right"
                    [tamano]="26"
                    color="var(--action-primary)"
                  />
                </button>
              }
            </div>

            @if (cantidadFotos() > 1) {
              <div class="lm-carousel__puntos">
                @for (foto of fotos(); track $index) {
                  <button
                    type="button"
                    class="sk-flor"
                    [class.on]="$index === indiceActual()"
                    [attr.aria-label]="'Ver la foto ' + ($index + 1)"
                    [attr.aria-current]="
                      $index === indiceActual()
                        ? 'true'
                        : null
                    "
                    (click)="irAFoto($index)"
                  >
                    <img
                      src="assets/img/flor-2.png"
                      alt=""
                    />
                  </button>
                }
              </div>
            }
          </section>

          <section class="producto-info">
            <h1>{{ producto.nombre }}</h1>

            <p class="producto-descripcion">
              {{ producto.descripcion }}
            </p>

            <div class="producto-datos">
              <article class="dato-card">
                <span class="dato-icono">
                  <lm-icono
                    nombre="payments"
                    [tamano]="26"
                  />
                </span>

                <span class="dato-contenido">
                  <small>PRECIO</small>
                  <strong>{{ precio(producto.precio) }}</strong>
                </span>
              </article>

              <article class="dato-card">
                <span class="dato-icono">
                  <lm-icono
                    nombre="schedule"
                    [tamano]="27"
                  />
                </span>

                <span class="dato-contenido">
                  <small>ELABORACIÓN</small>
                  <strong>
                    {{ producto.tiempoElaboracion }} minutos
                  </strong>
                </span>
              </article>
            </div>

            <div class="producto-estado">
              <strong class="producto-estado__titulo">
                Estado:
              </strong>

              <span
                class="estado-chip"
                [class.estado-chip--sin-stock]="!producto.disponible"
              >
                <span class="estado-chip__punto"></span>
                {{ producto.disponible ? 'Disponible' : 'Sin stock' }}
              </span>
            </div>

            @if (puedeAgregar()) {
              <div class="producto-cantidad">
                <span class="producto-cantidad__texto">
                  <strong>En tu pedido</strong>
                  <small>
                    {{
                      enElCarrito()
                        ? precio(producto.precio * enElCarrito())
                        : 'Todavía no lo sumaste'
                    }}
                  </small>
                </span>

                <lm-cantidad
                  [cantidad]="enElCarrito()"
                  [nombre]="producto.nombre"
                  [permitirAgregar]="marca() === null"
                  (agregar)="sumarUno()"
                  (quitar)="restarUno()"
                />
              </div>
            }
          </section>
        } @else {
          <lm-vacio
            icono="restaurant_menu"
            titulo="Producto no encontrado"
          >
            El producto solicitado no está disponible en la carta.
          </lm-vacio>
        }
      </div>

      <div class="lm-actionbar">
        @if (puedeGestionar()) {
          <lm-boton
            class="accion-editar"
            icono="edit"
            (presionar)="editar()"
          >
            Editar producto
          </lm-boton>

          <lm-boton
            class="accion-quitar"
            variante="danger"
            icono="delete_forever"
            (presionar)="quitar()"
          >
            Quitar de la carta
          </lm-boton>
        } @else if (puedeAgregar()) {
          @if (marca(); as marcado) {
            <lm-banner
              [tono]="marcado === 'CAMBIAR' ? 'error' : 'info'"
              [titulo]="
                marcado === 'CAMBIAR'
                  ? 'El mozo no puede prepararlo'
                  : 'Hay menos de lo que pediste'
              "
            >
              {{ avisoDeMarca() }}
            </lm-banner>
          }

          <lm-boton
            icono="add_shopping_cart"
            [deshabilitado]="marca() !== null"
            (presionar)="agregarAlCarrito()"
          >
            Agregar al carrito
          </lm-boton>

          @if (carrito.cantidadTotal() > 0) {
            <lm-texto-boton
              (presionar)="verCarrito()"
            >
              Ver carrito ({{ carrito.cantidadTotal() }})
            </lm-texto-boton>
          }
        } @else {
          <lm-boton
            icono="arrow_back"
            (presionar)="volver()"
          >
            Volver a la carta
          </lm-boton>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      .mesa-activa {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        padding: var(--space-2) var(--space-3);
        border: 1px solid rgba(255, 255, 255, 0.72);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
        color: #ffffff;
        font: var(--type-body-small);
        font-weight: 800;
      }

      .producto-body {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
        padding-bottom: var(--space-5);
      }

      .producto-fotos {
        width: 100%;
      }

      .sk-carrusel-fotos {
        position: relative;
        width: 100%;
        aspect-ratio: 1.35 / 1;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, 0.72);
        border-radius: 20px;
        background-color: #fff7f8;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        box-shadow: 0 8px 24px rgba(73, 4, 31, 0.18);

        /*
         * Permite detectar el gesto horizontal sin bloquear
         * el scroll vertical normal de la pantalla.
         */
        touch-action: pan-y;
        user-select: none;
        -webkit-user-select: none;
      }


      .lm-carousel__flecha {
        position: absolute;
        top: 50%;
        z-index: 5;
        width: var(--touch-min);
        height: var(--touch-min);
        padding: 0;
        border: 0;
        border-radius: 50%;
        display: grid;
        place-items: center;
        cursor: pointer;
        background: rgba(253, 236, 239, 0.94);
        box-shadow: 0 4px 12px rgba(64, 6, 28, 0.18);
        transform: translateY(-50%);
        transition:
          transform 150ms ease,
          background 150ms ease;
      }

      .lm-carousel__flecha:active {
        transform: translateY(-50%) scale(0.93);
      }

      .lm-carousel__flecha--izquierda {
        left: var(--space-3);
      }

      .lm-carousel__flecha--derecha {
        right: var(--space-3);
      }

      /*
       * Las flores vuelven a estar debajo de la foto,
       * sin cápsula ni fondo blanco alrededor.
       */
      .lm-carousel__puntos {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: var(--space-2);
        max-width: 100%;
        margin: var(--space-2) auto 0;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
      }

      /* La flor mide lo que se ve, pero el botón mide lo que se toca: con el
         área táctil mínima entran los dedos gruesos sin agrandar el adorno. */
      .sk-flor {
        appearance: none;
        -webkit-appearance: none;
        width: var(--touch-min);
        height: var(--touch-min);
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 0;
        cursor: pointer;
        background: transparent;
        box-shadow: none;
        opacity: 0.55;
        transition: opacity 150ms ease;
      }

      /* El achicado va sobre la flor y no sobre el botón: una transformación
         encoge también el área que recibe el toque, así que escalando el botón
         los 44px de arriba se quedaban en 34 reales y el punto volvía a ser
         imposible de acertar. */
      .sk-flor img {
        display: block;
        width: clamp(17px, 5.3vw, 23px);
        height: clamp(17px, 5.3vw, 23px);
        object-fit: contain;
        pointer-events: none;
        transform: scale(0.78);
        transition: transform 150ms ease;
      }

      .sk-flor.on {
        opacity: 1;
      }

      .sk-flor.on img {
        transform: scale(1.08);
      }

      .lm-carousel__vacio {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-6);
        color: var(--text-muted);
        font: var(--type-body-small);
        text-align: center;
        background: var(--surface-card);
      }

      .producto-info {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: 0 2px;
      }

      .producto-info h1 {
        margin: 0;
        color: var(--text-on-primary);
        font: 800 clamp(17.5px, 5.6vw, 24px) / 1.15 var(--font-text);
        letter-spacing: -0.3px;
      }

      .producto-descripcion {
        margin: 0;
        color: rgba(255, 255, 255, 0.92);
        font: var(--type-body-small);
        font-weight: 500;
        line-height: 1.55;
      }

      .producto-datos {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-3);
        margin-top: 3px;
      }

      .dato-card {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        border-radius: 16px;
        background: var(--surface-card);
        box-shadow: 0 4px 12px rgba(73, 4, 31, 0.1);
      }

      .dato-icono {
        width: var(--size-icono-caja);
        height: var(--size-icono-caja);
        flex: 0 0 var(--size-icono-caja);
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: var(--action-primary);
        background: rgba(227, 85, 133, 0.12);
      }

      .dato-contenido {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      /* El rótulo es una sola palabra en mayúsculas y el corte de emergencia
         que la base aplica a todo el texto la partía al medio: "ELABORACIÓ" y
         abajo la "N". Como no tiene dónde cortar bien, acá se prohíbe partirla
         y se la deja encoger hasta entrar en su columna. */
      .dato-contenido small {
        color: var(--text-muted);
        font: var(--type-caption);
        font-size: clamp(10.5px, 2.9vw, 13px);
        font-weight: 800;
        overflow-wrap: normal;
        word-break: keep-all;
        hyphens: none;
      }

      .dato-contenido strong {
        color: var(--text-title);
        font: var(--type-body-medium);
        font-weight: 800;
        line-height: 1.15;
      }

      .producto-estado {
        width: 100%;
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-top: 3px;
        padding: var(--space-4);
        border-radius: 18px;
        background: var(--surface-card);
        box-shadow: 0 4px 12px rgba(73, 4, 31, 0.1);
      }

      .producto-estado__titulo {
        flex: 0 0 auto;
        color: var(--action-primary);
        font: var(--type-body-medium);
        font-weight: 800;
        line-height: 1;
      }

      /* El chip no es un control, así que no le corresponde el área táctil
         mínima: venía en 18px y con esa altura pesaba más que el precio, que
         es el dato importante del bloque. Queda un escalón abajo. */
      .estado-chip {
        min-width: 0;
        min-height: clamp(36px, 10vw, 40px);
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        border-radius: 999px;
        color: #08783e;
        background: linear-gradient(90deg, #dcf8ea, #cff3df);
        font: var(--type-body-medium);
        font-weight: 800;
        line-height: 1.15;
      }

      .estado-chip__punto {
        width: 11px;
        height: 11px;
        flex: 0 0 11px;
        border-radius: 50%;
        background: #0a9b58;
        box-shadow: 0 0 0 4px rgba(10, 155, 88, 0.08);
      }

      .estado-chip--sin-stock {
        color: #a11b2d;
        background: linear-gradient(90deg, #ffe5e8, #ffdadd);
      }

      /* El mismo control de cantidad que la carta, acá adentro: antes había
         que volver atrás para sumar una unidad más. */
      .producto-cantidad {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border-radius: 18px;
        background: var(--surface-card);
        box-shadow: 0 4px 12px rgba(73, 4, 31, 0.1);
      }

      .producto-cantidad__texto {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .producto-cantidad__texto strong {
        color: var(--action-primary);
        font: var(--type-body-medium);
        font-weight: 800;
        line-height: 1.15;
      }

      .producto-cantidad__texto small {
        color: var(--text-muted);
        font: var(--type-body-small);
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .estado-chip--sin-stock .estado-chip__punto {
        background: #d43c50;
        box-shadow: 0 0 0 4px rgba(212, 60, 80, 0.08);
      }

      /* La ficha del cocinero mete dos acciones más abajo, así que el chasis
         —la foto y el espacio entre bloques— se compacta para dejarles lugar.
         El bloque de datos NO entra en esta compactación: eso se unificó
         después de la revisión de septiembre de 2026, donde el mismo producto
         se leía distinto según quién lo abría. */
      .producto-screen--gestionable .producto-body {
        gap: var(--space-3);
        padding-top: 4px;
        padding-bottom: 6px;
      }

      .producto-screen--gestionable .sk-carrusel-fotos {
        aspect-ratio: 1.85 / 1;
        max-height: min(48vw, 175px);
        border-radius: 16px;
        box-shadow: 0 4px 14px rgba(73, 4, 31, 0.14);
      }


      .producto-screen--gestionable .lm-carousel__puntos {
        margin: var(--space-1) auto 0;
        gap: var(--space-1);
      }

      .producto-screen--gestionable .sk-flor img {
        width: clamp(13px, 4vw, 17px);
        height: clamp(13px, 4vw, 17px);
      }

      /* De acá para abajo la ficha NO se compacta por rol. Precio, elaboración
         y estado son la lectura del producto y tienen que verse igual para
         todos: lo único que cambia entre roles son las acciones de abajo. */

      .producto-screen--gestionable .lm-actionbar {
        padding: var(--space-2) var(--gutter-screen) calc(var(--space-3) + var(--safe-bottom));
        gap: 2px;
      }

      /* El botón de texto NO se compacta por debajo del área táctil mínima:
         acá adentro es el que borra un producto de la carta. */
      .producto-screen--gestionable .lm-actionbar ::ng-deep .lm-textbtn {
        padding: var(--space-1) var(--space-2);
        font-size: clamp(12px, 3.1vw, 13px);
      }
      /* Ficha a pantalla completa: la foto se queda con el alto que sobra
         (nunca recortada a una franja) y el precio se lee primero. */
      .producto-body > .producto-fotos {
        flex: 1 0 auto;
        display: flex;
        flex-direction: column;
      }
      .producto-body .sk-carrusel-fotos {
        flex: 1 1 auto;
        aspect-ratio: auto;
        min-height: clamp(190px, 58vw, 320px);
      }
      .producto-fotos, .producto-info { scroll-snap-align: start; }
      .dato-contenido strong { font: var(--type-price); font-size: clamp(16px, 4.8vw, 21px); }
      .producto-info h1 { font-size: clamp(20px, 6.4vw, 28px); }
      .producto-descripcion { font: var(--type-body); line-height: 1.5; }
      .producto-screen--gestionable .sk-carrusel-fotos { aspect-ratio: auto; max-height: none; min-height: clamp(150px, 44vw, 240px); }

      /* ---------- calco del diseño de referencia ---------- */
      /* La foto cede alto para que la ficha entera (datos, estado y botón) entre
         sin desplazarse, como en el diseño. */
      .producto-body .sk-carrusel-fotos { min-height: clamp(130px, 34vw, 250px); }
      .producto-body { gap: var(--space-3); }

      /* Flores del carrusel con presencia: más grandes, con halo claro y sombra
         para que no se pierdan contra el fondo rosa. La activa crece y brilla. */
      .lm-carousel__puntos { gap: var(--space-1); margin-top: var(--space-2); }
      .sk-flor { opacity: 0.8; }
      .sk-flor img {
        width: clamp(26px, 7.4vw, 34px); height: clamp(26px, 7.4vw, 34px);
        transform: scale(0.82);
        filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.85)) drop-shadow(0 2px 4px rgba(94, 12, 44, 0.45));
      }
      .producto-screen--gestionable .sk-flor img { width: clamp(24px, 6.8vw, 30px); height: clamp(24px, 6.8vw, 30px); }
      .sk-flor.on { opacity: 1; }
      .sk-flor.on img {
        transform: scale(1.15);
        filter: drop-shadow(0 0 6px rgba(255, 255, 255, 1)) drop-shadow(0 2px 5px rgba(94, 12, 44, 0.5));
      }

      /* Acciones de gestión: dos mosaicos casi cuadrados, uno al lado del otro.
         Editar en rosa; Quitar con un acento rojo fuerte para que se lea como
         una acción negativa. */
      .producto-screen--gestionable .lm-actionbar {
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-3); align-items: stretch;
      }
      .producto-screen--gestionable .lm-actionbar lm-boton { display: flex; }
      .producto-screen--gestionable .lm-actionbar ::ng-deep .lm-btn {
        flex: 1 1 auto; flex-direction: column; justify-content: center; gap: var(--space-2);
        aspect-ratio: 1.45 / 1; min-height: 0; padding: var(--space-3);
        border-radius: 22px; text-align: center; line-height: 1.15;
        font-size: clamp(14.5px, 4vw, 17px); font-weight: 800;
      }
      .producto-screen--gestionable .lm-actionbar ::ng-deep .lm-btn .material-symbols-rounded {
        font-size: clamp(28px, 8vw, 36px) !important; font-variation-settings: 'FILL' 1, 'wght' 600;
      }
      .producto-screen--gestionable .lm-actionbar ::ng-deep .lm-btn--danger {
        color: #FFFFFF;
        background: linear-gradient(180deg, #F0452F 0%, #C0261A 55%, #8E160F 100%);
        border: 2px solid rgba(255, 190, 180, 0.7);
        box-shadow:
          inset 0 2px 0 rgba(255, 255, 255, 0.35),
          inset 0 -4px 10px rgba(80, 8, 4, 0.35),
          0 0 0 1px rgba(192, 38, 26, 0.55),
          0 8px 18px rgba(142, 22, 15, 0.45);
      }
      .producto-screen--gestionable .lm-actionbar ::ng-deep .lm-btn--danger:not(:disabled):active {
        background: linear-gradient(180deg, #C0261A 0%, #8E160F 100%);
      }

      /* Las flechas van en las esquinas de abajo de la foto: la de la izquierda
         abajo a la izquierda y la de la derecha abajo a la derecha. */
      .lm-carousel__flecha { top: auto; bottom: var(--space-3); transform: none; }
      .lm-carousel__flecha:active { transform: scale(0.93); }

      /* Foto: marco claro y grueso, esquinas amplias y un halo rosa. */
      .sk-carrusel-fotos {
        border: 3px solid rgba(255, 255, 255, 0.88);
        border-radius: 28px;
        box-shadow: 0 0 0 3px rgba(255, 143, 180, 0.35), 0 12px 30px rgba(73, 4, 31, 0.28);
      }
      .lm-carousel__flecha {
        width: clamp(44px, 12.5vw, 54px); height: clamp(44px, 12.5vw, 54px);
        background: rgba(255, 244, 247, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.9);
      }

      /* Título y descripción sobre el rosa, con un brillo suave. */
      .producto-info { gap: var(--space-3); }
      .producto-info h1 {
        font: 900 clamp(24px, 7.6vw, 34px)/1.08 var(--font-display);
        letter-spacing: -0.4px;
        background: linear-gradient(180deg, #FFFFFF 0%, #FFE3EC 100%);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 2px 6px rgba(94, 12, 44, 0.45));
      }
      .producto-descripcion {
        font: 500 clamp(15.5px, 4.3vw, 19px)/1.42 var(--font-text);
        color: rgba(255, 255, 255, 0.94);
        text-shadow: 0 1px 4px rgba(94, 12, 44, 0.35);
      }

      /* Tarjetas de precio y elaboración: ícono en disco con aro, rótulo chico
         y valor grande; ondas decorativas en la esquina inferior derecha. */
      .dato-card {
        position: relative; overflow: hidden; isolation: isolate;
        gap: var(--space-2); padding: var(--space-4) var(--space-3);
        border-radius: 22px;
      }
      .dato-icono {
        width: clamp(40px, 11vw, 52px); height: clamp(40px, 11vw, 52px); flex: 0 0 auto;
        color: #FFFFFF;
        background: radial-gradient(circle at 35% 28%, #FF7AA8, #D62C69 75%);
        box-shadow: 0 0 0 5px rgba(255, 122, 168, 0.25), 0 4px 10px rgba(168, 30, 72, 0.3);
      }
      .dato-card { flex-wrap: wrap; justify-content: center; }
      .dato-contenido { gap: 2px; flex: 1 1 78px; max-width: 100%; }
      .dato-contenido strong { overflow-wrap: break-word; }
      .dato-contenido small { max-width: 100%; font-size: clamp(9.5px, 2.7vw, 12px); letter-spacing: 0.04em; }
      .dato-contenido small { letter-spacing: 0.08em; color: var(--action-primary); }
      .dato-contenido strong { font: 900 clamp(19px, 5.6vw, 26px)/1.05 var(--font-numeric); }

      /* Estado y cantidad: la misma tarjeta, con el rótulo en rosa fuerte. */
      .producto-estado, .producto-cantidad { border-radius: 22px; position: relative; overflow: hidden; }
      .producto-estado__titulo { font: 900 clamp(16px, 4.6vw, 20px)/1 var(--font-text); }
      .estado-chip { font: 800 clamp(16px, 4.4vw, 19px)/1.1 var(--font-text); min-height: clamp(42px, 11.5vw, 50px); }

      /* Acción principal: botón rosa con brillo, borde claro y flores. Vale
         para todos los roles, sea cual sea la acción que muestre. */
      .lm-actionbar ::ng-deep .lm-btn--primary {
        position: relative; overflow: hidden; isolation: isolate;
        background: linear-gradient(180deg, #FF6AA0 0%, #E8336F 52%, #B81F55 100%);
        color: #FFFFFF; font-size: clamp(17px, 5vw, 21px); font-weight: 800;
        border: 2px solid rgba(255, 255, 255, 0.55);
        border-radius: 24px;
        box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.45), inset 0 -3px 8px rgba(110, 18, 52, 0.28), 0 8px 18px rgba(73, 4, 31, 0.35);
      }
      .lm-actionbar ::ng-deep .lm-btn--primary:not(:disabled):active {
        background: linear-gradient(180deg, #E8336F 0%, #B81F55 100%);
      }

    `,
  ],
})
export class ProductoFichaPage extends PaginaConSesion {
  private readonly route = inject(ActivatedRoute);
  private readonly productos = inject(ProductosService);
  private readonly mesas = inject(MesasService);
  private readonly pedidos = inject(PedidosService);
  protected readonly carrito = inject(CarritoService);

  private readonly posicionFoto = signal(0);
  private inicioSwipeX: number | null = null;

  protected readonly mesaId =
    this.route.snapshot.queryParamMap.get('mesaId');

  protected readonly mesaActiva = computed(() =>
    this.mesaId
      ? this.mesas.porId(this.mesaId)
      : undefined,
  );

  protected readonly producto = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.productos.porId(id) : undefined;
  });

  protected readonly puedeGestionar = computed(() => {
    const producto = this.producto();

    return (
      this.sesion.usuario()?.perfil === 'COCINERO' &&
      producto !== undefined &&
      producto.tipo !== 'BEBIDA'
    );
  });

  protected readonly puedeAgregar = computed(() => {
    const perfil = this.sesion.usuario()?.perfil;
    const producto = this.producto();

    return (
      (perfil === 'CLIENTE_REGISTRADO' ||
        perfil === 'CLIENTE_ANONIMO') &&
      Boolean(this.mesaId) &&
      producto !== undefined &&
      producto.disponible
    );
  });

  /**
   * US-7.2 · AC-7.2.2 · la marca que el mozo le puso a este producto al
   * devolver la comanda, si es que se la puso.
   *
   * Mientras el comensal está corrigiendo, la carta tiene que decir lo mismo
   * que el pedido: agregar de nuevo lo que el mozo marcó en rojo, o sumarle
   * unidades a un amarillo, va justo en contra de lo que le pidieron. Se
   * entera acá y no al volver al carrito.
   */
  protected readonly marca = computed<MarcaRechazo | null>(() => {
    const producto = this.producto();
    if (!producto) return null;

    const enEdicion = this.carrito.pedidoEnEdicion();
    if (!enEdicion) return null;

    const devuelto = this.pedidos.porId(enEdicion);
    if (devuelto?.estadoGlobal !== 'RECHAZADO') return null;

    return this.pedidos.marcaDe(devuelto, producto.id);
  });

  protected avisoDeMarca(): string {
    return this.marca() === 'CAMBIAR'
      ? 'El mozo lo marcó porque hoy no lo pueden preparar. Elegí otra cosa para tu pedido.'
      : 'El mozo avisó que hay menos de lo que pediste, así que no podés sumar más unidades. Bajá la cantidad desde tu pedido.';
  }

  protected readonly fotos = computed(() =>
    (this.producto()?.fotos ?? []).filter(Boolean),
  );

  protected cantidadFotos(): number {
    return this.fotos().length;
  }

  protected indiceActual(): number {
    return Math.min(
      this.posicionFoto(),
      Math.max(0, this.cantidadFotos() - 1),
    );
  }

  protected fotoActual(): string | null {
    return this.fotos()[this.indiceActual()] ?? null;
  }

  protected moverFoto(paso: number): void {
    const cantidad = this.cantidadFotos();
    if (!cantidad) return;

    this.posicionFoto.set(
      (this.indiceActual() + paso + cantidad) % cantidad,
    );
  }

  protected irAFoto(indice: number): void {
    this.posicionFoto.set(indice);
  }

  /* =========================================================
     SWIPE DEL CARRUSEL
     ========================================================= */

  protected iniciarSwipe(evento: PointerEvent): void {
    if (this.cantidadFotos() <= 1) {
      return;
    }

    /*
     * Un toque sobre una flecha no es el inicio de un gesto: si el marco captura
     * el puntero, el `click` se redirige al marco y la flecha nunca lo recibe.
     */
    if (evento.target instanceof Element && evento.target.closest('button')) {
      return;
    }

    this.inicioSwipeX = evento.clientX;

    const elemento = evento.currentTarget;
    if (elemento instanceof HTMLElement) {
      elemento.setPointerCapture?.(evento.pointerId);
    }
  }

  protected terminarSwipe(evento: PointerEvent): void {
    if (
      this.inicioSwipeX === null ||
      this.cantidadFotos() <= 1
    ) {
      return;
    }

    const diferencia = evento.clientX - this.inicioSwipeX;
    this.inicioSwipeX = null;

    const elemento = evento.currentTarget;
    if (
      elemento instanceof HTMLElement &&
      elemento.hasPointerCapture?.(evento.pointerId)
    ) {
      elemento.releasePointerCapture?.(evento.pointerId);
    }

    /*
     * Evita que un toque o un movimiento pequeño cambie la foto.
     * 45px funciona bien para diferenciar tap de swipe en móvil.
     */
    const umbral = 45;

    if (Math.abs(diferencia) < umbral) {
      return;
    }

    // Dedo hacia la izquierda => siguiente foto.
    if (diferencia < 0) {
      this.moverFoto(1);
      return;
    }

    // Dedo hacia la derecha => foto anterior.
    this.moverFoto(-1);
  }

  protected cancelarSwipe(): void {
    this.inicioSwipeX = null;
  }

  protected rotuloTipo(producto: Producto): string {
    if (producto.tipo === 'BEBIDA') return 'Bebida';
    if (producto.tipo === 'POSTRE') return 'Postre';
    return 'Comida';
  }


  protected precio(valor: number): string {
    return `$ ${valor.toLocaleString('es-AR')}`;
  }

  protected editar(): void {
    const producto = this.producto();

    if (!producto) {
      return;
    }

    this.ir([
      '/carta',
      producto.id,
      'editar',
    ]);
  }

  protected async quitar(): Promise<void> {
    const producto = this.producto();

    if (!producto) {
      return;
    }

    const seguro = await this.preguntar({
      titulo: '¿Quitás este producto de la carta?',
      mensaje:
        'El producto dejará de mostrarse, pero sus datos se conservarán.',
      confirmar: 'Quitar de la carta',
      tono: 'peligro',
      icono: 'delete',
      detalle: [
        {
          rotulo: 'Producto',
          valor: producto.nombre,
        },
        {
          rotulo: 'Categoría',
          valor: this.rotuloTipo(producto),
        },
      ],
    });

    if (!seguro) {
      return;
    }

    try {
      await this.cargando.conEsperaMinima(
        'Quitando el producto de la carta...',
        () =>
          this.productos.quitarDeLaCarta(
            producto.id,
          ),
      );

      this.avisos.exito(
        'Producto quitado',
        `${producto.nombre} ya no aparece en la carta.`,
      );

      this.ir(['/carta']);
    } catch (error) {
      console.error(
        'No se pudo quitar el producto:',
        error,
      );

      this.avisos.error(
        'No pudimos quitar el producto',
        'Revisá la conexión e intentá nuevamente.',
      );
    }
  }

  /** Unidades de este producto que ya están en el carrito. */
  protected readonly enElCarrito = computed(() => {
    const id = this.producto()?.id;
    if (!id) return 0;
    return this.carrito.items().find((item) => item.producto.id === id)?.cantidad ?? 0;
  });

  /*
   * El más y el menos no avisan por toast como el botón grande: se tocan
   * varias veces seguidas y el propio número ya es la confirmación.
   */
  protected sumarUno(): void {
    const producto = this.producto();
    if (!producto || !this.mesaId || this.marca() !== null) return;

    this.carrito.iniciarMesa(this.mesaId);
    this.carrito.agregar(producto);
  }

  protected restarUno(): void {
    const producto = this.producto();
    if (producto) this.carrito.restar(producto.id);
  }

  protected agregarAlCarrito(): void {
    const producto = this.producto();

    if (!producto || !this.mesaId) {
      return;
    }

    const marcado = this.marca();
    if (marcado) {
      this.avisos.error(
        marcado === 'CAMBIAR'
          ? 'El mozo no puede prepararlo'
          : 'No podés sumar más unidades',
        this.avisoDeMarca(),
      );
      return;
    }

    this.carrito.iniciarMesa(this.mesaId);
    this.carrito.agregar(producto);

    this.avisos.exito(
      'Producto agregado',
      `${producto.nombre} se agregó al carrito.`,
    );
  }

  protected verCarrito(): void {
    void this.router.navigate(
      ['/comanda/carrito'],
      {
        queryParams: this.mesaId
          ? { mesaId: this.mesaId }
          : undefined,
      },
    );
  }

  protected volver(): void {
    void this.router.navigate(
      ['/carta'],
      {
        queryParams: this.mesaId
          ? { mesaId: this.mesaId }
          : undefined,
      },
    );
  }
}
