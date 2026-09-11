import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { CorreoEnviado } from '../../nucleo/modelos/modelos';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { CorreoService } from '../../nucleo/servicios/correo.service';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';

/**
 * Puntos 7 y 8 · el dueño o el supervisor resuelven un registro.
 *
 * Primero confirma, después informa. Mismo esqueleto para aprobar y para
 * rechazar: el color y el ícono cargan la diferencia, no la posición del
 * botón. Al resolver se dispara el correo electrónico automático al cliente
 * y la notificación al resto de los administradores.
 */
@Component({
  selector: 'lm-dueno-resultado',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado [titulo]="tituloEncabezado()" conVolver (volver)="volver()" />

      @if (cliente(); as persona) {
        <div class="lm-body">
          <div class="ficha" [style.background]="fondo()" [style.border-color]="color()">
            <span class="ficha__icono" [style.background]="color()">
              <lm-icono [nombre]="glifo()" [tamano]="44" color="var(--lm-surface)" />
            </span>
            <span class="ficha__titulo">{{ tituloFicha() }}</span>
            <span class="ficha__texto">{{ detalle() }}</span>
          </div>

          <div class="lm-card persona">
            <span
              class="lm-avatar"
              [style.background-color]="usuarios.colorAvatar(persona)"
              [style.background-image]="persona.fotoUrl ? 'url(' + persona.fotoUrl + ')' : 'url(' + usuarios.avatarSushi(persona) + ')'"
            >
              @if (!persona.fotoUrl) {
                {{ usuarios.iniciales(persona) }}
              }
            </span>
            <div>
              <div class="persona__nombre">{{ usuarios.nombreCompleto(persona) }}</div>
              <div class="persona__meta">Documento {{ persona.dni | documento }}</div>
              <div class="persona__meta">{{ persona.email }}</div>
            </div>
          </div>

          @if (!resuelto() && aprobar() === false) {
            <lm-area
              [control]="formulario.controls.motivo"
              icono="notes"
              etiqueta="Motivo del rechazo"
              marcador="Qué dato no pudimos verificar"
              ayuda="Se incluye en el correo que recibe el cliente. Si lo dejás vacío se envía el motivo general."
            />
          }

          @if (resuelto()) {
            <div class="lm-card aviso">
              <lm-icono nombre="outgoing_mail" [tamano]="22" color="var(--action-primary)" />
              <span>
                Le enviamos el correo de {{ aprobar() ? 'aprobación' : 'rechazo' }} a {{ persona.email }}.
                <br />
                <small>{{ correo()?.detalle }}</small>
              </span>
            </div>
            <lm-separador />
            <p class="lm-nota">
              La fila queda en el listado con su estado
              {{ aprobar() ? 'aprobado en verde' : 'rechazado en rojo' }} y ya sin botones.
            </p>
          } @else {
            <lm-separador rotulo="Qué va a pasar" />
            <p class="lm-parrafo">{{ anticipo() }}</p>
          }
        </div>

        <div class="lm-actionbar">
          @if (resuelto()) {
            <lm-boton icono="list" (presionar)="volver()">Volver a registros</lm-boton>
            <lm-texto-boton (presionar)="ir(['/dueno/correos'])">Ver el correo enviado</lm-texto-boton>
          } @else {
            <lm-boton
              [variante]="aprobar() ? 'success' : 'danger'"
              [icono]="aprobar() ? 'check' : 'close'"
              (presionar)="confirmar()"
            >
              {{ aprobar() ? 'Aprobar y enviar el correo' : 'Rechazar y enviar el correo' }}
            </lm-boton>
            <lm-texto-boton (presionar)="volver()">Cancelar</lm-texto-boton>
          }
        </div>
      } @else {
        <div class="lm-body">
          <lm-vacio icono="person_off" titulo="No encontramos ese registro">
            Puede que ya lo hayas resuelto desde otro dispositivo.
            <lm-boton accion variante="secondary" [ancho]="false" (presionar)="volver()">Volver a registros</lm-boton>
          </lm-vacio>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .ficha {
        display: flex; flex-direction: column; align-items: center; gap: 12px;
        padding: 26px 18px; border-radius: var(--radius-card); border: 1px solid; text-align: center;
      }
      .ficha__icono { width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; }
      .ficha__titulo { font: var(--type-title); color: var(--text-title); text-wrap: balance; }
      .ficha__texto { font: var(--type-body-small); color: var(--text-muted); text-wrap: pretty; }
      .persona { display: flex; gap: 14px; align-items: center; padding: 16px; }
      .persona__nombre { font: var(--type-card-title); color: var(--text-title); }
      .persona__meta { font: var(--type-caption); color: var(--text-muted); }
      .aviso { display: flex; gap: 10px; padding: 14px; font: var(--type-body-small); color: var(--text-body); }
      .aviso small { color: var(--text-muted); font: var(--type-caption); }
    `,
  ],
})
export class DuenoResultadoPage extends PaginaConSesion {
  protected readonly usuarios = inject(UsuariosService);
  private readonly correos = inject(CorreoService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly fb = inject(FormBuilder);

  readonly id = input.required<string>();
  readonly decision = input.required<string>();

  protected readonly resuelto = signal(false);
  protected readonly correo = signal<CorreoEnviado | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({ motivo: [''] });

  protected readonly aprobar = computed(() => this.decision() === 'aprobado');
  protected readonly cliente = computed(() => this.usuarios.porId(this.id()));

  protected async confirmar(): Promise<void> {
    const persona = this.cliente();
    const resolutor = this.usuario();
    if (!persona || !resolutor) return;

    const aprobar = this.aprobar();
    const motivo = this.formulario.controls.motivo.value.trim();

    const seguro = await this.preguntar({
      titulo: aprobar ? '¿Aprobás el registro?' : '¿Rechazás el registro?',
      mensaje: aprobar
        ? 'La cuenta queda habilitada y sale un correo automático de aprobación. Se puede revertir rechazándola después.'
        : 'La cuenta queda bloqueada y sale un correo automático con el motivo. La persona no va a poder iniciar sesión.',
      confirmar: aprobar ? 'Aprobar y enviar' : 'Rechazar y enviar',
      tono: aprobar ? 'exito' : 'peligro',
      icono: aprobar ? 'check' : 'block',
      detalle: [
        { rotulo: 'Cliente', valor: this.usuarios.nombreCompleto(persona) },
        { rotulo: 'Correo', valor: persona.email ?? '—' },
        ...(aprobar || !motivo ? [] : [{ rotulo: 'Motivo', valor: motivo }]),
      ],
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima(
      aprobar ? 'Aprobando el registro…' : 'Rechazando el registro…',
      async () => {
        const actualizado = aprobar ? await this.usuarios.aprobar(persona.id) : await this.usuarios.rechazar(persona.id);
        const destinatario = actualizado ?? persona;

        const enviado = aprobar
          ? await this.correos.enviarAprobacion(destinatario, resolutor)
          : await this.correos.enviarRechazo(destinatario, resolutor, motivo || undefined);
        this.correo.set(enviado);

        // Avisamos al resto de los administradores para que no lo resuelvan dos veces.
        const otros = this.usuarios
          .administradores()
          .filter((u) => u.id !== resolutor.id)
          .map((u) => u.id);
        if (otros.length) {
          await this.notificaciones.enviar(
            otros,
            aprobar ? 'Registro aprobado' : 'Registro rechazado',
            `${this.usuarios.nombreCompleto(destinatario)} fue ${aprobar ? 'aprobado' : 'rechazado'} por ${resolutor.nombre}.`,
            ['/dueno/registros'],
          );
        }
      },
    );

    this.resuelto.set(true);
    if (aprobar) {
      this.avisos.exito('Cliente aprobado', `${persona.nombre} ya puede entrar a la aplicación.`);
    } else {
      this.avisos.info('Cliente rechazado', `${persona.nombre} no va a poder ingresar con esta cuenta.`);
    }
  }

  protected color(): string {
    return this.aprobar() ? 'var(--state-success)' : 'var(--state-error)';
  }
  protected fondo(): string {
    return this.aprobar() ? 'var(--state-success-surface)' : 'var(--state-error-surface)';
  }
  protected glifo(): string {
    if (!this.resuelto()) return this.aprobar() ? 'how_to_reg' : 'person_remove';
    return this.aprobar() ? 'check' : 'block';
  }
  protected tituloEncabezado(): string {
    if (this.resuelto()) return this.aprobar() ? 'Registro aprobado' : 'Registro rechazado';
    return this.aprobar() ? 'Aprobar registro' : 'Rechazar registro';
  }
  protected tituloFicha(): string {
    if (this.resuelto()) return this.aprobar() ? 'Cliente aprobado' : 'Cliente rechazado';
    return this.aprobar() ? '¿Aprobás este registro?' : '¿Rechazás este registro?';
  }
  protected detalle(): string {
    const nombre = this.usuarios.nombreCompleto(this.cliente());
    if (this.resuelto()) {
      return this.aprobar()
        ? `${nombre} ya puede iniciar sesión y sumarse a la lista de espera.`
        : `${nombre} no va a poder ingresar con esta cuenta.`;
    }
    return this.aprobar()
      ? 'Al aprobar, la cuenta queda habilitada para entrar a la aplicación.'
      : 'Al rechazar, la cuenta queda bloqueada y no puede entrar a la aplicación.';
  }
  protected anticipo(): string {
    return this.aprobar()
      ? 'Se envía un correo electrónico automático de aprobación desde la casilla del restaurante y la persona aparece en el ingreso rápido.'
      : 'Se envía un correo electrónico automático con el motivo del rechazo desde la casilla del restaurante. La persona todavía puede entrar como invitada.';
  }

  protected volver(): void {
    this.ir(['/dueno/registros']);
  }
}
