import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { PERFILES_EMPLEADO, Perfil, ROTULO_PERFIL } from '../../nucleo/modelos/enums';
import { Usuario } from '../../nucleo/modelos/modelos';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import {
  clave,
  clavesIguales,
  correoElectronico,
  cuil,
  largoMinimo,
  requerido,
  soloLetras,
  marcarEnviado,
  limpiarEnviado,
} from '../../nucleo/validacion/validadores';

/**
 * Punto 1 · Alta de empleado. Perfiles: dueño o supervisor.
 *
 * El escaneo del documento va arriba porque ahorra medio formulario. La
 * primaria es una sola, ancha y al pie; cancelar es texto debajo, sin color
 * propio. Se validan todos los campos: formato, vacíos, tipos y unicidad.
 */
@Component({
  selector: 'lm-alta-empleado',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Alta de empleado" conVolver (volver)="volver()" />

      <div class="lm-body lm-body--gap12">
        @if (alta(); as nuevo) {
          <lm-banner tono="success" titulo="Empleado dado de alta">
            {{ usuarios.nombreCompleto(nuevo) }} ya puede iniciar sesión como {{ rotuloPerfil(nuevo.perfil) }}.
          </lm-banner>
        }
        @if (resumenError()) {
          <lm-banner tono="error" titulo="Faltan datos para dar el alta">{{ resumenError() }}</lm-banner>
        }
        @if (leidoDelDocumento()) {
          <lm-banner tono="success" titulo="Datos leídos del documento">
            Los campos quedan editables: confirmá que estén bien antes de guardar.
          </lm-banner>
        }

        <!-- Todo el mosaico de la foto dispara la cámara, no sólo el círculo y el pie. -->
        <section class="lm-vidrio lm-doc">
          <b>Cargá tu foto y escaneá tu DNI</b>
          <div class="lm-fila-doc">
            <lm-foto [fuente]="foto()" [tamano]="120" etiqueta="Tomar foto" [error]="errorFoto()" (click)="tomarFoto()" />
            <lm-tarjeta-escaneo titulo="Escanear DNI" [escaneando]="escaneando()" (escanear)="escanearDocumento()" />
          </div>
        </section>

        <lm-campo [control]="formulario.controls.nombre" icono="person" etiqueta="Nombres" marcador="Sofía Ayelén" />
        <lm-campo [control]="formulario.controls.apellido" icono="person" etiqueta="Apellidos" marcador="Gómez" />
        <lm-campo
          [control]="formulario.controls.cuil"
          icono="credit_card"
          etiqueta="CUIL"
          marcador="27-44225858-4"
          modo="numeric"
          [largoMaximo]="13"
        />
        <lm-campo
          [control]="formulario.controls.email"
          icono="mail"
          tipo="email"
          modo="email"
          etiqueta="Correo electrónico"
          marcador="sofia@sakurapp.com.ar"
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

        <lm-segmentado
          etiqueta="Perfil"
          [opciones]="perfiles"
          [valor]="perfil()"
          [columnas]="2"
          (cambiar)="perfil.set($any($event))"
        />
      </div>

      <div class="lm-actionbar">
        <lm-decision rotuloAceptar="Dar de alta" (rechazar)="volver()" (aceptar)="guardar()" />
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }

      /* Distribución: ocupar el alto disponible y no cortar tarjetas (pautas de la cátedra) */
      /* Con poco contenido las partes se reparten el alto; con mucho, hay scroll. */
      .lm-body { justify-content: space-between; }
    `,
  ],
})
export class AltaEmpleadoPage extends PaginaConSesion {
  private readonly fb = inject(FormBuilder);
  protected readonly usuarios = inject(UsuariosService);
  private readonly camara = inject(CamaraService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);

  protected readonly perfiles = PERFILES_EMPLEADO.map((p) => ({ valor: p, rotulo: ROTULO_PERFIL[p] }));
  protected readonly perfil = signal<Extract<Perfil, 'METRE' | 'MOZO' | 'COCINERO' | 'CANTINERO'>>('COCINERO');

  protected readonly foto = signal<string | null>(null);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly escaneando = signal(false);
  protected readonly leidoDelDocumento = signal(false);
  protected readonly resumenError = signal<string | null>(null);
  protected readonly alta = signal<Usuario | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [requerido('Escribí los nombres'), soloLetras(), largoMinimo(2, 'El nombre es demasiado corto')]],
    apellido: ['', [requerido('Escribí los apellidos'), soloLetras(), largoMinimo(2, 'El apellido es demasiado corto')]],
    cuil: ['', [requerido('Escribí el CUIL'), cuil()]],
    email: ['', [requerido('Escribí el correo electrónico'), correoElectronico()]],
    clave: ['', [requerido('Elegí una contraseña'), clave()]],
    repeticion: ['', [requerido('Repetí la contraseña')]],
  }, { validators: [clavesIguales('clave', 'repeticion')] });

  protected rotuloPerfil(perfil: Perfil): string {
    return ROTULO_PERFIL[perfil];
  }

  protected async tomarFoto(): Promise<void> {
    const imagen = await this.camara.tomarFoto();
    if (imagen) {
      this.foto.set(imagen);
      this.errorFoto.set(null);
    }
  }

  /** Punto 1 · lectura del código del documento, que carga nombres, apellidos, documento y CUIL. */
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
      cuil: datos.cuil,
    });
    this.leidoDelDocumento.set(true);
    this.avisos.exito('Documento leído', `${datos.nombres} ${datos.apellidos}, documento ${datos.dni}.`);
  }

  protected async guardar(): Promise<void> {
    this.alta.set(null);
    this.resumenError.set(null);
    marcarEnviado(this.formulario);

    if (!this.foto()) this.errorFoto.set('Sacale una foto con la cámara para dar el alta');

    if (this.usuarios.existeCorreo(this.formulario.controls.email.value)) {
      this.formulario.controls.email.setErrors({ lm: 'Ese correo electrónico ya está en uso' });
    }
    if (this.formulario.controls.cuil.valid && this.usuarios.existeDocumento(this.dni())) {
      this.formulario.controls.cuil.setErrors({ lm: 'Ese número de documento ya está registrado' });
    }

    if (this.formulario.invalid || !this.foto()) {
      const faltantes = this.contarErrores();
      this.resumenError.set(faltantes === 1 ? 'Revisá el campo marcado.' : `Revisá los ${faltantes} campos marcados.`);
      this.avisos.error('No pudimos dar el alta', 'Hay datos incompletos o con formato incorrecto.');
      return;
    }

    const datos = this.formulario.getRawValue();
    const dni = this.dni();

    const seguro = await this.preguntar({
      titulo: '¿Das de alta a esta persona?',
      mensaje: '',
      confirmar: 'Dar de alta',
      tono: 'exito',
      icono: 'person_add',
      detalle: [
        { rotulo: 'Nombre', valor: `${datos.nombre} ${datos.apellido}` },
        { rotulo: 'Documento', valor: dni },
        { rotulo: 'Perfil', valor: ROTULO_PERFIL[this.perfil()] },
      ],
    });
    if (!seguro) return;

    const nuevo = await this.cargando.conEsperaMinima('Dando de alta al empleado…', () =>
      this.usuarios.crearEmpleado({
        nombre: datos.nombre,
        apellido: datos.apellido,
        dni,
        cuil: datos.cuil,
        email: datos.email,
        clave: datos.clave,
        perfil: this.perfil(),
        fotoUrl: this.foto()!,
      }),
    );

    this.limpiarFormulario();
    this.alta.set(nuevo);
    this.avisos.exito('Empleado dado de alta', `${nuevo.nombre} ya aparece en el ingreso rápido.`);
  }

  /** El documento se infiere del CUIL: los ocho dígitos del medio, sin ceros a la izquierda. */
  private dni(): string {
    return this.formulario.controls.cuil.value.replace(/\D/g, '').slice(2, 10).replace(/^0+/, '');
  }

  private contarErrores(): number {
    let total = this.foto() ? 0 : 1;
    for (const control of Object.values(this.formulario.controls)) {
      if (control.invalid) total++;
    }
    return total;
  }

  private limpiarFormulario(): void {
    this.formulario.reset();
    limpiarEnviado(this.formulario);
    this.foto.set(null);
    this.errorFoto.set(null);
    this.leidoDelDocumento.set(false);
    this.resumenError.set(null);
  }

  protected volver(): void {
    this.ir(['/dueno/empleados']);
  }
}
