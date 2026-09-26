import { Injectable, inject, signal } from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Unsubscribe,
  where,
  writeBatch,
} from 'firebase/firestore';
import { nuevoId } from '../datos/semilla';
import { RolMensaje } from '../modelos/enums';
import { MensajeChat, Mesa, Usuario } from '../modelos/modelos';
import { FirestoreService } from './firestore.service';
import { NotificacionesService } from './notificaciones.service';
import { UsuariosService } from './usuarios.service';
import { EsperaService } from './espera.service';

/** Colección base de conversaciones por mesa en Firestore ('sakurapp'). */
const COLECCION_CHAT = 'conversaciones_chat';

/** Resumen de conversación viva por mesa para el panel del mozo y supervisores. */
export interface ConversacionMesa {
  mesaId: string;
  mesaNumero: number;
  ultimoMensaje: string;
  ultimoRemitente: string;
  ultimoRol: RolMensaje;
  actualizadoEn: string;
  /** Hay algo escrito del otro lado que este rol todavía no abrió. */
  pendienteMozo: boolean;
  pendienteCliente: boolean;
  /** El mozo dio la consulta por resuelta. Sigue a la vista, pero sin reclamar. */
  cerrada: boolean;
  cerradaPor: string;
}

/**
 * Lo no leído se resuelve comparando dos marcas de tiempo del resumen de la
 * conversación: cuándo escribió por última vez cada lado y cuándo abrió el
 * hilo el otro.
 *
 * Antes el globo rojo del panel de consultas se pintaba con el rol del último
 * mensaje, que nunca cambia al leerlo: cualquier consulta del comensal
 * quedaba marcada como no leída para siempre. Un par de marcas de tiempo no
 * necesita contadores que sumar ni restar y no se desincroniza si dos mozos
 * abren el mismo hilo a la vez: el que entra último simplemente vuelve a
 * escribir la fecha.
 */
function hayPendiente(escritoEn: string, leidoEn: string): boolean {
  if (!escritoEn) return false;
  return !leidoEn || escritoEn > leidoEn;
}

