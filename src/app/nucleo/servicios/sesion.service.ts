import { Injectable, computed, inject, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { AlmacenService } from '../datos/almacen.service';
import { Usuario } from '../modelos/modelos';
import { PERFILES_ADMIN, Perfil } from '../modelos/enums';
import { UsuariosService } from './usuarios.service';
import { NotificacionesService } from './notificaciones.service';

export type ResultadoIngreso =
  | { ok: true; usuario: Usuario }
  | { ok: false; motivo: 'CREDENCIALES' | 'PENDIENTE' | 'RECHAZADO' | 'INACTIVO' };

/** Sesión abierta y persistencia de credenciales para v0. */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly almacen = inject(AlmacenService);
  private readonly usuarios = inject(UsuariosService);
  private readonly notificaciones = inject(NotificacionesService);

  readonly usuario = signal<Usuario | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);
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
    this.notificaciones.registrarSesion(usuario.id);
    await this.almacen.guardarSesion(usuario.id);
    return { ok: true, usuario };
  }

  /** Recupera la sesión guardada al abrir la aplicación. */
  async restaurar(): Promise<Usuario | null> {
    const id = await this.almacen.leerSesion();
    if (!id) return null;
    const usuario = this.usuarios.porId(id);
    if (!usuario || !usuario.activo || usuario.estado !== 'APROBADO') {
      this.notificaciones.registrarSesion(null);
      await this.almacen.borrarSesion();
      return null;
    }
    this.usuario.set(usuario);
    this.notificaciones.registrarSesion(usuario.id);
    return usuario;
  }

  /** Cierra la sesión y borra la credencial guardada en el dispositivo. */
  async cerrar(): Promise<void> {
    this.usuario.set(null);
    this.notificaciones.registrarSesion(null);
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
      case 'MOZO':
        return '/mesas';
      case 'COCINERO':
        return '/cocinero/alta-plato';
      case 'CANTINERO':
        return '/cantinero/alta-bebida';
      case 'CLIENTE_REGISTRADO':
      case 'CLIENTE_ANONIMO':
        return '/en-preparacion';
      default:
        return '/login';
    }
  }
}

