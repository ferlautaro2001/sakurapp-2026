import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { PROPINAS, QrService } from '../../nucleo/servicios/qr.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { Mesa } from '../../nucleo/modelos/modelos';

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
              <div class="lm-list">
                @for (mesa of mesas.todas(); track mesa.id) {
                  <button type="button" class="lm-card mesa" (click)="ir(['/mesas', mesa.id, 'qr'])">
                    <img [src]="miniatura(mesa)" [alt]="'Código QR de la mesa ' + mesa.numero" />
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
      .propina, .mesa { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3); width: 100%; min-height: var(--touch-min); text-align: left; cursor: pointer; }
      /* La miniatura del código escala con el ancho del equipo, pero sigue
         cuadrada: un QR deformado no lo lee ninguna cámara. */
      .propina img, .mesa img { width: var(--size-thumb); height: var(--size-thumb); aspect-ratio: 1; border-radius: var(--radius-thumb); flex: 0 0 auto; }
      .propina__datos, .mesa__datos { flex: 1; min-width: 0; }
      .mesa > lm-icono { flex: 0 0 auto; }
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
  /** Código dibujado en el momento para cada mesa, indexado por su id. */
  private readonly codigosDeMesa = signal<Record<string, string>>({});

  constructor() {
    super();
    // Las mesas llegan del salón cuando llegan: el dibujo se rehace solo a
    // medida que la lista se puebla, en vez de una sola vez al entrar.
    effect(() => void this.dibujarCodigosDeMesa(this.mesas.todas()));
  }

  async ngOnInit(): Promise<void> {
    this.ingreso.set(await this.qr.generarDeIngreso());
    const codigos: CodigoPropina[] = [];
    for (const propina of PROPINAS) {
      codigos.push({ ...propina, imagen: await this.qr.generarDePropina(propina.porcentaje) });
    }
    this.propinas.set(codigos);
  }

  /**
   * La miniatura se dibuja acá y no se lee de `qrCodeUrl`.
   *
   * Ese campo es un dato guardado, no código: las mesas del salón lo tenían
   * apuntando a un archivo que no existía y las doce miniaturas salían rotas.
   * Un archivo estático además envejece —si la mesa se renumera o se vuelve a
   * crear, la imagen sigue codificando la anterior— y un QR equivocado es peor
   * que uno roto, porque se escanea igual. La pantalla de la mesa ya prefiere
   * el código generado en vivo, así que generándolo también acá las dos
   * muestran lo mismo. Lo guardado queda de red por si el dibujo falla.
   */
  private async dibujarCodigosDeMesa(mesas: readonly Mesa[]): Promise<void> {
    const yaDibujados = untracked(this.codigosDeMesa);
    const faltantes = mesas.filter((mesa) => !yaDibujados[mesa.id]);
    if (!faltantes.length) return;
    const dibujados: Record<string, string> = {};
    for (const mesa of faltantes) {
      dibujados[mesa.id] = await this.qr.generarDeMesa(mesa.id, mesa.numero);
    }
    this.codigosDeMesa.update((actual) => ({ ...actual, ...dibujados }));
  }

  protected miniatura(mesa: { id: string; qrCodeUrl: string }): string {
    return this.codigosDeMesa()[mesa.id] || mesa.qrCodeUrl;
  }
}
