import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { AlmacenService } from '../../nucleo/datos/almacen.service';
import { CorreoEnviado } from '../../nucleo/modelos/modelos';

/**
 * Correos automáticos que salieron de la aplicación.
 *
 * Sirve para verificar los puntos 7 y 8 sin salir del teléfono: se ve el
 * destinatario, la plantilla que se usó y el mensaje tal como lo recibe el
 * cliente.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-dueno-correos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="correos().length">
          Correos automáticos
        </lm-titulo>

        @if (correos().length) {
          <div class="lm-lista-n">
            @for (correo of correos(); track correo.id) {
              <div #casilla class="casilla" [class.casilla--abierta]="abierto() === correo.id">
              <div class="lm-card correo" [class.correo--abierto]="abierto() === correo.id">
                  <span
                    class="correo__icono"
                    [class.correo__icono--rechazo]="correo.plantilla === 'RECHAZO' || correo.plantilla === 'RESERVA_RECHAZADA'"
                    [class.correo__icono--revision]="correo.plantilla === 'REGISTRO_RECIBIDO'"
                  >
                    <lm-icono [nombre]="aviso(correo).icono" [tamano]="22" color="var(--lm-surface)" />
                  </span>
                  <span class="correo__datos">
                    <b>{{ rotuloAsunto(correo.asunto) }}</b>
                    <!-- Si el correo no entra, parte antes del "@" en vez de cortarse. -->
                    <small>Para {{ partesPara(correo.para).usuario }}<wbr />{{ partesPara(correo.para).dominio }}</small>
                    <small>{{ correo.enviadoEn | fechaHora }}</small>
                  </span>
                  <span class="correo__pie">
                    <!-- Qué se le avisó a la persona, a la altura del chevrón. -->
                    <lm-chip [estado]="aviso(correo).chip">{{ aviso(correo).rotulo }}</lm-chip>
                    <lm-icono [nombre]="abierto() === correo.id ? 'expand_less' : 'expand_more'" [tamano]="22" />
                  </span>
                </button>

                @if (abierto() === correo.id) {
                  <iframe
                    class="correo__vista"
                    title="Vista previa del correo"
                    sandbox="allow-same-origin"
                    [srcdoc]="html(correo)"
                  ></iframe>
                }
              </div>
              </div>
            }
          </div>
        } @else {
          <lm-vacio icono="drafts" titulo="Todavía no salió ningún correo">
            Cuando apruebes o rechaces un registro, el correo se envía solo y queda registrado acá.
            <lm-boton accion variante="secondary" icono="how_to_reg" [ancho]="false" (presionar)="ir(['/dueno/registros'])">
              Ir a los registros
            </lm-boton>
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="correos" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .correo { padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-3); }
      /* Mismo aro de vidrio que el botón de cerrar sesión. */
      .correo {
        border: 1.5px solid rgba(255, 255, 255, .5) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .55), inset 0 -6px 12px rgba(255, 255, 255, .06), 0 4px 10px rgba(94, 12, 44, .16) !important;
      }
      .correo__fila { display: flex; align-items: center; gap: var(--space-3); background: none; border: none; padding: 0; min-height: var(--touch-min); cursor: pointer; text-align: left; width: 100%; }
      .correo__icono { width: var(--size-icono-caja); height: var(--size-icono-caja); flex: 0 0 auto; border-radius: var(--radius-thumb); background: var(--state-success); display: grid; place-items: center; }
      .correo__icono--rechazo { background: var(--state-error); }
      .correo__icono--revision { background: var(--state-pending); }
      .correo__datos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .correo__datos b { display: block; font: var(--type-body-medium); color: var(--text-title); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .correo__datos small { display: block; font: var(--type-caption); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* El pie (estado y chevrón) no cambia de lugar cuando la tarjeta está abierta. */
      .correo__pie { display: contents; }
      /* Tarjeta cerrada: todo en columna y centrado, y los textos bajan de
         renglón en vez de cortarse. La abierta conserva la fila de encabezado. */
      .correo:not(.correo--abierto) .correo__fila {
        flex-direction: column; justify-content: center; text-align: center;
        gap: 8px; min-height: 0; padding: 4px 0;
      }
      .correo:not(.correo--abierto) .correo__icono { width: clamp(34px, 9.5vw, 40px); height: clamp(34px, 9.5vw, 40px); }
      .correo:not(.correo--abierto) .correo__datos { align-items: center; text-align: center; gap: 3px; width: 100%; }
      .correo:not(.correo--abierto) .correo__datos b { white-space: normal; overflow: visible; text-overflow: clip; text-wrap: balance; line-height: 1.25; }
      .correo:not(.correo--abierto) .correo__datos small { white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; text-wrap: balance; }
      .correo:not(.correo--abierto) .correo__pie { display: flex; align-items: center; justify-content: center; gap: 10px; }
      /* El asunto y el destinatario ceden antes que el ícono y el chevrón, que
         son los que dicen de qué plantilla se trata y que la fila se abre. */
      .correo__fila > lm-icono { flex: 0 0 auto; }
      .correo__fila > lm-chip { flex: 0 0 auto; }
      /* El correo se muestra dentro de un marco aislado: su hoja de estilos
         está pensada para un cliente de correo y no puede tocar la aplicación. */
      .correo__vista {
        width: 100%; height: min(420px, 62dvh); display: block;
        border-radius: var(--radius-field); border: 1px solid var(--border-field);
        background: var(--surface-sunken);
      }
    
      /* Tandas exactas del sistema: cada casilla mide (alto - separaciones) / por,
         así entran enteras por pantalla y ninguna queda cortada; la tarjeta
         llena su casilla (con tope) y centra su contenido. */
      /* La última tarjeta no puede anclarse al tope (no hay más scroll): se
         ancla por debajo para que al llegar al final nunca quede cortada. */
      .lm-lista-n > .casilla:last-child { scroll-snap-align: end; }
      .casilla { display: flex; flex-direction: column; justify-content: center; }
      .casilla > .correo { flex: 1 1 auto; max-height: clamp(160px, 30dvh, 210px); justify-content: center; }
      .casilla--abierta { flex-basis: 100% !important; min-height: 70dvh; }
      .casilla > .correo--abierto { flex: 1 1 auto; max-height: 100%; justify-content: flex-start; min-height: 0; }
      .correo--abierto .correo__vista { flex: 1 1 0; height: auto; min-height: 250px; }

      @media (max-height: 760px) { .lm-lista-n:has(> :nth-child(5)) { --por: 2; } }
    `,
  ],
})
export class DuenoCorreosPage extends PaginaConSesion {
  private readonly almacen = inject(AlmacenService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly correos = computed(() => this.almacen.correos());
  protected readonly abierto = signal<string | null>(null);

  protected alternar(id: string, casilla?: HTMLElement): void {
    const abrir = this.abierto() !== id;
    this.abierto.set(abrir ? id : null);
    if (abrir && casilla) {
      // La tarjeta abierta ocupa toda la lista: se la lleva al tope para que
      // la vista previa no quede cortada por la posición de scroll anterior.
      // Doble cuadro para que Angular ya haya aplicado la clase abierta.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => casilla.scrollIntoView({ behavior: 'smooth', block: 'start' })),
      );
    }
  }

  /**
   * El HTML lo genera la propia aplicación desde sus plantillas, así que se
   * muestra tal cual para que se vea exactamente lo que recibe el cliente.
   * Va dentro de un marco aislado y sin scripts, para que sus estilos no se
   * filtren a la aplicación. Comparte el origen de la app sólo para poder
   * cargar el logo: con un origen nulo el navegador bloquea las imágenes del
   * propio servidor. Sin `allow-scripts` el correo no puede ejecutar nada.
   */
  protected html(correo: CorreoEnviado): SafeHtml {
    // Un marco con `srcdoc` no tiene dirección propia: sin una base, las
    // rutas relativas de los correos viejos (el logo en `assets/…`) no cargan.
    // Va dentro del <head>: antepuesta al DOCTYPE dejaría el correo en modo
    // de compatibilidad y cambiaría cómo se dibuja.
    const base = `<base href="${document.baseURI}">`;
    // La barra de desplazamiento del marco se oculta, pero el correo sigue
    // desplazándose con el dedo.
    const sinBarra = '<style>html,body{scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}</style>';
    const cabeza = base + sinBarra;
    const html = /<head[^>]*>/i.test(correo.cuerpoHtml)
      ? correo.cuerpoHtml.replace(/<head[^>]*>/i, (etiqueta) => etiqueta + cabeza)
      : cabeza + correo.cuerpoHtml;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /** Lo que se le avisó a la persona con cada plantilla: ícono y estado del chip. */
  protected aviso(correo: CorreoEnviado): { icono: string; chip: string; rotulo: string } {
    switch (correo.plantilla) {
      case 'APROBACION':
        return { icono: 'mark_email_read', chip: 'aprobado', rotulo: 'Aprobado' };
      case 'RECHAZO':
        return { icono: 'unsubscribe', chip: 'rechazado', rotulo: 'Rechazado' };
      case 'RESERVA_CONFIRMADA':
        return { icono: 'event_available', chip: 'aprobado', rotulo: 'Reserva' };
      case 'RESERVA_RECHAZADA':
        return { icono: 'event_busy', chip: 'rechazado', rotulo: 'Reserva rechazada' };
      default:
        return { icono: 'forward_to_inbox', chip: 'pendiente', rotulo: 'En revisión' };
    }
  }

  /** El destinatario en dos mitades para poder partirlo antes del "@". */
  protected partesPara(para: string): { usuario: string; dominio: string } {
    const arroba = para.lastIndexOf('@');
    return arroba > 0
      ? { usuario: para.slice(0, arroba), dominio: para.slice(arroba) }
      : { usuario: para, dominio: '' };
  }

  /** En la lista el asunto va corto: el nombre del local sobra y el del rechazo es largo. */
  protected rotuloAsunto(asunto: string): string {
    return asunto.includes('Estado de tu solicitud') ? 'Estado de solicitud' : asunto;
  }
}
