import { Injectable, computed, inject, signal } from '@angular/core';
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { nuevoId } from '../datos/semilla';
import { Mesa, Reserva, Usuario } from '../modelos/modelos';
import { EstadoReserva } from '../modelos/enums';
import { FirestoreService } from './firestore.service';
import { MesasService } from './mesas.service';
import { NotificacionesService } from './notificaciones.service';

/** Colección de Firestore con las reservas agendadas. */
const COLECCION = 'reservas';

/** Desde cuántos minutos antes de la hora reservada la mesa queda guardada. */
export const MINUTOS_BLOQUEO_PREVIO = 60;

/** Punto 26 · cuántos minutos después de la hora se libera la mesa si nadie llegó. */
export const MINUTOS_TOLERANCIA = 45;

const MINUTO = 60_000;

/** Estados en los que la reserva todavía ocupa su horario. */
const VIGENTES: EstadoReserva[] = ['PENDIENTE', 'CONFIRMADA'];

/**
 * US-13.1 · Reservas agendadas (puntos 24 a 26 del enunciado).
 *
 * El cliente registrado pide una mesa para un día y una hora futuros, el dueño
 * o el supervisor la confirma o la rechaza, y desde una hora antes hasta 45
 * minutos después la mesa queda guardada para él: el metre no la puede dar a
 * otro, y el cliente se sienta escaneando su código sin pasar por la fila.
 *
 * El vencimiento no depende de un proceso en el servidor: cada dispositivo que
 * mira las reservas las ve vencidas apenas pasan los 45 minutos, y la primera
 * que lo nota deja el estado `VENCIDA` guardado.
 *
 * La tabla `Reserva` y sus operaciones ya están en el esquema de Data Connect;
 * hasta que se despliegue y se regenere el SDK, las reservas viven en
 * Firestore, que es además lo que da la sincronización en vivo.
 */
