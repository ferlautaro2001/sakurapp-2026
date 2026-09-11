import { Component, OnInit, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { PROPINAS, QrService } from '../../nucleo/servicios/qr.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';

interface CodigoPropina {
  porcentaje: number;
  rotulo: string;
  imagen: string;
}

/**
 * Los códigos QR del salón, todos disponibles desde una sola pantalla:
 * el de ingreso al local, los cinco de propina y el de cada mesa.
 */
@Component({
  selector: 'lm-dueno-codigos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12">
        <lm-titulo bajada="Imprimilos y pegalos en la puerta, en la barra y en cada mesa">Códigos QR</lm-titulo>

        <lm-pestanas [opciones]="pestanas" [valor]="pestana()" (cambiar)="pestana.set($event)" />

        @switch (pestana()) {
          @case ('ingreso') {
            @if (ingreso()) {
              <lm-placa-qr [fuente]="ingreso()!" rotulo="Ingreso al local" />
              <lm-separador rotulo="Cómo se usa" />
              <p class="lm-parrafo">
                Va pegado en la puerta. El cliente lo escanea para anotarse en la lista de espera y para ver los
                resultados de las encuestas anteriores.
              </p>
            }
          }

          @case ('propinas') {
            <p class="lm-parrafo">
              Cinco códigos, uno por nivel de satisfacción. El cliente escanea el que corresponde y ese porcentaje se
              suma a la cuenta final.
            </p>
            <div class="lm-list">
              @for (codigo of propinas(); track codigo.porcentaje) {
                <div class="lm-card propina">
                  <img [src]="codigo.imagen" [alt]="'Código QR de propina ' + codigo.rotulo" />
                  <div class="propina__datos">
                    <span class="propina__rotulo">{{ codigo.rotulo }}</span>
                    <span class="propina__valor">{{ codigo.porcentaje }} %</span>
                    <span class="propina__nota">de propina sobre el total</span>
                  </div>
                </div>
              }
            </div>
          }

          @case ('mesas') {
            @if (mesas.todas().length) {
              <p class="lm-parrafo">Cada mesa tiene su código generado automáticamente al darla de alta.</p>
              <div class="lm-list">
                @for (mesa of mesas.todas(); track mesa.id) {
                  <button type="button" class="lm-card mesa" (click)="ir(['/mesas', mesa.id, 'qr'])">
                    <img [src]="mesa.qrCodeUrl" [alt]="'Código QR de la mesa ' + mesa.numero" />
                    <div class="mesa__datos">
                      <span class="mesa__numero">Mesa {{ mesa.numero }}</span>
                      <span class="mesa__meta">{{ mesa.cantidadComensales }} personas</span>
                    </div>
                    <lm-icono nombre="chevron_right" [tamano]="22" color="var(--action-primary)" />
                  </button>
                }
              </div>
            } @else {
              <lm-vacio icono="table_restaurant" titulo="Todavía no hay mesas">
                Cargá la primera mesa y su código se genera solo.
                <lm-boton accion variante="secondary" icono="add" [ancho]="false" (presionar)="ir(['/mesas/nueva'])">
                  Agregar una mesa
                </lm-boton>
              </lm-vacio>
            }
          }
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="codigos" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .propina, .mesa { display: flex; align-items: center; gap: 14px; padding: 12px; width: 100%; text-align: left; cursor: pointer; }
      .propina img, .mesa img { width: 84px; height: 84px; border-radius: var(--radius-thumb); flex: 0 0 auto; }
      .propina__datos, .mesa__datos { flex: 1; min-width: 0; }
      .propina__rotulo { display: block; font: var(--type-card-title); color: var(--text-title); }
      .propina__valor { display: block; font: var(--type-price); color: var(--action-primary); }
      .propina__nota { display: block; font: var(--type-caption); color: var(--text-muted); }
      .mesa__numero { display: block; font: var(--type-card-title); color: var(--text-title); }
      .mesa__meta { display: block; font: var(--type-caption); color: var(--text-muted); }
    `,
  ],
})
export class DuenoCodigosPage extends PaginaConSesion implements OnInit {
  private readonly qr = inject(QrService);
  protected readonly mesas = inject(MesasService);

  protected readonly pestanas = [
    { valor: 'ingreso', rotulo: 'Ingreso' },
    { valor: 'propinas', rotulo: 'Propinas' },
    { valor: 'mesas', rotulo: 'Mesas' },
  ];
  protected readonly pestana = signal('ingreso');

  protected readonly ingreso = signal<string | null>(null);
  protected readonly propinas = signal<CodigoPropina[]>([]);

  async ngOnInit(): Promise<void> {
    this.ingreso.set(await this.qr.generarDeIngreso());
    const codigos: CodigoPropina[] = [];
    for (const propina of PROPINAS) {
      codigos.push({ ...propina, imagen: await this.qr.generarDePropina(propina.porcentaje) });
    }
    this.propinas.set(codigos);
  }
}
