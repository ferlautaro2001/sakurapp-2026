import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { AlmacenService } from '../datos/almacen.service';
import { Usuario } from '../modelos/modelos';
import { PERFILES_ADMIN, Perfil } from '../modelos/enums';
import { UsuariosService } from './usuarios.service';
import { NotificacionesService } from './notificaciones.service';
import { FirestoreService } from './firestore.service';

export type ResultadoIngreso =
  | { ok: true; usuario: Usuario }
  | { ok: false; motivo: 'CREDENCIALES' | 'PENDIENTE' | 'RECHAZADO' | 'INACTIVO' };

/** Sesión abierta y persistencia de credenciales para v0. */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly almacen = inject(AlmacenService);
  private readonly usuarios = inject(UsuariosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly firestore = inject(FirestoreService);

  readonly usuario = signal<Usuario | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);
  readonly mesaActivaId = signal<string | null>(null);
  readonly mesaActivaNumero = signal<number | null>(null);
  readonly esAdministrador = computed(() => {
    const u = this.usuario();
    return u !== null && PERFILES_ADMIN.includes(u.perfil);
  });
  readonly esCliente = computed(() => {
    const u = this.usuario();
    return u?.perfil === 'CLIENTE_REGISTRADO' || u?.perfil === 'CLIENTE_ANONIMO';
  });


  /** Ingreso estricto con correo electrónico y contraseña validados contra Firebase Authentication. */
  async ingresar(email: string, clave: string): Promise<ResultadoIngreso> {
    const buscado = email.trim().toLocaleLowerCase();
    const usuario = this.usuarios.porCorreo(buscado);

    if (!usuario) return { ok: false, motivo: 'CREDENCIALES' };

    // 1. Validar estrictamente contra Firebase Authentication
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, buscado, clave);
    } catch (err) {
      // Si Firebase Auth rechaza la contraseña o no existe la cuenta, no se permite el ingreso
      return { ok: false, motivo: 'CREDENCIALES' };
    }

    // 2. Abrir sesión verificando el estado de la cuenta en la base relacional
    return this.abrirSesion(usuario);
  }

  /** Ingreso rápido desde la tarjeta de perfil del login. */
  async ingresarComo(usuario: Usuario): Promise<ResultadoIngreso> {
    return this.abrirSesion(usuario);
  }

  private async abrirSesion(usuario: Usuario): Promise<ResultadoIngreso> {
    if (!usuario.activo) return { ok: false, motivo: 'INACTIVO' };
    if (usuario.estado === 'PENDIENTE') return { ok: false, motivo: 'PENDIENTE' };
    if (usuario.estado === 'RECHAZADO') return { ok: false, motivo: 'RECHAZADO' };

    this.usuario.set(usuario);

    await this.firestore.guardarUsuario(usuario);

    this.notificaciones.registrarSesion(
      usuario.uid || usuario.id,
      usuario.perfil,
    );

    await this.almacen.guardarSesion(usuario);

    return { ok: true, usuario };
  }

  /** Almacena la sesión de mesa activa en el estado local del cliente (TASK-5.3.2.2). */
  async establecerMesaActiva(mesaId: string, mesaNumero: number): Promise<void> {
    this.mesaActivaId.set(mesaId);
    this.mesaActivaNumero.set(mesaNumero);
    try {
      await Preferences.set({ key: 'sk.mesa_activa_id', value: mesaId });
      await Preferences.set({ key: 'sk.mesa_activa_numero', value: String(mesaNumero) });
    } catch {
      // Entorno no nativo: almacenamiento reactivo en memoria
    }
  }

  /** Limpia la vinculación con la mesa activa. */
  async limpiarMesaActiva(): Promise<void> {
    this.mesaActivaId.set(null);
    this.mesaActivaNumero.set(null);
    try {
      await Preferences.remove({ key: 'sk.mesa_activa_id' });
      await Preferences.remove({ key: 'sk.mesa_activa_numero' });
    } catch {
      //
    }
  }

  /** Recupera la sesión guardada al abrir la aplicación. */
  async restaurar(): Promise<Usuario | null> {
    const id = await this.almacen.leerSesion();
    if (!id) return null;

    let usuario = this.usuarios.porId(id) || this.almacen.usuarios().find((u) => u.id === id || u.uid === id);
    if (!usuario) {
      const enCache = await this.almacen.leerSesionUsuario();
      if (enCache) usuario = enCache;
    }

    if (!usuario || !usuario.activo) {
      return null;
    }

    this.usuario.set(usuario);

    await this.firestore.guardarUsuario(usuario);

    this.notificaciones.registrarSesion(
      usuario.uid || usuario.id,
      usuario.perfil,
    );

    try {
      const mesaId = (await Preferences.get({ key: 'sk.mesa_activa_id' })).value;
      const mesaNum = (await Preferences.get({ key: 'sk.mesa_activa_numero' })).value;
      if (mesaId && mesaNum) {
        this.mesaActivaId.set(mesaId);
        this.mesaActivaNumero.set(Number(mesaNum));
      }
    } catch {
      //
    }

    return usuario;
  }

  /** Cierra la sesión y borra la credencial guardada en el dispositivo. */
  async cerrar(): Promise<void> {
    const actual = this.usuario();
    if (actual) {
      void this.firestore.removerFcmToken(actual.uid || actual.id);
    }
    this.usuario.set(null);
    this.notificaciones.registrarSesion(null, null);
    await this.limpiarMesaActiva();
    await this.almacen.borrarSesion();
  }


  /**
   * Pantalla de inicio de cada perfil.
   *
   * No hay tablero intermedio: quien inicia sesión aparece directamente en la
   * pantalla donde trabaja. Las secciones que todavía está desarrollando el
   * resto del grupo caen en la pantalla provisoria; a medida que se suban, se
   * reemplaza cada `/en-preparacion` por su ruta real.
   */
  rutaInicio(perfil?: Perfil): string {
    const p = perfil ?? this.usuario()?.perfil;
    switch (p) {
      case 'DUENO':
      case 'SUPERVISOR':
        return '/clientes-pendientes';
      case 'METRE':
        return '/metre/espera';
      case 'MOZO':
        return '/mozo/pedidos';
      case 'COCINERO':
      case 'CANTINERO':
        return '/carta';
      case 'CLIENTE_REGISTRADO':
      case 'CLIENTE_ANONIMO':
        // US-5.1 · lo primero y lo único que puede hacer el comensal es
        // escanear el código de ingreso al salón.
        return '/cliente/ingreso';
      default:
        return '/login';
    }
  }
}

