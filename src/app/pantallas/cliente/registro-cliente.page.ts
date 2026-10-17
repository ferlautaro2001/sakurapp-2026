import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

/**
 * Registro de cliente.
 * El registro queda en estado PENDIENTE de aprobación por Dueño o Supervisor.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-registro-cliente',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado [titulo]="desdePersonal() ? 'Registrar cliente' : 'Crear cuenta'" conVolver (volver)="volver()" />

      <!-- Dos tandas que miden justo el alto visible: el snap frena siempre al
           principio de una, así ningún campo queda cortado en ningún teléfono. -->
      <div class="lm-body registro__tandas">
        <div class="registro__tanda">
          @if (resumenError()) {
            <lm-banner tono="error" titulo="Revisá los datos marcados">{{ resumenError() }}</lm-banner>
          }
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
        </div>

        <div class="registro__tanda">
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
        </div>
      </div>

      <div class="lm-actionbar">
        <lm-decision
          [rotuloRechazar]="desdePersonal() ? 'Volver' : 'Cancelar'"
          [rotuloAceptar]="desdePersonal() ? 'Registrar cliente' : 'Registrarse'"
          [deshabilitado]="enviando()"
          (rechazar)="volver()"
          (aceptar)="registrar()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }

      /* Cada tanda mide el alto visible de la lista y reparte sus campos en él;
         si un cartel la estira de más, se puede recorrer en vez de cortarse. */
      .registro__tandas {
        container: registro / size; gap: 0; padding-block: 0;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0;
      }
      .registro__tanda {
        min-height: 50cqh; box-sizing: border-box;
        display: flex; flex-direction: column; justify-content: flex-start; gap: var(--space-3);
        padding-block: var(--space-3);
        scroll-snap-align: start; scroll-snap-stop: always;
      }
      .registro__tanda > * { flex-shrink: 0; }
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
  protected readonly resumenError = signal<string | null>(null);

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

  protected async registrar(): Promise<void> {
    if (this.enviando()) return;
    this.resumenError.set(null);
    marcarEnviado(this.formulario);

    if (!this.foto()) {
      this.errorFoto.set('Sacate una foto con la cámara para completar el registro');
    }

    if (this.usuarios.existeCorreo(this.formulario.controls.email.value)) {
      this.formulario.controls.email.setErrors({ lm: 'Ese correo electrónico ya tiene una cuenta' });
    }
    const dniDeducido = this.dni();
    if (this.formulario.controls.cuil.valid && this.usuarios.existeDocumento(dniDeducido)) {
      this.formulario.controls.cuil.setErrors({ lm: 'Ese número de documento ya está registrado' });
    }
    if (this.usuarios.existeCuil(this.formulario.controls.cuil.value)) {
      this.formulario.controls.cuil.setErrors({ lm: 'Ese CUIL ya está registrado' });
    }

    if (this.formulario.invalid || !this.foto()) {
      const faltantes = this.contarErrores();
      this.resumenError.set(
        faltantes === 1 ? 'Falta un dato para poder enviar el registro.' : `Faltan ${faltantes} datos para poder enviar el registro.`,
      );
      this.avisos.error('No pudimos enviar el registro', 'Revisá los campos marcados en rojo.');
      return;
    }

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

  private contarErrores(): number {
    let total = this.foto() ? 0 : 1;
    for (const control of Object.values(this.formulario.controls)) {
      if (control.invalid) total++;
    }
    return total;
  }

  protected volver(): void {
    void this.router.navigate([this.desdePersonal() ? this.sesion.rutaInicio() : '/login']);
  }
}

