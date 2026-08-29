import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UI } from '../../ui';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { SesionService } from '../../nucleo/servicios/sesion.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { largoMinimo, requerido, soloLetras, marcarEnviado } from '../../nucleo/validacion/validadores';

/**
 * Ingreso como cliente anónimo (invitado).
 * Requiere únicamente foto y nombre. Ingresa directo al salón sin requerir aprobación.
 */
@Component({
  selector: 'lm-registro-invitado',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Ingresar como invitado" conVolver (volver)="volver()" />

      <div class="lm-body">
        <lm-titulo bajada="Sin aprobación: entrás directo">
          Registro rápido
        </lm-titulo>

        @if (resumenError()) {
          <lm-banner tono="error" titulo="Faltan datos">{{ resumenError() }}</lm-banner>
        }

        <lm-foto
          [fuente]="foto()"
          [tamano]="148"
          etiqueta="Foto con cámara"
          [error]="errorFoto()"
          (capturar)="tomarFoto()"
        />

        <lm-campo [control]="formulario.controls.nombre" icono="person" etiqueta="Nombre" marcador="Cómo te llamamos" />

        <lm-separador />
        <p class="lm-parrafo">
          La foto se utiliza para reconocerte en el restaurante. Si querés guardar tus datos permanentemente,
          registrate con una cuenta completa.
        </p>
      </div>

      <div class="lm-actionbar">
        <lm-boton icono="how_to_reg" (presionar)="ingresar()">Ingresar como invitado</lm-boton>
        <lm-texto-boton (presionar)="cuentaCompleta()">Quiero una cuenta completa</lm-texto-boton>
      </div>
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
})
export class RegistroInvitadoPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usuarios = inject(UsuariosService);
  private readonly sesion = inject(SesionService);
  private readonly camara = inject(CamaraService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);

  protected readonly foto = signal<string | null>(null);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly resumenError = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [requerido('Escribí tu nombre'), soloLetras(), largoMinimo(2, 'El nombre es demasiado corto')]],
  });

  protected async tomarFoto(): Promise<void> {
    const imagen = await this.camara.tomarFoto();
    if (imagen) {
      this.foto.set(imagen);
      this.errorFoto.set(null);
    }
  }

  protected async ingresar(): Promise<void> {
    this.resumenError.set(null);
    marcarEnviado(this.formulario);
    if (!this.foto()) this.errorFoto.set('Sacate una foto con la cámara para ingresar');

    if (this.formulario.invalid || !this.foto()) {
      this.resumenError.set('Necesitamos tu nombre y una foto tomada con la cámara.');
      this.avisos.error('No pudimos ingresarte', 'Revisá los datos marcados en rojo.');
      return;
    }

    const seguro = await this.confirmacion.pedir({
      titulo: '¿Entrás como invitado?',
      mensaje: 'Entrás como cliente anónimo y no hace falta que nadie te apruebe.',
      confirmar: 'Entrar',
      tono: 'exito',
      icono: 'person',
      detalle: [{ rotulo: 'Nombre', valor: this.formulario.controls.nombre.value }],
    });
    if (!seguro) return;

    const invitado = await this.cargando.conEsperaMinima('Preparando tu ingreso…', async () => {
      const usuario = await this.usuarios.crearClienteAnonimo(this.formulario.controls.nombre.value, this.foto()!);
      await this.sesion.ingresarComo(usuario);
      return usuario;
    });

    this.avisos.exito(`Bienvenido, ${invitado.nombre}`, 'Ingresaste a SakurApp.');
    await this.router.navigate(['/home'], { replaceUrl: true });
  }

  protected cuentaCompleta(): void {
    void this.router.navigate(['/registro-cliente']);
  }
  protected volver(): void {
    void this.router.navigate(['/login']);
  }
}

