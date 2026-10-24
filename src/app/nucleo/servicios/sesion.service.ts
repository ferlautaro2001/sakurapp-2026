import { Capacitor } from '@capacitor/core';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, getRedirectResult, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut } from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { AlmacenService } from '../datos/almacen.service';
import { Mesa, Usuario } from '../modelos/modelos';
import { PERFILES_ADMIN, Perfil } from '../modelos/enums';
import { UsuariosService } from './usuarios.service';
import { NotificacionesService } from './notificaciones.service';
import { FirestoreService } from './firestore.service';

export type ResultadoIngreso =
  | { ok: true; usuario: Usuario }
  | { ok: false; motivo: 'CREDENCIALES' | 'PENDIENTE' | 'RECHAZADO' | 'INACTIVO' | 'SERVICIO' | 'SIN_CUENTA' };

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
  /** Desde cuándo está sentado: separa los pedidos de esta visita de los de visitas anteriores. */
  readonly mesaActivaDesde = signal<string | null>(null);
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

  /**
   * US-12.1 · Ingreso con la cuenta de Google, disponible para todos los
   * perfiles. La identidad la valida Google; la cuenta de SakurApp se asocia
   * por el correo: el mismo que usa el ingreso con contraseña. El estado de la
   * cuenta (en revisión, rechazada, inactiva) lo decide `abrirSesion`, igual
   * que en el ingreso clásico.
   *
   * La pantalla de Google no se puede decorar —es suya y lo prohíbe—, por eso
   * la presentación la elegimos nosotros: en navegador abre en una ventana
   * chica sobre el login, y en el teléfono la redirección sale al navegador
   * del sistema, donde el botón Atrás vuelve a la aplicación.
   */
  async ingresarConGoogle(): Promise<ResultadoIngreso> {
    let email: string | null = null;
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const auth = getAuth(app);

      if (Capacitor.isNativePlatform()) {
        // El WebView nativo bloquea popups y Google no negocia adentro de uno:
        // el circuito del teléfono es redirección completa al navegador del
        // sistema, donde el botón Atrás vuelve a la aplicación. El regreso lo
        // cierra `restaurar`.
        await signInWithRedirect(auth, new GoogleAuthProvider());
        return { ok: false, motivo: 'SERVICIO' };
      }

      try {
        const credencial = await signInWithPopup(auth, new GoogleAuthProvider());
        email = (credencial.user.email ?? '').trim().toLocaleLowerCase() || null;
      } catch (err) {
        // En un navegador que bloquea popups —visores embebidos, por ejemplo—
        // la única salida es la redirección completa, igual que en el teléfono.
        if ((err as { code?: string } | null)?.code !== 'auth/popup-blocked') throw err;
        await signInWithRedirect(auth, new GoogleAuthProvider());
        return { ok: false, motivo: 'SERVICIO' };
      }
    } catch (err) {
      console.warn('⚠️ El ingreso con Google no pudo completarse:', err);
      return { ok: false, motivo: 'SERVICIO' };
    }

    // Google siempre devuelve el correo de la cuenta elegida: si no vino, no
    // hay con qué asociarla a la base, y si no está en la base, el perfil
    // social no abre sesión por sí solo.
    if (!email) return { ok: false, motivo: 'SIN_CUENTA' };

    const usuario = this.usuarios.porCorreo(email);
    if (!usuario) return { ok: false, motivo: 'SIN_CUENTA' };

    return this.abrirSesion(usuario);
  }

  /**
   * Cierra el flujo que se fue por redirección: cuando Google vuelve a la
   * aplicación trae la identidad en la URL, y `getRedirectResult` la levanta
   * una sola vez al arrancar.
   */
  private async redireccionGoogle(): Promise<string | null> {
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const resultado = await getRedirectResult(getAuth(app));
      return (resultado?.user?.email ?? '').trim().toLocaleLowerCase() || null;
    } catch (err) {
      console.warn('⚠️ El regreso de Google no pudo completarse:', err);
      return null;
    }
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
    const desde = new Date().toISOString();
    this.mesaActivaId.set(mesaId);
    this.mesaActivaNumero.set(mesaNumero);
    this.mesaActivaDesde.set(desde);
    try {
      await Preferences.set({ key: 'sk.mesa_activa_id', value: mesaId });
      await Preferences.set({ key: 'sk.mesa_activa_numero', value: String(mesaNumero) });
      await Preferences.set({ key: 'sk.mesa_activa_desde', value: desde });
    } catch {
      // Entorno no nativo: almacenamiento reactivo en memoria
    }
  }

  /** Limpia la vinculación con la mesa activa. */
  async limpiarMesaActiva(): Promise<void> {
    this.mesaActivaId.set(null);
    this.mesaActivaNumero.set(null);
    this.mesaActivaDesde.set(null);
    try {
      await Preferences.remove({ key: 'sk.mesa_activa_id' });
      await Preferences.remove({ key: 'sk.mesa_activa_numero' });
      await Preferences.remove({ key: 'sk.mesa_activa_desde' });
    } catch {
      //
    }
  }

  /** Recupera la sesión guardada al abrir la aplicación. */
  async restaurar(): Promise<Usuario | null> {
    // Si el arranque es el regreso de una redirección de Google, el ingreso
    // termina acá: la identidad viene validada y se asocia igual que siempre.
    const emailGoogle = await this.redireccionGoogle();
    if (emailGoogle && !this.usuario()) {
      const usuarioGoogle = this.usuarios.porCorreo(emailGoogle);
      if (usuarioGoogle) await this.abrirSesion(usuarioGoogle);
    }

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
      const desde = (await Preferences.get({ key: 'sk.mesa_activa_desde' })).value;
      if (mesaId && mesaNum) {
        this.mesaActivaId.set(mesaId);
        this.mesaActivaNumero.set(Number(mesaNum));
        // Una sesión guardada antes de este cambio no trae la hora: vale
        // cualquier pedido, como antes. Cada vinculación nueva ya la guarda.
        this.mesaActivaDesde.set(desde ?? '');
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
    // La sesión social vive en Authentication: si no se cierra allá, el
    // próximo ingreso reusaría la cuenta de Google sin preguntar quién entra.
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      await signOut(getAuth(app));
    } catch {
      // No había sesión de Authentication abierta (acceso rápido, invitado).
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
   * pantalla donde trabaja. 
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

