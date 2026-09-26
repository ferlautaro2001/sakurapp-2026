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

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="conversaciones().length" bajada="Las contesta cualquiera de los mozos del salón">
          Consultas
        </lm-titulo>

        @if (conversaciones().length) {
          <div class="lm-list">
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
      .sala {
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
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .sala__hora {
        flex: 0 0 auto; font: var(--type-caption); color: var(--text-muted);
      }
      .sala__globo {
        flex: 0 0 auto; width: 12px; height: 12px; border-radius: 50%;
        background: var(--state-error);
      }
      /* Resuelta: sigue a la vista para releerla, pero sin pelear por la
         atención con las que todavía esperan respuesta. */
      .sala--cerrada { opacity: .72; }
      .sala--cerrada .sala__datos b { color: var(--text-muted); }
      .sala > lm-icono { flex: 0 0 auto; }
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
