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
  correoElectronico,
  cuil,
  documento,
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
      <lm-encabezado [titulo]="alta() ? 'Alta confirmada' : 'Alta de empleado'" conVolver (volver)="volver()" />

      @if (alta(); as nuevo) {
        <div class="lm-body">
          <lm-banner tono="success" titulo="Empleado dado de alta">
            {{ usuarios.nombreCompleto(nuevo) }} ya puede iniciar sesión como {{ rotuloPerfil(nuevo.perfil) }}.
          </lm-banner>

          <div class="lm-card persona">
            <span
              class="lm-avatar"
              [style.background-color]="usuarios.colorAvatar(nuevo)"
              [style.background-image]="nuevo.fotoUrl ? 'url(' + nuevo.fotoUrl + ')' : null"
            ></span>
            <div>
              <div class="persona__nombre">{{ usuarios.nombreCompleto(nuevo) }}</div>
              <div class="persona__meta">Documento {{ nuevo.dni | documento }} · CUIL {{ nuevo.cuil }}</div>
              <lm-chip estado="aprobado">{{ rotuloPerfil(nuevo.perfil) }}</lm-chip>
            </div>
          </div>

          <lm-separador rotulo="Qué sigue" />
          <p class="lm-parrafo">
            Ya aparece en el ingreso rápido del login con su foto y su rol. Puede entrar con
            {{ nuevo.email }} y la contraseña que le cargaste.
          </p>
        </div>

        <div class="lm-actionbar">
          <lm-boton icono="list" (presionar)="volver()">Volver a registros</lm-boton>
          <lm-texto-boton (presionar)="otroMas()">Dar de alta a otra persona</lm-texto-boton>
        </div>
      } @else {
        <div class="lm-body lm-body--gap12">
          @if (resumenError()) {
            <lm-banner tono="error" titulo="Faltan datos para dar el alta">{{ resumenError() }}</lm-banner>
          }
          @if (leidoDelDocumento()) {
            <lm-banner tono="success" titulo="Datos leídos del documento">
              Los campos quedan editables: confirmá que estén bien antes de guardar.
            </lm-banner>
          }

          <lm-tarjeta-escaneo [escaneando]="escaneando()" (escanear)="escanearDocumento()" />

          <lm-foto
            [fuente]="foto()"
            [tamano]="120"
            etiqueta="Foto con cámara"
            [error]="errorFoto()"
            (capturar)="tomarFoto()"
          />

          <lm-campo [control]="formulario.controls.nombre" icono="person" etiqueta="Nombres" marcador="Sofía Ayelén" />
          <lm-campo [control]="formulario.controls.apellido" icono="person" etiqueta="Apellidos" marcador="Gómez" />
          <lm-campo
            [control]="formulario.controls.dni"
            icono="badge"
            etiqueta="Número de documento"
            marcador="44225858"
            modo="numeric"
            [largoMaximo]="8"
          />
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

          <lm-segmentado
            etiqueta="Perfil"
            [opciones]="perfiles"
            [valor]="perfil()"
            [columnas]="2"
            (cambiar)="perfil.set($any($event))"
          />
        </div>

        <div class="lm-actionbar">
          <lm-boton icono="check" (presionar)="guardar()">Dar de alta</lm-boton>
          <lm-texto-boton (presionar)="volver()">Cancelar</lm-texto-boton>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .persona { display: flex; gap: 14px; align-items: center; padding: 16px; }
      .persona__nombre { font: var(--type-card-title); color: var(--text-title); }
      .persona__meta { font: var(--type-caption); color: var(--text-muted); margin-bottom: 6px; }
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
    dni: ['', [requerido('Escribí el número de documento'), documento()]],
    cuil: ['', [requerido('Escribí el CUIL'), cuil()]],
    email: ['', [requerido('Escribí el correo electrónico'), correoElectronico()]],
    clave: ['', [requerido('Elegí una contraseña'), clave()]],
  });

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
      dni: datos.dni,
      cuil: datos.cuil,
    });
    this.leidoDelDocumento.set(true);
    this.avisos.exito('Documento leído', `${datos.nombres} ${datos.apellidos}, documento ${datos.dni}.`);
  }

  protected async guardar(): Promise<void> {
    this.resumenError.set(null);
    marcarEnviado(this.formulario);

    if (!this.foto()) this.errorFoto.set('Sacale una foto con la cámara para dar el alta');

    if (this.usuarios.existeCorreo(this.formulario.controls.email.value)) {
      this.formulario.controls.email.setErrors({ lm: 'Ese correo electrónico ya está en uso' });
    }
    if (this.usuarios.existeDocumento(this.formulario.controls.dni.value)) {
      this.formulario.controls.dni.setErrors({ lm: 'Ese número de documento ya está registrado' });
    }
    if (!this.coincideCuil()) {
      this.formulario.controls.cuil.setErrors({ lm: 'El CUIL no coincide con el número de documento' });
    }

    if (this.formulario.invalid || !this.foto()) {
      const faltantes = this.contarErrores();
      this.resumenError.set(faltantes === 1 ? 'Revisá el campo marcado.' : `Revisá los ${faltantes} campos marcados.`);
      this.avisos.error('No pudimos dar el alta', 'Hay datos incompletos o con formato incorrecto.');
      return;
    }

    const datos = this.formulario.getRawValue();

    const seguro = await this.preguntar({
      titulo: '¿Das de alta a esta persona?',
      mensaje: 'Queda habilitada para entrar a la aplicación con su correo y su contraseña, y aparece en el ingreso rápido.',
      confirmar: 'Dar de alta',
      tono: 'exito',
      icono: 'person_add',
      detalle: [
        { rotulo: 'Nombre', valor: `${datos.nombre} ${datos.apellido}` },
        { rotulo: 'Documento', valor: datos.dni },
        { rotulo: 'Perfil', valor: ROTULO_PERFIL[this.perfil()] },
      ],
    });
    if (!seguro) return;

    const nuevo = await this.cargando.conEsperaMinima('Dando de alta al empleado…', () =>
      this.usuarios.crearEmpleado({
        nombre: datos.nombre,
        apellido: datos.apellido,
        dni: datos.dni,
        cuil: datos.cuil,
        email: datos.email,
        clave: datos.clave,
        perfil: this.perfil(),
        fotoUrl: this.foto()!,
      }),
    );

    this.alta.set(nuevo);
    this.avisos.exito('Empleado dado de alta', `${nuevo.nombre} ya aparece en el ingreso rápido.`);
  }

  /** El CUIL tiene que llevar adentro el mismo número de documento. */
  private coincideCuil(): boolean {
    const dni = this.formulario.controls.dni.value.replace(/\D/g, '');
    const cuil = this.formulario.controls.cuil.value.replace(/\D/g, '');
    if (!dni || cuil.length !== 11) return true;
    return cuil.slice(2, 10) === dni.padStart(8, '0');
  }

  private contarErrores(): number {
    let total = this.foto() ? 0 : 1;
    for (const control of Object.values(this.formulario.controls)) {
      if (control.invalid) total++;
    }
    return total;
  }

  protected otroMas(): void {
    this.formulario.reset();
    limpiarEnviado(this.formulario);
    this.foto.set(null);
    this.errorFoto.set(null);
    this.leidoDelDocumento.set(false);
    this.resumenError.set(null);
    this.alta.set(null);
  }

  protected volver(): void {
    this.ir(['/dueno/registros']);
  }
}
