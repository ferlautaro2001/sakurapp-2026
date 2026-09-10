import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Unsubscribe } from 'firebase/firestore';
import { ROTULO_ROL_MENSAJE, RolMensaje } from '../../nucleo/modelos/enums';
import { MensajeChat, Mesa } from '../../nucleo/modelos/modelos';
import { ChatService } from '../../nucleo/servicios/chat.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

const SUGERENCIAS_CLIENTE = [
  '¿Podrías acercarte a la mesa?',
  '¿Nos traés hielo y agua?',
  'Pedir la cuenta por favor',
  '¿Cuánto demora el pedido?',
];

const SUGERENCIAS_MOZO = [
  '¡Enseguida me acerco a la mesa!',
  'El pedido ya está en marcha.',
  'Preparando la cuenta en un momento.',
  '¿Necesitan algo más?',
];

/**
 * US-6.2 · Canal de Consulta Rápida al Mozo con Diseño WhatsApp (AC-6.2.1 y AC-6.2.2).
 *
 * Sala de conversación en tiempo real con diseño WhatsApp (burbujas verde/nieve Sakura),
 * marcas de tiempo sin abreviar (HH:mm), identificación de rol y remitente,
 * y despacho de notificaciones push en ambos sentidos.
 */
@Component({
  selector: 'lm-chat-mesa',
  imports: [DatePipe, FormsModule, ...UI],
  template: `
    <div class="lm-screen chat-screen">
      <!-- Encabezado de la Sala -->
      <div class="chat-header">
        <button type="button" class="chat-header__volver" (click)="volver()" aria-label="Volver">
          <lm-icono nombre="arrow_back" [tamano]="22" color="var(--text-title)" />
        </button>

        <div class="chat-header__avatar">
          <lm-icono nombre="table_restaurant" [tamano]="22" color="var(--action-primary)" />
        </div>

        <div class="chat-header__info">
          <span class="chat-header__titulo">Mesa {{ mesaNumero() }}</span>
          <span class="chat-header__subtitulo">
            <span class="chat-header__punto-en-vivo"></span>
            Sala en tiempo real con el personal
          </span>
        </div>

        <div class="chat-header__rol">
          <lm-chip [estado]="esMozo() ? 'ocupada' : 'reservada'">
            {{ esMozo() ? 'Atención Mozo' : 'Comensal' }}
          </lm-chip>
        </div>
      </div>

      <!-- Lista de Mensajes (Diseño WhatsApp) -->
      <div #contenedorMensajes class="chat-mensajes" role="log" aria-live="polite">
        <div class="chat-bienvenida">
          <div class="chat-bienvenida__insignia">
            <lm-icono nombre="forum" [tamano]="20" color="var(--action-primary)" />
            <span>Consultas directas para la Mesa {{ mesaNumero() }}</span>
          </div>
          <small class="chat-bienvenida__texto">
            Los mensajes son recibidos de inmediato por el personal en servicio y cuentan con avisos push.
          </small>
        </div>

        @if (mensajes().length === 0) {
          <div class="chat-vacio">
            <lm-icono nombre="chat_bubble_outline" [tamano]="36" color="var(--text-muted)" />
            <p>Aún no hay mensajes en esta mesa.</p>
            <small>Escribí una consulta o tocá una de las opciones rápidas.</small>
          </div>
        }

        @for (m of mensajes(); track m.id) {
          <div
            class="chat-fila"
            [class.chat-fila--propio]="esPropio(m)"
            [class.chat-fila--otro]="!esPropio(m)"
          >
            <article class="burbuja" [class.burbuja--propio]="esPropio(m)">
              <!-- Remitente y Rol -->
              <header class="burbuja__encabezado">
                <span class="burbuja__nombre" [class.burbuja__nombre--mozo]="m.remitenteRol === 'MOZO'">
                  {{ esPropio(m) ? 'Vos' : m.remitenteNombre }}
                </span>
                <span class="burbuja__rol-etiqueta" [class.burbuja__rol-etiqueta--mozo]="m.remitenteRol === 'MOZO'">
                  {{ rotuloRol(m.remitenteRol) }}
                </span>
              </header>

              <!-- Texto del Mensaje -->
              <p class="burbuja__cuerpo">{{ m.texto }}</p>

              <!-- Hora y Estado de Entrega -->
              <footer class="burbuja__pie">
                <time class="burbuja__hora">{{ m.timestamp | date: 'HH:mm' }}</time>
                @if (esPropio(m)) {
                  <lm-icono nombre="done_all" [tamano]="15" color="var(--sk-verde)" />
                }
              </footer>
            </article>
          </div>
        }
      </div>

      <!-- Sugerencias Rápidas -->
      <div class="chat-sugerencias">
        @for (sugerencia of sugerencias(); track sugerencia) {
          <button
            type="button"
            class="chat-sugerencia-chip"
            (click)="enviarSugerencia(sugerencia)"
            [disabled]="enviando()"
          >
            {{ sugerencia }}
          </button>
        }
      </div>

      <!-- Barra de Envío Fija -->
      <footer class="chat-barra-envio">
        <input
          type="text"
          class="chat-input"
          [placeholder]="esMozo() ? 'Responder al cliente comensal…' : 'Escribir consulta al mozo…'"
          [(ngModel)]="texto"
          (keydown.enter)="enviar()"
          [disabled]="enviando()"
          maxlength="280"
          autocomplete="off"
        />

        <button
          type="button"
          class="chat-boton-enviar"
          [disabled]="!texto().trim() || enviando()"
          (click)="enviar()"
          aria-label="Enviar mensaje"
        >
          <lm-icono
            [nombre]="enviando() ? 'hourglass_top' : 'send'"
            [tamano]="20"
            color="#FFFFFF"
          />
        </button>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
        width: 100%;
      }

      .chat-screen {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--bg-app);
      }

      /* Cabecera estilo WhatsApp */
      .chat-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: var(--surface-card);
        border-bottom: 1px solid rgba(110, 18, 52, 0.08);
        box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
        z-index: 10;
      }

      .chat-header__volver {
        background: none;
        border: none;
        padding: 4px;
        margin-left: -4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        border-radius: 50%;
      }

      .chat-header__avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--surface-sunken);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chat-header__info {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }

      .chat-header__titulo {
        font: var(--type-section);
        font-weight: 800;
        color: var(--text-title);
        line-height: 1.2;
      }

      .chat-header__subtitulo {
        font: var(--type-caption);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .chat-header__punto-en-vivo {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background-color: var(--sk-verde);
        animation: pulso 2s infinite;
      }

      @keyframes pulso {
        0% { opacity: 0.5; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.15); }
        100% { opacity: 0.5; transform: scale(0.9); }
      }

      /* Contenedor de burbujas */
      .chat-mensajes {
        flex: 1;
        overflow-y: auto;
        padding: 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        scroll-behavior: smooth;
      }

      .chat-bienvenida {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 4px;
        margin: 4px 0 10px 0;
      }

      .chat-bienvenida__insignia {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.85);
        color: var(--text-title);
        font: var(--type-caption);
        font-weight: 700;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .chat-bienvenida__texto {
        font: var(--type-caption);
        color: var(--text-sobre-fondo, #FFFFFF);
        opacity: 0.85;
      }

      .chat-vacio {
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        color: var(--text-sobre-fondo, #FFFFFF);
        gap: 6px;
        padding: 24px;
        opacity: 0.9;
      }

      .chat-vacio p {
        margin: 0;
        font: var(--type-section);
        font-weight: 700;
      }

      .chat-vacio small {
        font: var(--type-caption);
      }

      /* Filas y Burbujas */
      .chat-fila {
        display: flex;
        width: 100%;
      }

      .chat-fila--propio {
        justify-content: flex-end;
      }

      .chat-fila--otro {
        justify-content: flex-start;
      }

      .burbuja {
        max-width: 82%;
        min-width: 120px;
        padding: 8px 12px;
        border-radius: 14px;
        position: relative;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        gap: 3px;
        word-break: break-word;
        background: #FFFFFF;
        color: var(--text-body);
      }

      /* Burbuja del usuario actual (tono verde WhatsApp / Sakura) */
      .burbuja--propio {
        background: var(--sk-verde-fondo, #DCF1E5);
        border-bottom-right-radius: 3px;
      }

      .chat-fila--otro .burbuja {
        background: var(--surface-card, #FDECEF);
        border-bottom-left-radius: 3px;
      }

      .burbuja__encabezado {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 11px;
        margin-bottom: 1px;
      }

      .burbuja__nombre {
        font-weight: 800;
        color: var(--sk-fucsia-hondo, #C72657);
      }

      .burbuja__nombre--mozo {
        color: var(--sk-verde, #1B7A4C);
      }

      .burbuja__rol-etiqueta {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 4px;
        background: rgba(199, 38, 87, 0.12);
        color: var(--sk-fucsia-hondo);
      }

      .burbuja__rol-etiqueta--mozo {
        background: rgba(27, 122, 76, 0.14);
        color: var(--sk-verde);
      }

      .burbuja__cuerpo {
        margin: 0;
        font: var(--type-body);
        line-height: 1.35;
        color: var(--text-body);
        text-wrap: pretty;
      }

      .burbuja__pie {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        margin-top: 2px;
      }

      .burbuja__hora {
        font-size: 10px;
        color: var(--text-muted);
      }

      /* Barra de sugerencias rápidas */
      .chat-sugerencias {
        display: flex;
        gap: 8px;
        padding: 8px 12px 6px 12px;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: none;
      }

      .chat-sugerencias::-webkit-scrollbar {
        display: none;
      }

      .chat-sugerencia-chip {
        border: none;
        background: rgba(255, 255, 255, 0.9);
        color: var(--text-title);
        font: var(--type-caption);
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 16px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s ease;
      }

      .chat-sugerencia-chip:active {
        background: var(--surface-sunken);
      }

      /* Barra de entrada de texto inferior */
      .chat-barra-envio {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: var(--surface-card);
        border-top: 1px solid rgba(110, 18, 52, 0.08);
      }

      .chat-input {
        flex: 1;
        border: 1px solid rgba(110, 18, 52, 0.15);
        border-radius: 24px;
        padding: 10px 16px;
        font: var(--type-body);
        outline: none;
        background: #FFFFFF;
        color: var(--text-body);
      }

      .chat-input:focus {
        border-color: var(--sk-fucsia-hondo);
      }

      .chat-boton-enviar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--gradiente-marca, var(--sk-fucsia-hondo));
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        transition: transform 0.1s ease, opacity 0.15s ease;
      }

      .chat-boton-enviar:active:not(:disabled) {
        transform: scale(0.94);
      }

      .chat-boton-enviar:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ChatMesaPage extends PaginaConSesion implements OnInit, AfterViewInit, OnDestroy {
  readonly id = input.required<string>();

  @ViewChild('contenedorMensajes') private readonly contenedorMensajes?: ElementRef<HTMLDivElement>;

  private readonly chatService = inject(ChatService);
  private readonly mesasService = inject(MesasService);

  private desuscribirChat: Unsubscribe | null = null;

  protected readonly mesa = computed<Mesa | undefined>(() => {
    const mesaId = this.id();
    return this.mesasService.porId(mesaId) || this.mesasService.todas().find((m) => m.id === mesaId);
  });

  protected readonly mesaNumero = computed<number>(() => this.mesa()?.numero ?? 0);

  protected readonly esMozo = computed<boolean>(() => this.usuario()?.perfil === 'MOZO');

  protected readonly mensajes = signal<MensajeChat[]>([]);
  protected readonly texto = signal<string>('');
  protected readonly enviando = signal<boolean>(false);

  protected readonly sugerencias = computed<string[]>(() =>
    this.esMozo() ? SUGERENCIAS_MOZO : SUGERENCIAS_CLIENTE,
  );

  ngOnInit(): void {
    const mesaId = this.id();
    const usuarioActual = this.usuario();

    if (!usuarioActual) {
      void this.router.navigate(['/login']);
      return;
    }

    // Suscripción reactiva en tiempo real (AC-6.2.1 y AC-6.2.2)
    this.desuscribirChat = this.chatService.escucharMensajes(
      mesaId,
      usuarioActual.id,
      (mensajesActualizados) => {
        this.mensajes.set(mensajesActualizados);
        setTimeout(() => this.scrollAlFondo(), 60);
      },
    );
  }

  ngAfterViewInit(): void {
    this.scrollAlFondo();
  }

  ngOnDestroy(): void {
    if (this.desuscribirChat) {
      this.desuscribirChat();
      this.desuscribirChat = null;
    }
  }

  protected volver(): void {
    if (this.esMozo()) {
      void this.router.navigate(['/mesas']);
    } else {
      void this.router.navigate(['/cliente/espera']);
    }
  }

  protected esPropio(mensaje: MensajeChat): boolean {
    const actual = this.usuario();
    return mensaje.remitenteId === actual?.id || mensaje.remitenteId === actual?.uid;
  }

  protected rotuloRol(rol: RolMensaje): string {
    return ROTULO_ROL_MENSAJE[rol] || rol;
  }

  protected async enviarSugerencia(textoRapido: string): Promise<void> {
    this.texto.set(textoRapido);
    await this.enviar();
  }

  protected async enviar(): Promise<void> {
    const contenido = this.texto().trim();
    if (!contenido || this.enviando()) return;

    const actual = this.usuario();
    const mesaActual = this.mesa();

    if (!actual || !mesaActual) {
      this.avisos.error('Error al enviar', 'No se pudo identificar la mesa o tu usuario.');
      return;
    }

    this.enviando.set(true);
    try {
      await this.chatService.enviarMensaje(mesaActual, actual, contenido);
      this.texto.set('');
      setTimeout(() => this.scrollAlFondo(), 50);
    } catch (err: any) {
      console.warn('⚠️ Error al enviar mensaje:', err);
      this.avisos.error('Error al enviar', err.message || 'No se pudo enviar el mensaje.');
    } finally {
      this.enviando.set(false);
    }
  }

  private scrollAlFondo(): void {
    try {
      const el = this.contenedorMensajes?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      // Ignorar si el elemento aún no fue proyectado
    }
  }
}
