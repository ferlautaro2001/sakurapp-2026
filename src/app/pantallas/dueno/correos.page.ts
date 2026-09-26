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

                <!-- El chip alcanza: el detalle que devuelve el proveedor es
                     diagnóstico interno y no le dice nada a quien mira. -->
                <div class="correo__estado">
                  <lm-chip [estado]="correo.entregado ? 'aprobado' : 'pendiente'">
                    {{ correo.entregado ? 'Entregado' : 'En bandeja' }}
                  </lm-chip>
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
      .correo { padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-3); }
      .correo__fila { display: flex; align-items: center; gap: var(--space-3); background: none; border: none; padding: 0; min-height: var(--touch-min); cursor: pointer; text-align: left; width: 100%; }
      .correo__icono { width: var(--size-icono-caja); height: var(--size-icono-caja); flex: 0 0 auto; border-radius: var(--radius-thumb); background: var(--state-success); display: grid; place-items: center; }
      .correo__icono--rechazo { background: var(--state-error); }
      .correo__datos { flex: 1; min-width: 0; }
      .correo__datos b { display: block; font: var(--type-body-medium); color: var(--text-title); }
      .correo__datos small { display: block; font: var(--type-caption); color: var(--text-muted); }
      /* El asunto y el destinatario ceden antes que el ícono y el chevrón, que
         son los que dicen de qué plantilla se trata y que la fila se abre. */
      .correo__fila > lm-icono { flex: 0 0 auto; }
      .correo__estado { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
      /* El correo se muestra dentro de un marco aislado: su hoja de estilos
         está pensada para un cliente de correo y no puede tocar la aplicación. */
      .correo__vista {
        /* 420px clavados tapaban la pantalla entera en un equipo bajo: el marco
           nunca pasa de dos tercios del alto útil. */
        width: 100%; height: min(420px, 62dvh); display: block;
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
