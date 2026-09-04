import { Component, computed, inject, input } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { ROTULO_TIPO_MESA } from '../../nucleo/modelos/enums';

/**
 * Punto 4 · Visualización e impresión del código QR identificador de la mesa.
 */
@Component({
  selector: 'lm-mesa-qr',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Código de la mesa" conVolver (volver)="volver()" />

      @if (mesa(); as m) {
        <div class="lm-body">
          <lm-titulo bajada="Generado automáticamente para identificación de comensales y empleados">
            Mesa {{ m.numero }} · {{ tipo() }}
          </lm-titulo>

          <lm-placa-qr [fuente]="m.qrCodeUrl" [rotulo]="'Mesa ' + m.numero + ' · ' + m.cantidadComensales + ' personas'" />

          <lm-separador rotulo="Uso en salón" />
          <p class="lm-parrafo">
            Imprimí este código y pegalo sobre la mesa física. El personal lo escanea para ver su estado y disponibilidad;
            el comensal lo escanea para vincularse al puesto físico asignado por el metre.
          </p>

          <div class="lm-card resumen">
            <div>
              <span class="lm-label">Capacidad</span>
              <span class="resumen__valor">{{ m.cantidadComensales }}</span>
            </div>
            <div>
              <span class="lm-label">Tipo</span>
              <span class="resumen__texto">{{ tipo() }}</span>
            </div>
            <lm-chip [estado]="m.estado.toLowerCase()">{{ estado() }}</lm-chip>
          </div>
        </div>

        <div class="lm-actionbar">
          <lm-boton icono="print" (presionar)="compartir()">Compartir o imprimir</lm-boton>
          <lm-texto-boton (presionar)="volver()">Volver a mesas</lm-texto-boton>
        </div>
      } @else {
        <div class="lm-body">
          <lm-vacio icono="table_restaurant" titulo="No encontramos esa mesa">
            Puede que la hayan dado de baja o que el identificador sea inválido.
            <lm-boton accion variante="secondary" [ancho]="false" (presionar)="volver()">Volver a mesas</lm-boton>
          </lm-vacio>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .resumen { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; }
      .resumen__valor { display: block; font: var(--type-section); color: var(--text-title); }
      .resumen__texto { display: block; font: var(--type-body-medium); color: var(--text-title); }
    `,
  ],
})
export class MesaQrPage extends PaginaConSesion {
  private readonly mesas = inject(MesasService);
  private readonly qr = inject(QrService);

  readonly id = input.required<string>();

  protected readonly mesa = computed(() => this.mesas.porId(this.id()));

  protected tipo(): string {
    const m = this.mesa();
    return m ? ROTULO_TIPO_MESA[m.tipo] : '';
  }

  protected estado(): string {
    const m = this.mesa();
    if (!m) return '';
    return m.estado === 'VACIA' ? 'Vacía' : m.estado === 'OCUPADA' ? 'Ocupada' : 'Inactiva';
  }

  protected async compartir(): Promise<void> {
    const m = this.mesa();
    if (!m) return;
    const listo = await this.qr.compartir(m.qrCodeUrl, `sakurapp-mesa-${m.numero}`, `Código QR Mesa ${m.numero}`);
    if (!listo) {
      this.avisos.error('No pudimos compartir el código', 'Probá de nuevo en unos segundos.');
    }
  }

  protected volver(): void {
    this.ir(['/mesas']);
  }
}
