import { Component, DestroyRef, computed, inject } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { ChatService, ConversacionMesa } from '../../nucleo/servicios/chat.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { DatePipe } from '@angular/common';

/**
 * Bandeja de consultas directas de las mesas para los mozos en servicio.
 */
@Component({
  selector: 'lm-mozo-consultas',
  imports: [DatePipe, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="conversaciones().length">
          Consultas
        </lm-titulo>

        @if (conversaciones().length) {
          <div class="lm-lista-n">
            @for (sala of conversaciones(); track sala.mesaId) {
              <button
                type="button"
                class="sala"
                [class.sala--cerrada]="sala.cerrada"
                (click)="ir(['/mozo/consultas', sala.mesaId])"
              >
                <span class="sala__mesa">
                  <small>Mesa</small>
                  {{ sala.mesaNumero }}
                </span>
                <span class="sala__datos">
                  <b>{{ comensal(sala) }}</b>
                  <small>
                    @if (autor(sala); as quien) {
                      <b [style.color]="sala.ultimoRol === 'MOZO' ? 'var(--action-primary)' : 'var(--text-title)'">
                        {{ quien }}:
                      </b>
                    }
                    {{ sala.ultimoMensaje }}
                  </small>
                </span>
                @if (sala.cerrada) {
                  <lm-icono nombre="task_alt" [tamano]="20" color="var(--state-success)" />
                } @else if (sala.pendienteMozo) {
                  <!-- Un punto y no un número: lo que la bandeja sabe es que
                       hay algo sin abrir, no cuántos mensajes son. El "1" fijo
                       que había antes mentía y además no se apagaba nunca. -->
                  <span class="sala__globo" aria-label="Sin leer"></span>
                } @else {
                  <span class="sala__hora">{{ sala.actualizadoEn | date: 'HH:mm' }}</span>
                }
              </button>
            }
          </div>
        } @else {
          <lm-vacio icono="forum" titulo="No hay consultas abiertas">
            Cuando alguien pregunte algo desde su mesa, la conversación aparece acá y la puede contestar cualquier mozo.
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="consultas" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      /* Más filas por tanda: cada consulta mide poco, así que entran 2, 4 o 6
         enteras según cuántas haya. La fila se queda en horizontal: la regla
         global de las listas la apilaría en columna. */
      .lm-lista-n { --por: 2; }
      .lm-lista-n:has(> :nth-child(3)) { --por: 4; }
      .lm-lista-n:has(> :nth-child(5)) { --por: 4; }
      @media (max-height: 760px) {
        .lm-lista-n:has(> :nth-child(3)) { --por: 3; }
        .lm-lista-n:has(> :nth-child(5)) { --por: 3; }
      }
      .sala {
        flex-direction: row; justify-content: flex-start;
        display: flex; align-items: center; gap: var(--space-3); width: 100%;
        padding: 10px var(--space-3); text-align: left; cursor: pointer;
        border: none; border-radius: var(--radius-card);
        background: var(--surface-card); box-shadow: var(--shadow-card);
      }
      /* El sello de la mesa no se encoge nunca por debajo del área táctil: es
         la referencia con la que el mozo ubica la fila de un vistazo. */
      .sala__mesa {
        flex: 0 0 auto; width: var(--touch-min); min-height: var(--touch-min); border-radius: 14px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: var(--surface-sunken); color: var(--action-primary);
        font: 900 clamp(14px, 4.4vw, 19px)/1 var(--font-numeric);
      }
      .sala__mesa small {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-muted);
      }
      .sala__datos { flex: 1 1 auto; min-width: 0; }
      .sala__datos b { display: block; font: var(--type-card-title); color: var(--text-title); }
      .sala__datos small {
        display: block; font: var(--type-caption); color: var(--text-muted);
        overflow: hidden; text-overflow: ellipsis;
        display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2;
        white-space: normal; overflow-wrap: anywhere;
      }
      .sala__datos > b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .sala__datos small b { display: block; font: 800 clamp(14.5px, 4.1vw, 17px)/1.25 var(--font-text); color: var(--action-primary) !important; }
      .sala__hora {
        flex: 0 0 auto; font: var(--type-caption); color: var(--text-muted);
      }
      .sala__globo {
        flex: 0 0 auto; width: 12px; height: 12px; border-radius: 50%;
        background: var(--state-error);
      }
      /* Resuelta: sigue a la vista para releerla, pero sin pelear por la
         atención con las que todavía esperan respuesta. */
      .sala--cerrada { opacity: 1; }
      .sala > lm-icono { flex: 0 0 auto; }

      /* ---------- calco del diseño de referencia ---------- */
      /* Perla rosada con flor grande y pétalos de fondo; sin el degradado
         fuerte del resto de las tarjetas. */
      .sala {
        position: relative; overflow: hidden; isolation: isolate;
        gap: var(--space-4); padding: var(--space-3) var(--space-4);
        border-radius: 24px;
        background-color: #FFF1F5 !important;
        background-image:
          radial-gradient(ellipse at 18% 0%, rgba(255, 255, 255, .9), transparent 60%),
          linear-gradient(135deg, #FFF6F8 0%, #FFE6EE 60%, #FFD9E5 100%) !important;
        box-shadow: 0 8px 18px rgba(88, 12, 43, .2);
      }
      .sala::before {
        content: ''; position: absolute; right: -14px; bottom: -22px; z-index: -1; pointer-events: none;
        width: clamp(96px, 28vw, 130px); height: clamp(96px, 28vw, 130px);
        background: url('/assets/img/flor-2.png') no-repeat center / contain;
        opacity: .2; transform: rotate(-12deg);
      }
      .sala::after {
        content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
        background:
          radial-gradient(ellipse 7px 4px at 62% 72%, rgba(255, 150, 185, .5), transparent 70%),
          radial-gradient(ellipse 6px 3.5px at 88% 22%, rgba(255, 150, 185, .45), transparent 70%),
          radial-gradient(ellipse 5px 3px at 40% 14%, rgba(255, 150, 185, .35), transparent 70%);
      }
      .sala__mesa {
        width: clamp(58px, 16.5vw, 72px); min-height: clamp(58px, 16.5vw, 72px);
        border-radius: 18px;
        background: linear-gradient(160deg, #FFFFFF 0%, #FFE9F0 100%);
        box-shadow: 0 4px 10px rgba(168, 30, 72, .18), inset 0 1px 0 #FFFFFF;
        border: 1px solid rgba(255, 190, 210, .8);
        font: 900 clamp(22px, 6.6vw, 30px)/1 var(--font-numeric);
      }
      .sala__mesa small { font-size: clamp(10px, 2.9vw, 12px); color: var(--text-muted); }
      .sala__datos { display: flex; flex-direction: column; justify-content: center; gap: 1px; }
      .sala__datos > b { font: 900 clamp(17px, 5vw, 21px)/1.15 var(--font-display); color: var(--text-title); }
      .sala__datos small { font: 500 clamp(14px, 3.9vw, 16px)/1.3 var(--font-text); color: var(--text-muted); }
      .sala__hora { font: 500 clamp(13px, 3.7vw, 16px)/1 var(--font-text); color: var(--text-muted); }
      .sala > lm-icono {
        width: clamp(36px, 10.5vw, 44px); height: clamp(36px, 10.5vw, 44px); justify-content: center;
        border-radius: 50%; background: #D8F4E4; box-shadow: 0 3px 8px rgba(10, 120, 62, .22);
      }
    `,
  ],
})
export class MozoConsultasPage extends PaginaConSesion {
  private readonly chat = inject(ChatService);
  private readonly mesas = inject(MesasService);
  private readonly pedidos = inject(PedidosService);
  private readonly espera = inject(EsperaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly conversaciones = this.chat.conversacionesActivas;

  constructor() {
    super();
    this.pedidos.iniciar();
    this.espera.iniciar();
    const unsub = this.chat.iniciarEscuchaConversaciones();
    this.destroyRef.onDestroy(() => {
      if (unsub) unsub();
    });
  }

  /**
   * Quién está sentado en la mesa.
   *
   * Antes esto devolvía el remitente del último mensaje cuando era del
   * comensal, que es exactamente lo mismo que muestra el renglón de abajo: la
   * fila quedaba con el nombre repetido dos veces. El titular de la fila es la
   * mesa y su comensal —dato del salón—, y el remitente es cosa del renglón
   * del mensaje.
   */
  protected comensal(sala: ConversacionMesa): string {
    const pedido = this.pedidos
      .todos()
      .find(
        (p) =>
          (p.mesaId === sala.mesaId || String(p.mesaNumero) === String(sala.mesaNumero)) &&
          p.estadoGlobal !== 'CERRADO',
      );
    if (pedido?.clienteNombre) return pedido.clienteNombre;
    const entrada = this.espera
      .lista()
      .find((e) => e.mesaAsignadaId === sala.mesaId && (e.estado === 'FINALIZADO' || e.estado === 'ASIGNADO'));
    if (entrada?.clienteNombre) return entrada.clienteNombre;
    if (sala.ultimoRol === 'CLIENTE' && sala.ultimoRemitente) return sala.ultimoRemitente;
    return `Mesa ${sala.mesaNumero}`;
  }

  /**
   * Quién escribió lo último. Se omite si es el mismo nombre que encabeza la
   * fila —el caso del comensal sin pedido ni espera cargados—, porque leer
   * "Ana / Ana: hola" no agrega nada.
   */
  protected autor(sala: ConversacionMesa): string {
    if (!sala.ultimoRemitente) return '';
    return sala.ultimoRemitente === this.comensal(sala) ? '' : sala.ultimoRemitente;
  }
}
