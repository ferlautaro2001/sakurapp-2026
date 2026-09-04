import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UI } from '../../ui';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { SonidoService } from '../../nucleo/servicios/sonido.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { Perfil, ROTULO_PERFIL } from '../../nucleo/modelos/enums';
import { Usuario } from '../../nucleo/modelos/modelos';
import { clave, correoElectronico, cuil, cuilDelDocumento, documento, largoMinimo, marcarEnviado, requerido, soloLetras } from '../../nucleo/validacion/validadores';

type PerfilEmpleado = Extract<Perfil, 'COCINERO' | 'CANTINERO' | 'MOZO' | 'METRE'>;
const PERFILES: PerfilEmpleado[] = ['COCINERO', 'CANTINERO', 'MOZO', 'METRE'];

/** Alta administrativa de personal: cámara obligatoria, lector DNI y aprobación inmediata. */
@Component({
  selector: 'lm-alta-empleado',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Alta de personal" conVolver (volver)="volver()" />
      <div class="lm-body lm-body--gap12">
        @if (resumenError()) { <lm-banner tono="error" titulo="Revisá los datos">{{ resumenError() }}</lm-banner> }
        @if (leidoDelDocumento()) { <lm-banner tono="success" titulo="Documento leído">Confirmá los datos antes de dar el alta.</lm-banner> }

        <lm-foto [fuente]="foto()" [tamano]="132" etiqueta="Tomar foto con cámara" [error]="errorFoto()" (capturar)="tomarFoto()" />
        <lm-tarjeta-escaneo titulo="Escanear código de barras del DNI" ayuda="Completamos identidad y CUIL" [escaneando]="escaneando()" (escanear)="escanearDocumento()" />

        <lm-campo [control]="formulario.controls.nombre" icono="person" etiqueta="Nombres" marcador="Sofía Ayelén" />
        <lm-campo [control]="formulario.controls.apellido" icono="person" etiqueta="Apellidos" marcador="Gómez" />
        <lm-campo [control]="formulario.controls.dni" icono="badge" etiqueta="DNI" marcador="44225858" modo="numeric" [largoMaximo]="8" />
        <lm-campo [control]="formulario.controls.cuil" icono="fingerprint" etiqueta="CUIL" marcador="27-44225858-4" modo="numeric" [largoMaximo]="13" />
        <lm-campo [control]="formulario.controls.email" icono="mail" tipo="email" etiqueta="Correo electrónico" marcador="sofia@correo.com.ar" />
        <lm-campo [control]="formulario.controls.clave" icono="lock" tipo="password" etiqueta="Contraseña" marcador="Mínimo ocho caracteres, una letra y un número" />

        <section class="roles" aria-labelledby="rol-title">
          <span id="rol-title" class="lm-label">Rol operativo</span>
          <div class="roles__grilla">
            @for (opcion of perfiles; track opcion) {
              <button type="button" class="roles__tarjeta" [class.roles__tarjeta--activa]="perfil() === opcion" (click)="perfil.set(opcion)">
                <lm-icono [nombre]="iconoRol(opcion)" [tamano]="22" />
                {{ rotuloRol(opcion) }}
              </button>
            }
          </div>
        </section>
      </div>
      <div class="lm-actionbar"><lm-boton icono="person_add" (presionar)="guardar()">Dar de alta</lm-boton></div>
    </div>

    @if (alta(); as empleado) {
      <lm-modal titulo="Empleado dado de alta" mensaje="La cuenta quedó aprobada y puede ingresar inmediatamente." rotuloCancelar="Cerrar" rotuloConfirmar="Dar otra alta" tono="exito" icono="verified" [detalle]="detalleAlta(empleado)" (cancelar)="volver()" (confirmar)="otroMas()" />
    }
  `,
  styles: [`:host{display:flex;flex:1;min-height:0}.roles{display:grid;gap:8px}.roles__grilla{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.roles__tarjeta{min-height:74px;border:1px solid var(--border-card);border-radius:var(--radius-card);background:var(--surface-card);color:var(--text-body);font:700 13px var(--font-text);display:flex;align-items:center;justify-content:center;gap:7px}.roles__tarjeta--activa{border:2px solid var(--action-primary);background:rgba(185,46,88,.08);color:var(--action-primary)}`],
})
export class AltaEmpleadoPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usuarios = inject(UsuariosService);
  private readonly camara = inject(CamaraService);
  private readonly escaner = inject(EscanerService);
  private readonly qr = inject(QrService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly sonido = inject(SonidoService);

  protected readonly perfiles = PERFILES;
  protected readonly perfil = signal<PerfilEmpleado>('COCINERO');
  protected readonly foto = signal<string | null>(null);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly escaneando = signal(false);
  protected readonly leidoDelDocumento = signal(false);
  protected readonly resumenError = signal<string | null>(null);
  protected readonly alta = signal<Usuario | null>(null);
  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [requerido('Escribí los nombres'), soloLetras(), largoMinimo(2, 'El nombre es demasiado corto')]],
    apellido: ['', [requerido('Escribí los apellidos'), soloLetras(), largoMinimo(2, 'El apellido es demasiado corto')]],
    dni: ['', [requerido('Escribí el DNI'), documento()]],
    cuil: ['', [requerido('Escribí el CUIL'), cuil()]],
    email: ['', [requerido('Escribí el correo electrónico'), correoElectronico()]],
    clave: ['', [requerido('Elegí una contraseña'), clave()]],
  }, { validators: [cuilDelDocumento('dni', 'cuil')] });

  protected async tomarFoto(): Promise<void> {
    const imagen = await this.camara.tomarFoto();
    if (imagen) { this.foto.set(imagen); this.errorFoto.set(null); }
  }

  protected async escanearDocumento(): Promise<void> {
    if (!this.escaner.disponible()) { this.avisos.info('El lector funciona en el teléfono', 'Instalá la aplicación en Android para leer el código del DNI.'); return; }
    this.escaneando.set(true);
    const lectura = await this.escaner.leer('DNI');
    this.escaneando.set(false);
    if (!lectura) return;
    const datos = this.qr.interpretarDni(lectura);
    if (!datos) { this.avisos.error('No pudimos leer el DNI', 'Probá de nuevo con el reverso bien iluminado.'); return; }
    this.formulario.patchValue({ nombre: datos.nombres, apellido: datos.apellidos, dni: datos.dni, cuil: datos.cuil });
    this.leidoDelDocumento.set(true);
    this.avisos.exito('Documento leído', `${datos.nombres} ${datos.apellidos}.`);
  }

  protected async guardar(): Promise<void> {
    this.resumenError.set(null); marcarEnviado(this.formulario);
    if (!this.foto()) this.errorFoto.set('La foto tomada con cámara es obligatoria');
    if (this.usuarios.existeCorreo(this.formulario.controls.email.value)) this.formulario.controls.email.setErrors({ lm: 'Ese correo ya está en uso' });
    if (this.usuarios.existeDocumento(this.formulario.controls.dni.value)) this.formulario.controls.dni.setErrors({ lm: 'Ese DNI ya está registrado' });
    if (this.usuarios.existeCuil(this.formulario.controls.cuil.value)) this.formulario.controls.cuil.setErrors({ lm: 'Ese CUIL ya está registrado' });
    if (this.formulario.invalid || !this.foto()) {
      this.resumenError.set('Completá todos los campos obligatorios con datos válidos.');
      this.avisos.error('No pudimos dar el alta', 'Revisá los campos marcados.');
      return;
    }
    const datos = this.formulario.getRawValue();
    const seguro = await this.confirmacion.pedir({ titulo: '¿Das de alta a esta persona?', mensaje: 'La cuenta quedará aprobada y podrá autenticarse de inmediato.', confirmar: 'Dar de alta', tono: 'exito', icono: 'person_add', detalle: [{ rotulo: 'Empleado', valor: `${datos.nombre} ${datos.apellido}` }, { rotulo: 'Rol', valor: this.rotuloRol(this.perfil()) }] });
    if (!seguro) return;
    const empleado = await this.cargando.conEsperaMinima('Registrando empleado…', () => this.usuarios.crearEmpleado({ ...datos, perfil: this.perfil(), fotoUrl: this.foto()! }));
    this.alta.set(empleado);
    this.sonido.reproducir('inicio');
    this.avisos.exito('Alta confirmada', `${empleado.nombre} ya tiene acceso a SakurApp.`);
  }

  protected rotuloRol(perfil: PerfilEmpleado): string { return ROTULO_PERFIL[perfil]; }
  protected iconoRol(perfil: PerfilEmpleado): string { return ({ COCINERO: 'skillet', CANTINERO: 'local_bar', MOZO: 'room_service', METRE: 'groups' } as Record<PerfilEmpleado, string>)[perfil]; }
  protected detalleAlta(empleado: Usuario) { return [{ rotulo: 'Empleado', valor: `${empleado.nombre} ${empleado.apellido ?? ''}`.trim() }, { rotulo: 'Rol', valor: this.rotuloRol(empleado.perfil as PerfilEmpleado) }]; }
  protected otroMas(): void { this.formulario.reset(); this.foto.set(null); this.errorFoto.set(null); this.leidoDelDocumento.set(false); this.resumenError.set(null); this.alta.set(null); this.perfil.set('COCINERO'); }
  protected volver(): void { void this.router.navigate(['/home']); }
}
