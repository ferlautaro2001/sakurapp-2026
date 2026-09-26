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
          <lm-chip [estado]="cerrada() ? 'libre' : esMozo() ? 'ocupada' : 'reservada'">
            {{ cerrada() ? 'Resuelta' : esMozo() ? 'Atención Mozo' : 'Comensal' }}
          </lm-chip>
        </div>

        <!--
          Cerrar es del mozo: es el que sabe si la consulta quedó contestada.
          El comensal no lo ve porque para él el hilo nunca estuvo abierto ni
          cerrado, sólo es el canal con su mesa.
        -->
        @if (esMozo()) {
          <lm-icono-boton
            [icono]="cerrada() ? 'replay' : 'task_alt'"
            [rotulo]="cerrada() ? 'Reabrir la consulta' : 'Marcar la consulta como resuelta'"
            [tono]="cerrada() ? 'neutro' : 'primario'"
            (presionar)="alternarCierre()"
          />
        }
      </div>

      @if (cerrada()) {
        <p class="chat-cerrada">
          <lm-icono nombre="task_alt" [tamano]="16" color="var(--state-success)" />
          Consulta resuelta{{ cerradaPor() ? ' por ' + cerradaPor() : '' }}. Si escriben de nuevo,
          vuelve a la bandeja sola.
        </p>
      }

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
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        padding-top: calc(var(--space-3) + var(--safe-top));
        background: var(--surface-card);
        border-bottom: 1px solid rgba(110, 18, 52, 0.08);
        box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
        z-index: 10;
      }

      .chat-header__volver {
        background: none;
        border: none;
        min-width: var(--touch-min);
        min-height: var(--touch-min);
        flex: 0 0 auto;
        padding: 4px;
        margin-left: calc(var(--space-1) * -1);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .chat-header__avatar {
        width: var(--size-avatar-sm);
        height: var(--size-avatar-sm);
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

      /* Con el nombre del comensal al lado del número, el título es lo único
         de la cabecera que puede ceder: la placa de rol no se deforma y el
         nombre completo se recupera entrando a la mesa. */
      .chat-header__titulo {
        font: var(--type-section);
        font-weight: 800;
        color: var(--text-title);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chat-header__subtitulo {
        font: var(--type-caption);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .chat-header__rol {
        flex: 0 1 auto;
      }

      .chat-header__punto-en-vivo {
        width: 7px;
        height: 7px;
        flex: 0 0 auto;
        border-radius: 50%;
        background-color: var(--sk-verde);
        animation: pulso 2s infinite;
      }

      @keyframes pulso {
        0% { opacity: 0.5; transform: scale(0.9); }
        50% { opacity: 1; transform: scale(1.15); }
        100% { opacity: 0.5; transform: scale(0.9); }
      }

      /* Aviso de hilo resuelto, pegado bajo la cabecera: explica por qué la
         consulta ya no figura en la bandeja sin ocupar lugar en el hilo. */
      .chat-cerrada {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
        padding: var(--space-2) var(--space-4);
        background: var(--state-success-surface);
        color: var(--state-success);
        font: var(--type-body-small);
        text-wrap: pretty;
      }

      .chat-cerrada lm-icono {
        flex: 0 0 auto;
      }

      /* Contenedor de burbujas */
      .chat-mensajes {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-4) var(--space-3);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        scroll-behavior: smooth;
      }

      .chat-vacio {
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        color: var(--text-sobre-fondo, #FFFFFF);
        gap: var(--space-2);
        padding: var(--space-6);
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

      /* La burbuja crece con lo que dice el mensaje y nunca al revés: el
         min-width de 120px que tenía era un piso que un "Ok" no necesita y que,
         sumado al encabezado de nombre y rol, empujaba la fila fuera de
         pantalla. Ahora el único límite es el techo del 78% de la fila, y lo
         que no entra envuelve —incluido un enlace o un correo sin espacios,
         que el overflow-wrap de la base ya corta. */
      .burbuja {
        max-width: 78%;
        min-width: 0;
        padding: var(--space-2) var(--space-3);
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

      /* Nombre y placa de rol se acomodan en dos renglones antes que ensanchar
         la burbuja: un nombre largo no puede decidir el ancho del hilo. */
      .burbuja__encabezado {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--space-1) var(--space-2);
        font: var(--type-label);
        margin-bottom: 1px;
      }

      .burbuja__nombre {
        font-weight: 800;
        color: var(--sk-fucsia-hondo, #C72657);
        min-width: 0;
      }

      .burbuja__nombre--mozo {
        color: var(--sk-verde, #1B7A4C);
      }

      .burbuja__rol-etiqueta {
        font-size: clamp(9px, 2.3vw, 10px);
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
        font-size: clamp(9px, 2.3vw, 10px);
        color: var(--text-muted);
      }

      /* Barra de entrada de texto inferior */
      .chat-barra-envio {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        padding-bottom: calc(var(--space-2) + var(--safe-bottom));
        background: var(--surface-card);
        border-top: 1px solid rgba(110, 18, 52, 0.08);
      }

      .chat-input {
        flex: 1;
        min-width: 0;
        min-height: var(--touch-min);
        border: 1px solid rgba(110, 18, 52, 0.15);
        border-radius: 24px;
        padding: var(--space-3) var(--space-4);
        font: var(--type-body);
        outline: none;
        background: #FFFFFF;
        color: var(--text-body);
      }

      .chat-input:focus {
        border-color: var(--sk-fucsia-hondo);
      }

      .chat-boton-enviar {
        width: var(--touch-min);
        height: var(--touch-min);
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
  /** Baja de esta pantalla en la escucha compartida de conversaciones. */
  private soltarConversaciones: Unsubscribe | null = null;
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

  /** El estado de cierre vive en el resumen de la conversación, no en el hilo. */
  private readonly resumen = computed(() =>
    this.chatService.conversacionesActivas().find((c) => c.mesaId === (this.mesa()?.id ?? this.id())),
  );
  protected readonly cerrada = computed(() => this.resumen()?.cerrada ?? false);
  protected readonly cerradaPor = computed(() => this.resumen()?.cerradaPor ?? '');


  ngOnInit(): void {
    const mesaId = this.id();
    const usuarioActual = this.usuario();

    if (!usuarioActual) {
      void this.router.navigate(['/login']);
      return;
    }

    void this.mesasService.sincronizar();
    void this.esperaService.iniciar();
    // El resumen de la conversación es lo que dice si está cerrada. La escucha
    // es una sola para toda la aplicación y está contada por referencias: darla
    // de baja acá no apaga la de las otras pantallas.
    this.soltarConversaciones = this.chatService.iniciarEscuchaConversaciones();

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
        // Estar adentro del hilo es haberlo leído: se limpia al entrar y cada
        // vez que llega algo mientras el hilo sigue en pantalla. Sin esto la
        // bandeja del mozo nunca apagaba el globo de no leído.
        void this.chatService.marcarLeidos(idMesa, this.esMozo() ? 'CLIENTE' : 'MOZO');
        setTimeout(() => this.scrollAlFondo(), 60);
      },
    );
  }

  /**
   * Cerrar no archiva ni corta nada: saca la consulta de las pendientes del
   * panel. Por eso es reversible desde el mismo botón, y además se deshace
   * sola cuando alguien vuelve a escribir.
   */
  protected async alternarCierre(): Promise<void> {
    const mesaId = this.mesa()?.id ?? this.id();
    if (this.cerrada()) {
      await this.chatService.reabrirConversacion(mesaId);
      this.avisos.info('Consulta reabierta', 'Vuelve a figurar como pendiente en el panel.');
      return;
    }
    const actual = this.usuario();
    await this.chatService.cerrarConversacion(mesaId, actual?.nombre ?? '');
    this.avisos.exito('Consulta resuelta', 'Sale de las pendientes. Si escriben de nuevo, vuelve sola.');
  }

  ngAfterViewInit(): void {
    this.scrollAlFondo();
  }

  ngOnDestroy(): void {
    if (this.desuscribirChat) {
      this.desuscribirChat();
      this.desuscribirChat = null;
    }
    if (this.soltarConversaciones) {
      this.soltarConversaciones();
      this.soltarConversaciones = null;
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
