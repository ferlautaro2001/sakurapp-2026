import { Injectable, inject } from '@angular/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { nuevoId } from '../datos/semilla';
import { RolMensaje } from '../modelos/enums';
import { MensajeChat, Mesa, Usuario } from '../modelos/modelos';
import { FirestoreService } from './firestore.service';
import { NotificacionesService } from './notificaciones.service';

/** Colección base de conversaciones por mesa en Firestore ('sakurapp'). */
const COLECCION_CHAT = 'conversaciones_chat';

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
  private audioCtx: AudioContext | null = null;

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
          const msj: MensajeChat = {
            id: docSnap.id,
            mesaId: d['mesaId'] || mesaId,
            mesaNumero: Number(d['mesaNumero']) || 0,
            remitenteId: d['remitenteId'] || '',
            remitenteNombre: d['remitenteNombre'] || 'Usuario',
            remitenteRol: (d['remitenteRol'] as RolMensaje) || 'CLIENTE',
            texto: d['texto'] || '',
            timestamp: d['timestamp'] || new Date().toISOString(),
            leido: Boolean(d['leido']),
          };
          mensajes.push(msj);
        });

        // Orden cronológico ascendente (los más viejos arriba, más recientes abajo)
        mensajes.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

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
      },
      { merge: true },
    );

    // 3. Despacho de Notificaciones Push (TASK-6.2.1.2 & TASK-6.2.2.1)
    if (!esMozo) {
      // Consulta del comensal: Notificar a todos los mozos en servicio
      await this.firestore.encolarNotificacion({
        destinatarioRol: 'MOZO',
        titulo: `Consulta en Mesa ${mesa.numero}`,
        cuerpo: `${remitenteNombre}: ${textoLimpio}`,
        ruta: `/mesas/${mesa.id}/chat`,
      });
    } else {
      // Respuesta del mozo: Notificar al comensal de la mesa
      const destinatarioUid = clienteDestinatarioUid || (mesa as any).clienteActual?.uid;
      if (destinatarioUid) {
        await this.firestore.encolarNotificacion({
          destinatarioUid,
          titulo: `Mozo ${remitenteNombre} · Mesa ${mesa.numero}`,
          cuerpo: textoLimpio,
          ruta: `/mesas/${mesa.id}/chat`,
        });
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
}
