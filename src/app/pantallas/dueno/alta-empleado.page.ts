import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
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

/** Los dos pasos del alta: los datos de la persona y, después, su perfil y su cuenta. */
const PASOS = ['Foto y datos', 'Perfil y cuenta'] as const;

/**
 * Punto 1 · Alta de empleado. Perfiles: dueño o supervisor.
 *
 * El formulario no entra en una sola vista, así que va paginado en dos pasos.
 * El escaneo del documento abre el primero porque ahorra medio formulario.
 * Cada paso se valida antes de avanzar, y si al guardar falla un dato de otro
 * paso se vuelve a ese. Se validan todos los campos: formato, vacíos, tipos y
 * unicidad.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-alta-empleado',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Alta de empleado" conVolver (volver)="atras()" />

      <!-- Dónde está parado: un tramo por paso y el nombre del paso. -->
      <div class="alta__pasos" role="group" [attr.aria-label]="'Paso ' + paso() + ' de ' + pasos.length">
        <div class="alta__tramos">
          @for (nombre of pasos; track nombre; let n = $index) {
            <span class="alta__tramo" [class.alta__tramo--hecho]="n + 1 <= paso()"></span>
          }
        </div>
        <span class="alta__rotulo">Paso {{ paso() }} de {{ pasos.length }} · {{ nombrePaso() }}</span>
      </div>

      <div #cuerpo class="lm-body lm-body--gap14 alta__cuerpo">
        @switch (paso()) {
          @case (1) {
            @if (alta(); as nuevo) {
              <lm-banner tono="success" titulo="Empleado dado de alta">
                {{ usuarios.nombreCompleto(nuevo) }} ya puede iniciar sesión como {{ rotuloPerfil(nuevo.perfil) }}.
              </lm-banner>
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
          }
          @case (2) {
            <lm-segmentado
              etiqueta="Perfil"
              [opciones]="perfiles"
              [valor]="perfil()"
              [columnas]="2"
              (cambiar)="perfil.set($any($event))"
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
          }
        }
      </div>

      <div class="lm-actionbar lm-actionbar--split">
        <lm-boton class="alta__accion" variante="danger" [icono]="paso() === 1 ? 'close' : 'arrow_back'" (presionar)="atras()">
          {{ paso() === 1 ? 'Cancelar' : 'Atrás' }}
        </lm-boton>
        @if (paso() < pasos.length) {
          <lm-boton class="alta__accion" variante="success" icono="arrow_forward" (presionar)="siguiente()">Siguiente</lm-boton>
        } @else {
          <lm-boton class="alta__accion" variante="success" icono="person_add" (presionar)="guardar()">Dar de alta</lm-boton>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }

      .alta__pasos {
        flex: 0 0 auto; display: flex; flex-direction: column; gap: 6px;
        padding: var(--space-2) var(--gutter-screen) 0;
      }
      .alta__tramos { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 6px; }
      .alta__tramo {
        height: 6px; border-radius: 999px; background: rgba(255, 255, 255, .28);
        transition: background var(--dur-base) var(--ease-standard);
      }
      .alta__tramo--hecho { background: var(--surface-card); }
      .alta__rotulo {
        font: var(--type-label); letter-spacing: var(--tracking-label);
        text-transform: uppercase; color: var(--text-sobre-fondo);
      }

      /* Cada paso entra entero y sus partes se reparten el alto, para que no
         quede un hueco abajo. Los márgenes automáticos reparten igual que
         space-evenly pero, si un cartel lo estira en un teléfono muy bajo, el
         paso se recorre desde arriba en vez de cortarse. */
      .alta__cuerpo { scroll-snap-type: none; }
      .alta__cuerpo > * { margin-block: auto; }
      @media (max-height: 700px) { .alta__cuerpo { gap: var(--space-2); } }

      /* En pantallas angostas el rótulo no se parte: se va el ícono. */
      .alta__accion ::ng-deep .lm-btn { white-space: nowrap; }
      @media (max-width: 340px) { .alta__accion ::ng-deep lm-icono { display: none; } }
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
  protected readonly pasos = PASOS;
  protected readonly paso = signal(1);
  protected readonly nombrePaso = computed(() => PASOS[this.paso() - 1]);
  private readonly cuerpo = viewChild<ElementRef<HTMLElement>>('cuerpo');
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

  /** Avanza sólo si el paso actual está completo; si no, marca lo que falta. */
  protected siguiente(): void {
    if (!this.pasoValido(this.paso(), true)) {
      this.avisos.error('Revisá este paso', 'Hay datos incompletos o con formato incorrecto.');
      return;
    }
    this.irAlPaso(this.paso() + 1);
  }

  /** En el primer paso, atrás es cancelar el alta. */
  protected atras(): void {
    if (this.paso() === 1) this.volver();
    else this.irAlPaso(this.paso() - 1);
  }

  protected async guardar(): Promise<void> {
    this.alta.set(null);
    marcarEnviado(this.formulario);

    // Si falla un dato de un paso anterior (por ejemplo, el CUIL ya existe),
    // se vuelve a ese paso para que se vea qué corregir.
    const conError = [1, 2].find((n) => !this.pasoValido(n, false));
    if (conError) {
      this.irAlPaso(conError);
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
    this.irAlPaso(1);
    this.alta.set(nuevo);
    this.avisos.exito('Empleado dado de alta', `${nuevo.nombre} ya aparece en el ingreso rápido.`);
  }

  /** El documento se infiere del CUIL: los ocho dígitos del medio, sin ceros a la izquierda. */
  private dni(): string {
    return this.formulario.controls.cuil.value.replace(/\D/g, '').slice(2, 10).replace(/^0+/, '');
  }

  /**
   * Revisa los campos de un paso. Con `marcar` los pone en rojo; sin él sólo
   * consulta, porque guardar ya marcó todo el formulario.
   */
  private pasoValido(paso: number, marcar: boolean): boolean {
    const c = this.formulario.controls;
    if (paso === 1) {
      if (!this.foto()) this.errorFoto.set('Sacale una foto con la cámara para dar el alta');
      if (marcar) [c.nombre, c.apellido, c.cuil].forEach((control) => marcarEnviado(control));
      if (c.cuil.valid && this.usuarios.existeDocumento(this.dni())) {
        c.cuil.setErrors({ lm: 'Ese número de documento ya está registrado' });
      }
      return !!this.foto() && c.nombre.valid && c.apellido.valid && c.cuil.valid;
    }
    if (marcar) [c.email, c.clave, c.repeticion].forEach((control) => marcarEnviado(control));
    if (c.email.valid && this.usuarios.existeCorreo(c.email.value)) {
      c.email.setErrors({ lm: 'Ese correo electrónico ya está en uso' });
    }
    return c.email.valid && c.clave.valid && c.repeticion.valid && this.formulario.valid;
  }

  private irAlPaso(paso: number): void {
    this.paso.set(paso);
    this.cuerpo()?.nativeElement.scrollTo({ top: 0 });
  }

  private limpiarFormulario(): void {
    this.formulario.reset();
    limpiarEnviado(this.formulario);
    this.foto.set(null);
    this.errorFoto.set(null);
    this.leidoDelDocumento.set(false);
  }

  protected volver(): void {
    this.ir(['/dueno/empleados']);
  }
}
