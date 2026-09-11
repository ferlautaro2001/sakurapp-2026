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

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="correos().length" bajada="Se envían solos al resolver cada registro">
          Correos automáticos
        </lm-titulo>

        @if (correos().length) {
          <div class="lm-list">
            @for (correo of correos(); track correo.id) {
              <div class="lm-card correo">
                <button type="button" class="correo__fila" (click)="alternar(correo.id)">
                  <span class="correo__icono" [class.correo__icono--rechazo]="correo.plantilla === 'RECHAZO'">
                    <lm-icono
                      [nombre]="correo.plantilla === 'APROBACION' ? 'mark_email_read' : 'unsubscribe'"
                      [tamano]="22"
                      color="var(--lm-surface)"
                    />
                  </span>
                  <span class="correo__datos">
                    <b>{{ correo.asunto }}</b>
                    <small>Para {{ correo.para }} · {{ correo.enviadoEn | fechaHora }}</small>
                  </span>
                  <lm-icono [nombre]="abierto() === correo.id ? 'expand_less' : 'expand_more'" [tamano]="22" />
                </button>

                <div class="correo__estado">
                  <lm-chip [estado]="correo.entregado ? 'aprobado' : 'pendiente'">
                    {{ correo.entregado ? 'Entregado' : 'En bandeja' }}
                  </lm-chip>
                  <span class="lm-nota">{{ correo.detalle }}</span>
                </div>

                @if (abierto() === correo.id) {
                  <iframe
                    class="correo__vista"
                    title="Vista previa del correo"
                    sandbox=""
                    [srcdoc]="html(correo)"
                  ></iframe>
                }
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
      .correo { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
      .correo__fila { display: flex; align-items: center; gap: 12px; background: none; border: none; padding: 0; cursor: pointer; text-align: left; width: 100%; }
      .correo__icono { width: 46px; height: 46px; flex: 0 0 auto; border-radius: var(--radius-thumb); background: var(--state-success); display: grid; place-items: center; }
      .correo__icono--rechazo { background: var(--state-error); }
      .correo__datos { flex: 1; min-width: 0; }
      .correo__datos b { display: block; font: var(--type-body-medium); color: var(--text-title); }
      .correo__datos small { display: block; font: var(--type-caption); color: var(--text-muted); }
      .correo__estado { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      /* El correo se muestra dentro de un marco aislado: su hoja de estilos
         está pensada para un cliente de correo y no puede tocar la aplicación. */
      .correo__vista {
        width: 100%; height: 420px; display: block;
        border-radius: var(--radius-field); border: 1px solid var(--border-field);
        background: var(--surface-sunken);
      }
    `,
  ],
})
export class DuenoCorreosPage extends PaginaConSesion {
  private readonly almacen = inject(AlmacenService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly correos = computed(() => this.almacen.correos());
  protected readonly abierto = signal<string | null>(null);

  protected alternar(id: string): void {
    this.abierto.update((actual) => (actual === id ? null : id));
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
}