@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly firestore = inject(FirestoreService);
  private readonly mesas = inject(MesasService);
  private readonly notificaciones = inject(NotificacionesService);

  private escucha: Unsubscribe | null = null;
  private reloj: ReturnType<typeof setInterval> | null = null;
  private iniciado = false;

  private readonly guardadas = signal<Reserva[]>([]);
  /** Late cada medio minuto para que los vencimientos aparezcan solos. */
  private readonly ahora = signal(Date.now());

  /** Todas las reservas, con las vencidas ya marcadas aunque nadie las haya guardado así. */
  readonly todas = computed(() => {
    const ahora = this.ahora();
    return this.guardadas()
      .map((r) => (estaVencida(r, ahora) ? { ...r, estado: 'VENCIDA' as const } : r))
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
  });

  /** Las que esperan una decisión del dueño o del supervisor, la más próxima primero. */
  readonly pendientes = computed(() => this.todas().filter((r) => r.estado === 'PENDIENTE'));

  /** Mesas que el metre no puede asignar ahora porque están guardadas para una reserva. */
  readonly mesasBloqueadas = computed(() => {
    const ahora = this.ahora();
    return new Set(
      this.todas()
        .filter((r) => r.estado === 'CONFIRMADA' && enVentana(r, ahora))
        .map((r) => r.mesaId),
    );
  });

  /** Arranca la lectura en vivo. Se llama sola desde las pantallas que la usan. */
  iniciar(): void {
    if (this.iniciado) return;
    this.iniciado = true;

    try {
      this.escucha = onSnapshot(
        collection(this.firestore.obtenerDb(), COLECCION),
        (snapshot) => {
          const lista: Reserva[] = [];
          snapshot.forEach((docSnap) => lista.push(desdeDocumento(docSnap.id, docSnap.data())));
          this.guardadas.set(lista);
          void this.guardarVencidas();
        },
        (error) => console.warn('⚠️ Error escuchando las reservas en Firestore:', error),
      );
    } catch (err) {
      console.warn('⚠️ No se pudo iniciar la escucha de las reservas:', err);
    }

    this.reloj = setInterval(() => {
      this.ahora.set(Date.now());
      void this.guardarVencidas();
    }, 30_000);
  }

  detener(): void {
    this.escucha?.();
    this.escucha = null;
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = null;
    this.iniciado = false;
  }

  /** Las reservas de un cliente, de la más nueva a la más vieja. */
  deCliente(clienteId: string): Reserva[] {
    return this.todas()
      .filter((r) => r.clienteId === clienteId)
      .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
  }

  /** La reserva pendiente o confirmada del cliente, si tiene una. */
  vigenteDe(clienteId: string): Reserva | undefined {
    return this.todas().find((r) => r.clienteId === clienteId && VIGENTES.includes(r.estado));
  }

  /**
   * La reserva confirmada del cliente que ya está en horario de llegada: desde
   * una hora antes hasta los 45 minutos de tolerancia.
   */
  paraSentarse(clienteId: string): Reserva | undefined {
    const ahora = this.ahora();
    return this.todas().find((r) => r.clienteId === clienteId && r.estado === 'CONFIRMADA' && enVentana(r, ahora));
  }

  /**
   * Si la mesa está libre para una reserva a esa hora: ninguna otra reserva
   * pendiente o confirmada de la misma mesa puede pisar su ventana.
   */
  mesaLibre(mesaId: string, fechaHora: string, exceptoId?: string): boolean {
    const hora = new Date(fechaHora).getTime();
    const separacion = (MINUTOS_BLOQUEO_PREVIO + MINUTOS_TOLERANCIA) * MINUTO;
    return !this.todas().some(
      (r) =>
        r.id !== exceptoId &&
        r.mesaId === mesaId &&
        VIGENTES.includes(r.estado) &&
        Math.abs(new Date(r.fechaHora).getTime() - hora) < separacion,
    );
  }

  /** TASK-13.1.1.1 · el cliente registrado pide la reserva. Nace pendiente. */
  async crear(cliente: Usuario, mesa: Mesa, fechaHora: string, comensales: number): Promise<Reserva> {
    if (cliente.perfil !== 'CLIENTE_REGISTRADO') {
      throw new Error('Sólo los clientes registrados pueden reservar.');
    }
    const hora = new Date(fechaHora).getTime();
    if (!Number.isFinite(hora) || hora <= Date.now()) {
      throw new Error('La reserva tiene que ser para más adelante.');
    }

    const reserva: Reserva = {
      id: nuevoId(),
      clienteId: cliente.id,
      clienteUid: cliente.uid,
      clienteNombre: [cliente.nombre, cliente.apellido ?? ''].join(' ').trim(),
      clienteEmail: cliente.email,
      clienteFotoUrl: cliente.fotoUrl,
      mesaId: mesa.id,
      mesaNumero: mesa.numero,
      fechaHora,
      comensales,
      estado: 'PENDIENTE',
      motivoRechazo: null,
      resueltoPorNombre: null,
      createdAt: new Date().toISOString(),
    };

    await this.guardarNuevaAtomica(reserva);

    const cuando = new Date(fechaHora).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    for (const rol of ['DUENO', 'SUPERVISOR'] as const) {
      await this.notificaciones.enviarPorRol(
        rol,
        'Nueva reserva para revisar',
        `${reserva.clienteNombre} pidió la mesa ${mesa.numero} para el ${cuando}.`,
        ['/dueno/reservas'],
      );
    }

    return reserva;
  }

  /** TASK-13.1.1.2 · el dueño o el supervisor la confirma: la mesa queda guardada. */
  async confirmar(reserva: Reserva, resolutor: Usuario): Promise<Reserva> {
    if (!this.mesaLibre(reserva.mesaId, reserva.fechaHora, reserva.id)) {
      throw new Error(`La mesa ${reserva.mesaNumero} ya tiene otra reserva en ese horario.`);
    }
    const confirmada: Reserva = { ...reserva, estado: 'CONFIRMADA', resueltoPorNombre: resolutor.nombre };
    await this.guardar(confirmada);
    await this.avisarAlCliente(
      confirmada,
      '¡Tu reserva está confirmada!',
      `Te esperamos en la mesa ${reserva.mesaNumero}. Al llegar, escaneá su código QR.`,
    );
    return confirmada;
  }

  /** TASK-13.1.1.2 · rechazo con motivo, que también le llega por correo. */
  async rechazar(reserva: Reserva, resolutor: Usuario, motivo: string): Promise<Reserva> {
    const rechazada: Reserva = {
      ...reserva,
      estado: 'RECHAZADA',
      motivoRechazo: motivo,
      resueltoPorNombre: resolutor.nombre,
    };
    await this.guardar(rechazada);
    await this.avisarAlCliente(rechazada, 'No pudimos confirmar tu reserva', motivo);
    return rechazada;
  }

  /** El cliente la cancela y libera la mesa. */
  async cancelar(reserva: Reserva): Promise<void> {
    await this.guardar({ ...reserva, estado: 'CANCELADA' });
  }

  /**
   * TASK-13.1.1.3 · el cliente escaneó el código de una mesa con la reserva
   * confirmada y en horario. Si es su mesa, queda sentado sin pasar por la
   * lista de espera; si no, se le dice cuál es la suya.
   */
  async sentarse(reserva: Reserva, mesaEscaneadaId: string): Promise<void> {
    const valida = await this.mesas.validarMesaEscaneada(mesaEscaneadaId, reserva.mesaId);
    if (!valida) {
      throw new Error(`Ese no es el código de tu mesa. Tu reserva es en la mesa ${reserva.mesaNumero}.`);
    }
    await this.mesas.cambiarEstado(reserva.mesaId, 'OCUPADA');
    await this.guardar({ ...reserva, estado: 'CUMPLIDA' });
  }

  private async avisarAlCliente(reserva: Reserva, titulo: string, cuerpo: string): Promise<void> {
    const destinatarios = [reserva.clienteUid, reserva.clienteId].filter(Boolean);
    if (destinatarios.length) {
      await this.notificaciones.enviar(destinatarios, titulo, cuerpo, ['/cliente/reservas']);
    }
  }

  /** Deja guardado `VENCIDA` en las que pasaron la tolerancia sin que nadie se sentara. */
  private async guardarVencidas(): Promise<void> {
    const ahora = Date.now();
    const vencidas = this.guardadas().filter((r) => estaVencida(r, ahora));
    for (const r of vencidas) {
      await this.guardar({ ...r, estado: 'VENCIDA' });
    }
  }

  /**
   * Valida y crea en una transacción. Los documentos de bloqueo hacen que dos
   * altas simultáneas de la misma mesa o cliente se serialicen, aunque todavía
   * no exista una reserva que ambas transacciones puedan leer.
   */
  private async guardarNuevaAtomica(reserva: Reserva): Promise<void> {
    const db = this.firestore.obtenerDb();
    const separacion = (MINUTOS_BLOQUEO_PREVIO + MINUTOS_TOLERANCIA) * MINUTO;
    const hora = new Date(reserva.fechaHora).getTime();
    const bloqueoMesa = doc(db, 'reservas_bloqueos', `mesa-${encodeURIComponent(reserva.mesaId)}`);
    const bloqueoCliente = doc(db, 'reservas_bloqueos', `cliente-${encodeURIComponent(reserva.clienteId)}`);
    const referencia = doc(db, COLECCION, reserva.id);

    await runTransaction(db, async (transaccion) => {
      await transaccion.get(bloqueoMesa);
      await transaccion.get(bloqueoCliente);

      const reservasMesa = await transaccion.get(
        query(collection(db, COLECCION), where('mesaId', '==', reserva.mesaId)),
      );
      const reservasCliente = await transaccion.get(
        query(collection(db, COLECCION), where('clienteId', '==', reserva.clienteId)),
      );

      const mesaOcupadaEnEseHorario = reservasMesa.docs.some((docReserva) => {
        const existente = desdeDocumento(docReserva.id, docReserva.data());
        return (
          VIGENTES.includes(existente.estado) &&
          Math.abs(new Date(existente.fechaHora).getTime() - hora) < separacion
        );
      });
      if (mesaOcupadaEnEseHorario) {
        throw new Error(`La mesa ${reserva.mesaNumero} ya está reservada cerca de ese horario.`);
      }

      const clienteYaTieneReserva = reservasCliente.docs.some((docReserva) =>
        VIGENTES.includes(desdeDocumento(docReserva.id, docReserva.data()).estado),
      );
      if (clienteYaTieneReserva) {
        throw new Error('Ya tenés una reserva pendiente o confirmada. Cancelala para pedir otra.');
      }

      transaccion.set(bloqueoMesa, { actualizadoEn: new Date().toISOString() });
      transaccion.set(bloqueoCliente, { actualizadoEn: new Date().toISOString() });
      transaccion.set(referencia, { ...reserva }, { merge: true });
    });

    this.guardadas.update((actual) => [...actual.filter((r) => r.id !== reserva.id), reserva]);
  }

  private async guardar(reserva: Reserva): Promise<void> {
    // Actualización optimista: la pantalla cambia aunque la red tarde.
    this.guardadas.update((actual) => [...actual.filter((r) => r.id !== reserva.id), reserva]);
    await setDoc(doc(this.firestore.obtenerDb(), COLECCION, reserva.id), { ...reserva }, { merge: true });
  }
}

