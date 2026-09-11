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
              <button type="button" class="sala" (click)="ir(['/mozo/consultas', sala.mesaId])">
                <span class="sala__mesa">
                  <small>Mesa</small>
                  {{ sala.mesaNumero }}
                </span>
                <span class="sala__datos">
                  <b>{{ comensal(sala) }}</b>
                  <small>
                    <b [style.color]="sala.ultimoRol === 'MOZO' ? 'var(--action-primary)' : 'var(--text-title)'">
                      {{ sala.ultimoRemitente }}:
                    </b>
                    {{ sala.ultimoMensaje }}
                  </small>
                </span>
                @if (sala.ultimoRol === 'CLIENTE') {
                  <span class="sala__globo">1</span>
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
        display: flex; align-items: center; gap: 12px; width: 100%;
        padding: 10px 12px; text-align: left; cursor: pointer;
        border: none; border-radius: var(--radius-card);
        background: var(--surface-card); box-shadow: var(--shadow-card);
      }
      .sala__mesa {
        flex: 0 0 auto; width: 46px; height: 46px; border-radius: 14px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: var(--surface-sunken); color: var(--action-primary);
        font: 900 19px/1 var(--font-numeric);
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
        flex: 0 0 auto; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px;
        display: grid; place-items: center;
        background: var(--state-error); color: #FFFFFF; font: 800 12px/1 var(--font-numeric);
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

  protected comensal(sala: ConversacionMesa): string {
    if (sala.ultimoRol === 'CLIENTE' && sala.ultimoRemitente) {
      return sala.ultimoRemitente;
    }
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
    return `Mesa ${sala.mesaNumero}`;
  }
}
