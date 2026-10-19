import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UI } from '../../ui';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { CorreoService } from '../../nucleo/servicios/correo.service';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { SesionService } from '../../nucleo/servicios/sesion.service';
import {
  clave,
  clavesIguales,
  correoElectronico,
  cuil,
  largoMinimo,
  requerido,
  soloLetras,
  marcarEnviado,
} from '../../nucleo/validacion/validadores';

/** Los dos pasos del registro: la persona y, después, su cuenta. */
const PASOS = ['Foto y datos', 'Cuenta'] as const;

/**
 * Registro de cliente.
 * El registro queda en estado PENDIENTE de aprobación por Dueño o Supervisor.
 * Va paginado en dos pasos, como el alta de empleado: así entra entero en
 * cualquier teléfono aun con los errores a la vista. Cada paso se valida antes
 * de avanzar y, si al enviar falla un dato del primero, se vuelve a él.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-registro-cliente',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado [titulo]="desdePersonal() ? 'Registrar cliente' : 'Crear cuenta'" conVolver (volver)="atras()" />

      <!-- Dónde está parado: un tramo por paso y el nombre del paso. -->
      <div class="registro__pasos" role="group" [attr.aria-label]="'Paso ' + paso() + ' de ' + pasos.length">
        <div class="registro__tramos">
          @for (nombre of pasos; track nombre; let n = $index) {
            <span class="registro__tramo" [class.registro__tramo--hecho]="n + 1 <= paso()"></span>
          }
        </div>
        <!-- Con errores, el aviso ocupa el renglón del paso y no suma alto: así el
             paso sigue entrando entero con todos los errores a la vista. -->
        @if (conErrores()) {
          <span class="registro__aviso" role="alert">
            <lm-icono nombre="error" [tamano]="16" />
            Revisá los datos marcados
          </span>
        } @else {
          <span class="registro__rotulo">Paso {{ paso() }} de {{ pasos.length }} · {{ nombrePaso() }}</span>
        }
      </div>

      <div #cuerpo class="lm-body lm-body--gap14 registro__cuerpo">
        @switch (paso()) {
          @case (1) {
            @if (leidoDelDocumento()) {
              <lm-banner tono="success" titulo="Datos leídos del documento">
                Confirmá que estén bien antes de enviar el registro.
              </lm-banner>
            }

            <!-- Igual que el alta de empleado: todo el mosaico de la foto dispara la cámara. -->
            <section class="lm-vidrio lm-doc">
              <b>{{ desdePersonal() ? 'Cargá su foto y escaneá su DNI' : 'Cargá tu foto y escaneá tu DNI' }}</b>
              <div class="lm-fila-doc">
                <lm-foto [fuente]="foto()" [tamano]="120" etiqueta="Tomar foto" [error]="errorFoto()" (click)="tomarFoto()" />
                <lm-tarjeta-escaneo titulo="Escanear DNI" [escaneando]="escaneando()" (escanear)="escanearDocumento()" />
              </div>
            </section>

            <lm-campo [control]="formulario.controls.nombre" icono="person" etiqueta="Nombres" marcador="Sofía Ayelén" />
            <lm-campo [control]="formulario.controls.apellido" icono="person" etiqueta="Apellidos" marcador="Gómez" />
            <lm-campo
              [control]="formulario.controls.cuil"
              icono="fingerprint"
              etiqueta="CUIL"
              marcador="20-44225858-9"
              modo="numeric"
              [largoMaximo]="13"
            />
          }
          @case (2) {
            <lm-campo
              [control]="formulario.controls.email"
              icono="mail"
              tipo="email"
              modo="email"
              etiqueta="Correo electrónico"
              marcador="sofia@correo.com.ar"
            />
            <lm-campo
              [control]="formulario.controls.clave"
              icono="lock"
              tipo="password"
              etiqueta="Contraseña"
              marcador="Mínimo ocho caracteres"
            />
            <lm-campo
              [control]="formulario.controls.repeticion"
              icono="lock_reset"
              tipo="password"
              etiqueta="Confirmar contraseña"
              marcador="Repetí la contraseña"
              tecla="done"
            />
          }
        }
      </div>

      <div class="lm-actionbar lm-actionbar--split">
        <lm-boton class="registro__accion" variante="danger" [icono]="paso() === 1 ? 'close' : 'arrow_back'" (presionar)="atras()">
          {{ paso() === 1 ? (desdePersonal() ? 'Volver' : 'Cancelar') : 'Atrás' }}
        </lm-boton>
        @if (paso() < pasos.length) {
          <lm-boton class="registro__accion" variante="success" icono="arrow_forward" (presionar)="siguiente()">Siguiente</lm-boton>
        } @else {
          <lm-boton class="registro__accion" variante="success" icono="how_to_reg" [deshabilitado]="enviando()" (presionar)="registrar()">
            {{ desdePersonal() ? 'Registrar' : 'Registrarme' }}
          </lm-boton>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }

      .registro__pasos {
        flex: 0 0 auto; display: flex; flex-direction: column; gap: 6px;
        padding: var(--space-2) var(--gutter-screen) 0;
      }
      .registro__tramos { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 6px; }
      .registro__tramo {
        height: 6px; border-radius: 999px; background: rgba(255, 255, 255, .28);
        transition: background var(--dur-base) var(--ease-standard);
      }
      .registro__tramo--hecho { background: var(--surface-card); }
      .registro__rotulo {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-sobre-fondo);
      }
      .registro__aviso {
        display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
        padding: 3px 10px; border-radius: var(--radius-pill);
        background: var(--state-error-surface); color: var(--state-error);
        font: var(--type-label); letter-spacing: var(--tracking-label); text-transform: uppercase;
      }

      /* Cada paso entra entero y sus partes se reparten el alto, igual que en el
         alta de empleado. Si un cartel lo estira en un teléfono muy bajo, el paso
         se recorre desde arriba en vez de cortarse. */
      .registro__cuerpo { scroll-snap-type: none; }
      .registro__cuerpo > * { margin-block: auto; }
      /* Pantallas bajas: menos aire, para que el primer paso entre entero aun
         con todos los errores a la vista. */
      @media (max-height: 700px) {
        .registro__cuerpo { gap: 6px; }
      }

      /* En pantallas angostas el rótulo no se parte: se va el ícono. */
      .registro__accion ::ng-deep .lm-btn { white-space: nowrap; }
      @media (max-width: 340px) { .registro__accion ::ng-deep lm-icono { display: none; } }
    `,
  ],
})
export class RegistroClientePage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usuarios = inject(UsuariosService);
  private readonly sesion = inject(SesionService);
  protected readonly desdePersonal = computed(() => this.sesion.tienePerfil('METRE', 'DUENO', 'SUPERVISOR', 'MOZO', 'COCINERO', 'CANTINERO'));
  protected readonly enviando = signal(false);
  private readonly camara = inject(CamaraService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly correo = inject(CorreoService);
  private readonly notificaciones = inject(NotificacionesService);

  protected readonly foto = signal<string | null>(null);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly escaneando = signal(false);
  protected readonly leidoDelDocumento = signal(false);
  protected readonly pasos = PASOS;
  protected readonly paso = signal(1);
  protected readonly nombrePaso = computed(() => PASOS[this.paso() - 1]);
  /** El cartel corto de arriba: el detalle ya lo muestra cada campo. */
  protected readonly conErrores = signal(false);
  private readonly cuerpo = viewChild<ElementRef<HTMLElement>>('cuerpo');

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', [requerido('Escribí tus nombres'), soloLetras(), largoMinimo(2, 'El nombre es demasiado corto')]],
      apellido: ['', [requerido('Escribí tus apellidos'), soloLetras(), largoMinimo(2, 'El apellido es demasiado corto')]],
      cuil: ['', [requerido('Escribí tu CUIL'), cuil()]],
      email: ['', [requerido('Escribí tu correo electrónico'), correoElectronico()]],
      clave: ['', [requerido('Elegí una contraseña'), clave()]],
      repeticion: ['', [requerido('Repetí la contraseña')]],
    },
    { validators: [clavesIguales('clave', 'repeticion')] },
  );

  protected async tomarFoto(): Promise<void> {
    const imagen = await this.camara.tomarFoto();
    if (imagen) {
      this.foto.set(imagen);
      this.errorFoto.set(null);
    }
  }

  protected async escanearDocumento(): Promise<void> {
    if (!this.escaner.disponible()) {
      this.avisos.info(
        'El lector funciona en el teléfono',
        'Instalá la aplicación en Android para leer el código del documento.',
      );
      return;
    }

    this.escaneando.set(true);
    const leido = await this.escaner.leer('DNI');
    this.escaneando.set(false);
    if (!leido) return;

    const datos = this.qr.interpretarDni(leido);
    if (!datos) {
      this.avisos.error('No pudimos leer el documento', 'Probá de nuevo con el reverso del documento bien iluminado.');
      return;
    }

    this.formulario.patchValue({
      nombre: datos.nombres,
      apellido: datos.apellidos,
      // El código del documento no trae el CUIL: se deduce del documento y el sexo.
      cuil: datos.cuil,
    });
    this.leidoDelDocumento.set(true);
    this.avisos.exito('Documento leído', `${datos.nombres} ${datos.apellidos}, CUIL ${datos.cuil}.`);
  }

  /** El documento se infiere del CUIL: los ocho dígitos del medio, sin ceros a la izquierda. */
  private dni(): string {
    return this.formulario.controls.cuil.value.replace(/\D/g, '').slice(2, 10).replace(/^0+/, '');
  }

  /** Avanza sólo si el paso actual está completo; si no, marca lo que falta. */
  protected siguiente(): void {
    if (!this.pasoValido(this.paso(), true)) {
      this.conErrores.set(true);
      this.avisos.error('Revisá este paso', 'Hay datos incompletos o con formato incorrecto.');
      return;
    }
    this.conErrores.set(false);
    this.irAlPaso(this.paso() + 1);
  }

  /** En el primer paso, atrás es salir del registro. */
  protected atras(): void {
    if (this.paso() === 1) this.volver();
    else this.irAlPaso(this.paso() - 1);
  }

  protected async registrar(): Promise<void> {
    if (this.enviando()) return;
    this.conErrores.set(false);
    marcarEnviado(this.formulario);

    // Si falla un dato del primer paso (por ejemplo, el CUIL ya existe), se
    // vuelve a ese paso para que se vea qué corregir.
    const conError = [1, 2].find((n) => !this.pasoValido(n, false));
    if (conError) {
      this.conErrores.set(true);
      this.irAlPaso(conError);
      this.avisos.error('No pudimos enviar el registro', 'Revisá los campos marcados en rojo.');
      return;
    }

    const dniDeducido = this.dni();
    const datos = this.formulario.getRawValue();

    const seguro = await this.confirmacion.pedir({
      titulo: this.desdePersonal() ? '¿Registrás a este cliente?' : '¿Enviás tu registro?',
      mensaje: this.desdePersonal()
        ? undefined
        : 'Te avisaremos por correo cuando el dueño o el supervisor revise tu registro.',
      confirmar: 'Enviar registro',
      tono: 'exito',
      icono: 'how_to_reg',
      detalle: [
        { rotulo: 'Nombre', valor: `${datos.nombre} ${datos.apellido}` },
        { rotulo: 'CUIL', valor: datos.cuil },
        { rotulo: 'Correo', valor: datos.email },
      ],
    });
    if (!seguro || this.enviando()) return;

    this.enviando.set(true);
    try {
      const usuarioCreado = await this.cargando.conEsperaMinima('Enviando registro…', () =>
        this.usuarios.crearClienteRegistrado({
          nombre: datos.nombre,
          apellido: datos.apellido,
          dni: dniDeducido,
          cuil: datos.cuil,
          email: datos.email,
          clave: datos.clave,
          fotoUrl: this.foto()!,
        }, this.desdePersonal()),
      );

      // US-3.2: Envío automático de correo con plantilla "Registro Recibido"
      void this.correo.enviarConfirmacionRegistro(usuarioCreado).catch((err) => {
        console.warn('⚠️ Fallo en despacho de correo de registro recibido:', err);
      });

      // US-3.2: Notificación push a Dueño y Supervisor ante nuevo comensal pendiente
      const adminIds = this.usuarios.administradores().map((u) => u.id);
      void this.notificaciones
        .notificarNuevoRegistro(this.usuarios.nombreCompleto(usuarioCreado), adminIds)
        .catch((err) => {
          console.warn('⚠️ Fallo al emitir notificación a administradores:', err);
        });

      if (this.desdePersonal()) {
        this.avisos.exito('Cliente registrado', 'Su cuenta quedó pendiente de aprobación.');
        await this.router.navigate([this.sesion.rutaInicio()], { replaceUrl: true });
      } else {
        await this.router.navigate(['/registro-enviado'], { replaceUrl: true });
      }
    } catch (error) {
      this.avisos.error('No pudimos enviar el registro', error instanceof Error ? error.message : 'Intentá de nuevo.');
    } finally {
      this.enviando.set(false);
    }
  }

  /**
   * Revisa los campos de un paso. Con `marcar` los pone en rojo; sin él sólo
   * consulta, porque enviar ya marcó todo el formulario.
   */
  private pasoValido(paso: number, marcar: boolean): boolean {
    const c = this.formulario.controls;
    if (paso === 1) {
      if (!this.foto()) this.errorFoto.set('Sacate una foto con la cámara para completar el registro');
      if (marcar) [c.nombre, c.apellido, c.cuil].forEach((control) => marcarEnviado(control));
      if (c.cuil.valid && this.usuarios.existeDocumento(this.dni())) {
        c.cuil.setErrors({ lm: 'Documento ya registrado' });
      }
      if (this.usuarios.existeCuil(c.cuil.value)) {
        c.cuil.setErrors({ lm: 'CUIL ya registrado' });
      }
      return !!this.foto() && c.nombre.valid && c.apellido.valid && c.cuil.valid;
    }
    if (marcar) [c.email, c.clave, c.repeticion].forEach((control) => marcarEnviado(control));
    if (c.email.valid && this.usuarios.existeCorreo(c.email.value)) {
      c.email.setErrors({ lm: 'Correo ya registrado' });
    }
    return c.email.valid && c.clave.valid && c.repeticion.valid && this.formulario.valid;
  }

  private irAlPaso(paso: number): void {
    this.paso.set(paso);
    this.cuerpo()?.nativeElement.scrollTo({ top: 0 });
  }

  protected volver(): void {
    void this.router.navigate([this.desdePersonal() ? this.sesion.rutaInicio() : '/login']);
  }
}

