import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { PROPINAS, QrService } from '../../nucleo/servicios/qr.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { Mesa } from '../../nucleo/modelos/modelos';
import { ROTULO_TIPO_MESA } from '../../nucleo/modelos/enums';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-dueno-codigos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo>Códigos QR</lm-titulo>

        <lm-pestanas [opciones]="pestanas" [valor]="pestana()" (cambiar)="pestana.set($event)" />

        @switch (pestana()) {
          @case ('ingreso') {
            @if (ingreso()) {
              <div class="con-descarga con-descarga--placa">
                <lm-placa-qr [fuente]="ingreso()!" rotulo="Ingreso al local" />
                <button type="button" class="descarga" aria-label="Descargar el código de ingreso" title="Descargar" (click)="descargar(ingreso()!, 'qr-ingreso')">
                  <lm-icono nombre="download" [tamano]="20" />
                </button>
              </div>
            }
          }

          @case ('propinas') {
            <div class="lm-lista-uno">
              @for (codigo of propinas(); track codigo.porcentaje) {
                <div class="con-descarga">
                  <div class="lm-card propina" [attr.data-nivel]="codigo.porcentaje">
                    <img [src]="codigo.imagen" [alt]="'Código QR de propina ' + codigo.rotulo" loading="lazy" decoding="async" />
                    <div class="propina__datos">
                      <span class="propina__valor">{{ codigo.porcentaje }}<small>%</small></span>
                      <span class="propina__rotulo">{{ codigo.rotulo }}</span>
                    </div>
                  </div>
                  <button type="button" class="descarga" [attr.aria-label]="'Descargar el código de propina ' + codigo.porcentaje + '%'" title="Descargar" (click)="descargar(codigo.imagen, 'qr-propina-' + codigo.porcentaje)">
                    <lm-icono nombre="download" [tamano]="20" />
                  </button>
                </div>
              }
            </div>
          }

          @case ('mesas') {
            @if (mesas.todas().length) {
              <div class="lm-lista-uno">
                @for (mesa of mesas.todas(); track mesa.id) {
                  <!-- El de descarga va al lado y no adentro: un botón no puede contener otro. -->
                  <div class="con-descarga">
                    <button type="button" class="lm-card mesa" [attr.aria-label]="'Mesa ' + mesa.numero" (click)="ir(['/mesas', mesa.id, 'qr'])">
                      <img [src]="miniatura(mesa)" [alt]="'Código QR de la mesa ' + mesa.numero" loading="lazy" decoding="async" />
                      <!-- Igual que las propinas: número grande y una pastilla con el tipo, coloreada. -->
                      <div class="propina__datos" [attr.data-tipo]="mesa.tipo">
                        <span class="propina__valor">{{ mesa.numero }}</span>
                        <span class="propina__rotulo">{{ rotuloTipo[mesa.tipo] }}</span>
                      </div>
                    </button>
                    <button type="button" class="descarga" [attr.aria-label]="'Descargar el código de la mesa ' + mesa.numero" title="Descargar" (click)="descargar(miniatura(mesa), 'qr-mesa-' + mesa.numero)">
                      <lm-icono nombre="download" [tamano]="20" />
                    </button>
                  </div>
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
      /* Una tarjeta por pantalla: el código va grande, arriba, y los datos debajo. */
      /* Tarjeta de QR en horizontal: el código cuadrado a la izquierda, tan alto como la
         casilla, y los datos a la derecha. Entra de a dos por pantalla sin achicar el QR. */
      .propina, .mesa { display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: var(--space-4); padding: var(--space-3); width: 100%; min-height: 0; max-height: 100%; text-align: left; cursor: pointer; }
      /* La miniatura del código escala con el ancho del equipo, pero sigue
         cuadrada: un QR deformado no lo lee ninguna cámara. */
      .propina img, .mesa img { flex: 0 0 auto; width: 46%; height: auto; max-height: 100%; aspect-ratio: 1; object-fit: contain; border-radius: var(--radius-card); background: #fff; }
      .propina__datos, .mesa__datos { flex: 1 1 0; min-width: 0; }
      /* Los códigos van de a dos con alto de pantalla normal; en pantallas bajas, de a uno. */
      @media (max-height: 700px) { .lm-lista-uno:has(> :nth-child(3)) { --por: 1; } }
      /* El porcentaje manda: es lo que distingue un código de otro de un vistazo.
         La calificación va debajo, como etiqueta. */
      .propina__datos { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); text-align: center; }
      .propina__valor { font: 900 clamp(40px, 13vw, 60px)/1 var(--font-numeric); color: var(--action-primary); letter-spacing: -0.02em; }
      .propina__valor small { font-size: .5em; margin-left: 2px; }
      /* El QR lo más grande que entre en el alto de la tarjeta (sin pasar del
         58% del ancho), y los datos centrados en el espacio que queda: así no
         sobra aire arriba y abajo del código ni a la derecha del texto. */
      .propina { padding: var(--space-4); gap: var(--space-4); align-items: stretch; }
      .propina img { width: auto; height: 100%; max-width: 58%; align-self: center; }
      .propina__rotulo {
        font: 750 clamp(13px, 3.6vw, 15px)/1 var(--font-text); color: var(--text-title);
        padding: 6px 14px; border-radius: var(--radius-pill); background: rgba(255, 255, 255, .7);
        border: 1.5px solid rgba(255, 255, 255, .85); box-shadow: 0 0 0 1px rgba(232, 51, 111, .25);
      }
      /* Escala de color tipo formato condicional: de verde (excelente) a rojo (malo). */
      .propina { --nivel: #1B7A4C; }
      .propina[data-nivel="15"] { --nivel: #5E9E2F; }
      .propina[data-nivel="10"] { --nivel: #C99A06; }
      .propina[data-nivel="5"] { --nivel: #D9670F; }
      .propina[data-nivel="0"] { --nivel: #C0261A; }
      .propina__valor { color: var(--nivel); }
      .propina__rotulo { background: var(--nivel); color: #FFFFFF; }
      /* Mesas: el color lo da el tipo. */
      .mesa { --nivel: var(--action-primary); align-items: stretch; padding: var(--space-4); }
      .mesa img { width: auto; height: 100%; max-width: 58%; align-self: center; }
      [data-tipo="VIP"] { --nivel: #B8860B; }
      [data-tipo="MOVILIDAD_REDUCIDA"] { --nivel: #1565C0; }
      .mesa .propina__valor small { font-size: .38em; margin: 0 2px 0 0; letter-spacing: 0; }
      /* El QR con el mismo aro de vidrio que el resto de las piezas. */
      .propina img, .mesa img { border: 2px solid rgba(255, 255, 255, .8); box-shadow: 0 0 0 1px rgba(232, 51, 111, .28), 0 3px 8px rgba(59, 8, 27, .16); box-sizing: border-box; }
    
      /* Distribución: llenar el alto disponible sin recortar tarjetas */

      /* El código de ingreso es una sola pieza: ocupa todo el alto libre. */
      .con-descarga--placa { flex: 1 1 auto; display: flex; }
      .con-descarga--placa > lm-placa-qr { flex: 1 1 auto; display: flex; }
      .con-descarga--placa > lm-placa-qr ::ng-deep .lm-qrplate { flex: 1; width: 100%; justify-content: center; }
      .con-descarga--placa > lm-placa-qr ::ng-deep .lm-qrplate img { max-width: min(100%, 44dvh, 340px); }

      /* Cada tarjeta lleva su botón de descarga flotando arriba a la derecha.
         El contenedor ocupa la casilla de la lista en lugar de la tarjeta. */
      .con-descarga { position: relative; display: flex; min-height: 0; }
      .con-descarga > .lm-card { flex: 1 1 auto; }
      .descarga {
        position: absolute; top: 10px; right: 10px; z-index: 1;
        width: 38px; height: 38px; border-radius: 50%; padding: 0; cursor: pointer;
        display: grid; place-items: center;
        background: var(--surface-card); color: var(--action-primary);
        border: 1.5px solid rgba(255, 255, 255, .85);
        box-shadow: 0 0 0 1px rgba(232, 51, 111, .28), 0 3px 8px rgba(59, 8, 27, .18);
        transition: transform var(--dur-fast) var(--ease-standard);
      }
      .descarga:active { transform: scale(.9); }
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
  protected readonly rotuloTipo = ROTULO_TIPO_MESA;
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

  /** Baja el PNG del código y avisa dónde quedó. */
  protected async descargar(imagen: string, nombre: string): Promise<void> {
    const resultado = await this.qr.descargar(imagen, nombre);
    if (resultado === 'documentos') this.avisos.exito('Código guardado', `Quedó en Documentos como ${nombre}.png.`);
    else if (resultado === null) this.avisos.error('No pudimos descargar el código', 'Probá de nuevo en unos segundos.');
  }

  protected miniatura(mesa: { id: string; qrCodeUrl: string }): string {
    return this.codigosDeMesa()[mesa.id] || mesa.qrCodeUrl;
  }
}
