import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { ChatService } from '../../nucleo/servicios/chat.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { MensajeChat, Mesa } from '../../nucleo/modelos/modelos';
import { Unsubscribe } from 'firebase/firestore';

const SUGERENCIAS_MOZO = [
  '¡Enseguida me acerco a la mesa!',
  'El pedido ya está en marcha.',
  'Preparando la cuenta en un momento.',
  '¿Necesitan algo más?',
];

/**
 * Sala de chat en tiempo real del mozo con una mesa específica.
 */
@Component({
  selector: 'lm-mozo-sala',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen lm-screen--florida">
      <lm-encabezado [titulo]="'Mesa ' + numeroMesa()" conVolver (volver)="volver()" />

      <div class="lm-body lm-body--gap12 sala">
        <lm-titulo bajada="Atención directa de consultas del salón">Mesa {{ numeroMesa() }}</lm-titulo>

        <div class="sala__hilo">
          @if (mensajes().length) {
            @for (mensaje of mensajes(); track mensaje.id) {
              <lm-burbuja
                [autor]="mensaje.remitenteRol === 'MOZO' ? (mensaje.remitenteNombre + ' · vos') : mensaje.remitenteNombre"
                [texto]="mensaje.texto"
                [hora]="mensaje.timestamp"
                [propia]="mensaje.remitenteRol === 'MOZO'"
              />
            }
          } @else {
            <div class="sala__vacia">
              <lm-icono nombre="forum" [tamano]="34" color="var(--action-accent)" />
              <b>La mesa todavía no escribió</b>
              <span>Podés adelantarte y preguntarle si necesita algo.</span>
            </div>
          }
        </div>

        <div class="sugerencias">
          <span class="sugerencias__titulo">Respuestas rápidas:</span>
          <div class="sugerencias__lista">
            @for (sug of sugerencias; track sug) {
              <button type="button" class="sug-btn" (click)="usarSugerencia(sug)">
                {{ sug }}
              </button>
            }
          </div>
        </div>
      </div>

      <div class="lm-actionbar">
        <lm-campo
          [control]="formulario.controls.texto"
          icono="chat"
          marcador="Escribí tu respuesta"
          tecla="send"
          [largoMaximo]="240"
          accesorio
        >
          <lm-icono-boton
            accesorio
            icono="send"
            rotulo="Enviar la respuesta"
            tono="primario"
            (presionar)="enviar()"
          />
        </lm-campo>
        <lm-texto-boton (presionar)="volver()">Volver a las consultas</lm-texto-boton>
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
        padding: 8px 10px; border-radius: var(--radius-card);
        background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(8px);
      }
      .sugerencias__titulo { font: var(--type-caption); color: var(--text-muted); font-weight: 600; }
      .sugerencias__lista { display: flex; flex-wrap: wrap; gap: 6px; }
      .sug-btn {
        border: 1px solid var(--border-card); background: var(--surface-card);
        color: var(--text-title); font: var(--type-body-small);
        padding: 5px 10px; border-radius: var(--radius-pill); cursor: pointer;
        text-align: left; transition: background 0.15s ease;
      }
      .sug-btn:active { background: var(--surface-sunken); }
    `,
  ],
})
export class MozoSalaPage extends PaginaConSesion {
  private readonly fb = inject(FormBuilder);
  private readonly chat = inject(ChatService);
  private readonly mesas = inject(MesasService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly sugerencias = SUGERENCIAS_MOZO;
  protected readonly formulario = this.fb.nonNullable.group({ texto: [''] });
  protected readonly mensajes = signal<MensajeChat[]>([]);

  private escuchaChat: Unsubscribe | null = null;

  protected readonly mesa = computed<Mesa | undefined>(() => {
    return this.mesas.porId(this.id()) ?? {
      id: this.id(),
      numero: 1,
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
      const mid = this.id();
      const uid = this.usuario()?.id;
      if (this.escuchaChat) {
        this.escuchaChat();
        this.escuchaChat = null;
      }
      if (mid && uid) {
        this.escuchaChat = this.chat.escucharMensajes(mid, uid, (msjs) => {
          this.mensajes.set(msjs);
          if (msjs.some((m) => m.remitenteRol === 'CLIENTE' && !m.leido)) {
            void this.chat.marcarLeidos(mid, 'CLIENTE');
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

  protected numeroMesa(): number | string {
    return this.mesa()?.numero ?? '—';
  }

  protected usarSugerencia(texto: string): void {
    this.formulario.controls.texto.setValue(texto);
    void this.enviar();
  }

  protected async enviar(): Promise<void> {
    const texto = this.formulario.controls.texto.value.trim();
    const mozo = this.usuario();
    const mesa = this.mesa();
    if (!texto || !mozo || !mesa) return;

    this.formulario.controls.texto.setValue('');
    try {
      await this.chat.enviarMensaje(mesa, mozo, texto);
    } catch {
      this.avisos.error('Error', 'No se pudo enviar la respuesta.');
      this.formulario.controls.texto.setValue(texto);
    }
  }

  protected volver(): void {
    this.ir(['/mozo/consultas']);
  }
}
