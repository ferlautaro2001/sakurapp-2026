import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-login',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen lm-screen--login">
      <div class="lm-body login-body">
        <lm-logo class="login-logo" [tamano]="76" />

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
        <div class="lm-grid2 login-perfiles">
          @for (usuario of perfiles(); track usuario.id) {
            <lm-tarjeta-perfil [usuario]="usuario" soloNombre (presionar)="entrarComo(usuario)" />
          }
        </div>
      </div>

      <div class="lm-actionbar login-actionbar">
        <lm-boton icono="login" (presionar)="ingresar()">Iniciar sesión</lm-boton>
        <!-- US-12.1 · ingreso social: el logo va proyectado adentro del botón
             porque no es un ícono de Material, es la marca de Google. -->
        <lm-boton variante="secondary" (presionar)="ingresarConGoogle()">
          <svg class="google__marca" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </lm-boton>
        <!-- La pregunta arriba; debajo, las dos salidas repartidas en mitades. -->
        <p class="registro__pregunta">¿No tenés cuenta?</p>
        <div class="registro">
          <lm-texto-boton (presionar)="comoInvitado()"><lm-icono nombre="person_outline" [tamano]="20" /> Invitado</lm-texto-boton>
          <lm-texto-boton enfasis="alto" (presionar)="registrarse()">Registrate</lm-texto-boton>
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
        padding-top: calc(6px + var(--safe-top));
        padding-bottom: 0;
        /* Ritmo por bloques: logo, campos, acceso rápido. El aire entre bloques
           crece con el alto del equipo y se achica en los bajos. */
        gap: clamp(10px, 2.6dvh, 22px);
        overflow-y: auto;
        /* El eje horizontal se declara a mano porque un contenedor que se
           desplaza en vertical no puede dejar el otro eje en visible: el
           navegador lo convierte en auto y aparece una barra lateral por
           cualquier sombra o pétalo que asome. Acá ya no tapa nada: lo que
           antes desbordaba de verdad —la fila de accesos sin corte, el
           perfil y el avatar clavados en píxeles— está resuelto arriba. */
        overflow-x: hidden;
        flex: 1;
        min-height: 0;
        -webkit-overflow-scrolling: touch;
        /* El formulario ocupa menos que la pantalla en un teléfono alto y todo
           lo que sobra caía junto abajo, contra la barra. Centrado, ese aire se
           reparte arriba y abajo. */
        justify-content: safe center;
      }
      /* Sin bajada debajo, la marca toma ese lugar: más grande. */
      :host ::ng-deep .login-logo .lm-logo__nombre { font-size: clamp(34px, 10vw, 44px); line-height: 1.1; }
      .campos-grupo {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }
      /* Compactamos la altura de los campos para asegurar que entre todo en viewport móvil */
      :host ::ng-deep .login-body .lm-field__box {
        min-height: var(--touch-min);
        padding: 0 var(--space-4);
      }
      /* Tipografía más legible para personas con presbicia */
      :host ::ng-deep .lm-field input {
        font-size: clamp(14px, 3.6vw, 15.5px) !important;
        font-weight: 600 !important;
        letter-spacing: 0.01em !important;
        color: var(--text-title) !important;
      }
      :host ::ng-deep .lm-field__marcador {
        font-size: clamp(13px, 3.3vw, 14px) !important;
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
        font: 700 clamp(11px, 2.8vw, 12px)/1 var(--font-display);
        color: var(--action-primary);
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .login-perfiles {
        gap: 8px;
        margin-top: calc(-1 * clamp(2px, 1dvh, 10px));
        width: 100%;
      }
      /* Compactar el perfil no puede llevarlo por debajo del área táctil: son
         ocho botones chicos pegados y errarle es entrar con otro usuario. */
      :host ::ng-deep .login-perfiles .lm-profile {
        min-height: var(--touch-min);
        padding: 3px 8px;
        gap: 8px;
      }
      :host ::ng-deep .login-perfiles .lm-profile__avatar {
        width: var(--size-avatar-sm);
        height: var(--size-avatar-sm);
      }
      /* En proporción y no en píxeles, así sigue al avatar cuando este escala
         con el ancho del equipo. */
      :host ::ng-deep .login-perfiles .lm-profile__avatar img {
        width: 74%;
        height: 74%;
      }
      :host ::ng-deep .login-perfiles .lm-profile__texto b {
        font-size: clamp(12.5px, 3.1vw, 13.5px) !important;
        font-weight: 700 !important;
        line-height: 1.2;
      }
      :host ::ng-deep .login-perfiles .lm-profile__texto small {
        font-size: clamp(11px, 2.8vw, 12px) !important;
        line-height: 1.1;
      }
      .login-actionbar {
        padding: 10px var(--gutter-screen) calc(var(--space-2) + var(--safe-bottom));
        gap: 6px;
        flex-shrink: 0;
        background: transparent;
      }
      .registro {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        gap: 8px;
      }
      .registro lm-texto-boton { text-align: center; }
      .registro ::ng-deep .lm-textbtn { justify-content: center; gap: 6px; }
      /* Más aire entre la acción principal y las alternativas. */
      .login-actionbar > lm-boton { margin-bottom: 10px; }
      :host ::ng-deep .lm-btn .google__marca { margin-right: 8px; flex-shrink: 0; }
      .registro__pregunta {
        margin: 0;
        font: var(--type-body-medium);
        font-size: 16.5px;
        font-weight: 600;
        color: var(--text-sobre-fondo-suave);
        text-align: center;
      }
      .registro span {
        font: var(--type-body-small);
        font-weight: 600;
        color: var(--text-sobre-fondo-suave);
      }
      /* Segunda en la escalera: se lee sin esfuerzo, pero sin el peso ni el
         relleno del botón de arriba, que es la acción que se espera. */
      .registro lm-texto-boton {
        display: inline-block;
        font: var(--type-body-small);
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

  /** US-12.1 · ingreso social con la cuenta de Google. */
  protected async ingresarConGoogle(): Promise<void> {
    this.error.set(null);
    const resultado = await this.cargando.conEsperaMinima('Abriendo tu cuenta de Google…', () =>
      this.sesion.ingresarConGoogle(),
    );
    await this.resolver(resultado);
  }

  private async resolver(resultado: Awaited<ReturnType<SesionService['ingresar']>>): Promise<void> {
    if (resultado.ok) {
      this.avisos.exito(`¡Bienvenido, ${resultado.usuario.nombre}!`);
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
      // La cuenta social valida quién sos, pero no quién sos en SakurApp:
      // sin un usuario de la base con ese correo no hay sesión que abrir.
      case 'SIN_CUENTA':
        this.error.set('Esa cuenta de Google no está asociada a ningún usuario de SakurApp.');
        this.avisos.error('Cuenta de Google sin asociar', 'Ingresá con tu correo y contraseña, o registrate.');
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

}

