import { Component, OnInit, inject, signal } from '@angular/core';
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
 * - Separador decorativo con flor Sakura
 * - Tipografía de alta legibilidad para presbicia (mayor tamaño y contraste)
 * - Contenedor fluido con scroll suave que no se rompe con errores de validación
 * - Botones de acceso rápido para los perfiles requeridos
 */
@Component({
  selector: 'lm-login',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen lm-screen--login">
      <div class="lm-body login-body">
        <lm-logo bajada="Bienvenido" [tamano]="30" />
        <h2 class="login-bajada">Iniciá sesión para continuar</h2>

        @if (error()) {
          <lm-banner tono="error" titulo="No pudimos iniciar sesión">{{ error() }}</lm-banner>
        }

        <div class="campos-grupo">
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
        </div>

        <div class="separador-flor">
          <span class="separador-flor__linea"></span>
          <div class="separador-flor__centro">
            <img src="assets/img/flor-2.png" width="18" height="18" alt="🌸" class="separador-flor__icono" />
            <span class="separador-flor__texto">Acceso rápido</span>
          </div>
          <span class="separador-flor__linea"></span>
        </div>

        <p class="login-nota">Tocá un perfil para ingresar.</p>

        <div class="lm-grid2 login-perfiles">
          @for (usuario of perfiles(); track usuario.id) {
            <lm-tarjeta-perfil [usuario]="usuario" soloNombre (presionar)="entrarComo(usuario)" />
          }
        </div>

        <div class="login-enlace-presentacion">
          <lm-texto-boton (presionar)="verPresentacion()">Ver pantallas de presentación</lm-texto-boton>
        </div>
      </div>

      <div class="lm-actionbar login-actionbar">
        <lm-boton icono="login" (presionar)="ingresar()">Iniciar sesión</lm-boton>
        <p class="registro__pregunta">¿No tenés cuenta?</p>
        <div class="registro">
          <lm-texto-boton enfasis="alto" (presionar)="registrarse()">Registrate</lm-texto-boton>
          <span class="registro__separador">·</span>
          <lm-texto-boton (presionar)="comoInvitado()">Ingresar como invitado</lm-texto-boton>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .lm-screen--login {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      .login-body {
        padding-top: calc(6px + env(safe-area-inset-top, 6px));
        padding-bottom: 0;
        gap: 4px;
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1;
        min-height: 0;
        -webkit-overflow-scrolling: touch;
        /* El formulario ocupa menos que la pantalla en un teléfono alto y todo
           lo que sobra caía junto abajo, contra la barra. Centrado, ese aire se
           reparte arriba y abajo. */
        justify-content: safe center;
      }
      .login-bajada {
        margin: 0;
        font: 700 15px/1.25 var(--font-text);
        color: var(--text-sobre-fondo);
        text-align: center;
      }
      .campos-grupo {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
      }
      /* Compactamos la altura de los campos para asegurar que entre todo en viewport móvil */
      :host ::ng-deep .login-body .lm-field__box {
        min-height: 44px;
        padding: 0 14px;
      }
      /* Tipografía más legible para personas con presbicia */
      :host ::ng-deep .lm-field input {
        font-size: 15.5px !important;
        font-weight: 600 !important;
        letter-spacing: 0.01em !important;
        color: var(--text-title) !important;
      }
      :host ::ng-deep .lm-field__marcador {
        font-size: 14px !important;
      }
      /* Separador decorativo con flor Sakura */
      .separador-flor {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        margin: 0;
      }
      .separador-flor__linea {
        flex: 1;
        height: 1.5px;
        background: linear-gradient(90deg, transparent, rgba(235, 54, 107, 0.45), transparent);
      }
      .separador-flor__centro {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(235, 54, 107, 0.25);
        border-radius: var(--radius-pill);
        box-shadow: 0 1px 4px rgba(110, 18, 52, 0.08);
      }
      .separador-flor__icono {
        display: block;
        animation: rotarFlor 12s linear infinite;
      }
      @keyframes rotarFlor {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .separador-flor__texto {
        font: 700 12px/1 var(--font-display);
        color: var(--action-primary);
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .login-nota {
        margin: 0;
        font: 500 12px/1.25 var(--font-text);
        color: var(--text-sobre-fondo-suave);
        text-align: center;
      }
      .login-perfiles {
        gap: 3px;
        width: 100%;
      }
      :host ::ng-deep .login-perfiles .lm-profile {
        min-height: 40px;
        padding: 3px 8px;
        gap: 8px;
      }
      :host ::ng-deep .login-perfiles .lm-profile__avatar {
        width: 32px;
        height: 32px;
      }
      :host ::ng-deep .login-perfiles .lm-profile__avatar img {
        width: 24px;
        height: 24px;
      }
      :host ::ng-deep .login-perfiles .lm-profile__texto b {
        font-size: 13.5px !important;
        font-weight: 700 !important;
        line-height: 1.2;
      }
      :host ::ng-deep .login-perfiles .lm-profile__texto small {
        font-size: 11px !important;
        line-height: 1.1;
      }
      .login-enlace-presentacion {
        display: flex;
        justify-content: center;
      }
      .login-actionbar {
        padding: 2px var(--gutter-screen) calc(6px + env(safe-area-inset-bottom, 6px));
        gap: 4px;
        flex-shrink: 0;
        background: var(--bg-app);
      }
      .registro {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex-wrap: wrap;
        white-space: nowrap;
      }
      .registro__separador {
        margin: 0 2px;
        opacity: 0.5;
      }
      .registro__pregunta {
        margin: 0;
        font: 600 13px/1.2 var(--font-text);
        color: var(--text-sobre-fondo-suave);
        text-align: center;
      }
      .registro span {
        font: 600 13.5px/1.2 var(--font-text);
        color: var(--text-sobre-fondo-suave);
      }
      .registro lm-texto-boton {
        display: inline-block;
        font-size: 13.5px;
      }
    `,
  ],
})
export class LoginPage implements OnInit {
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

  ngOnInit(): void {
    if (this.sesion.autenticado()) {
      void this.router.navigate([this.sesion.rutaInicio()], { replaceUrl: true });
    }
  }

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
      // El problema no es de quien está intentando entrar: decirle que sus
      // datos están mal lo manda a revisar una contraseña que está bien.
      case 'SERVICIO':
        this.error.set('No pudimos verificar tu contraseña: el servicio de cuentas no está respondiendo.');
        this.avisos.error('No pudimos verificar tu contraseña', 'Probá de nuevo en un rato o entrá como invitado.');
        break;
      default:
        this.error.set('El correo electrónico o la contraseña no son correctos.');
        this.avisos.error('Datos incorrectos', 'Revisá el correo electrónico y la contraseña.');
    }
  }

  protected registrarse(): void {
    void this.router.navigate(['/registro-cliente']);
  }

  /** Entrar sin cuenta: sólo nombre y foto, como pide la consigna. */
  protected comoInvitado(): void {
    void this.router.navigate(['/registro-invitado']);
  }

  protected verPresentacion(): void {
    void this.router.navigate(['/']);
  }
}

