import { Component, computed, inject, signal } from '@angular/core';
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
                <button type="button" class="correo__fila" (click)="alternar(correo.id, casilla)">
                  <span class="correo__icono" [class.correo__icono--rechazo]="!esPositivo(correo)">
                    <lm-icono
                      [nombre]="esPositivo(correo) ? 'mark_email_read' : 'unsubscribe'"
                      [tamano]="22"
                      color="var(--lm-surface)"
                    />
                  </span>
                  <span class="correo__datos">
                    <b>{{ rotuloAsunto(correo.asunto) }}</b>
                    <small>Para {{ correo.para }}</small>
                    <small>{{ correo.enviadoEn | fechaHora }}</small>
                  </span>
                  <!-- Qué se le avisó a la persona, a la altura del chevrón. -->
                  <lm-chip [estado]="esPositivo(correo) ? 'aprobado' : 'rechazado'">
                    {{ rotuloPlantilla(correo) }}
                  </lm-chip>
                  <lm-icono [nombre]="abierto() === correo.id ? 'expand_less' : 'expand_more'" [tamano]="22" />
                </button>

                @if (abierto() === correo.id) {
                  <iframe
                    class="correo__vista"
                    title="Vista previa del correo"
                    sandbox=""
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
      .correo__datos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .correo__datos b { display: block; font: var(--type-body-medium); color: var(--text-title); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .correo__datos small { display: block; font: var(--type-caption); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
   * Va dentro de un marco aislado y sin permisos, para que sus estilos no se
   * filtren a la aplicación.
   */
  protected html(correo: CorreoEnviado): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(correo.cuerpoHtml);
  }

  /** Aprobaciones y reservas confirmadas van en verde; los rechazos, en rojo. */
  protected esPositivo(correo: CorreoEnviado): boolean {
    return correo.plantilla === 'APROBACION' || correo.plantilla === 'RESERVA_CONFIRMADA';
  }

  protected rotuloPlantilla(correo: CorreoEnviado): string {
    switch (correo.plantilla) {
      case 'RESERVA_CONFIRMADA':
        return 'Reserva';
      case 'RESERVA_RECHAZADA':
        return 'Reserva rechazada';
      default:
        return this.esPositivo(correo) ? 'Aprobado' : 'Rechazado';
    }
  }

  /** En la lista el asunto va corto: el nombre del local sobra y el del rechazo es largo. */
  protected rotuloAsunto(asunto: string): string {
    return asunto.includes('Estado de tu solicitud') ? 'Estado de solicitud' : asunto;
  }
}
