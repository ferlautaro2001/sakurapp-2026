import { Component, computed, effect, inject, signal } from '@angular/core';
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
        @if (!esperando()) {
          <lm-titulo>{{ titulo() }}</lm-titulo>
        }

        @if (esperando()) {
          <!-- El lugar real del comensal en la fila. -->
          <div class="turno">
            <span class="turno__rotulo">Tu lugar en la fila es:</span>
            <span class="turno__numero">{{ posicion() }}</span>
            @if (posicion() === 1) {
              <span class="turno__mensaje">¡Sos el próximo!</span>
            }
            <span class="turno__mensaje">En unos instantes el metre te asignará una mesa</span>
          </div>
        } @else if (numeroMesa(); as numero) {
          <div class="turno">
            @if (vinculado()) {
              <span class="turno__rotulo">Estás en la mesa</span>
            }
            <span class="turno__numero">{{ numero }}</span>
            @if (mesa(); as m) {
              <!-- Dos fichas iguales debajo del número: capacidad y tipo, ícono + dato. -->
              <span class="turno__fichas">
                <span class="ficha ficha--fila" [attr.aria-label]="m.cantidadComensales + ' lugares'">
                  <lm-icono nombre="group" [tamano]="30" />
                  <b>{{ m.cantidadComensales }}</b>
                </span>
                <span class="ficha">
                  <lm-icono [nombre]="iconoTipo(m.tipo)" [tamano]="30" />
                  <b>{{ rotuloTipo(m.tipo) }}</b>
                </span>
              </span>
            }
          </div>

          @if (vinculado()) {
            <div class="lm-vidrio pasos">
              <span class="paso">
                <lm-icono nombre="insights" [tamano]="19" color="#FFFFFF" />
                Mientras esperás la atención, podés mirar los resultados de las encuestas anteriores.
              </span>
            </div>
          }
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
      } @else if (vinculado() && entrada()?.mesaAsignadaId) {
        <div class="lm-actionbar lm-actionbar--split">
          <lm-boton icono="restaurant_menu" (presionar)="irCarta()">Explorar la carta</lm-boton>
          <lm-boton icono="chat" (presionar)="abrirChatMozo()">Consulta al mozo</lm-boton>
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
      /* La ficha se estira con lo que sobre: es lo que hace que la pantalla
         quede llena y sin desplazamiento, en cualquier alto de teléfono. */
      .turno {
        flex: 1 1 auto;
        min-height: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
        padding: var(--space-4) var(--space-5); text-align: center;
        border-radius: var(--radius-card); background: var(--surface-card);
        box-shadow: var(--shadow-raised);
        position: relative; overflow: hidden;
      }
      .turno::before {
        content: ""; position: absolute; top: calc(-1 * var(--space-6)); right: calc(-1 * var(--space-6));
        width: clamp(80px, 26vw, 112px); height: clamp(80px, 26vw, 112px);
        background: url("/assets/img/flor-2.png") center / contain no-repeat; opacity: .28;
      }
      .turno__rotulo {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-muted);
      }
      .turno__numero {
        font-family: var(--font-numeric); font-weight: 900; line-height: 1;
        /* El número manda en la ficha, pero no puede ser más ancho que un
           cuarto de pantalla: en los equipos angostos y altos, el alto solo lo
           dejaba crecer hasta desbordar a lo ancho. */
        font-size: clamp(56px, min(17dvh, 26vw), 104px);
        color: var(--action-primary);
      }
      .turno__mensaje { font: var(--type-section); color: var(--text-title); text-wrap: balance; }
      .turno__pie {
        display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;
        font: var(--type-caption); color: var(--text-muted);
      }
      .pasos { display: flex; flex-direction: column; gap: 9px; padding: var(--space-4); }
      .paso { display: flex; gap: 9px; align-items: flex-start; font: var(--type-body-small); color: var(--text-sobre-fondo); text-wrap: pretty; }
      .turno__fichas { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 320px; }
      .ficha {
        display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px;
        border-radius: 18px; color: var(--action-primary);
        background: linear-gradient(180deg, rgba(255, 255, 255, .85) 0%, rgba(255, 215, 223, .8) 100%);
        border: 1.5px solid rgba(255, 79, 139, .45);
        box-shadow: inset 0 1px 0 #FFFFFF, 0 3px 8px rgba(94, 12, 44, .14);
      }
      .ficha b { font: 800 20px/1.1 var(--font-text); color: var(--text-title); }
      .ficha { justify-content: center; }
      .ficha--fila { flex-direction: row; gap: 8px; }
      .ficha--fila b { font-size: 26px; }
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
    if (delante === 1) return 'Hay una persona delante tuyo.';
    return `Hay ${delante} personas delante tuyo.`;
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

  protected async actualizar(): Promise<void> {
    await this.cargando.conEsperaMinima('Consultando la lista de espera…', async () => undefined, 500);
    this.avisos.info('Lista actualizada', this.mensajeFila());
  }

  /** Abre la sala de chat en vivo con el mozo asignado a la mesa (US-6.2). */
  protected abrirChatMozo(): void {
    const entrada = this.entrada();
    if (entrada?.mesaAsignadaId) {
      this.ir(['/cliente/consulta']);
    }
  }
}

