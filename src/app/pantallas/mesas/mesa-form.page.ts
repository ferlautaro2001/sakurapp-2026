import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Mesa } from '../../nucleo/modelos/modelos';
import { EstadoMesa, ROTULO_TIPO_MESA, TipoMesa } from '../../nucleo/modelos/enums';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { enteroEntre, requerido, marcarEnviado } from '../../nucleo/validacion/validadores';

const TIPOS: { valor: TipoMesa; rotulo: string }[] = [
  { valor: 'ESTANDAR', rotulo: ROTULO_TIPO_MESA.ESTANDAR },
  { valor: 'VIP', rotulo: ROTULO_TIPO_MESA.VIP },
  { valor: 'MOVILIDAD_REDUCIDA', rotulo: ROTULO_TIPO_MESA.MOVILIDAD_REDUCIDA },
];

/**
 * Punto 4 · Edición de mesa y cambio de disponibilidad.
 */
@Component({
  selector: 'lm-mesa-form',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado [titulo]="titulo()" conVolver (volver)="volver()" />

      <div class="lm-body lm-body--gap14">
        @if (resumenError()) {
          <lm-banner tono="error" titulo="No pudimos guardar la mesa">{{ resumenError() }}</lm-banner>
        }

        @if (soloDisponibilidad()) {
          <lm-foto
            [fuente]="foto()"
            forma="rectangulo"
            [tamano]="168"
            etiqueta="Sin foto cargada"
            (capturar)="avisarSinPermiso()"
          />
          <div class="lm-grid2">
            <div class="lm-card dato">
              <span class="lm-label">Número</span>
              <span class="dato__valor">{{ mesa()?.numero }}</span>
            </div>
            <div class="lm-card dato">
              <span class="lm-label">Comensales</span>
              <span class="dato__valor">{{ mesa()?.cantidadComensales }}</span>
            </div>
          </div>
          <div class="lm-card dato">
            <span class="lm-label">Tipo de mesa</span>
            <span class="dato__texto">{{ rotuloTipo() }}</span>
          </div>
        } @else {
          <lm-foto
            [fuente]="foto()"
            forma="rectangulo"
            [tamano]="168"
            etiqueta="Foto de la mesa con cámara"
            [error]="errorFoto()"
            (capturar)="tomarFoto()"
          />

          <lm-campo
            [control]="formulario.controls.numero"
            icono="numbers"
            etiqueta="Número de mesa"
            marcador="7"
            modo="numeric"
            [largoMaximo]="3"
          />
          <lm-campo
            [control]="formulario.controls.comensales"
            icono="group"
            etiqueta="Cantidad de comensales"
            marcador="6"
            modo="numeric"
            [largoMaximo]="2"
          />
          <lm-segmentado etiqueta="Tipo de mesa" [opciones]="tipos" [valor]="tipo()" (cambiar)="tipo.set($any($event))" />
        }

        <lm-interruptor
          etiqueta="Disponible"
          [ayuda]="disponible() ? 'La mesa se muestra como vacía en la grilla' : 'La mesa se muestra como ocupada en la grilla'"
          [activo]="disponible()"
          (cambiar)="disponible.set($event)"
        />

        @if (mesa()) {
          <lm-separador rotulo="Código de la mesa" />
          <lm-boton variante="secondary" icono="qr_code_2" (presionar)="ir(['/mesas', mesa()!.id, 'qr'])">
            Ver el código QR de la mesa
          </lm-boton>
        }
      </div>

      <div class="lm-actionbar">
        <lm-boton [icono]="mesa() ? 'save' : 'add'" (presionar)="guardar()">
          {{ mesa() ? 'Guardar cambios' : 'Agregar mesa' }}
        </lm-boton>
        @if (mesa() && !soloDisponibilidad() && mesa()!.estado !== 'INACTIVA') {
          <lm-texto-boton enfasis="peligro" (presionar)="darDeBaja()">Dar de baja la mesa</lm-texto-boton>
        } @else {
          <lm-texto-boton (presionar)="volver()">Cancelar</lm-texto-boton>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .dato { padding: 14px; }
      .dato__valor { display: block; font: var(--type-numeral); color: var(--text-title); }
      .dato__texto { display: block; font: var(--type-card-title); color: var(--text-title); margin-top: 4px; }
    `,
  ],
})
export class MesaFormPage extends PaginaConSesion implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mesas = inject(MesasService);
  private readonly camara = inject(CamaraService);

  readonly id = input<string | undefined>(undefined);

  protected readonly tipos = TIPOS;
  protected readonly tipo = signal<TipoMesa>('ESTANDAR');
  protected readonly disponible = signal(true);
  protected readonly foto = signal<string | null>(null);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly resumenError = signal<string | null>(null);

  protected readonly mesa = computed(() => (this.id() ? this.mesas.porId(this.id()!) : undefined));
  protected readonly soloDisponibilidad = computed(() => !this.sesion.esAdministrador());

  protected readonly formulario = this.fb.nonNullable.group({
    numero: ['', [requerido('Escribí el número de mesa'), enteroEntre(1, 999, 'El número tiene que estar entre 1 y 999')]],
    comensales: ['', [requerido('Escribí la cantidad de comensales'), enteroEntre(1, 30, 'La cantidad tiene que estar entre 1 y 30')]],
  });

  ngOnInit(): void {
    const existente = this.mesa();
    if (existente) {
      this.formulario.patchValue({
        numero: String(existente.numero),
        comensales: String(existente.cantidadComensales),
      });
      this.tipo.set(existente.tipo);
      this.disponible.set(existente.estado === 'VACIA');
      this.foto.set(existente.fotoUrl || null);
    } else {
      this.formulario.patchValue({ numero: String(this.mesas.proximoNumero()) });
    }
  }

  protected titulo(): string {
    if (!this.mesa()) return 'Agregar nueva mesa';
    return this.soloDisponibilidad() ? `Mesa ${this.mesa()!.numero}` : `Editar la mesa ${this.mesa()!.numero}`;
  }

  protected rotuloTipo(): string {
    const mesa = this.mesa();
    return mesa ? ROTULO_TIPO_MESA[mesa.tipo] : '';
  }

  protected async tomarFoto(): Promise<void> {
    const imagen = await this.camara.tomarFoto();
    if (imagen) {
      this.foto.set(imagen);
      this.errorFoto.set(null);
    }
  }

  protected avisarSinPermiso(): void {
    this.avisos.info('La foto la cambia el administrador', 'Desde este perfil sólo se puede cambiar la disponibilidad.');
  }

  protected async guardar(): Promise<void> {
    const estado: EstadoMesa = this.disponible() ? 'VACIA' : 'OCUPADA';

    if (this.soloDisponibilidad()) {
      const existente = this.mesa();
      if (!existente) return;
      const seguro = await this.preguntar({
        titulo: '¿Cambiás la disponibilidad?',
        mensaje: 'La grilla del salón se actualiza para todos los perfiles en el momento.',
        confirmar: 'Guardar',
        icono: 'save',
        detalle: [
          { rotulo: 'Mesa', valor: String(existente.numero) },
          { rotulo: 'Queda', valor: this.disponible() ? 'Vacía' : 'Ocupada' },
        ],
      });
      if (!seguro) return;
      await this.cargando.conEsperaMinima('Guardando la disponibilidad…', async () => {
        await this.mesas.cambiarEstado(existente.id, estado);
      });
      this.avisos.exito(`Mesa ${existente.numero} actualizada`, `Quedó marcada como ${this.disponible() ? 'vacía' : 'ocupada'}.`);
      this.volver();
      return;
    }

    this.resumenError.set(null);
    marcarEnviado(this.formulario);

    if (!this.foto()) this.errorFoto.set('Sacale una foto a la mesa con la cámara');

    const numero = Number(this.formulario.controls.numero.value);
    if (numero && this.mesas.existeNumero(numero, this.mesa()?.id)) {
      this.formulario.controls.numero.setErrors({ lm: `La mesa ${numero} ya está registrada` });
    }

    if (this.formulario.invalid || !this.foto()) {
      this.resumenError.set('Revisá los campos marcados y la foto de la mesa.');
      this.avisos.error('Faltan datos de la mesa', 'Revisá los campos marcados en rojo.');
      return;
    }

    const datos = {
      numero,
      cantidadComensales: Number(this.formulario.controls.comensales.value),
      tipo: this.tipo(),
      estado,
      fotoUrl: this.foto()!,
    };

    const existente = this.mesa();
    if (existente) {
      const seguro = await this.preguntar({
        titulo: '¿Guardás los cambios de la mesa?',
        mensaje: 'Los datos nuevos reemplazan a los anteriores en toda la aplicación. El código QR no cambia.',
        confirmar: 'Guardar cambios',
        icono: 'save',
        detalle: [
          { rotulo: 'Mesa', valor: String(numero) },
          { rotulo: 'Comensales', valor: String(datos.cantidadComensales) },
          { rotulo: 'Tipo', valor: ROTULO_TIPO_MESA[this.tipo()] },
        ],
      });
      if (!seguro) return;
      await this.cargando.conEsperaMinima('Guardando los cambios…', () => this.mesas.editar(existente.id, datos));
      this.avisos.exito(`Mesa ${numero} actualizada`, 'Los cambios ya se ven en la grilla.');
      this.ir(['/mesas']);
      return;
    }

    const alta = await this.preguntar({
      titulo: '¿Agregás la mesa al salón?',
      mensaje: 'Se crea la mesa y su código QR se genera automáticamente, listo para imprimir y pegar.',
      confirmar: 'Agregar mesa',
      tono: 'exito',
      icono: 'add',
      detalle: [
        { rotulo: 'Número', valor: String(numero) },
        { rotulo: 'Comensales', valor: String(datos.cantidadComensales) },
        { rotulo: 'Tipo', valor: ROTULO_TIPO_MESA[this.tipo()] },
      ],
    });
    if (!alta) return;

    const nueva: Mesa = await this.cargando.conEsperaMinima('Agregando la mesa…', () => this.mesas.crear(datos));
    this.avisos.exito(`Mesa ${nueva.numero} agregada`, 'Su código QR ya está generado y listo para imprimir.');
    this.ir(['/mesas', nueva.id, 'qr']);
  }

  protected async darDeBaja(): Promise<void> {
    const existente = this.mesa();
    if (!existente) return;

    const seguro = await this.preguntar({
      titulo: '¿Das de baja la mesa?',
      mensaje: 'Queda fuera de servicio y no se puede asignar a nadie. Conserva su código QR y se puede volver a habilitar.',
      confirmar: 'Dar de baja',
      tono: 'peligro',
      icono: 'block',
      detalle: [
        { rotulo: 'Mesa', valor: String(existente.numero) },
        { rotulo: 'Comensales', valor: String(existente.cantidadComensales) },
      ],
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima('Dando de baja la mesa…', () => this.mesas.desactivar(existente.id));
    this.avisos.info(`Mesa ${existente.numero} dada de baja`, 'Queda fuera de servicio, pero conserva su código.');
    this.ir(['/mesas']);
  }

  protected volver(): void {
    this.ir(['/mesas']);
  }
}
