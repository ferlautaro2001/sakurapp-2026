import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UI } from '../../ui';
import { Usuario } from '../../nucleo/modelos/modelos';
import { SesionService } from '../../nucleo/servicios/sesion.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { correoElectronico, requerido, marcarEnviado } from '../../nucleo/validacion/validadores';

/**
 * Formulario de ingreso (Login) con validaciones y accesos rápidos para v0.
 *
 * Cumple con los requerimientos excluyentes:
 * - Validación de correo y contraseña (sin alerts)
 * - Botones de acceso rápido para los perfiles requeridos
 * - Spinner con el logo en esperas
 * - Vibración háptica en errores
 */
@Component({
  selector: 'lm-login',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <div class="lm-body" style="padding-top:calc(12px + env(safe-area-inset-top)); padding-bottom: 8px; gap: 10px">
        <lm-logo bajada="Bienvenido" [tamano]="56" />
        <p class="lm-parrafo lm-centro" style="margin:0">Iniciá sesión para continuar</p>

        @if (error()) {
          <lm-banner tono="error" titulo="No pudimos iniciar sesión">{{ error() }}</lm-banner>
        }

        <lm-campo
          [control]="formulario.controls.email"
          icono="mail"
          tipo="email"
          modo="email"
          marcador="Correo electrónico"
          autocompletar="username"
        />
        <lm-campo
          [control]="formulario.controls.clave"
          icono="lock"
          tipo="password"
          marcador="Contraseña"
          autocompletar="current-password"
          tecla="done"
        />

        <lm-separador rotulo="Acceso rápido" />
        <p class="lm-nota lm-centro" style="margin:0">Tocá un perfil para entrar directamente con sus credenciales.</p>

        <div class="lm-grid2" style="gap: 8px">
          @for (usuario of perfiles(); track usuario.id) {
            <lm-tarjeta-perfil [usuario]="usuario" soloNombre (presionar)="entrarComo(usuario)" />
          }
        </div>
      </div>

      <div class="lm-actionbar" style="padding-top: 10px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); gap: 6px">
        <lm-boton icono="login" (presionar)="ingresar()">Iniciar sesión</lm-boton>
        <div class="registro">
          <span>¿No tenés cuenta?</span>
          <lm-texto-boton enfasis="alto" (presionar)="registrarse()">Registrate</lm-texto-boton>
          <span style="opacity: 0.4; margin: 0 4px">·</span>
          <lm-texto-boton (presionar)="comoInvitado()">Ingresar como invitado</lm-texto-boton>
        </div>
        <lm-texto-boton (presionar)="verPresentacion()">Ver pantallas de presentación</lm-texto-boton>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .registro { display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap; }
      .registro span { font: var(--type-body-small); color: var(--text-sobre-fondo-suave); }
      .registro lm-texto-boton { display: inline-block; }
    `,
  ],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);
  private readonly usuarios = inject(UsuariosService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);

  protected readonly error = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [requerido('Escribí tu correo electrónico'), correoElectronico()]],
    clave: ['', [requerido('Escribí tu contraseña'), Validators.minLength(4)]],
  });

  protected perfiles(): Usuario[] {
    return this.usuarios.perfilesRapidos();
  }

  protected async ingresar(): Promise<void> {
    this.error.set(null);
    marcarEnviado(this.formulario);

    if (this.formulario.invalid) {
      this.avisos.error('Faltan datos para entrar', 'Revisá el correo electrónico y la contraseña.');
      return;
    }

    const { email, clave } = this.formulario.getRawValue();
    const resultado = await this.cargando.conEsperaMinima('Verificando tus datos…', () =>
      this.sesion.ingresar(email, clave),
    );

    await this.resolver(resultado);
  }

  protected async entrarComo(usuario: Usuario): Promise<void> {
    this.error.set(null);
    const resultado = await this.cargando.conEsperaMinima(`Iniciando sesión como ${usuario.nombre}…`, () =>
      this.sesion.ingresarComo(usuario),
    );
    await this.resolver(resultado);
  }

  private async resolver(resultado: Awaited<ReturnType<SesionService['ingresar']>>): Promise<void> {
    if (resultado.ok) {
      this.avisos.exito(`¡Bienvenido, ${resultado.usuario.nombre}!`, 'Sesión iniciada con éxito.');
      await this.router.navigate([this.sesion.rutaInicio()], { replaceUrl: true });
      return;
    }

    switch (resultado.motivo) {
      case 'PENDIENTE':
        await this.router.navigate(['/estado-cuenta', 'pendiente']);
        break;
      case 'RECHAZADO':
        await this.router.navigate(['/estado-cuenta', 'rechazado']);
        break;
      case 'INACTIVO':
        this.error.set('Esta cuenta se encuentra inactiva.');
        this.avisos.error('Cuenta inactiva', 'Hablá con un encargado del salón.');
        break;
      default:
        this.error.set('El correo electrónico o la contraseña no son correctos.');
        this.avisos.error('Datos incorrectos', 'Revisá el correo electrónico y la contraseña.');
    }
  }

  protected registrarse(): void {
    void this.router.navigate(['/registro-cliente']);
  }

  protected comoInvitado(): void {
    void this.router.navigate(['/registro-invitado']);
  }

  protected verPresentacion(): void {
    void this.router.navigate(['/']);
  }
}

