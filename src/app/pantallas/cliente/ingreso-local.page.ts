import { Component, computed, effect, inject } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';

/**
 * US-5.1 · TASK-5.1.1.1 · primera pantalla del comensal, registrado o invitado.
 *
 * Apenas entra, lo único que puede hacer es escanear el código pegado en la
 * puerta del salón para anotarse en la lista de espera: no hay carta, ni
 * pedidos, ni mesa hasta que el metre se la asigne. Por eso la pantalla es una
 * sola cosa, grande y sin distracciones.
 *
 * El código de una mesa acá no vincula nada: quien lo escanea sin que el metre
 * le haya asignado esa mesa recibe la explicación y sigue en la fila.
 */
@Component({
  selector: 'lm-cliente-ingreso-local',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap14">
        <lm-titulo bajada="Tocá el botón de abajo de todo para sumarte a la fila">
          Hola, {{ usuario()?.nombre }}
        </lm-titulo>

        <div class="marco">
          <span class="marco__esquina si"></span>
          <span class="marco__esquina sd"></span>
          <span class="marco__esquina ii"></span>
          <span class="marco__esquina id"></span>
          <span class="marco__linea"></span>
          <lm-icono nombre="qr_code_scanner" [tamano]="76" color="#FFFFFF" />
          <span class="marco__rotulo">Código de ingreso al local</span>
        </div>

        <div class="lm-vidrio pasos">
          <b>Qué pasa cuando lo escaneás</b>
          <span class="paso">
            <i>1</i>
            Quedás anotado en la lista de espera del salón, con tu hora de llegada.
          </span>
          <span class="paso">
            <i>2</i>
            El metre recibe el aviso en el momento y te busca cuando se libera una mesa.
          </span>
          <span class="paso">
            <i>3</i>
            Mientras esperás podés mirar los resultados de las encuestas anteriores.
          </span>
        </div>

        <lm-separador flor rotulo="Tu cuenta" />

        <div class="lm-card cuenta">
          <lm-icono [nombre]="registrado() ? 'verified' : 'person'" [tamano]="26" color="var(--action-primary)" />
          <b>{{ detalleCuenta() }}</b>
        </div>
      </div>

      <div class="lm-actionbar">
        <lm-boton icono="qr_code_scanner" (presionar)="escanear()">Escanear el código de ingreso</lm-boton>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .marco {
        position: relative;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
        min-height: 230px; padding: 26px;
        border-radius: var(--radius-card);
        background: rgba(110, 18, 52, .3);
        border: 1px solid rgba(255, 255, 255, .28);
        overflow: hidden;
      }
      .marco__esquina { position: absolute; width: 32px; height: 32px; border: 4px solid #FFFFFF; }
      .marco__esquina.si { top: 14px; left: 14px; border-right: none; border-bottom: none; border-top-left-radius: 14px; }
      .marco__esquina.sd { top: 14px; right: 14px; border-left: none; border-bottom: none; border-top-right-radius: 14px; }
      .marco__esquina.ii { bottom: 14px; left: 14px; border-right: none; border-top: none; border-bottom-left-radius: 14px; }
      .marco__esquina.id { bottom: 14px; right: 14px; border-left: none; border-top: none; border-bottom-right-radius: 14px; }
      .marco__linea {
        position: absolute; left: 26px; right: 26px; top: 50%; height: 2px;
        background: #FFFFFF; box-shadow: 0 0 16px #FFFFFF; opacity: .8;
        animation: lm-scan 2.6s var(--ease-standard) infinite;
      }
      .marco__rotulo {
        font: var(--type-label); letter-spacing: var(--tracking-label); text-transform: uppercase;
        color: var(--text-sobre-fondo); text-align: center;
      }
      .pasos { display: flex; flex-direction: column; gap: 10px; }
      .paso { display: flex; gap: 10px; align-items: flex-start; font: var(--type-body-small); color: var(--text-sobre-fondo-suave); text-wrap: pretty; }
      .paso i {
        flex: 0 0 auto; width: 22px; height: 22px; border-radius: 50%;
        display: grid; place-items: center; font: 800 12px/1 var(--font-numeric); font-style: normal;
        background: rgba(255, 255, 255, .9); color: var(--action-primary);
      }
      .cuenta { display: flex; align-items: center; gap: 12px; padding: 14px; }
      .cuenta b { font: var(--type-card-title); color: var(--text-title); text-wrap: pretty; }
    `,
  ],
})
export class ClienteIngresoLocalPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);
  private readonly usuarios = inject(UsuariosService);
  private readonly notificaciones = inject(NotificacionesService);

  protected readonly registrado = computed(() => this.usuario()?.perfil === 'CLIENTE_REGISTRADO');

  /** Cualquier estado vivo —en la fila, con mesa o ya sentado— saca de acá. */
  protected readonly enLista = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.espera.activaDe(id) !== undefined : false;
  });

  constructor() {
    super();
    void this.espera.iniciar();

    // Si ya está anotado, esta pantalla no tiene nada más que ofrecerle: pasa
    // a ver su lugar en la fila.
    effect(() => {
      if (this.enLista()) void this.router.navigate(['/cliente/espera'], { replaceUrl: true });
    });
  }

  protected detalleCuenta(): string {
    return this.registrado()
      ? 'Sos un cliente registrado, tu cuenta ya fue aprobada por el salón'
      : 'Sos un cliente anónimo, tu cuenta no requiere aprobación';
  }

  /** Lectura del código de ingreso al local, que anota al comensal en la lista de espera. */
  protected async escanear(): Promise<void> {
    if (!this.escaner.disponible()) {
      this.avisos.info(
        'El lector funciona en el teléfono',
        'Instalá la aplicación en Android para escanear el código de ingreso.',
      );
      return;
    }

    const leido = await this.escaner.leer('QR');
    if (!leido) return;

    const contenido = this.qr.interpretar(leido);

    if (contenido.tipo === 'INGRESO') {
      await this.anotarse();
      return;
    }

    // Candado del punto 10: sin asignación del metre, el código de una mesa no
    // vincula al comensal con ella.
    if (contenido.tipo === 'MESA') {
      this.avisos.info(
        'Todavía no tenés una mesa asignada',
        'Anotate primero con el código de la puerta. Cuando el metre te asigne una mesa, esta pantalla te va a pedir que escanees su código.',
      );
      return;
    }

    this.avisos.error('Ese código no es de SakurApp', 'Buscá el código pegado en la puerta del salón.');
  }

  private async anotarse(): Promise<void> {
    const cliente = this.usuario();
    if (!cliente) return;

    await this.cargando.conEsperaMinima('Anotándote en la lista de espera…', () => this.espera.anotar(cliente));

    const metres = this.usuarios.todos().filter((u) => u.perfil === 'METRE');
    await this.notificaciones.enviar(
      metres.map((u) => u.id),
      'Un nuevo comensal está esperando',
      `${this.usuarios.nombreCompleto(cliente)} se anotó en la lista de espera.`,
      ['/metre/espera'],
    );

    this.avisos.exito('Estás en la fila', 'El metre ya recibió tu llegada.');
    await this.router.navigate(['/cliente/espera'], { replaceUrl: true });
  }
}
