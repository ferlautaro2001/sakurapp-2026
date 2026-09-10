import { Component, computed, effect, inject } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { ROTULO_TIPO_MESA, TipoMesa } from '../../nucleo/modelos/enums';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { QrService } from '../../nucleo/servicios/qr.service';

/**
 * US-5.1 · el lugar del comensal, de punta a punta de su espera. Entra entera
 * en la pantalla: la ficha del medio se estira o se encoge con el espacio que
 * haya.
 *
 *  1. En la fila  → su número de orden. (`ESPERANDO`)
 *  2. Con mesa    → escanea el código de la mesa que le tocó. (`ASIGNADO`)
 *  3. Ya sentado  → los datos de su mesa. (`FINALIZADO`)
 *
 * Los resultados de las encuestas viven en la otra sección de la barra: son lo
 * único más a lo que la consigna le da acceso hasta acá.
 */
@Component({
  selector: 'lm-cliente-espera',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--fijo lm-body--gap12">
        <lm-titulo [bajada]="bajada()">{{ titulo() }}</lm-titulo>

        @if (esperando()) {
          <div class="turno">
            <span class="turno__rotulo">Personas delante tuyo</span>
            <span class="turno__numero">{{ delante() }}</span>
            <span class="turno__mensaje">{{ mensajeFila() }}</span>
            <span class="turno__pie">
              <lm-icono nombre="schedule" [tamano]="15" color="var(--action-primary)" />
              Llegaste a las {{ horaLlegada() }} · sos el número {{ posicion() }} de la fila
            </span>
          </div>

          <div class="lm-vidrio pasos">
            <span class="paso">
              <lm-icono nombre="person_pin" [tamano]="19" color="#FFFFFF" />
              El metre te asigna una mesa según la cantidad de comensales.
            </span>
            <span class="paso">
              <lm-icono nombre="qr_code_2" [tamano]="19" color="#FFFFFF" />
              Cuando lo haga, esta pantalla te va a pedir que escanees su código.
            </span>
          </div>
        } @else if (numeroMesa(); as numero) {
          <div class="turno">
            <span class="turno__rotulo">{{ vinculado() ? 'Estás en la mesa' : 'Te tocó la mesa' }}</span>
            <span class="turno__numero">{{ numero }}</span>
            <span class="turno__mensaje">
              {{
                vinculado()
                  ? 'Listo, quedaste vinculado con tu mesa.'
                  : 'Buscá ese número y escaneá el código pegado sobre la mesa.'
              }}
            </span>
            @if (mesa(); as m) {
              <span class="turno__datos">
                <span>
                  <lm-icono nombre="group" [tamano]="15" />
                  {{ m.cantidadComensales }} lugares
                </span>
                <span>
                  <lm-icono [nombre]="iconoTipo(m.tipo)" [tamano]="15" />
                  {{ rotuloTipo(m.tipo) }}
                </span>
                <lm-chip [estado]="vinculado() ? 'ocupada' : 'reservada'">
                  {{ vinculado() ? 'Ocupada por vos' : 'Reservada para vos' }}
                </lm-chip>
              </span>
            }
          </div>

          <div class="lm-vidrio pasos">
            <span class="paso">
              <lm-icono [nombre]="vinculado() ? 'insights' : 'qr_code_scanner'" [tamano]="19" color="#FFFFFF" />
              {{
                vinculado()
                  ? 'Mientras esperás la atención, podés mirar los resultados de las encuestas anteriores.'
                  : 'Sólo sirve el código de la mesa ' + numero + ': si escaneás otra, te lo vamos a avisar.'
              }}
            </span>
          </div>
        }
      </div>

      @if (estado() === 'ASIGNADO') {
        <div class="lm-actionbar">
          <lm-boton icono="qr_code_scanner" (presionar)="escanearMesa()">Escanear el código de mi mesa</lm-boton>
        </div>
      } @else if (esperando()) {
        <div class="lm-actionbar">
          <lm-boton icono="refresh" (presionar)="actualizar()">Actualizar mi lugar</lm-boton>
        </div>
      }
        @else if (vinculado()) {
          <div class="lm-actionbar">
            <lm-boton
              icono="restaurant_menu"
              (presionar)="irCarta()"
            >
              Explorar la carta
            </lm-boton>
          </div>
        }

      <lm-barra-inferior [items]="secciones()" activo="lugar" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      /* La ficha se estira con lo que sobre: es lo que hace que la pantalla
         quede llena y sin desplazamiento, en cualquier alto de teléfono. */
      .turno {
        flex: 1 1 auto;
        min-height: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
        padding: 16px 18px; text-align: center;
        border-radius: var(--radius-card); background: var(--surface-card);
        box-shadow: var(--shadow-raised);
        position: relative; overflow: hidden;
      }
      .turno::before {
        content: ""; position: absolute; top: -24px; right: -24px; width: 112px; height: 112px;
        background: url("/assets/img/flor-2.png") center / contain no-repeat; opacity: .28;
      }
      .turno__rotulo {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-muted);
      }
      .turno__numero {
        font-family: var(--font-numeric); font-weight: 900; line-height: 1;
        font-size: clamp(56px, 17vh, 104px);
        color: var(--action-primary);
      }
      .turno__mensaje { font: var(--type-section); color: var(--text-title); text-wrap: balance; }
      .turno__pie, .turno__datos {
        display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;
        font: var(--type-caption); color: var(--text-muted);
      }
      .turno__datos { gap: 12px; font: var(--type-body-small); margin-top: 2px; }
      .turno__datos > span { display: inline-flex; align-items: center; gap: 5px; }
      .pasos { display: flex; flex-direction: column; gap: 9px; padding: 13px 14px; }
      .paso { display: flex; gap: 9px; align-items: flex-start; font: var(--type-body-small); color: var(--text-sobre-fondo); text-wrap: pretty; }
    `,
  ],
})
export class ClienteEsperaPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly mesas = inject(MesasService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);

  protected readonly entrada = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.espera.activaDe(id) : undefined;
  });

  protected readonly estado = computed(() => this.entrada()?.estado ?? null);
  protected readonly esperando = computed(() => this.estado() === 'ESPERANDO');
  protected readonly vinculado = computed(() => this.estado() === 'FINALIZADO');

  /** La mesa completa, si el salón ya la tiene cargada en este dispositivo. */
  protected readonly mesa = computed(() => {
    const id = this.entrada()?.mesaAsignadaId;
    return id ? this.mesas.porId(id) : undefined;
  });

  /**
   * El número de la mesa asignada. Viaja en la propia entrada de la lista, así
   * que se muestra aunque la grilla de mesas todavía no haya llegado.
   */
  protected readonly numeroMesa = computed(() => this.mesa()?.numero ?? this.entrada()?.mesaAsignadaNumero ?? null);

  protected readonly posicion = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.espera.posicionDe(id) : 0;
  });

  protected readonly delante = computed(() => Math.max(0, this.posicion() - 1));

  constructor() {
    super();
    void this.espera.iniciar();

    // Si lo sacaron de la lista, esta pantalla no tiene nada que mostrarle.
    effect(() => {
      if (!this.entrada()) void this.router.navigate(['/cliente/ingreso'], { replaceUrl: true });
    });
  }

  protected titulo(): string {
    if (this.vinculado()) return 'Tu mesa';
    if (this.estado() === 'ASIGNADO') return 'Ya tenés mesa';
    return 'Esperando tu mesa';
  }

  protected bajada(): string {
    if (this.vinculado()) return 'Quedaste vinculado con la mesa que te asignó el metre';
    if (this.estado() === 'ASIGNADO') return 'Escaneá el código de tu mesa para vincularte';
    return 'Ya estás anotado en la lista de espera del salón';
  }

  protected mensajeFila(): string {
    const delante = this.delante();
    if (delante === 0) return '¡Sos el próximo!';
    if (delante === 1) return 'Hay una persona delante tuyo.';
    return `Hay ${delante} personas delante tuyo.`;
  }

  protected horaLlegada(): string {
    const entrada = this.entrada();
    if (!entrada) return '—';
    return new Date(entrada.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  protected rotuloTipo(tipo: TipoMesa): string {
    return ROTULO_TIPO_MESA[tipo];
  }

  protected iconoTipo(tipo: TipoMesa): string {
    return tipo === 'VIP' ? 'star' : tipo === 'MOVILIDAD_REDUCIDA' ? 'accessible' : 'table_restaurant';
  }

  /**
   * Punto 10 · el comensal escanea el código de la mesa que le asignaron.
   * Sólo sirve el código de esa mesa: con cualquier otra, se le indica cuál es
   * la suya y no se vincula.
   */
  protected async escanearMesa(): Promise<void> {
    const entrada = this.entrada();
    const numero = this.numeroMesa();
    if (!entrada || !entrada.mesaAsignadaId || numero === null) return;

    if (!this.escaner.disponible()) {
      this.avisos.info(
        'El lector funciona en el teléfono',
        `Instalá la aplicación en Android para escanear el código de la mesa ${numero}.`,
      );
      return;
    }

    const leido = await this.escaner.leer('QR');
    if (!leido) return;

    const contenido = this.qr.interpretar(leido);

    if (contenido.tipo === 'INGRESO') {
      this.avisos.info('Ese es el código de la puerta', `Buscá el código pegado sobre la mesa ${numero}.`);
      return;
    }

    if (contenido.tipo !== 'MESA') {
      this.avisos.error('Ese código no es de una mesa', `Buscá el código pegado sobre la mesa ${numero}.`);
      return;
    }

    if (contenido.mesaId !== entrada.mesaAsignadaId) {
      const otra = this.mesas.porId(contenido.mesaId);
      this.avisos.error(
        otra ? `Esa es la mesa ${otra.numero}` : 'Esa no es tu mesa',
        `La tuya es la mesa ${numero}. Buscá ese número en el salón.`,
      );
      return;
    }

    await this.cargando.conEsperaMinima(
      'Vinculándote con tu mesa…',
      () => this.espera.vincularConLaMesa(entrada.id),
    );

    this.avisos.exito(
      `Estás en la mesa ${numero}`,
      'Ya podés explorar la carta.',
    );

    await this.router.navigate(
      ['/carta'],
      {
        queryParams: {
          mesaId: entrada.mesaAsignadaId,
        },
        replaceUrl: true,
      },
    );
  }

  protected irCarta(): void {
    const mesaId =
      this.entrada()?.mesaAsignadaId;

    if (!mesaId) {
      this.avisos.error(
        'No pudimos identificar tu mesa',
        'Actualizá la pantalla e intentá nuevamente.',
      );
      return;
    }

    void this.router.navigate(['/carta'], {
      queryParams: { mesaId },
    });
  }

  protected async actualizar(): Promise<void> {
    await this.cargando.conEsperaMinima(
      'Consultando la lista de espera…',
      async () => undefined,
      500,
    );
  }
}
