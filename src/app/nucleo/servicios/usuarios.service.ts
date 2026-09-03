import { Injectable, computed, inject } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUsuario, Perfil as DcPerfil, EstadoUsuario as DcEstado } from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { AlmacenService } from '../datos/almacen.service';
import { AlmacenamientoService } from './almacenamiento.service';
import { Usuario, AltaCliente } from '../modelos/modelos';
import { Perfil } from '../modelos/enums';

const ORDEN_PERFIL: Perfil[] = [
  'DUENO',
  'SUPERVISOR',
  'METRE',
  'MOZO',
  'COCINERO',
  'CANTINERO',
  'CLIENTE_REGISTRADO',
  'CLIENTE_ANONIMO',
];

/** Gestión de usuarios para v0: consulta y perfiles de acceso rápido. */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly almacen = inject(AlmacenService);
  private readonly almacenamiento = inject(AlmacenamientoService);

  readonly todos = computed(() => this.almacen.usuarios());

  /** Perfiles que se ofrecen en el ingreso rápido del login (exactamente 1 por perfil). */
  readonly perfilesRapidos = computed(() =>
    this.almacen
      .usuarios()
      .filter((u) => u.activo && u.estado === 'APROBADO')
      .filter((u, i, todos) => todos.findIndex((o) => o.perfil === u.perfil) === i)
      .sort((a, b) => ORDEN_PERFIL.indexOf(a.perfil) - ORDEN_PERFIL.indexOf(b.perfil)),
  );

  porId(id: string): Usuario | undefined {
    return this.almacen.usuarios().find((u) => u.id === id);
  }

  porCorreo(email: string): Usuario | undefined {
    const buscado = email.trim().toLocaleLowerCase();
    return this.almacen.usuarios().find((u) => (u.email ?? '').toLocaleLowerCase() === buscado);
  }

  /** Nombre completo listo para mostrar. */
  nombreCompleto(usuario: Usuario | undefined | null): string {
    if (!usuario) return '';
    return `${usuario.nombre} ${usuario.apellido ?? ''}`.trim();
  }

  /** Iniciales para el avatar. */
  iniciales(usuario: Usuario | undefined | null): string {
    if (!usuario) return '';
    const primera = usuario.nombre.charAt(0);
    const segunda = (usuario.apellido ?? usuario.nombre.charAt(1) ?? '').charAt(0);
    return `${primera}${segunda}`.toLocaleUpperCase('es-AR');
  }

  /** Color del avatar, estable para un mismo usuario. */
  colorAvatar(usuario: Usuario | undefined | null): string {
    if (!usuario) return 'var(--avatar-1)';
    const suma = [...usuario.id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return `var(--avatar-${(suma % 6) + 1})`;
  }

  existeCorreo(email: string): boolean {
    const buscado = email.trim().toLocaleLowerCase();
    return this.almacen.usuarios().some((u) => (u.email ?? '').toLocaleLowerCase() === buscado);
  }

  existeDocumento(dni: string): boolean {
    const limpio = dni.replace(/\./g, '').trim();
    return this.almacen.usuarios().some((u) => (u.dni ?? '').replace(/\./g, '') === limpio);
  }

  existeCuil(cuil: string): boolean {
    const limpio = cuil.replace(/\D/g, '');
    if (!limpio) return false;
    return this.almacen.usuarios().some((u) => (u.cuil ?? '').replace(/\D/g, '') === limpio);
  }

  administradores(): Usuario[] {
    return this.almacen.usuarios().filter((u) => u.perfil === 'DUENO' || u.perfil === 'SUPERVISOR');
  }

  async crearClienteRegistrado(datos: AltaCliente): Promise<Usuario> {
    let uid = `uid-${Date.now()}`;
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const auth = getAuth(app);
      const cred = await createUserWithEmailAndPassword(auth, datos.email.trim(), datos.clave);
      uid = cred.user.uid;
    } catch (err) {
      console.warn('Firebase Auth registro:', err);
    }

    // Subir foto a Firebase Cloud Storage
    let urlFoto = datos.fotoUrl || 'assets/icon/sushis/sushi-7.png';
    if (datos.fotoUrl && datos.fotoUrl.startsWith('data:')) {
      try {
        urlFoto = await this.almacenamiento.subirFoto(`usuarios/${uid}/perfil.jpg`, datos.fotoUrl);
      } catch (storageErr) {
        console.warn('⚠️ Fallback resiliente: No se pudo subir foto a Firebase Storage, usando avatar por defecto:', storageErr);
        urlFoto = 'assets/icon/sushis/sushi-7.png';
      }
    }

    const usuario: Usuario = {
      id: `usr-${Date.now()}`,
      uid,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      dni: opcional(datos.dni),
      // Vacío no: en Postgres dos cadenas '' chocan contra el índice único,
      // mientras que dos NULL conviven sin problema.
      cuil: opcional(datos.cuil),
      email: datos.email.trim().toLocaleLowerCase(),
      perfil: 'CLIENTE_REGISTRADO',
      fotoUrl: urlFoto,
      estado: 'PENDIENTE',
      activo: true,
      clave: datos.clave,
      createdAt: new Date().toISOString(),
    };

    // Inserción en Firebase Data Connect (Cloud SQL PostgreSQL)
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const dc = getDataConnect(app, connectorConfig);
      const res = await createUsuario(dc, {
        uid,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        dni: usuario.dni,
        cuil: usuario.cuil,
        email: usuario.email,
        perfil: DcPerfil.CLIENTE_REGISTRADO,
        fotoUrl: usuario.fotoUrl,
        estado: DcEstado.PENDIENTE,
      });
      if (res?.data?.user_insert?.id) {
        usuario.id = res.data.user_insert.id;
      }
      console.log('✅ Usuario cliente registrado exitosamente en Cloud SQL PostgreSQL (Data Connect) con foto en Storage');
    } catch (sqlErr) {
      console.warn('⚠️ No se pudo registrar en Cloud SQL Data Connect (se mantiene en almacenamiento local):', sqlErr);
    }

    await this.almacen.guardarUsuarios([...this.almacen.usuarios(), usuario]);
    return usuario;
  }

  async crearClienteAnonimo(nombre: string, fotoUrl: string): Promise<Usuario> {
    let uid = `uid-${Date.now()}`;
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const auth = getAuth(app);
      const cred = await signInAnonymously(auth);
      uid = cred.user.uid;
    } catch (err) {
      console.warn('Firebase Auth anónimo:', err);
    }

    // Subir foto a Firebase Cloud Storage
    let urlFoto = fotoUrl || 'assets/icon/sushis/sushi-5.png';
    if (fotoUrl && fotoUrl.startsWith('data:')) {
      try {
        urlFoto = await this.almacenamiento.subirFoto(`usuarios/${uid}/perfil.jpg`, fotoUrl);
      } catch (storageErr) {
        console.warn('⚠️ Fallback resiliente: No se pudo subir foto de invitado a Storage, usando avatar por defecto:', storageErr);
        urlFoto = 'assets/icon/sushis/sushi-5.png';
      }
    }

    const usuario: Usuario = {
      id: `usr-${Date.now()}`,
      uid,
      nombre: nombre.trim(),
      apellido: null,
      dni: null,
      cuil: null,
      email: null,
      perfil: 'CLIENTE_ANONIMO',
      fotoUrl: urlFoto,
      estado: 'APROBADO',
      activo: true,
      clave: null,
      createdAt: new Date().toISOString(),
    };

    // Inserción en Firebase Data Connect (Cloud SQL PostgreSQL)
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const dc = getDataConnect(app, connectorConfig);
      const res = await createUsuario(dc, {
        uid: usuario.uid,
        nombre: usuario.nombre,
        apellido: null,
        dni: null,
        cuil: null,
        email: null,
        perfil: DcPerfil.CLIENTE_ANONIMO,
        fotoUrl: usuario.fotoUrl,
        estado: DcEstado.APROBADO,
      });
      if (res?.data?.user_insert?.id) {
        usuario.id = res.data.user_insert.id;
      }
      console.log('✅ Cliente anónimo registrado exitosamente en Cloud SQL PostgreSQL (Data Connect) con foto en Storage');
    } catch (sqlErr) {
      console.warn('⚠️ No se pudo registrar cliente anónimo en Cloud SQL Data Connect (se mantiene local):', sqlErr);
    }

    await this.almacen.guardarUsuarios([...this.almacen.usuarios(), usuario]);
    return usuario;
  }

  /** Ícono de sushi para el avatar. */
  avatarSushi(usuario: Usuario | undefined | null): string {
    if (!usuario) return 'assets/icon/sushis/sushi-1.png';
    if (usuario.fotoUrl && usuario.fotoUrl.trim() !== '') return usuario.fotoUrl;
    return SUSHIS_POR_PERFIL[usuario.perfil] ?? 'assets/icon/sushis/sushi-1.png';
  }
}

/** Normaliza un campo de texto opcional: vacío se guarda como NULL, no como ''. */
function opcional(valor: string | null | undefined): string | null {
  const limpio = (valor ?? '').trim();
  return limpio === '' ? null : limpio;
}

const SUSHIS_POR_PERFIL: Record<Perfil, string> = {
  DUENO: 'assets/icon/sushis/sushi-1.png',
  SUPERVISOR: 'assets/icon/sushis/sushi-2.png',
  METRE: 'assets/icon/sushis/sushi-3.png',
  MOZO: 'assets/icon/sushis/sushi-4.png',
  COCINERO: 'assets/icon/sushis/sushi-5.png',
  CANTINERO: 'assets/icon/sushis/sushi-6.png',
  CLIENTE_REGISTRADO: 'assets/icon/sushis/sushi-7.png',
  CLIENTE_ANONIMO: 'assets/icon/sushis/sushi-8.png',
};

