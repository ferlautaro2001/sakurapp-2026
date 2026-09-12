import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { AlmacenService } from '../datos/almacen.service';
import { Mesa, Usuario } from '../modelos/modelos';
import { PERFILES_ADMIN, Perfil } from '../modelos/enums';
import { UsuariosService } from './usuarios.service';
import { NotificacionesService } from './notificaciones.service';
import { FirestoreService } from './firestore.service';

export type ResultadoIngreso =
  | { ok: true; usuario: Usuario }
  | { ok: false; motivo: 'CREDENCIALES' | 'PENDIENTE' | 'RECHAZADO' | 'INACTIVO' | 'SERVICIO' };

/**
 * Códigos con los que Firebase Authentication dice "esta contraseña está mal".
 *
 * Cualquier otro error suyo no habla del usuario sino de que no se lo pudo
 * verificar, y no se le puede echar la culpa a él: la clave del proyecto
 * vencida, la red caída, o que la cuenta exista en la base pero no allá.
 *
 * `auth/user-not-found` queda deliberadamente afuera: quién es usuario lo dice
 * la base, no Authentication. Si alguien está en la base y no allá, es un alta
 * que quedó a medias —el registro se traga el error de Authentication y guarda
 * igual—, no una contraseña equivocada.
 */
const ERRORES_DE_CREDENCIAL = new Set([
  'auth/wrong-password',
  'auth/invalid-credential',
  'auth/invalid-email',
  'auth/user-disabled',
]);

function esErrorDeCredencial(error: unknown): boolean {
  const codigo = (error as { code?: string } | null)?.code;
  return typeof codigo === 'string' && ERRORES_DE_CREDENCIAL.has(codigo);
}

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

  tienePerfil(...perfiles: Perfil[]): boolean {
    const u = this.usuario();
    return u !== null && perfiles.includes(u.perfil);
  }

  mesa(): Mesa | undefined {
    const id = this.mesaActivaId();
    if (!id) return undefined;
    return this.almacen.mesas().find((m) => m.id === id);
  }


  /** Ingreso con correo electrónico y contraseña, validados contra Firebase Authentication. */
  async ingresar(email: string, clave: string): Promise<ResultadoIngreso> {
    const buscado = email.trim().toLocaleLowerCase();
    const usuario = this.usuarios.porCorreo(buscado);

    if (!usuario) return { ok: false, motivo: 'CREDENCIALES' };

    // 1. Firebase Authentication manda cuando responde.
    let validado = false;
    let servicioCaido = false;
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, buscado, clave);
      validado = true;
    } catch (err) {
      // La contraseña vive sólo en Authentication —la base guarda `clave` en
      // nulo a propósito—, así que acá no hay con qué comparar: lo único que
      // se puede saber es si el que dijo que no fue el servicio o la clave.
      servicioCaido = !esErrorDeCredencial(err);
      if (servicioCaido) {
        console.warn('⚠️ Firebase Auth no pudo verificar el ingreso:', err);
      }
    }

    if (!validado) {
      // Una cuenta en revisión o rechazada no abre ninguna sesión: lo único
      // que falta es explicarle por qué no puede entrar, y eso no depende de
      // la contraseña. Se le muestra su pantalla aunque Authentication no la
      // haya podido confirmar —muchas de estas cuentas ni siquiera existen
      // allá, porque el alta se guarda igual cuando Authentication falla—.
      // Dejarla en "los datos son incorrectos" sería mentirle: sus datos
      // están bien, lo que pasa es que todavía no la aprobaron.
      if (usuario.estado === 'PENDIENTE') return { ok: false, motivo: 'PENDIENTE' };
      if (usuario.estado === 'RECHAZADO') return { ok: false, motivo: 'RECHAZADO' };

      // Una cuenta aprobada sí abriría sesión, y para eso la contraseña tiene
      // que estar verificada de verdad. Si el servicio no contestó se lo
      // decimos como es; si contestó que no, es que la contraseña está mal.
      return { ok: false, motivo: servicioCaido ? 'SERVICIO' : 'CREDENCIALES' };
    }

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
        return '/dueno/registros';
      case 'METRE':
        return '/metre/espera';
      case 'MOZO':
        return '/mozo/pedidos';
      case 'COCINERO':
      case 'CANTINERO':
        return '/sector/pedidos';
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

