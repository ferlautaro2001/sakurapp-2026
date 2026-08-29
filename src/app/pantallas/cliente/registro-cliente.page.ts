import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UI } from '../../ui';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import {
  clave,
  clavesIguales,
  correoElectronico,
  documento,
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
  selector: 'lm-registro-cliente',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Crear cuenta" conVolver (volver)="volver()" />

      <div class="lm-body lm-body--gap12">
        @if (resumenError()) {
          <lm-banner tono="error" titulo="Revisá los datos marcados">{{ resumenError() }}</lm-banner>
        }
        @if (leidoDelDocumento()) {
          <lm-banner tono="success" titulo="Datos leídos del documento">
            Confirmá que estén bien antes de enviar el registro.
          </lm-banner>
        }

        <lm-foto
          [fuente]="foto()"
          [tamano]="124"
          etiqueta="Foto con cámara"
          [error]="errorFoto()"
          (capturar)="tomarFoto()"
        />

        <lm-tarjeta-escaneo
          titulo="Escanear el código del documento"
          ayuda="Es más rápido que escribir todo"
          [escaneando]="escaneando()"
          (escanear)="escanearDocumento()"
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
          [control]="formulario.controls.email"
          icono="mail"
          tipo="email"
          modo="email"
          etiqueta="Correo electrónico"
          marcador="sofia@correo.com.ar"
          ayuda="Ahí te avisamos si tu cuenta quedó aprobada o rechazada"
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

      <div class="lm-actionbar">
        <lm-boton icono="how_to_reg" (presionar)="registrar()">Registrarse</lm-boton>
        <lm-texto-boton (presionar)="volver()">Ya tengo cuenta</lm-texto-boton>
      </div>
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
})
export class RegistroClientePage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usuarios = inject(UsuariosService);
  private readonly camara = inject(CamaraService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);

  protected readonly foto = signal<string | null>(null);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly escaneando = signal(false);
  protected readonly leidoDelDocumento = signal(false);
  protected readonly resumenError = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', [requerido('Escribí tus nombres'), soloLetras(), largoMinimo(2, 'El nombre es demasiado corto')]],
      apellido: ['', [requerido('Escribí tus apellidos'), soloLetras(), largoMinimo(2, 'El apellido es demasiado corto')]],
      dni: ['', [requerido('Escribí tu número de documento'), documento()]],
      email: ['', [requerido('Escribí tu correo electrónico'), correoElectronico()]],
      clave: ['', [requerido('Elegí una contraseña'), clave()]],
      repeticion: ['', [requerido('Repetí la contraseña')]],
    },
    { validators: clavesIguales('clave', 'repeticion') },
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
      dni: datos.dni,
    });
    this.leidoDelDocumento.set(true);
    this.avisos.exito('Documento leído', `${datos.nombres} ${datos.apellidos}, documento ${datos.dni}.`);
  }

  protected async registrar(): Promise<void> {
    this.resumenError.set(null);
    marcarEnviado(this.formulario);

    if (!this.foto()) {
      this.errorFoto.set('Sacate una foto con la cámara para completar el registro');
    }

    if (this.usuarios.existeCorreo(this.formulario.controls.email.value)) {
      this.formulario.controls.email.setErrors({ lm: 'Ese correo electrónico ya tiene una cuenta' });
    }
    if (this.usuarios.existeDocumento(this.formulario.controls.dni.value)) {
      this.formulario.controls.dni.setErrors({ lm: 'Ese número de documento ya está registrado' });
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
      titulo: '¿Enviás tu registro?',
      mensaje: 'El dueño o el supervisor lo revisan y te avisan por correo electrónico. Hasta que lo aprueben no vas a poder entrar.',
      confirmar: 'Enviar registro',
      tono: 'exito',
      icono: 'how_to_reg',
      detalle: [
        { rotulo: 'Nombre', valor: `${datos.nombre} ${datos.apellido}` },
        { rotulo: 'Documento', valor: datos.dni },
        { rotulo: 'Correo', valor: datos.email },
      ],
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima('Enviando tu registro…', () =>
      this.usuarios.crearClienteRegistrado({
        nombre: datos.nombre,
        apellido: datos.apellido,
        dni: datos.dni,
        cuil: '',
        email: datos.email,
        clave: datos.clave,
        fotoUrl: this.foto()!,
      }),
    );

    await this.router.navigate(['/registro-enviado'], { replaceUrl: true });
  }

  private contarErrores(): number {
    let total = this.foto() ? 0 : 1;
    for (const control of Object.values(this.formulario.controls)) {
      if (control.invalid) total++;
    }
    return total;
  }

  protected volver(): void {
    void this.router.navigate(['/login']);
  }
}

