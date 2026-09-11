import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import { listMesas, listProductos, listUsuarios, connectorConfig } from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { CorreoEnviado, Mesa, Producto, Usuario } from '../modelos/modelos';
import { EstadoMesa, TipoMesa } from '../modelos/enums';
import { Semilla } from './semilla';
import { FirestoreService } from '../servicios/firestore.service';

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
  private readonly firestore = inject(FirestoreService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly mesas = signal<Mesa[]>([]);
  readonly correos = signal<CorreoEnviado[]>([]);
  private iniciado = false;
  private inicioEnCurso?: Promise<void>;
  private desuscribirUsuarios?: () => void;
  private desuscribirMesas?: () => void;
  private desuscribirProductos?: () => void;

  async iniciar(sembrar: () => Promise<Semilla> | Semilla): Promise<void> {
    if (this.iniciado) return;
    if (this.inicioEnCurso) return this.inicioEnCurso;

    this.inicioEnCurso = (async () => {
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
          const mesasDc = mesasRes.data.mesas.map((m) => ({
            id: m.id,
            numero: m.numero,
            cantidadComensales: m.cantidadComensales,
            tipo: m.tipo as TipoMesa,
            estado: m.estado as EstadoMesa,
            fotoUrl: m.fotoUrl,
            qrCodeUrl: m.qrCodeUrl,
          }));
          const mesasLocales = await this.leer<Mesa>(CLAVE.mesas);
          const mapaMesas = new Map<number, Mesa>();
          for (const m of mesasLocales) {
            mapaMesas.set(m.numero, m);
          }
          for (const m of mesasDc) {
            const previo = mapaMesas.get(m.numero);
            mapaMesas.set(m.numero, { ...previo, ...m });
          }
          mesasCargadas = Array.from(mapaMesas.values()).sort((a, b) => a.numero - b.numero);
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

      // Desduplicar preventivamente por número en caso de basura previa en almacenamiento local
      const mapaMesasInicial = new Map<number, Mesa>();
      for (const m of mesasCargadas) {
        mapaMesasInicial.set(m.numero, m);
      }
      mesasCargadas = Array.from(mapaMesasInicial.values()).sort((a, b) => a.numero - b.numero);

      const correosCargados = await this.leer<CorreoEnviado>(CLAVE.correos);

      this.usuarios.set(usuariosCargados);
      this.productos.set(productosCargados);
      this.mesas.set(mesasCargadas);
      this.correos.set(correosCargados);
      this.iniciado = true;

      // 3. Sincronización en tiempo real vía Firestore (sakurapp)
      try {
        this.desuscribirUsuarios = this.firestore.escucharUsuarios((listaFirestore) => {
          if (listaFirestore.length > 0) {
            this.usuarios.update((actuales) => {
              const mapa = new Map<string, Usuario>();
              for (const u of actuales) mapa.set(u.uid || u.id, u);
              const esUuid = (val?: string | null) =>
                Boolean(val && /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(val));

              for (const u of listaFirestore) {
                const previo = mapa.get(u.uid || u.id);
                const idValido = esUuid(u.id) ? u.id : (esUuid(previo?.id) ? previo!.id : u.id);
                mapa.set(u.uid || u.id, { ...previo, ...u, id: idValido });
              }
              const combinados = Array.from(mapa.values());
              void this.guardar(CLAVE.usuarios, combinados);
              return combinados;
            });
          } else if (usuariosCargados.length > 0) {
            for (const u of usuariosCargados) {
              void this.firestore.guardarUsuario(u);
            }
          }
        });

        this.desuscribirMesas = this.firestore.escucharMesas((listaFirestoreMesas) => {
          if (listaFirestoreMesas.length > 0) {
            this.mesas.update((actuales) => {
              // Unicidad estricta por número de mesa: el salón no admite números duplicados
              const mapaPorNumero = new Map<number, Mesa>();
              for (const m of actuales) {
                mapaPorNumero.set(m.numero, m);
              }
              const esUuid = (val?: string | null) =>
                Boolean(val && /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(val));
              for (const m of listaFirestoreMesas) {
                const previo = mapaPorNumero.get(m.numero);
                const idValido = esUuid(m.id) ? m.id : (esUuid(previo?.id) ? previo!.id : m.id);
                mapaPorNumero.set(m.numero, { ...previo, ...m, id: idValido });
              }
              const combinadas = Array.from(mapaPorNumero.values()).sort((a, b) => a.numero - b.numero);
              void this.guardar(CLAVE.mesas, combinadas);
              return combinadas;
            });
          } else if (mesasCargadas.length > 0) {
            for (const m of mesasCargadas) {
              void this.firestore.guardarMesa(m);
            }
          }
        });

        this.desuscribirProductos = this.firestore.escucharProductos((listaFirestoreProductos) => {
          if (listaFirestoreProductos.length > 0) {
            this.productos.update((actuales) => {
              const mapa = new Map<string, Producto>();
              for (const p of actuales) mapa.set(p.id, p);
              for (const p of listaFirestoreProductos) {
                const previo = mapa.get(p.id);
                mapa.set(p.id, { ...previo, ...p });
              }
              const combinados = Array.from(mapa.values());
              void this.guardar(CLAVE.productos, combinados);
              return combinados;
            });
          } else if (productosCargados.length > 0) {
            for (const p of productosCargados) {
              void this.firestore.guardarProducto(p);
            }
          }
        });
      } catch (fsErr) {
        console.warn('⚠️ No se pudo iniciar escucha en tiempo real de Firestore:', fsErr);
      }
    })();

    return this.inicioEnCurso;
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

  async guardarSesion(usuarioOId: Usuario | string): Promise<void> {
    const id = typeof usuarioOId === 'string' ? usuarioOId : usuarioOId.id;
    await Preferences.set({ key: CLAVE.sesion, value: id });
    if (typeof usuarioOId !== 'string') {
      await Preferences.set({ key: 'sk.sesion.usuario', value: JSON.stringify(usuarioOId) });
    }
  }

  async leerSesion(): Promise<string | null> {
    return this.leerTexto(CLAVE.sesion);
  }

  async leerSesionUsuario(): Promise<Usuario | null> {
    const res = await Preferences.get({ key: 'sk.sesion.usuario' });
    if (!res.value) return null;
    try {
      return JSON.parse(res.value) as Usuario;
    } catch {
      return null;
    }
  }

  async borrarSesion(): Promise<void> {
    await Preferences.remove({ key: CLAVE.sesion });
    await Preferences.remove({ key: 'sk.sesion.usuario' });
  }

  /**
   * Desconecta todas las escuchas en tiempo real de Firestore
   * para evitar retenciones o fugas de memoria al cambiar de entorno o reiniciar sesión.
   */
  desconectar(): void {
    this.desuscribirUsuarios?.();
    this.desuscribirMesas?.();
    this.desuscribirProductos?.();
    this.desuscribirUsuarios = undefined;
    this.desuscribirMesas = undefined;
    this.desuscribirProductos = undefined;
    this.iniciado = false;
    this.inicioEnCurso = undefined;
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
