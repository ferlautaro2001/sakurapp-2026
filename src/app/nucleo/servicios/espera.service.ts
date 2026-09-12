import { Injectable, computed, inject, signal } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDataConnect } from 'firebase/data-connect';
import { collection, doc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import {
  createEspera,
  listEspera,
  updateEstadoEspera,
  asignarMesaCliente,
  EstadoEspera as DcEstadoEspera,
  connectorConfig,
} from '../../../dataconnect-generated';
import { environment } from '../../../environments/environment';
import { Espera, Mesa, Usuario } from '../modelos/modelos';
import { EstadoEspera } from '../modelos/enums';
import { FirestoreService } from './firestore.service';
import { NotificacionesService } from './notificaciones.service';


/** Colección de Firestore que refleja la tabla `listaEspera` en tiempo real. */
const COLECCION = 'listaEspera';

/**
 * Lista de espera del salón (punto 9 del enunciado).
 *
 * El comensal entra escaneando el código de ingreso pegado en la puerta y
 * queda en `ESPERANDO`. De ahí en adelante no puede hacer nada por su cuenta:
 * la mesa se la asigna el metre. Los estados son los de `EstadoEspera`.
 *
 * La persistencia sigue el mismo esquema que el resto de la aplicación: la
 * fila de verdad se escribe en Cloud SQL con la mutación `CreateEspera` de
 * Data Connect, y se refleja en Firestore para que el salón vea los cambios
 * en el momento, sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class EsperaService {
  private readonly firestore = inject(FirestoreService);
  private readonly notificaciones = inject(NotificacionesService);


  private escucha: Unsubscribe | null = null;
  private iniciado = false;

  readonly lista = signal<Espera[]>([]);

  /** La fila, de la llegada más vieja a la más nueva. */
  readonly esperando = computed(() =>
    this.lista()
      .filter((e) => e.estado === 'ESPERANDO')
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  );

  /** Arranca la lectura en vivo. Se llama sola desde las pantallas que la usan. */
  async iniciar(): Promise<void> {
    if (this.iniciado) return;
    this.iniciado = true;

    // 1. Estado guardado en Cloud SQL (Data Connect).
    try {
      const res = await listEspera(this.dataConnect());
      if (res?.data?.esperas?.length) {
        this.lista.set(
          res.data.esperas.map((e) => ({
            id: e.id,
            clienteId: e.cliente.id,
            clienteUid: '',
            clienteNombre: [e.cliente.nombre, e.cliente.apellido ?? ''].join(' ').trim(),
            clienteFotoUrl: e.cliente.fotoUrl,
            estado: e.estado as EstadoEspera,
            mesaAsignadaId: e.mesaAsignada?.id ?? null,
            mesaAsignadaNumero: e.mesaAsignada?.numero ?? null,
            timestamp: e.timestamp,
          })),
        );
      }
    } catch (err) {
      console.warn('⚠️ No se pudo leer la lista de espera de Data Connect:', err);
    }

    // 2. Sincronización en vivo por Firestore.
    try {
      const db = this.firestore.obtenerDb();
      this.escucha = onSnapshot(
        collection(db, COLECCION),
        (snapshot) => {
          const mapa = new Map(this.lista().map((e) => [e.id, e]));
          snapshot.forEach((docSnap) => {
            const datos = docSnap.data();
            mapa.set(docSnap.id, {
              id: docSnap.id,
              clienteId: datos['clienteId'] ?? '',
              clienteUid: datos['clienteUid'] ?? '',
              clienteNombre: datos['clienteNombre'] ?? '',
              clienteFotoUrl: datos['clienteFotoUrl'] ?? '',
              estado: (datos['estado'] as EstadoEspera) ?? 'ESPERANDO',
              mesaAsignadaId: datos['mesaAsignadaId'] ?? null,
              mesaAsignadaNumero: datos['mesaAsignadaNumero'] ?? null,
              timestamp: datos['timestamp'] ?? new Date().toISOString(),
            });
          });
          this.lista.set([...mapa.values()]);
        },
        (error) => console.warn('⚠️ Error escuchando la lista de espera en Firestore:', error),
      );
    } catch (err) {
      console.warn('⚠️ No se pudo iniciar la escucha de la lista de espera:', err);
    }
  }

  /** Corta la escucha en vivo. */
  detener(): void {
    this.escucha?.();
    this.escucha = null;
    this.iniciado = false;
  }

  /**
   * La entrada viva del comensal, esté en la fila, con mesa asignada o ya
   * sentado. Es lo que decide qué pantalla le toca ver.
   */
  activaDe(clienteId: string): Espera | undefined {
    return this.lista().find((e) => e.clienteId === clienteId && e.estado !== 'CANCELADO');
  }

  /** Posición en la fila, empezando en uno. Devuelve cero si no está esperando. */
  posicionDe(clienteId: string): number {
    return this.esperando().findIndex((e) => e.clienteId === clienteId) + 1;
  }

  /**
   * Anota al comensal en la lista de espera. Es la única escritura que hace el
   * cliente: nace en `ESPERANDO` y sin mesa, porque asignarla es trabajo del
   * metre. Si ya estaba anotado devuelve su entrada, sin duplicarla.
   */
  async anotar(cliente: Usuario): Promise<Espera> {
    await this.iniciar();

    const yaEsta = this.activaDe(cliente.id);
    if (yaEsta) return yaEsta;

    const entrada: Espera = {
      id: `esp-${Date.now()}`,
      clienteId: cliente.id,
      clienteUid: cliente.uid,
      clienteNombre: [cliente.nombre, cliente.apellido ?? ''].join(' ').trim(),
      clienteFotoUrl: cliente.fotoUrl,
      estado: 'ESPERANDO',
      mesaAsignadaId: null,
      mesaAsignadaNumero: null,
      timestamp: new Date().toISOString(),
    };

    // Inserción en Cloud SQL (Data Connect). El identificador del comensal es
    // un UUID sólo si su alta llegó a la base relacional; si se quedó en el
    // dispositivo, la fila vive igual en Firestore y no se pierde la llegada.
    if (esUuid(cliente.id)) {
      try {
        const res = await createEspera(this.dataConnect(), { clienteId: cliente.id });
        if (res?.data?.espera_insert?.id) entrada.id = res.data.espera_insert.id;
        console.log('✅ Comensal anotado en la lista de espera (Cloud SQL · Data Connect)');
      } catch (err) {
        console.warn('⚠️ No se pudo anotar en Data Connect, queda registrado en Firestore:', err);
      }
    }

    try {
      const db = this.firestore.obtenerDb();
      await setDoc(doc(db, COLECCION, entrada.id), { ...entrada }, { merge: true });
    } catch (err) {
      console.warn('⚠️ No se pudo reflejar la lista de espera en Firestore:', err);
    }

    this.lista.update((actual) => [...actual.filter((e) => e.id !== entrada.id), entrada]);
    return entrada;
  }

  /**
   * AC-5.3.1 (TASK-5.3.1.2) · Asignación atómica de mesa libre con bloqueo de concurrencia y push al cliente.
   *
   * 1. Ejecuta runTransaction en Firestore para asegurar que la mesa no esté tomada/asignada por otro metre (TC-023).
   * 2. Ejecuta la mutación AsignarMesaCliente en Cloud SQL (Data Connect) para consistencia transaccional relacional.
   * 3. Despacha notificación push automática al cliente con el número y tipo de mesa asignada (TC-021).
   * 4. Actualiza el estado reactivo local.
   */
  async asignarMesa(entrada: Espera, mesa: Mesa): Promise<void> {
    // 1. Bloqueo de concurrencia transaccional en Firestore
    await this.firestore.asignarMesaTransaccional(
      entrada.id,
      mesa.id,
      entrada.clienteUid,
      entrada.clienteId,
      mesa.numero,
    );

    // 2. Persistencia relacional en Data Connect
    if (esUuid(entrada.id) && esUuid(mesa.id) && esUuid(entrada.clienteId)) {
      try {
        await asignarMesaCliente(this.dataConnect(), {
          esperaId: entrada.id,
          mesaId: mesa.id,
          clienteId: entrada.clienteId,
        });
        console.log(`✅ Asignación atómica de mesa ${mesa.numero} persistida en Cloud SQL`);
      } catch (err) {
        console.warn('⚠️ Nota sobre Data Connect en asignarMesa (sigue persistido en Firestore):', err);
      }
    }

    // 3. Notificación push al cliente comensal (destinatarioUid: cliente.uid)
    const destinatarios = [entrada.clienteUid, entrada.clienteId].filter(Boolean);
    if (destinatarios.length) {
      await this.notificaciones.enviar(
        destinatarios,
        '¡Tu mesa está lista!',
        `El metre te asignó la mesa ${mesa.numero} (${mesa.tipo}). Acercate y escaneá su código QR para sentarte.`,
        ['/cliente/espera'],
      );
    }

    // 4. Actualización optimista local
    this.lista.update((actual) =>
      actual.map((e) =>
        e.id === entrada.id
          ? {
              ...e,
              estado: 'ASIGNADO' as const,
              mesaAsignadaId: mesa.id,
              mesaAsignadaNumero: mesa.numero,
            }
          : e,
      ),
    );
  }


  /**
   * Punto 10 · el comensal escaneó el código de la mesa que le asignó el metre
   * y queda sentado en ella. Es lo último que puede hacer por su cuenta: quién
   * ocupa qué mesa lo decide el salón, no el cliente.
   */
  async vincularConLaMesa(esperaId: string): Promise<void> {
    if (esUuid(esperaId)) {
      try {
        await updateEstadoEspera(this.dataConnect(), {
          id: esperaId,
          estado: DcEstadoEspera.FINALIZADO,
        });
      } catch (err) {
        console.warn('⚠️ No se pudo actualizar la espera en Data Connect:', err);
      }
    }

    try {
      const db = this.firestore.obtenerDb();
      await setDoc(doc(db, COLECCION, esperaId), { estado: 'FINALIZADO' }, { merge: true });
    } catch (err) {
      console.warn('⚠️ No se pudo reflejar el estado de la espera en Firestore:', err);
    }

    this.lista.update((actual) =>
      actual.map((e) => (e.id === esperaId ? { ...e, estado: 'FINALIZADO' as const } : e)),
    );
  }

  /** El metre remueve al comensal y conserva el turno con estado CANCELADO. */
  async quitar(esperaId: string): Promise<void> {
    if (esUuid(esperaId)) {
      try {
        await updateEstadoEspera(this.dataConnect(), {
          id: esperaId,
          estado: DcEstadoEspera.CANCELADO,
        });
      } catch (err) {
        console.warn('⚠️ No se pudo cancelar la espera en Data Connect:', err);
      }
    }

    try {
      const db = this.firestore.obtenerDb();
      await setDoc(doc(db, COLECCION, esperaId), { estado: 'CANCELADO' }, { merge: true });
    } catch (err) {
      console.warn('⚠️ No se pudo reflejar la cancelación en Firestore:', err);
    }

    this.lista.update((actual) =>
      actual.map((e) => (e.id === esperaId ? { ...e, estado: 'CANCELADO' as const } : e)),
    );
  }

  private dataConnect() {
    const app = getApps().length ? getApp() : initializeApp(environment.firebase);
    return getDataConnect(app, connectorConfig);
  }
}

/** Los identificadores de Cloud SQL son UUID; los locales, no. */
function esUuid(valor: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}
