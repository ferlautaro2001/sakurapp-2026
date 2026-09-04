import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';

export interface AvisoPush {
  id: number;
  titulo: string;
  cuerpo: string;
  ruta?: string[];
  recibidoEn: string;
  leido: boolean;
}

const CANAL = 'sakurapp-salon';

/**
 * Servicio de Notificaciones Push y Alertas del Salón (US-3.2).
 *
 * Combina Firebase Cloud Messaging / @capacitor/push-notifications para registro
 * de tokens nativos y recepción de avisos remotos, con @capacitor/local-notifications
 * y banners reactivos en la interfaz.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly router = inject(Router);

  private siguienteId = 1;
  private readonly enSesion = signal<string | null>(null);
  private readonly bandejas = signal<Record<string, AvisoPush[]>>({});

  readonly ultimoAviso = signal<AvisoPush | null>(null);
  readonly pushToken = signal<string | null>(null);

  private permitido = false;
  private iniciado = false;

  registrarSesion(usuarioId: string | null): void {
    this.enSesion.set(usuarioId);
  }

  async iniciar(): Promise<void> {
    if (this.iniciado) return;
    this.iniciado = true;

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 1. Configurar canales locales
    try {
      const estadoLocal = await LocalNotifications.checkPermissions();
      this.permitido = estadoLocal.display === 'granted';
      if (!this.permitido) {
        const pedido = await LocalNotifications.requestPermissions();
        this.permitido = pedido.display === 'granted';
      }

      await LocalNotifications.createChannel({
        id: CANAL,
        name: 'Salón SakurApp',
        description: 'Avisos y notificaciones del salón',
        importance: 5,
        visibility: 1,
        lights: true,
        lightColor: '#C72657',
        vibration: true,
      });
    } catch (err) {
      console.warn('⚠️ LocalNotifications error:', err);
    }

    // 2. Configurar PushNotifications nativo (FCM)
    try {
      let pushPerm = await PushNotifications.checkPermissions();
      if (pushPerm.receive !== 'granted') {
        pushPerm = await PushNotifications.requestPermissions();
      }

      if (pushPerm.receive === 'granted') {
        await PushNotifications.register();

        await PushNotifications.addListener('registration', (token: Token) => {
          console.log('📲 Token Push FCM registrado con éxito:', token.value);
          this.pushToken.set(token.value);
        });

        await PushNotifications.addListener('registrationError', (error: any) => {
          console.warn('⚠️ Error al registrar token push:', error);
        });

        await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('🔔 Push recibida en primer plano:', notification);
          void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
          const aviso: AvisoPush = {
            id: this.siguienteId++,
            titulo: notification.title || 'Aviso SakurApp',
            cuerpo: notification.body || '',
            recibidoEn: new Date().toISOString(),
            leido: false,
          };
          this.ultimoAviso.set(aviso);
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
          console.log('👉 Notificación push tocada:', action);
          const ruta = action.notification.data?.ruta;
          if (ruta) {
            void this.router.navigate(Array.isArray(ruta) ? ruta : [ruta]);
          }
        });
      }
    } catch (err) {
      console.warn('⚠️ PushNotifications error:', err);
    }
  }

  /**
   * Envía un aviso push / local a uno o varios destinatarios por su ID de usuario.
   */
  async enviar(destinatarios: string[], titulo: string, cuerpo: string, ruta?: string[]): Promise<void> {
    const aviso: AvisoPush = {
      id: this.siguienteId++,
      titulo,
      cuerpo,
      ruta,
      recibidoEn: new Date().toISOString(),
      leido: false,
    };

    this.bandejas.update((actual) => {
      const siguiente = { ...actual };
      for (const dest of destinatarios) {
        siguiente[dest] = [aviso, ...(actual[dest] ?? [])].slice(0, 30);
      }
      return siguiente;
    });

    const enUso = this.enSesion();
    const esParaSesionActual = enUso && destinatarios.includes(enUso);

    if (esParaSesionActual) {
      this.ultimoAviso.set(aviso);
      void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
    }

    if (!Capacitor.isNativePlatform() || !this.permitido) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: aviso.id,
            channelId: CANAL,
            title: titulo,
            body: cuerpo,
            smallIcon: 'ic_stat_sakura',
            largeIcon: 'ic_launcher',
            extra: { ruta },
          },
        ],
      });
    } catch (err) {
      console.warn('⚠️ No se pudo disparar notificación de sistema:', err);
    }
  }

  /**
   * Notificación para dueños y supervisores cuando un cliente se registra.
   */
  async notificarNuevoRegistro(clienteNombre: string, adminIds: string[]): Promise<void> {
    await this.enviar(
      adminIds,
      'Nuevo cliente pendiente',
      `${clienteNombre} completó su registro y espera aprobación.`,
      ['/clientes-pendientes'],
    );
  }

  /**
   * Notificación para el cliente cuando su cuenta es aprobada o rechazada.
   */
  async notificarResolucion(clienteId: string, aprobada: boolean): Promise<void> {
    const titulo = aprobada ? '¡Cuenta aprobada!' : 'Solicitud no admitida';
    const cuerpo = aprobada
      ? 'Tu solicitud fue aprobada. Ya podés ingresar y pedir tu mesa en SakurApp.'
      : 'Tu registro no pudo ser aprobado. Revisá tu correo electrónico para ver el motivo.';

    await this.enviar([clienteId], titulo, cuerpo, aprobada ? ['/login'] : undefined);
  }

  bandejaDe(usuarioId: string): AvisoPush[] {
    return this.bandejas()[usuarioId] ?? [];
  }

  pendientesDe(usuarioId: string): AvisoPush[] {
    if (this.enSesion() !== usuarioId) return [];
    return this.bandejaDe(usuarioId).filter((a) => !a.leido);
  }

  marcarLeidos(usuarioId: string): void {
    const bandeja = this.bandejaDe(usuarioId).map((a) => ({ ...a, leido: true }));
    this.bandejas.update((actual) => ({ ...actual, [usuarioId]: bandeja }));
  }
}
