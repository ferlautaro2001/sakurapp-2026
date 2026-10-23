import { Component, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Mesa, Reserva } from '../../nucleo/modelos/modelos';
import { ROTULO_ESTADO_RESERVA, ROTULO_TIPO_MESA } from '../../nucleo/modelos/enums';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { ReservasService, MINUTOS_TOLERANCIA } from '../../nucleo/servicios/reservas.service';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { QrService } from '../../nucleo/servicios/qr.service';

const PERSONAS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ valor: String(n), rotulo: String(n) }));
const MINUTOS = ['00', '15', '30', '45'].map((m) => ({ valor: m, rotulo: `:${m}` }));
const DIAS_ADELANTE = 8;

/**
 * US-13.1 · TASK-13.1.1.1 y TASK-13.1.1.3 · reservas del cliente registrado.
 *
 * Con una reserva vigente, la pantalla es esa reserva: su estado, cancelarla
 * y, cuando ya está en horario, escanear el código de la mesa para sentarse
 * sin pasar por la lista de espera. Sin reserva vigente, es el formulario para
 * pedir una: personas, día, hora y una de las mesas que entran y están libres.
 */
@Component({
  selector: 'lm-cliente-reservas',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap14">
        <lm-titulo>Reservas</lm-titulo>

        @if (vigente(); as r) {
          <div class="lm-card reserva">
            <div class="reserva__cabecera">
              <span class="reserva__mesa">Mesa {{ r.mesaNumero }}</span>
              <lm-chip [estado]="chip(r)">{{ rotuloEstado(r) }}</lm-chip>
            </div>
            <p class="reserva__cuando">{{ cuando(r) }}</p>
            <p class="reserva__dato">{{ r.comensales }} {{ r.comensales === 1 ? 'persona' : 'personas' }}</p>
            @if (r.estado === 'PENDIENTE') {
              <p class="reserva__ayuda">El dueño o el supervisor la está revisando. Te llega un correo con la respuesta.</p>
            } @else if (paraSentarse()) {
              <p class="reserva__ayuda">Ya estás en horario: escaneá el código de la mesa {{ r.mesaNumero }} y quedás sentado, sin pasar por la lista de espera.</p>
            } @else {
              <p class="reserva__ayuda">La mesa queda guardada para vos desde una hora antes hasta {{ tolerancia }} minutos después de la hora reservada.</p>
            }
          </div>

          @if (paraSentarse()) {
            <lm-boton icono="qr_code_scanner" (presionar)="escanearMesa()">Escanear la mesa {{ r.mesaNumero }}</lm-boton>
          }
          <lm-boton variante="ghost" sobreOscuro icono="event_busy" (presionar)="cancelar(r)">Cancelar la reserva</lm-boton>
        } @else {
          <lm-segmentado etiqueta="¿Cuántas personas?" [opciones]="personas" [columnas]="4" [valor]="comensales()" (cambiar)="elegirPersonas($event)" />
          <lm-segmentado etiqueta="Día" [opciones]="dias()" [columnas]="4" [valor]="dia()" (cambiar)="elegirDia($event)" />

          @if (horas().length) {
            <lm-segmentado etiqueta="Hora" [opciones]="horas()" [columnas]="6" [valor]="hora()" (cambiar)="hora.set($event); mesaId.set('')" />
            <lm-segmentado etiqueta="Minutos" [opciones]="minutos" [valor]="minuto()" (cambiar)="minuto.set($event); mesaId.set('')" />
          } @else {
            <lm-banner tono="info" titulo="No quedan horarios hoy">Elegí otro día.</lm-banner>
          }

          @if (fechaHora()) {
            @if (mesasLibres().length) {
              <lm-segmentado etiqueta="Mesa" [opciones]="opcionesMesa()" [columnas]="2" [valor]="mesaId()" (cambiar)="mesaId.set($event)" />
            } @else {
              <lm-banner tono="info" titulo="No hay mesas libres">
                No quedan mesas para {{ comensales() }} {{ comensales() === '1' ? 'persona' : 'personas' }} en ese horario. Probá con otra hora.
              </lm-banner>
            }
          }

          <lm-boton icono="event_available" [deshabilitado]="!mesaElegida()" (presionar)="reservar()">Pedir la reserva</lm-boton>
        }

        @if (anteriores().length) {
          <lm-separador rotulo="Reservas anteriores" />
          @for (r of anteriores(); track r.id) {
            <div class="lm-card reserva reserva--anterior">
              <div class="reserva__cabecera">
                <span class="reserva__mesa">Mesa {{ r.mesaNumero }}</span>
                <lm-chip [estado]="chip(r)">{{ rotuloEstado(r) }}</lm-chip>
              </div>
              <p class="reserva__cuando">{{ cuando(r) }}</p>
              @if (r.motivoRechazo) {
                <p class="reserva__ayuda">Motivo: {{ r.motivoRechazo }}</p>
              }
            </div>
          }
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="reservas" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .lm-body { overflow-y: auto; }
      .reserva { display: flex; flex-direction: column; gap: 6px; padding: var(--space-4); }
      .reserva__cabecera { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .reserva__mesa {
        padding: 5px 11px; border-radius: var(--radius-pill);
        background: var(--action-primary); color: #FFFFFF;
        font: var(--type-label); letter-spacing: var(--tracking-label); text-transform: uppercase;
      }
      .reserva__cuando { margin: 0; font: var(--type-section); color: var(--text-title); }
      .reserva__dato { margin: 0; font: var(--type-body-small); color: var(--text-muted); }
      .reserva__ayuda { margin: 0; font: var(--type-body-small); color: var(--text-muted); text-wrap: pretty; }
      .reserva--anterior { opacity: .85; }
    `,
  ],
})
export class ClienteReservasPage extends PaginaConSesion {
  private readonly reservas = inject(ReservasService);
  private readonly mesas = inject(MesasService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);

  protected readonly personas = PERSONAS;
  protected readonly minutos = MINUTOS;
  protected readonly tolerancia = MINUTOS_TOLERANCIA;

  protected readonly comensales = signal('2');
  protected readonly dia = signal('0');
  protected readonly hora = signal('');
  protected readonly minuto = signal('00');
  protected readonly mesaId = signal('');

  protected readonly vigente = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.reservas.vigenteDe(id) : undefined;
  });

  protected readonly paraSentarse = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.reservas.paraSentarse(id) : undefined;
  });

  protected readonly anteriores = computed(() => {
    const id = this.usuario()?.id;
    const vigente = this.vigente()?.id;
    return id ? this.reservas.deCliente(id).filter((r) => r.id !== vigente) : [];
  });

  /** Hoy y los próximos siete días. */
  protected readonly dias = computed(() =>
    Array.from({ length: DIAS_ADELANTE }, (_, i) => {
      const fecha = this.diaDesdeHoy(i);
      const rotulo =
        i === 0
          ? 'Hoy'
          : i === 1
            ? 'Mañana'
            : fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }).replace('.', '');
      return { valor: String(i), rotulo };
    }),
  );

  /** Las horas del día elegido que todavía no pasaron. */
  protected readonly horas = computed(() => {
    const esHoy = this.dia() === '0';
    const ahora = new Date();
    return Array.from({ length: 24 }, (_, h) => h)
      .filter((h) => !esHoy || h > ahora.getHours() || (h === ahora.getHours() && ahora.getMinutes() < 45))
      .map((h) => ({ valor: String(h), rotulo: String(h).padStart(2, '0') }));
  });

  /** La fecha y hora elegidas en ISO, o vacío si falta algo o ya pasó. */
  protected readonly fechaHora = computed(() => {
    if (this.hora() === '') return '';
    const fecha = this.diaDesdeHoy(Number(this.dia()));
    fecha.setHours(Number(this.hora()), Number(this.minuto()), 0, 0);
    return fecha.getTime() > Date.now() ? fecha.toISOString() : '';
  });

  /** Mesas activas donde entran todos y que nadie reservó cerca de ese horario. */
  protected readonly mesasLibres = computed(() => {
    const fechaHora = this.fechaHora();
    const personas = Number(this.comensales());
    if (!fechaHora) return [];
    return this.mesas
      .todas()
      .filter((m) => m.estado !== 'INACTIVA' && m.cantidadComensales >= personas)
      .filter((m) => this.reservas.mesaLibre(m.id, fechaHora));
  });

  protected readonly opcionesMesa = computed(() =>
    this.mesasLibres().map((m) => ({
      valor: m.id,
      rotulo: `Mesa ${m.numero} · ${ROTULO_TIPO_MESA[m.tipo]}`,
    })),
  );

  protected readonly mesaElegida = computed<Mesa | undefined>(() =>
    this.mesasLibres().find((m) => m.id === this.mesaId()),
  );

  constructor() {
    super();
    this.reservas.iniciar();
  }

  protected elegirPersonas(valor: string): void {
    this.comensales.set(valor || '2');
    this.mesaId.set('');
  }

  protected elegirDia(valor: string): void {
    this.dia.set(valor || '0');
    this.hora.set('');
    this.mesaId.set('');
  }

  protected async reservar(): Promise<void> {
    const cliente = this.usuario();
    const mesa = this.mesaElegida();
    const fechaHora = this.fechaHora();
    if (!cliente || !mesa || !fechaHora) return;

    const seguro = await this.preguntar({
      titulo: '¿Pedís esta reserva?',
      mensaje: 'El dueño o el supervisor la revisa y te llega un correo con la respuesta.',
      confirmar: 'Pedir reserva',
      tono: 'exito',
      icono: 'event_available',
      detalle: [
        { rotulo: 'Cuándo', valor: this.cuandoDe(fechaHora) },
        { rotulo: 'Mesa', valor: `${mesa.numero} · ${ROTULO_TIPO_MESA[mesa.tipo]}` },
        { rotulo: 'Personas', valor: this.comensales() },
      ],
    });
    if (!seguro) return;

    try {
      await this.cargando.conEsperaMinima('Enviando tu reserva…', () =>
        this.reservas.crear(cliente, mesa, fechaHora, Number(this.comensales())),
      );
      this.avisos.exito('Reserva enviada', 'Te avisamos apenas la revisen.');
      this.hora.set('');
      this.mesaId.set('');
    } catch (err: any) {
      this.avisos.error('No se pudo reservar', err?.message || 'Revisá la conexión y volvé a intentarlo.');
    }
  }

  protected async cancelar(reserva: Reserva): Promise<void> {
    const seguro = await this.preguntar({
      titulo: '¿Cancelás la reserva?',
      mensaje: 'La mesa queda libre para otra persona.',
      confirmar: 'Cancelar reserva',
      cancelar: 'Mantenerla',
      tono: 'peligro',
      icono: 'event_busy',
      detalle: [
        { rotulo: 'Cuándo', valor: this.cuando(reserva) },
        { rotulo: 'Mesa', valor: String(reserva.mesaNumero) },
      ],
    });
    if (!seguro) return;

    try {
      await this.cargando.conEsperaMinima('Cancelando la reserva…', () => this.reservas.cancelar(reserva), 350);
      this.avisos.exito('Reserva cancelada', 'Cuando quieras, podés pedir otra.');
    } catch {
      this.avisos.error('No se pudo cancelar', 'Revisá la conexión y volvé a intentarlo.');
    }
  }

  /** TASK-13.1.1.3 · se sienta escaneando su mesa, sin pasar por la fila. */
  protected async escanearMesa(): Promise<void> {
    const reserva = this.paraSentarse();
    if (!reserva) return;

    if (!this.escaner.disponible()) {
      this.avisos.info(
        'El lector funciona en el teléfono',
        `Instalá la aplicación en Android para escanear el código de la mesa ${reserva.mesaNumero}.`,
      );
      return;
    }

    const leido = await this.escaner.leer('QR');
    if (!leido) return;

    const contenido = this.qr.interpretar(leido);
    if (contenido.tipo !== 'MESA') {
      this.avisos.error('Ese código no es de una mesa', `Buscá el código pegado sobre la mesa ${reserva.mesaNumero}.`);
      return;
    }

    try {
      await this.cargando.conEsperaMinima('Te estamos sentando…', async () => {
        await this.reservas.sentarse(reserva, contenido.mesaId);
        await this.sesion.establecerMesaActiva(reserva.mesaId, reserva.mesaNumero);
      });
      this.avisos.exito(`Estás en la mesa ${reserva.mesaNumero}`, 'Ya podés explorar la carta.');
      await this.router.navigate(['/carta'], { queryParams: { mesaId: reserva.mesaId }, replaceUrl: true });
    } catch (err: any) {
      this.avisos.error('No pudimos sentarte', err?.message || 'Revisá la conexión y volvé a intentarlo.');
    }
  }

  protected cuando(reserva: Reserva): string {
    return this.cuandoDe(reserva.fechaHora);
  }

  protected rotuloEstado(reserva: Reserva): string {
    return ROTULO_ESTADO_RESERVA[reserva.estado];
  }

  protected chip(reserva: Reserva): string {
    switch (reserva.estado) {
      case 'CONFIRMADA':
      case 'CUMPLIDA':
        return 'aprobado';
      case 'PENDIENTE':
        return 'pendiente';
      default:
        return 'rechazado';
    }
  }

  private cuandoDe(iso: string): string {
    return new Date(iso).toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private diaDesdeHoy(dias: number): Date {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() + dias);
    return fecha;
  }
}
