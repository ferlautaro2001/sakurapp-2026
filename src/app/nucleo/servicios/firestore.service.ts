import { Injectable, inject } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { Usuario } from '../modelos/modelos';
import { EstadoUsuario, Perfil } from '../modelos/enums';

export interface NotificacionCola {
  id?: string;
  destinatarioRol?: Perfil;
  destinatarioUid?: string;
  destinatarioEmail?: string;
  titulo: string;
  cuerpo: string;
  ruta?: string;
  estado: 'PENDIENTE' | 'ENVIADO' | 'SIN_TOKENS' | 'ERROR';
  creadoEn: string;
  procesadoEn?: string;
}

/**
 * Servicio central de Cloud Firestore conectado a la base de datos 'sakurapp'.
 * Proporciona sincronización en tiempo real (onSnapshot), persistencia de tokens FCM
 * y encolado de notificaciones para despacho serverless 24/7.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private db: Firestore | null = null;

  constructor() {
    this.obtenerDb();
  }

  obtenerDb(): Firestore {
    if (this.db) return this.db;
    const app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.db = getFirestore(app, 'sakurapp');
    return this.db;
  }

  /**
   * Escucha en tiempo real la colección de usuarios.
   * Cualquier cambio (aprobación, nuevo registro, actualización de token) se recibe de inmediato.
   */
  escucharUsuarios(callback: (usuarios: Usuario[]) => void): Unsubscribe {
    const db = this.obtenerDb();
    const colRef = collection(db, 'usuarios');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const lista: Usuario[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          lista.push({
            id: docSnap.id,
            uid: data['uid'] || docSnap.id,
            nombre: data['nombre'] || '',
            apellido: data['apellido'] || null,
            dni: data['dni'] || null,
            cuil: data['cuil'] || null,
            email: data['email'] || null,
            perfil: (data['perfil'] as Perfil) || 'CLIENTE_REGISTRADO',
            fotoUrl: data['fotoUrl'] || 'assets/icon/sushis/sushi-7.png',
            estado: (data['estado'] as EstadoUsuario) || 'PENDIENTE',
            activo: data['activo'] !== false,
            clave: null,
            fcmToken: data['fcmToken'] || null,
            createdAt: data['createdAt'] || new Date().toISOString(),
          });
        });
        callback(lista);
      },
      (error) => {
        console.warn('⚠️ Error en listener en tiempo real de Firestore (sakurapp):', error);
      }
    );
  }

  /**
   * Guarda o actualiza un usuario en la colección 'usuarios' de Firestore.
   */
  async guardarUsuario(usuario: Usuario): Promise<void> {
    try {
      const db = this.obtenerDb();
      const userRef = doc(db, 'usuarios', usuario.uid || usuario.id);
      await setDoc(
        userRef,
        {
          id: usuario.id,
          uid: usuario.uid,
          nombre: usuario.nombre,
          apellido: usuario.apellido ?? null,
          dni: usuario.dni ?? null,
          cuil: usuario.cuil ?? null,
          email: usuario.email ?? null,
          perfil: usuario.perfil,
          fotoUrl: usuario.fotoUrl,
          estado: usuario.estado,
          activo: usuario.activo,
          updatedAt: new Date().toISOString(),
          createdAt: usuario.createdAt,
        },
        { merge: true }
      );
      console.log(`✅ Usuario ${usuario.email || usuario.nombre} sincronizado en Firestore (sakurapp)`);
    } catch (err) {
      console.warn('⚠️ Error al sincronizar usuario en Firestore:', err);
    }
  }

  /**
   * Registra el token FCM del dispositivo en el documento del usuario.
   */
  async registrarFcmToken(uid: string, token: string): Promise<void> {
    try {
      const db = this.obtenerDb();
      const userRef = doc(db, 'usuarios', uid);
      await setDoc(
        userRef,
        {
          fcmToken: token,
          pushToken: token,
          fcmActualizadoEn: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`📲 Token FCM registrado en Firestore para UID ${uid}: ${token.substring(0, 15)}...`);
    } catch (err) {
      console.warn('⚠️ Error al registrar token FCM en Firestore:', err);
    }
  }

  /**
   * Actualiza el estado (APROBADO / RECHAZADO) de un usuario en Firestore en tiempo real.
   */
  async actualizarEstadoUsuario(usuarioIdOrUid: string, estado: EstadoUsuario): Promise<void> {
    try {
      const db = this.obtenerDb();
      const userRef = doc(db, 'usuarios', usuarioIdOrUid);
      await updateDoc(userRef, {
        estado,
        estadoActualizadoEn: new Date().toISOString(),
      });
      console.log(`✅ Estado de ${usuarioIdOrUid} actualizado a ${estado} en Firestore (sakurapp)`);
    } catch (err) {
      console.warn('⚠️ Error actualizando estado en Firestore:', err);
    }
  }

  /**
   * Encola una notificación push en 'notificaciones_cola'.
   * La Cloud Function en Google Cloud la detecta y la envía a FCM en milisegundos.
   */
  async encolarNotificacion(datos: Omit<NotificacionCola, 'estado' | 'creadoEn'>): Promise<string | null> {
    try {
      const db = this.obtenerDb();
      const colaRef = collection(db, 'notificaciones_cola');
      const docRef = await addDoc(colaRef, {
        ...datos,
        estado: 'PENDIENTE',
        creadoEn: new Date().toISOString(),
      });
      console.log(`🚀 Notificación encolada exitosamente para despacho: ${datos.titulo} (ID: ${docRef.id})`);
      return docRef.id;
    } catch (err) {
      console.warn('⚠️ Error encolando notificación en Firestore:', err);
      return null;
    }
  }
}
