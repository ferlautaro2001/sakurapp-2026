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
import { doc, getDoc, Unsubscribe } from 'firebase/firestore';
import { ROTULO_ROL_MENSAJE, RolMensaje } from '../../nucleo/modelos/enums';
import { MensajeChat, Mesa } from '../../nucleo/modelos/modelos';
import { ChatService } from '../../nucleo/servicios/chat.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { FirestoreService } from '../../nucleo/servicios/firestore.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

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
          <span class="chat-header__titulo">
            Mesa {{ mesaNumero() }}
            @if (esMozo() && clienteDestinatario()?.clienteNombre) {
              · {{ clienteDestinatario()!.clienteNombre }}
            }
          </span>
          <span class="chat-header__subtitulo">
            <span class="chat-header__punto-en-vivo"></span>
            Consultas al mozo
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

        @if (mensajes().length === 0) {
          <div class="chat-vacio">
            <lm-icono nombre="chat_bubble_outline" [tamano]="36" color="var(--text-muted)" />
            <p>Aún no hay mensajes en esta mesa.</p>
            <small>Escribí tu mensaje para empezar.</small>
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
                  {{ esMismoRemitente(m) ? 'Vos' : m.remitenteNombre }}
                </span>
                <span class="burbuja__rol-etiqueta" [class.burbuja__rol-etiqueta--mozo]="m.remitenteRol === 'MOZO'">
                  {{ rotuloRol(m.remitenteRol) }}
                </span>
              </header>

              <!-- Texto del Mensaje -->
              <p class="burbuja__cuerpo">{{ m.texto }}</p>

              <!-- Hora y Estado de Entrega -->
              <footer class="burbuja__pie">
                <!-- Con la fecha: dos mensajes de días distintos a la misma
                     hora se leían iguales. -->
                <time class="burbuja__hora">{{ m.timestamp | date: 'dd/MM/yyyy HH:mm' }}</time>
                @if (esMismoRemitente(m)) {
                  <lm-icono nombre="done_all" [tamano]="15" color="var(--sk-verde)" />
                }
              </footer>
            </article>
          </div>
        }
      </div>

      <!-- Barra de Envío Fija -->
      <footer class="chat-barra-envio">
        <input
          type="text"
          class="chat-input"
          [placeholder]="esMozo() ? 'Responder al cliente…' : 'Escribir consulta al mozo…'"
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

      /* Burbuja del usuario actual (verde auténtico WhatsApp) */
      .chat-fila--propio .burbuja,
      .burbuja--propio {
        background: #DCF8C6 !important;
        border-bottom-right-radius: 3px;
        color: #111B21;
      }

      .chat-fila--otro .burbuja {
        background: #FFFFFF !important;
        border-bottom-left-radius: 3px;
        color: #111B21;
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
        color: #111B21;
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
  private readonly esperaService = inject(EsperaService);
  private readonly firestore = inject(FirestoreService);

  private desuscribirChat: Unsubscribe | null = null;
  private readonly mesaDirecta = signal<Mesa | null>(null);

  protected readonly clienteDestinatario = computed(() => {
    const mesaId = this.id();
    return this.esperaService.lista().find((e) => e.mesaAsignadaId === mesaId && e.estado !== 'CANCELADO');
  });

  protected readonly mesa = computed<Mesa | undefined>(() => {
    const mesaId = this.id();
    const deStore =
      this.mesasService.porId(mesaId) ||
      this.mesasService.porNumero(Number(mesaId)) ||
      this.mesasService.todas().find((m) => m.id === mesaId);
    return deStore || this.mesaDirecta() || undefined;
  });

  protected readonly mesaNumero = computed<number>(() => {
    const m = this.mesa();
    if (m) return m.numero;
    const num = Number(this.id());
    return isNaN(num) ? (this.clienteDestinatario()?.mesaAsignadaNumero ?? 0) : num;
  });

  protected readonly esMozo = computed<boolean>(() => this.usuario()?.perfil === 'MOZO');

  protected readonly mensajes = signal<MensajeChat[]>([]);
  protected readonly texto = signal<string>('');
  protected readonly enviando = signal<boolean>(false);


  ngOnInit(): void {
    const mesaId = this.id();
    const usuarioActual = this.usuario();

    if (!usuarioActual) {
      void this.router.navigate(['/login']);
      return;
    }

    void this.mesasService.sincronizar();
    void this.esperaService.iniciar();

    // Si la mesa no está cargada en el store reactivo, cargarla directamente de Firestore
    if (!this.mesa()) {
      try {
        const db = this.firestore.obtenerDb();
        void getDoc(doc(db, 'mesas', mesaId)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            this.mesaDirecta.set({
              id: snap.id,
              numero: Number(data['numero']) || 0,
              cantidadComensales: Number(data['cantidadComensales']) || 2,
              tipo: data['tipo'] || 'ESTANDAR',
              estado: data['estado'] || 'OCUPADA',
              fotoUrl: data['fotoUrl'] || '',
              qrCodeUrl: data['qrCodeUrl'] || '',
              clienteActualId: data['clienteActualId'] || null,
              clienteActualUid: data['clienteActualUid'] || null,
            });
            if (snap.id && snap.id !== this.idEscuchando) {
              this.iniciarEscucha(snap.id, usuarioActual.id);
            }
          }
        });
      } catch {
        // Fallback no bloqueante
      }
    }

    // Suscripción reactiva en tiempo real al ID canónico de la mesa (AC-6.2.1 y AC-6.2.2)
    const idMesaInicial = this.mesa()?.id || mesaId;
    this.iniciarEscucha(idMesaInicial, usuarioActual.id);
  }

  private idEscuchando: string | null = null;

  private iniciarEscucha(idMesa: string, usuarioId: string): void {
    if (this.idEscuchando === idMesa && this.desuscribirChat) return;
    if (this.desuscribirChat) {
      this.desuscribirChat();
      this.desuscribirChat = null;
    }
    this.idEscuchando = idMesa;
    this.desuscribirChat = this.chatService.escucharMensajes(
      idMesa,
      usuarioId,
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

  protected esMismoRemitente(mensaje: MensajeChat): boolean {
    const actual = this.usuario();
    if (!actual) return false;
    return mensaje.remitenteId === actual.id || mensaje.remitenteId === actual.uid;
  }

  /**
   * De qué lado del hilo va el mensaje.
   *
   * Manda el rol, no la persona: la respuesta de otro mozo también es del
   * salón y va a la derecha, junto con la propia. Si cayera a la izquierda se
   * confundiría con lo que escribe el comensal, que es lo único que tiene que
   * leerse enfrente. Quién escribió cada una lo dice el nombre de la burbuja.
   */
  protected esPropio(mensaje: MensajeChat): boolean {
    const actual = this.usuario();
    if (!actual) return false;

    if (mensaje.remitenteId === actual.id || mensaje.remitenteId === actual.uid) {
      return true;
    }

    const esPersonal = actual.perfil === 'MOZO' || actual.perfil === 'SUPERVISOR' || actual.perfil === 'DUENO';
    if (esPersonal && mensaje.remitenteRol === 'MOZO') {
      return true;
    }

    const esCliente = actual.perfil === 'CLIENTE_REGISTRADO' || actual.perfil === 'CLIENTE_ANONIMO';
    if (esCliente && mensaje.remitenteRol === 'CLIENTE') {
      return true;
    }

    return false;
  }

  protected rotuloRol(rol: RolMensaje): string {
    return ROTULO_ROL_MENSAJE[rol] || rol;
  }


  protected async enviar(): Promise<void> {
    const contenido = this.texto().trim();
    if (!contenido || this.enviando()) return;

    const actual = this.usuario();
    if (!actual) {
      this.avisos.error('Error al enviar', 'No se pudo identificar tu usuario.');
      return;
    }

    const mesaActual = this.mesa() || {
      id: this.id(),
      numero: this.mesaNumero() || 1,
      cantidadComensales: 4,
      tipo: 'ESTANDAR' as const,
      estado: 'OCUPADA' as const,
      fotoUrl: '',
      qrCodeUrl: '',
    };

    this.enviando.set(true);
    try {
      const comensal = this.clienteDestinatario();
      const clienteUid = comensal?.clienteUid || comensal?.clienteId || null;

      await this.chatService.enviarMensaje(mesaActual, actual, contenido, clienteUid);
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