/** Pendiente o confirmada, y ya pasaron los 45 minutos de tolerancia. */
function estaVencida(r: Reserva, ahora: number): boolean {
  return VIGENTES.includes(r.estado) && ahora > new Date(r.fechaHora).getTime() + MINUTOS_TOLERANCIA * MINUTO;
}

/** Si `ahora` cae entre una hora antes de la reserva y los 45 minutos de tolerancia. */
function enVentana(r: Reserva, ahora: number): boolean {
  const hora = new Date(r.fechaHora).getTime();
  return ahora >= hora - MINUTOS_BLOQUEO_PREVIO * MINUTO && ahora <= hora + MINUTOS_TOLERANCIA * MINUTO;
}

function desdeDocumento(id: string, datos: Record<string, any>): Reserva {
  return {
    id,
    clienteId: datos['clienteId'] ?? '',
    clienteUid: datos['clienteUid'] ?? '',
    clienteNombre: datos['clienteNombre'] ?? 'Cliente',
    clienteEmail: datos['clienteEmail'] ?? null,
    clienteFotoUrl: datos['clienteFotoUrl'] ?? '',
    mesaId: datos['mesaId'] ?? '',
    mesaNumero: Number(datos['mesaNumero'] ?? 0),
    fechaHora: datos['fechaHora'] ?? new Date(0).toISOString(),
    comensales: Number(datos['comensales'] ?? 1),
    estado: (datos['estado'] as EstadoReserva) ?? 'PENDIENTE',
    motivoRechazo: datos['motivoRechazo'] ?? null,
    resueltoPorNombre: datos['resueltoPorNombre'] ?? null,
    createdAt: datos['createdAt'] ?? new Date().toISOString(),
  };
}
