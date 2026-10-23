import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Reserva } from '../../nucleo/modelos/modelos';
import { ROTULO_ESTADO_RESERVA } from '../../nucleo/modelos/enums';
import { ReservasService } from '../../nucleo/servicios/reservas.service';
import { CorreoService } from '../../nucleo/servicios/correo.service';
import { marcarEnviado, requerido } from '../../nucleo/validacion/validadores';

const FILTROS = [
  { valor: 'PENDIENTE', rotulo: 'Pendientes' },
  { valor: 'CONFIRMADA', rotulo: 'Confirmadas' },
  { valor: 'TODAS', rotulo: 'Todas' },
];

/**
 * US-13.1 · TASK-13.1.1.2 · listado de reservas del dueño y del supervisor.
 *
 * Como en los registros, la decisión vive dentro de la tarjeta. Rechazar pide
 * el motivo ahí mismo, porque es lo que le llega al cliente en el correo: no
 * se puede rechazar sin escribirlo.
 */
@Component({
  selector: 'lm-dueno-reservas',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="reservas.pendientes().length">Reservas</lm-titulo>

        <lm-pestanas [opciones]="filtros" [valor]="filtro()" (cambiar)="filtro.set($event)" />

        @if (visibles().length) {
          <div class="lm-lista-libre">
            @for (r of visibles(); track r.id) {
              <div class="lm-card reserva">
                <div class="reserva__cabecera">
                  <span class="reserva__mesa">Mesa {{ r.mesaNumero }}</span>
                  <span class="reserva__cliente">{{ r.clienteNombre }}</span>
                  <lm-chip [estado]="chip(r)">{{ rotuloEstado(r) }}</lm-chip>
                </div>
                <p class="reserva__cuando">{{ cuando(r) }}</p>
                <p class="reserva__dato">
                  {{ r.comensales }} {{ r.comensales === 1 ? 'persona' : 'personas' }} · {{ r.clienteEmail || 'Sin correo' }}
                </p>
                @if (r.motivoRechazo) {
                  <p class="reserva__dato">Motivo: {{ r.motivoRechazo }}</p>
                }
                @if (r.resueltoPorNombre && r.estado !== 'PENDIENTE') {
                  <p class="reserva__dato">Resuelta por {{ r.resueltoPorNombre }}</p>
                }

                @if (r.estado === 'PENDIENTE') {
                  @if (rechazando() === r.id) {
                    <lm-area
                      [control]="motivo"
                      etiqueta="Motivo del rechazo"
                      marcador="Por ejemplo: ese día el salón está cerrado por un evento privado."
                      [filas]="2"
                      [largoMaximo]="200"
                      ayuda="Le llega al cliente en el correo."
                    />
                    <lm-decision compacto rotuloRechazar="Volver" rotuloAceptar="Rechazar" (rechazar)="rechazando.set(null)" (aceptar)="rechazar(r)" />
                  } @else {
                    <lm-decision compacto rotuloRechazar="Rechazar" rotuloAceptar="Confirmar" (rechazar)="abrirRechazo(r)" (aceptar)="confirmar(r)" />
                  }
                }
              </div>
            }
          </div>
        } @else {
          <lm-vacio icono="event" [titulo]="tituloVacio()">
            Cuando un cliente registrado pida una reserva, aparece acá para que la confirmes o la rechaces.
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="reservas" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .reserva { display: flex; flex-direction: column; gap: 8px; padding: var(--space-4); }
      .reserva__cabecera { display: flex; align-items: center; gap: 10px; }
      .reserva__mesa {
        flex: 0 0 auto; padding: 5px 11px; border-radius: var(--radius-pill);
        background: var(--action-primary); color: #FFFFFF;
        font: var(--type-label); letter-spacing: var(--tracking-label); text-transform: uppercase;
      }
      .reserva__cliente {
        flex: 1 1 auto; min-width: 0;
        font: var(--type-body-small); color: var(--text-muted);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .reserva__cuando { margin: 0; font: var(--type-section); color: var(--text-title); }
      .reserva__dato { margin: 0; font: var(--type-body-small); color: var(--text-muted); overflow-wrap: anywhere; }
    `,
  ],
})
export class DuenoReservasPage extends PaginaConSesion {
  protected readonly reservas = inject(ReservasService);
  private readonly correos = inject(CorreoService);

  protected readonly filtros = FILTROS;
  protected readonly filtro = signal('PENDIENTE');
  /** La tarjeta que tiene abierto el motivo de rechazo. */
  protected readonly rechazando = signal<string | null>(null);
  protected readonly motivo = new FormControl('', {
    nonNullable: true,
    validators: [requerido('Escribí el motivo: es lo que le llega al cliente')],
  });

  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    const todas = this.reservas.todas();
    return filtro === 'TODAS' ? [...todas].reverse() : todas.filter((r) => r.estado === filtro);
  });

  constructor() {
    super();
    this.reservas.iniciar();
  }

  protected abrirRechazo(reserva: Reserva): void {
    this.motivo.reset('');
    this.rechazando.set(reserva.id);
  }

  protected async confirmar(reserva: Reserva): Promise<void> {
    const resolutor = this.usuario();
    if (!resolutor) return;

    const seguro = await this.preguntar({
      titulo: '¿Confirmás la reserva?',
      mensaje: 'La mesa queda guardada para este cliente y le llega un correo.',
      confirmar: 'Confirmar',
      tono: 'exito',
      icono: 'event_available',
      foto: reserva.clienteFotoUrl || null,
      detalle: this.detalle(reserva),
    });
    if (!seguro) return;

    try {
      await this.cargando.conEsperaMinima('Confirmando la reserva…', async () => {
        const confirmada = await this.reservas.confirmar(reserva, resolutor);
        await this.correos.enviarReservaConfirmada(confirmada, resolutor);
      });
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
      this.avisos.exito('Reserva confirmada', `La mesa ${reserva.mesaNumero} queda guardada para ${reserva.clienteNombre}.`);
    } catch (err: any) {
      this.avisos.error('No se pudo confirmar', err?.message || 'Revisá la conexión y volvé a intentarlo.');
    }
  }

  protected async rechazar(reserva: Reserva): Promise<void> {
    const resolutor = this.usuario();
    if (!resolutor) return;

    marcarEnviado(this.motivo);
    const motivo = this.motivo.value.trim();
    if (this.motivo.invalid || !motivo) {
      this.avisos.error('Falta el motivo', 'Escribí por qué no se puede confirmar.');
      return;
    }

    const seguro = await this.preguntar({
      titulo: '¿Rechazás la reserva?',
      mensaje: 'Le llega un correo al cliente con el motivo.',
      confirmar: 'Rechazar',
      tono: 'peligro',
      icono: 'event_busy',
      foto: reserva.clienteFotoUrl || null,
      detalle: [...this.detalle(reserva), { rotulo: 'Motivo', valor: motivo }],
    });
    if (!seguro) return;

    try {
      await this.cargando.conEsperaMinima('Rechazando la reserva…', async () => {
        const rechazada = await this.reservas.rechazar(reserva, resolutor, motivo);
        await this.correos.enviarReservaRechazada(rechazada, resolutor, motivo);
      });
      this.rechazando.set(null);
      this.avisos.error('Reserva rechazada', `${reserva.clienteNombre} recibe el motivo por correo.`);
    } catch (err: any) {
      this.avisos.error('No se pudo rechazar', err?.message || 'Revisá la conexión y volvé a intentarlo.');
    }
  }

  protected cuando(reserva: Reserva): string {
    return new Date(reserva.fechaHora).toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  protected tituloVacio(): string {
    if (this.filtro() === 'PENDIENTE') return 'No hay reservas para revisar';
    if (this.filtro() === 'CONFIRMADA') return 'No hay reservas confirmadas';
    return 'Todavía no hay reservas';
  }

  private detalle(reserva: Reserva) {
    return [
      { rotulo: 'Cliente', valor: reserva.clienteNombre },
      { rotulo: 'Cuándo', valor: this.cuando(reserva) },
      { rotulo: 'Mesa', valor: String(reserva.mesaNumero) },
      { rotulo: 'Personas', valor: String(reserva.comensales) },
    ];
  }
}
