import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-cliente-espera',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--fijo lm-body--gap12">
        @if (esperando()) {
          <!-- En la fila: el estado arriba, el lugar en el centro y qué pasa después al pie. -->
          <section class="ficha">
            <span class="estado"><span class="estado__punto"></span>Esperando mesa</span>
            <div class="lugar">
              <div class="anillo" [attr.aria-label]="'Tu lugar en la fila: ' + posicion()">
                <!-- Tres flores de sakura que giran sobre el aro mientras espera. -->
                <span class="anillo__orbita" aria-hidden="true">
                  <img class="anillo__flor" src="assets/img/flor-2.png" alt="" />
                  <img class="anillo__flor" src="assets/img/flor-2.png" alt="" />
                  <img class="anillo__flor" src="assets/img/flor-2.png" alt="" />
                </span>
                <span class="anillo__rotulo">Tu lugar</span>
                <span class="anillo__numero">{{ posicion() }}</span>
              </div>
              <p class="lugar__mensaje">{{ mensajeFila() }}</p>
            </div>
            <div class="pie">
              <lm-icono nombre="notifications_active" [tamano]="22" />
              El metre te notificará cuando se te asigne una mesa
            </div>
          </section>
        } @else if (numeroMesa(); as numero) {
          <!-- Con mesa, antes y después de escanear: la misma tarjeta. Arriba la mesa y sus
               datos; después del corte, qué hacer (escanear el QR o empezar a pedir). -->
          <section class="ficha ficha--ticket">
            <div class="boleto">
              <h2 class="boleto__titulo">{{ vinculado() ? 'Se te asignó la mesa' : '¡Ya tenés mesa!' }}</h2>
              <!-- El mismo aro con flores que la fila, pero quieto: ya no hay que esperar. -->
              <div class="anillo anillo--quieto" [attr.aria-label]="'Mesa ' + numero">
                <span class="anillo__orbita" aria-hidden="true">
                  <img class="anillo__flor" src="assets/img/flor-2.png" alt="" />
                  <img class="anillo__flor" src="assets/img/flor-2.png" alt="" />
                  <img class="anillo__flor" src="assets/img/flor-2.png" alt="" />
                </span>
                <span class="anillo__rotulo">Mesa</span>
                <span class="anillo__numero">{{ numero }}</span>
              </div>
              @if (mesa(); as m) {
                <div class="datos">
                  <span class="dato" [attr.aria-label]="m.cantidadComensales + ' lugares'">
                    <lm-icono nombre="group" [tamano]="20" />
                    {{ m.cantidadComensales }} lugares
                  </span>
                  <span class="dato">
                    <lm-icono [nombre]="iconoTipo(m.tipo)" [tamano]="20" />
                    {{ rotuloTipo(m.tipo) }}
                  </span>
                </div>
              }
            </div>
            <div class="corte">
              {{ vinculado() ? 'Ya podés empezar a hacer tu pedido' : 'Buscá tu mesa y escaneá el código' }}
            </div>
          </section>
        }
      </div>

      @if (estado() === 'ASIGNADO') {
        <div class="lm-actionbar">
          <lm-boton icono="document_scanner" (presionar)="escanearMesa()">Escanear QR</lm-boton>
        </div>
      }

      @if (modalErrorMesa(); as err) {
        <lm-modal animate.leave="sk-modal-host-sale"
          titulo="Mesa incorrecta"
          [mensaje]="err.mensaje"
          rotuloConfirmar="Entendido"
          [conCancelar]="false"
          tono="peligro"
          icono="wrong_location"
          [detalle]="[
            { rotulo: 'Tu mesa asignada', valor: 'Mesa ' + err.mesaCorrectaNumero }
          ]"
          (confirmar)="modalErrorMesa.set(null)"
        />
      }

      <lm-barra-inferior [items]="secciones()" activo="lugar" />
    </div>
  `,

  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      /* La ficha se estira con lo que sobre: la pantalla queda llena y sin
         desplazamiento en cualquier alto de teléfono. Sus tres partes se
         reparten el alto: estado arriba, lo importante al medio, el pie abajo. */
      .ficha {
        flex: 1 1 auto; min-height: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: space-between;
        gap: var(--space-3); padding: var(--space-5) var(--space-4); text-align: center;
        border-radius: var(--radius-card); background: var(--surface-card);
        box-shadow: var(--shadow-raised);
        position: relative; overflow: hidden;
      }
      .ficha::before {
        content: ""; position: absolute; top: calc(-1 * var(--space-6)); right: calc(-1 * var(--space-6));
        width: clamp(80px, 26vw, 112px); height: clamp(80px, 26vw, 112px);
        background: url("/assets/img/flor-2.png") center / contain no-repeat; opacity: .28;
      }

      .estado {
        display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 999px;
        background: rgba(255, 79, 139, .16); color: var(--text-title);
        font: var(--type-label); letter-spacing: var(--tracking-label); text-transform: uppercase;
      }
      .estado__punto {
        width: 9px; height: 9px; border-radius: 50%; background: var(--action-primary);
        animation: latido 1.6s ease-in-out infinite;
      }
      @keyframes latido { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.6); opacity: .45; } }

      .lugar { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
      /* El anillo gira despacio para decir "esperando"; el número queda quieto. */
      .anillo {
        --lado: clamp(170px, min(36dvh, 72vw), 290px);
        width: var(--lado); height: var(--lado); border-radius: 50%; position: relative;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      }
      .anillo::after {
        content: ""; position: absolute; inset: 0; border-radius: 50%;
        border: 9px solid rgba(255, 79, 139, .18); border-top-color: var(--action-primary);
        animation: giro 2.4s linear infinite;
      }
      @keyframes giro { to { transform: rotate(360deg); } }
      /* Las flores viajan por el aro: cada una arranca a un tercio de vuelta de
         la otra y además gira sobre sí misma. */
      /* Por encima del aro: el ::after se pinta después y las tapaba. */
      .anillo__orbita { position: absolute; inset: 0; z-index: 1; animation: giro 7s linear infinite; }
      .anillo--quieto .anillo__orbita { animation: none; }
      .anillo__flor {
        --flor: clamp(28px, 5.4dvh, 42px);
        position: absolute; top: 50%; left: 50%; width: var(--flor); height: var(--flor);
        margin: calc(var(--flor) / -2) 0 0 calc(var(--flor) / -2);
        filter: drop-shadow(0 2px 4px rgba(59, 8, 27, .25));
      }
      .anillo__flor:nth-child(1) { transform: rotate(0deg) translateY(calc(var(--lado) / -2 + 4px)) rotate(0deg); }
      .anillo__flor:nth-child(2) { transform: rotate(120deg) translateY(calc(var(--lado) / -2 + 4px)) rotate(-120deg) scale(.8); }
      .anillo__flor:nth-child(3) { transform: rotate(240deg) translateY(calc(var(--lado) / -2 + 4px)) rotate(-240deg) scale(.65); }
      .anillo__rotulo {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-muted);
      }
      .anillo__numero {
        font-family: var(--font-numeric); font-weight: 900; line-height: 1;
        font-size: clamp(72px, min(15dvh, 30vw), 124px); color: var(--action-primary);
      }
      .lugar__mensaje { margin: 0; font: 800 clamp(19px, 5.4vw, 24px)/1.25 var(--font-text); color: var(--text-title); text-wrap: balance; }
      .anillo__rotulo { font-size: clamp(13px, 3.8vw, 16px); }
      .estado { padding: 8px 16px; font-size: clamp(12.5px, 3.6vw, 14px); }
      .estado__punto { width: 11px; height: 11px; }

      .pie {
        display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px;
        border-radius: 16px; background: rgba(255, 79, 139, .12); color: var(--text-title);
        font: var(--type-body-small); font-size: clamp(15px, 4.2vw, 16.5px); text-align: left;
      }
      .pie lm-icono { color: var(--action-primary); flex-shrink: 0; }

      /* Ticket: la parte de arriba se estira; el corte punteado separa el pie. */
      .ficha--ticket { padding: 0; gap: 0; }
      /* "boleto" y no "ticket": .ticket ya tiene estilos globales (los de cocina y barra). */
      .boleto {
        flex: 1 1 auto; width: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: space-between;
        gap: var(--space-3); padding: var(--space-5) var(--space-4) var(--space-4);
      }
      .mesa { display: flex; flex-direction: column; align-items: center; }
      .boleto__titulo { margin: 0; font: var(--type-title-xl); color: #FFFFFF; text-wrap: balance; }
      .mesa__rotulo {
        font: 800 clamp(16px, 4.6vw, 20px)/1 var(--font-text); letter-spacing: .2em;
        text-transform: uppercase; color: var(--text-muted);
      }
      .mesa__numero {
        font-family: var(--font-numeric); font-weight: 900; line-height: 1;
        font-size: clamp(100px, min(25dvh, 42vw), 190px); color: var(--action-primary);
      }
      .datos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
      .dato {
        display: flex; align-items: center; justify-content: center; gap: 7px; padding: 11px 8px;
        border-radius: 14px; background: rgba(255, 79, 139, .12); color: var(--text-title);
        font: 800 clamp(14px, 4vw, 16px)/1.2 var(--font-text);
      }
      .dato lm-icono { color: var(--action-primary); }
      .corte {
        width: 100%; display: flex; align-items: center; gap: 12px;
        padding: var(--space-4); border-top: 2px dashed rgba(255, 79, 139, .45);
        color: var(--text-title); font: var(--type-body-small); font-size: clamp(15px, 4.2vw, 16.5px); text-align: center; justify-content: center;
      }

      /* Las tres fichas van en el vidrio del resto de la app (como el recuadro de
         foto y DNI) y no en blanco liso, que encandila; por eso lo de adentro va en blanco. */
      .ficha {
        background: linear-gradient(160deg, rgba(255, 255, 255, .2) 0%, rgba(255, 255, 255, .08) 100%);
        color: #FFFFFF; border: 1px solid rgba(255, 255, 255, .35);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .25), 0 6px 18px rgba(59, 8, 27, .18);
      }
      .estado { background: rgba(255, 255, 255, .22); color: #FFFFFF; }
      .estado__punto { background: #FFFFFF; }
      .anillo::after { border-color: rgba(255, 255, 255, .3); animation: none; }
      .anillo__rotulo, .mesa__rotulo { color: rgba(255, 255, 255, .88); }
      .anillo__numero, .mesa__numero {
        color: #FFFFFF; text-shadow: 0 4px 16px rgba(110, 18, 52, .28);
      }
      .lugar__mensaje { color: #FFFFFF; }
      .pie, .dato { background: rgba(255, 255, 255, .2); color: #FFFFFF; }
      .pie lm-icono, .dato lm-icono { color: #FFFFFF; }
      .corte { color: #FFFFFF; border-top-color: rgba(255, 255, 255, .6); }

      @media (prefers-reduced-motion: reduce) {
        .estado__punto, .anillo::after, .anillo__orbita { animation: none; }
      }
    `,
  ],
})
export class ClienteEsperaPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly mesas = inject(MesasService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);

  protected readonly modalErrorMesa = signal<{ mensaje: string; mesaCorrectaNumero: number } | null>(null);

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
    if (this.estado() === 'ASIGNADO') return 'Mesa asignada';
    return 'Esperando tu mesa';
  }


  protected mensajeFila(): string {
    const delante = this.delante();
    if (delante === 0) return '¡Sos el próximo!';
    if (delante === 1) return 'Hay 1 persona delante tuyo';
    return `Hay ${delante} personas delante tuyo`;
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

    // TASK-5.3.2.1 · Validación estricta con respuesta háptica de error
    const valida = await this.mesas.validarMesaEscaneada(contenido.mesaId, entrada.mesaAsignadaId);
    if (!valida) {
      const otra = this.mesas.porId(contenido.mesaId);
      const mensaje = otra
        ? `Escaneaste el código QR de la Mesa ${otra.numero}. Tu mesa asignada por el Metre es la Mesa ${numero}.`
        : `El código QR escaneado no corresponde a tu mesa. Tu mesa asignada es la Mesa ${numero}.`;

      this.modalErrorMesa.set({
        mensaje,
        mesaCorrectaNumero: numero,
      });
      return;
    }

    // TASK-5.3.2.2 · Vinculación y conmutación de disponibilidad a OCUPADA
    try {
      await this.cargando.conEsperaMinima('Vinculándote con tu mesa…', async () => {
        await this.mesas.cambiarEstado(entrada.mesaAsignadaId!, 'OCUPADA');
        await this.sesion.establecerMesaActiva(entrada.mesaAsignadaId!, numero);
        await this.espera.vincularConLaMesa(entrada.id);
      });

      this.avisos.exito(`Estás en la mesa ${numero}`, 'Ya podés explorar la carta.');

      await this.router.navigate(['/carta'], {
        queryParams: {
          mesaId: entrada.mesaAsignadaId,
        },
        replaceUrl: true,
      });
    } catch (err: any) {
      console.error('⚠️ Error al vincularse con la mesa:', err);
      this.avisos.error('No se pudo vincular la mesa', err?.message || 'Ocurrió un error al registrar tu mesa.');
    }
  }

  protected irCarta(): void {
    const mesaId = this.entrada()?.mesaAsignadaId;

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

  /** Abre la sala de chat en vivo con el mozo asignado a la mesa (US-6.2). */
  protected abrirChatMozo(): void {
    const entrada = this.entrada();
    if (entrada?.mesaAsignadaId) {
      this.ir(['/cliente/consulta']);
    }
  }
}

