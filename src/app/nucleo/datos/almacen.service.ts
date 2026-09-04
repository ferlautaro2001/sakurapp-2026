import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import { listMesas, listProductos, listUsuarios, connectorConfig } from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { CorreoEnviado, Mesa, Producto, Usuario } from '../modelos/modelos';
import { EstadoMesa, TipoMesa } from '../modelos/enums';
import { Semilla } from './semilla';

const CLAVE = {
  usuarios: 'sk.usuarios',
  productos: 'sk.productos',
  mesas: 'sk.mesas',
  correos: 'sk.correos',
  version: 'sk.version',
  sesion: 'sk.sesion',
};

const VERSION_DATOS = '3-v0';

/**
 * Repositorio de la aplicación conectado a Firebase Data Connect (Cloud SQL PostgreSQL).
 * Recupera los usuarios en vivo de la base de datos relacional y mantiene
 * soporte offline mediante Capacitor Preferences.
 */
@Injectable({ providedIn: 'root' })
export class AlmacenService {
  readonly usuarios = signal<Usuario[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly mesas = signal<Mesa[]>([]);
  readonly correos = signal<CorreoEnviado[]>([]);
  private iniciado = false;

  async iniciar(sembrar: () => Promise<Semilla> | Semilla): Promise<void> {
    if (this.iniciado) return;

    let usuariosCargados: Usuario[] = [];
    let productosCargados: Producto[] = [];
    let mesasCargadas: Mesa[] = [];

    // 1. Conexión a Firebase Data Connect (Cloud SQL PostgreSQL)
    try {
      const app = getApps().length ? getApp() : initializeApp(environment.firebase);
      const dc = getDataConnect(app, connectorConfig);
      const res = await listUsuarios(dc);

      if (res?.data?.users?.length) {
        usuariosCargados = res.data.users.map((u) => ({
          id: u.id,
          uid: u.uid,
          nombre: u.nombre,
          apellido: u.apellido ?? null,
          dni: u.dni ?? null,
          cuil: u.cuil ?? null,
          email: u.email ?? null,
          perfil: u.perfil,
          fotoUrl: u.fotoUrl,
          estado: u.estado,
          activo: true,
          clave: null,
          createdAt: u.createdAt,
        }));
        await this.guardar(CLAVE.usuarios, usuariosCargados);
      }
      const productos = await listProductos(dc);
      if (productos?.data?.productos?.length) {
        productosCargados = productos.data.productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          tiempoElaboracion: p.tiempoElaboracion,
          precio: p.precio,
          tipo: p.tipo,
          sector: p.sector,
          fotos: [p.foto1, p.foto2, p.foto3],
          activo: p.activo,
          disponible: true,
        }));
        await this.guardar(CLAVE.productos, productosCargados);
      }
      const mesasRes = await listMesas(dc);
      if (mesasRes?.data?.mesas?.length) {
        mesasCargadas = mesasRes.data.mesas.map((m) => ({
          id: m.id,
          numero: m.numero,
          cantidadComensales: m.cantidadComensales,
          tipo: m.tipo as TipoMesa,
          estado: m.estado as EstadoMesa,
          fotoUrl: m.fotoUrl,
          qrCodeUrl: m.qrCodeUrl,
        }));
        await this.guardar(CLAVE.mesas, mesasCargadas);
      }
    } catch (error) {
      console.warn('Conexión en vivo a Firebase Data Connect no disponible, utilizando almacenamiento local:', error);
    }

    // 2. Si no hay conexión o no se recuperaron datos, usar datos locales / semilla
    if (!usuariosCargados.length) {
      const version = await this.leerTexto(CLAVE.version);
      if (version !== VERSION_DATOS) {
        const semilla = await sembrar();
        await this.guardar(CLAVE.usuarios, semilla.usuarios);
        await Preferences.set({ key: CLAVE.version, value: VERSION_DATOS });
      }
      usuariosCargados = await this.leer<Usuario>(CLAVE.usuarios);
      productosCargados = await this.leer<Producto>(CLAVE.productos);
    }

    if (!mesasCargadas.length) {
      mesasCargadas = await this.leer<Mesa>(CLAVE.mesas);
    }

    const correosCargados = await this.leer<CorreoEnviado>(CLAVE.correos);

    this.usuarios.set(usuariosCargados);
    this.productos.set(productosCargados);
    this.mesas.set(mesasCargadas);
    this.correos.set(correosCargados);
    this.iniciado = true;
  }

  async guardarUsuarios(lista: Usuario[]): Promise<void> {
    this.usuarios.set(lista);
    await this.guardar(CLAVE.usuarios, lista);
  }

  async guardarProductos(lista: Producto[]): Promise<void> {
    this.productos.set(lista);
    await this.guardar(CLAVE.productos, lista);
  }

  async guardarMesas(lista: Mesa[]): Promise<void> {
    this.mesas.set(lista);
    await this.guardar(CLAVE.mesas, lista);
  }

  async guardarCorreos(lista: CorreoEnviado[]): Promise<void> {
    this.correos.set(lista);
    await this.guardar(CLAVE.correos, lista);
  }

  // --- sesión ------------------------------------------------------------

  async guardarSesion(usuarioId: string): Promise<void> {
    await Preferences.set({ key: CLAVE.sesion, value: usuarioId });
  }

  async leerSesion(): Promise<string | null> {
    return this.leerTexto(CLAVE.sesion);
  }

  async borrarSesion(): Promise<void> {
    await Preferences.remove({ key: CLAVE.sesion });
  }

  // --- helpers privados --------------------------------------------------

  private async guardar<T>(clave: string, valor: T[]): Promise<void> {
    await Preferences.set({ key: clave, value: JSON.stringify(valor) });
  }

  private async leer<T>(clave: string): Promise<T[]> {
    const res = await Preferences.get({ key: clave });
    if (!res.value) return [];
    try {
      return JSON.parse(res.value) as T[];
    } catch {
      return [];
    }
  }

  private async leerTexto(clave: string): Promise<string | null> {
    const res = await Preferences.get({ key: clave });
    return res.value ?? null;
  }
}
