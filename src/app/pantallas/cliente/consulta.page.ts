import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MensajeChat, Mesa } from '../../nucleo/modelos/modelos';
import { ChatService } from '../../nucleo/servicios/chat.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { Unsubscribe } from 'firebase/firestore';

const SUGERENCIAS = [
  '¿Podrías acercarte a la mesa?',
  '¿Nos traés hielo y agua?',
  'Pedir la cuenta por favor',
  '¿Cuánto demora el pedido?',
];

/**
 * Consulta rápida al mozo del salón desde la mesa.
 */
@Component({
  selector: 'lm-cliente-consulta',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen lm-screen--florida">
      <lm-encabezado titulo="Consulta al mozo" conVolver (volver)="volverAlMenu()" />

      <div class="lm-body lm-body--gap12 sala">
        <lm-titulo [bajada]="bajada()">Mesa {{ numeroMesa() }}</lm-titulo>

        <div class="sala__hilo">
          @if (mensajes().length) {
            @for (mensaje of mensajes(); track mensaje.id) {
              <lm-burbuja
                [autor]="mensaje.remitenteNombre"
                [texto]="mensaje.texto"
                [hora]="mensaje.timestamp"
                [propia]="mensaje.remitenteRol === 'CLIENTE'"
              />
            }
          } @else {
            <div class="sala__vacia">
              <lm-icono nombre="forum" [tamano]="34" color="var(--action-accent)" />
              <b>Preguntá lo que necesites</b>
              <span>Tu consulta le llega a todos los mozos del salón y te contesta el primero que se libere.</span>
            </div>
          }
        </div>

        @if (!mensajes().length) {
          <div class="sugerencias">
            <span class="sugerencias__titulo">Consultas rápidas:</span>
            <div class="sugerencias__lista">
              @for (sug of sugerencias; track sug) {
                <button type="button" class="sug-btn" (click)="usarSugerencia(sug)">
                  {{ sug }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <div class="lm-actionbar">
        <lm-campo
          [control]="formulario.controls.texto"
          icono="chat"
          marcador="Escribí tu consulta"
          tecla="send"
          [largoMaximo]="240"
          accesorio
        >
          <lm-icono-boton
            accesorio
            icono="send"
            rotulo="Enviar la consulta"
            tono="primario"
            (presionar)="enviar()"
          />
        </lm-campo>
        <lm-texto-boton (presionar)="volverAlMenu()">Volver al menú</lm-texto-boton>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .sala { overflow: hidden; }
      .sala__hilo {
        flex: 1 1 auto; min-height: 0; overflow-y: auto;
        display: flex; flex-direction: column; gap: 8px; padding-right: 2px;
      }
      .sala__vacia {
        flex: 1 1 auto; display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 6px; text-align: center; padding: 20px 10px;
      }
      .sala__vacia b { font: var(--type-card-title); color: var(--text-sobre-fondo); }
      .sala__vacia span { font: var(--type-body-small); color: var(--text-sobre-fondo-suave); text-wrap: pretty; }

      .sugerencias {
        flex: 0 0 auto; display: flex; flex-direction: column; gap: 6px;
        padding: 10px; border-radius: var(--radius-card);
        background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(8px);
      }
      .sugerencias__titulo { font: var(--type-caption); color: var(--text-muted); font-weight: 600; }
      .sugerencias__lista { display: flex; flex-wrap: wrap; gap: 6px; }
      .sug-btn {
        border: 1px solid var(--border-card); background: var(--surface-card);
        color: var(--text-title); font: var(--type-body-small);
        padding: 6px 12px; border-radius: var(--radius-pill); cursor: pointer;
        text-align: left; transition: background 0.15s ease;
      }
      .sug-btn:active { background: var(--surface-sunken); }
    `,
  ],
})
export class ClienteConsultaPage extends PaginaConSesion {
  private readonly fb = inject(FormBuilder);
  private readonly chat = inject(ChatService);
  private readonly espera = inject(EsperaService);
  private readonly mesas = inject(MesasService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sugerencias = SUGERENCIAS;
  protected readonly formulario = this.fb.nonNullable.group({ texto: [''] });
  protected readonly mensajes = signal<MensajeChat[]>([]);

  private escuchaChat: Unsubscribe | null = null;

  protected readonly mesaId = computed(() => {
    const id = this.usuario()?.id;
    if (this.sesion.mesaActivaId()) return this.sesion.mesaActivaId();
    const entrada = id ? this.espera.activaDe(id) : undefined;
    return entrada?.estado === 'FINALIZADO' ? entrada.mesaAsignadaId : null;
  });

  protected readonly mesa = computed<Mesa | undefined>(() => {
    const id = this.mesaId();
    if (!id) return undefined;
    return this.mesas.porId(id) ?? {
      id,
      numero: this.sesion.mesaActivaNumero() ?? 1,
      cantidadComensales: 4,
      tipo: 'ESTANDAR',
      estado: 'OCUPADA',
      fotoUrl: '',
      qrCodeUrl: '',
    };
  });

  constructor() {
    super();

    effect(() => {
      const mid = this.mesaId();
      const uid = this.usuario()?.id;
      if (this.escuchaChat) {
        this.escuchaChat();
        this.escuchaChat = null;
      }
      if (mid && uid) {
        this.escuchaChat = this.chat.escucharMensajes(mid, uid, (msjs) => {
          this.mensajes.set(msjs);
          if (msjs.some((m) => m.remitenteRol === 'MOZO' && !m.leido)) {
            void this.chat.marcarLeidos(mid, 'MOZO');
          }
        });
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.escuchaChat) {
        this.escuchaChat();
        this.escuchaChat = null;
      }
    });
  }

  protected bajada(): string {
    return 'Conversación directa con el personal de mozos';
  }

  protected numeroMesa(): number | string {
    return this.mesa()?.numero ?? this.sesion.mesaActivaNumero() ?? '—';
  }

  protected usarSugerencia(texto: string): void {
    this.formulario.controls.texto.setValue(texto);
    void this.enviar();
  }

  protected async enviar(): Promise<void> {
    const texto = this.formulario.controls.texto.value.trim();
    const usuario = this.usuario();
    const mesa = this.mesa();
    if (!texto || !usuario || !mesa) return;

    this.formulario.controls.texto.setValue('');
    try {
      await this.chat.enviarMensaje(mesa, usuario, texto);
      this.avisos.exito('Enviado', 'Tu consulta fue entregada al mozo.');
    } catch {
      this.avisos.error('Error', 'No se pudo enviar el mensaje. Probá de nuevo.');
      this.formulario.controls.texto.setValue(texto);
    }
  }

  protected volverAlMenu(): void {
    this.ir(['/carta']);
  }
}