/**
 * Servicio de Chat en Tiempo Real entre Cliente y Mozo (US-6.2).
 *
 * Cumple con:
 * - AC-6.2.1: Sala de chat en tiempo real y despacho push a todos los mozos en servicio.
 * - AC-6.2.2: Respuesta del mozo con su nombre y despacho push al cliente comensal.
 * - Feedback háptico y sonoro sutil al recibir mensajes en vivo.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly firestore = inject(FirestoreService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly usuarios = inject(UsuariosService);
  private readonly espera = inject(EsperaService);
  private audioCtx: AudioContext | null = null;

  readonly conversacionesActivas = signal<ConversacionMesa[]>([]);
  private escuchaConversaciones: Unsubscribe | null = null;
  /**
   * Cuántas pantallas están mirando la lista de conversaciones ahora mismo.
   *
   * La escucha es una sola para toda la aplicación, pero la piden cuatro
   * pantallas distintas. Antes se devolvía el `Unsubscribe` compartido y la
   * primera que se cerraba apagaba la escucha para todas; peor aún, el campo
   * quedaba con el handle muerto, así que ninguna llamada posterior volvía a
   * suscribirse y la bandeja se congelaba hasta recargar la aplicación. Por
   * eso ahora se cuenta: la escucha se corta recién cuando se va el último.
   */
  private miradasConversaciones = 0;

  /**
   * Inicia la escucha reactiva de todas las conversaciones activas para los mozos en servicio.
   */
  iniciarEscuchaConversaciones(): Unsubscribe {
    this.miradasConversaciones++;
    if (this.escuchaConversaciones) return this.soltarConversaciones();

    const db = this.firestore.obtenerDb();
    const colRef = collection(db, COLECCION_CHAT);

    this.escuchaConversaciones = onSnapshot(
      colRef,
      (snapshot) => {
        const lista: ConversacionMesa[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d['mesaId'] && d['ultimoMensaje']) {
            const cerrada = Boolean(d['cerrada']);
            lista.push({
              mesaId: d['mesaId'],
              mesaNumero: Number(d['mesaNumero']) || 0,
              ultimoMensaje: d['ultimoMensaje'],
              ultimoRemitente: d['ultimoRemitente'] || '',
              ultimoRol: (d['ultimoRol'] as RolMensaje) || 'CLIENTE',
              actualizadoEn: d['actualizadoEn'] || '',
              // Una consulta dada por resuelta no vuelve a reclamar atención
              // aunque el último mensaje sea del comensal.
              pendienteMozo:
                !cerrada && hayPendiente(d['ultimoDeCliente'] || '', d['leidoPorMozoEn'] || ''),
              pendienteCliente: hayPendiente(
                d['ultimoDeMozo'] || '',
                d['leidoPorClienteEn'] || '',
              ),
              cerrada,
              cerradaPor: d['cerradaPor'] || '',
            });
          }
        });
        lista.sort((a, b) => (b.actualizadoEn || '').localeCompare(a.actualizadoEn || ''));
        this.conversacionesActivas.set(lista);
      },
      (error) => {
        console.warn('⚠️ Error escuchando conversaciones activas de chat:', error);
      },
    );

    return this.soltarConversaciones();
  }

  /**
   * Baja de una pantalla: sólo corta la escucha cuando se fue la última, y
   * deja el campo en nulo para que la próxima que entre vuelva a suscribirse.
   * Es idempotente: si una pantalla la llama dos veces, la segunda no resta.
   */
  private soltarConversaciones(): Unsubscribe {
    let soltada = false;
    return () => {
      if (soltada) return;
      soltada = true;
      this.miradasConversaciones = Math.max(0, this.miradasConversaciones - 1);
      if (this.miradasConversaciones === 0 && this.escuchaConversaciones) {
        this.escuchaConversaciones();
        this.escuchaConversaciones = null;
      }
    };
  }

  /**
   * Escucha los mensajes en tiempo real de una mesa específica.
   * Invoca el callback cada vez que hay nuevos mensajes ordenados cronológicamente.
   */
  escucharMensajes(
    mesaId: string,
    usuarioActualId: string,
    callback: (mensajes: MensajeChat[]) => void,
  ): Unsubscribe {
    const db = this.firestore.obtenerDb();
    const colRef = collection(db, COLECCION_CHAT, mesaId, 'mensajes');

    let primeraCarga = true;

    return onSnapshot(
      colRef,
      (snapshot) => {
        const mensajes: MensajeChat[] = [];
        let hayNuevoEntrante = false;

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const rawTs = d['timestamp'];
          let ts = '';
          if (typeof rawTs === 'string') {
            ts = rawTs;
          } else if (rawTs && typeof rawTs.toDate === 'function') {
            ts = rawTs.toDate().toISOString();
          } else if (rawTs && typeof rawTs.seconds === 'number') {
            ts = new Date(rawTs.seconds * 1000).toISOString();
          } else {
            ts = new Date().toISOString();
          }

          const msj: MensajeChat = {
            id: docSnap.id,
            mesaId: d['mesaId'] || mesaId,
            mesaNumero: Number(d['mesaNumero']) || 0,
            remitenteId: d['remitenteId'] || '',
            remitenteNombre: d['remitenteNombre'] || 'Usuario',
            remitenteRol: (d['remitenteRol'] as RolMensaje) || 'CLIENTE',
            texto: d['texto'] || '',
            timestamp: ts,
            leido: Boolean(d['leido']),
          };
          mensajes.push(msj);
        });

        // Orden cronológico estricto (los más antiguos arriba, más recientes abajo intercalados)
        mensajes.sort((a, b) => {
          const tA = new Date(a.timestamp).getTime();
          const tB = new Date(b.timestamp).getTime();
          if (isNaN(tA) || isNaN(tB)) {
            return a.timestamp.localeCompare(b.timestamp);
          }
          return tA - tB;
        });

        // Si se agregó un mensaje que no es del usuario actual después de la carga inicial
        if (!primeraCarga && snapshot.docChanges().some((c) => c.type === 'added')) {
          const cambios = snapshot.docChanges();
          for (const c of cambios) {
            if (c.type === 'added') {
              const remitente = c.doc.data()['remitenteId'];
              if (remitente && remitente !== usuarioActualId) {
                hayNuevoEntrante = true;
                break;
              }
            }
          }
        }

        if (hayNuevoEntrante) {
          this.reproducirTonoMensaje();
          void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
        }

        primeraCarga = false;
        callback(mensajes);
      },
      (error) => {
        console.warn('⚠️ Error al escuchar mensajes de chat en Firestore:', error);
      },
    );
  }

  /**
   * Envía un mensaje en la conversación de la mesa y dispara las notificaciones push pertinentes.
   */
  async enviarMensaje(
    mesa: Mesa,
    remitente: Usuario,
    texto: string,
    clienteDestinatarioUid?: string | null,
  ): Promise<MensajeChat> {
    const textoLimpio = texto.trim();
    if (!textoLimpio) {
      throw new Error('El mensaje no puede estar vacío.');
    }

    const esMozo = remitente.perfil === 'MOZO';
    const rol: RolMensaje = esMozo ? 'MOZO' : 'CLIENTE';
    const remitenteNombre = [remitente.nombre, remitente.apellido ?? ''].join(' ').trim();
    const id = nuevoId();
    const timestamp = new Date().toISOString();

    const nuevoMensaje: MensajeChat = {
      id,
      mesaId: mesa.id,
      mesaNumero: mesa.numero,
      remitenteId: remitente.id,
      remitenteNombre,
      remitenteRol: rol,
      texto: textoLimpio,
      timestamp,
      leido: false,
    };

    const db = this.firestore.obtenerDb();

    // 1. Guardar mensaje en la subcolección de la mesa
    const msgRef = doc(db, COLECCION_CHAT, mesa.id, 'mensajes', id);
    await setDoc(msgRef, {
      ...nuevoMensaje,
    });

    // 2. Actualizar estado de la conversación padre
    const convRef = doc(db, COLECCION_CHAT, mesa.id);
    await setDoc(
      convRef,
      {
        mesaId: mesa.id,
        mesaNumero: mesa.numero,
        ultimoMensaje: textoLimpio,
        ultimoRemitente: remitenteNombre,
        ultimoRol: rol,
        actualizadoEn: timestamp,
        // Cada lado deja su propia marca: es contra ella que se compara la de
        // lectura del otro para saber si queda algo sin abrir.
        ...(esMozo ? { ultimoDeMozo: timestamp } : { ultimoDeCliente: timestamp }),
        // Escribir reabre: una consulta dada por resuelta a la que el comensal
        // vuelve es una consulta abierta, y pedirle al mozo que la destrabe a
        // mano es la forma segura de perder el mensaje.
        cerrada: false,
        cerradaPor: '',
      },
      { merge: true },
    );

    // 3. Despacho de Notificaciones Push (TASK-6.2.1.2 & TASK-6.2.2.1)
    if (!esMozo) {
      // Consulta del comensal: Notificar a todos los mozos en servicio vía FCM
      await this.firestore.encolarNotificacion({
        destinatarioRol: 'MOZO',
        titulo: `Consulta en Mesa ${mesa.numero}`,
        cuerpo: `${remitenteNombre}: ${textoLimpio}`,
        ruta: `/mesas/${mesa.id}/chat`,
      });

      // Notificación in-app y alerta para mozos activos en sesión local
      const mozoIds = this.usuarios.todos().filter((u) => u.perfil === 'MOZO').map((u) => u.id);
      if (mozoIds.length) {
        await this.notificaciones.enviar(
          mozoIds,
          `Consulta en Mesa ${mesa.numero}`,
          `${remitenteNombre}: ${textoLimpio}`,
          ['/mesas', mesa.id, 'chat'],
        );
      }
    } else {
      // Respuesta del mozo: Notificar al comensal de la mesa
      let destinatarioUid = clienteDestinatarioUid || mesa.clienteActualUid || mesa.clienteActualId;

      if (!destinatarioUid) {
        const enEspera = this.espera.lista().find((e) => e.mesaAsignadaId === mesa.id);
        destinatarioUid = enEspera?.clienteUid || enEspera?.clienteId || null;
      }

      if (destinatarioUid) {
        await this.firestore.encolarNotificacion({
          destinatarioUid,
          titulo: `Mozo ${remitenteNombre} · Mesa ${mesa.numero}`,
          cuerpo: textoLimpio,
          ruta: `/mesas/${mesa.id}/chat`,
        });

        await this.notificaciones.enviar(
          [destinatarioUid],
          `Mozo ${remitenteNombre} · Mesa ${mesa.numero}`,
          textoLimpio,
          ['/mesas', mesa.id, 'chat'],
        );
      } else {
        console.warn(`⚠️ No se pudo determinar el comensal de la mesa ${mesa.numero} para enviar la notificación push`);
      }
    }

    return nuevoMensaje;
  }

  /**
   * Genera un chime suave y armónico mediante la Web Audio API nativa.
   * Evita dependencias de archivos estáticos externos que puedan fallar en emuladores o móviles.
   */
  private reproducirTonoMensaje(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }

      const ahora = this.audioCtx.currentTime;
      const oscilador = this.audioCtx.createOscillator();
      const ganancia = this.audioCtx.createGain();

      oscilador.type = 'sine';
      // Acorde suave: 784Hz (G5) a 1046Hz (C6)
      oscilador.frequency.setValueAtTime(784, ahora);
      oscilador.frequency.exponentialRampToValueAtTime(1046.5, ahora + 0.12);

      ganancia.gain.setValueAtTime(0.01, ahora);
      ganancia.gain.linearRampToValueAtTime(0.18, ahora + 0.03);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.35);

      oscilador.connect(ganancia);
      ganancia.connect(this.audioCtx.destination);

      oscilador.start(ahora);
      oscilador.stop(ahora + 0.36);
    } catch {
      // Si el navegador bloquea audio sin interacción de usuario, continúa silenciosamente
    }
  }

  /**
   * Marca como leídos los mensajes de un rol determinado en una mesa.
   *
   * El `leido` de cada mensaje sirve para la tilde doble de la burbuja, pero
   * el panel de consultas no lo mira: ese lee el resumen de la conversación.
   * Por eso acá también se estampa la fecha de lectura del rol contrario, que
   * es lo que apaga el globo rojo de la lista.
   */
  async marcarLeidos(mesaId: string, rolParaMarcar: RolMensaje): Promise<void> {
    const ahora = new Date().toISOString();
    try {
      const db = this.firestore.obtenerDb();
      const convRef = doc(db, COLECCION_CHAT, mesaId);
      await setDoc(
        convRef,
        rolParaMarcar === 'CLIENTE' ? { leidoPorMozoEn: ahora } : { leidoPorClienteEn: ahora },
        { merge: true },
      );
    } catch {
      // Ignorar fallas si la base está en modo offline o sin permisos
    }

    try {
      const db = this.firestore.obtenerDb();
      const colRef = collection(db, COLECCION_CHAT, mesaId, 'mensajes');
      const q = query(colRef, where('remitenteRol', '==', rolParaMarcar), where('leido', '==', false));
      const snaps = await getDocs(q);
      if (snaps.empty) return;
      const batch = writeBatch(db);
      snaps.forEach((d) => {
        batch.update(d.ref, { leido: true });
      });
      await batch.commit();
    } catch {
      // Ignorar fallas si la base está en modo offline o sin permisos
    }
  }

  /**
   * El mozo da la consulta por resuelta.
   *
   * No se borra nada ni se corta el hilo: el historial de la mesa sigue
   * entero y el comensal puede seguir escribiendo. Lo único que cambia es que
   * deja de figurar como pendiente en el panel, que era el problema real —un
   * hilo contestado hace media hora seguía reclamando atención igual que uno
   * recién llegado. Se reabre de dos maneras: a mano, con `reabrir`, o sola,
   * apenas alguien vuelve a escribir.
   */
  async cerrarConversacion(mesaId: string, cerradaPor: string): Promise<void> {
    await this.marcarEstadoDeCierre(mesaId, true, cerradaPor);
  }

  /** Vuelve a poner la consulta en la bandeja, sin tocar los mensajes. */
  async reabrirConversacion(mesaId: string): Promise<void> {
    await this.marcarEstadoDeCierre(mesaId, false, '');
  }

  private async marcarEstadoDeCierre(
    mesaId: string,
    cerrada: boolean,
    cerradaPor: string,
  ): Promise<void> {
    try {
      const db = this.firestore.obtenerDb();
      await setDoc(
        doc(db, COLECCION_CHAT, mesaId),
        {
          cerrada,
          cerradaPor,
          cerradaEn: cerrada ? new Date().toISOString() : '',
        },
        { merge: true },
      );
    } catch {
      // Ignorar fallas si la base está en modo offline o sin permisos
    }
  }
}
