import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { UI } from '../../ui';
import { EstadoMesa, ROTULO_TIPO_MESA, TipoMesa } from '../../nucleo/modelos/enums';
import { Mesa } from '../../nucleo/modelos/modelos';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { enteroEntre, marcarEnviado, requerido } from '../../nucleo/validacion/validadores';

const TIPOS: { valor: TipoMesa; rotulo: string }[] = [
  { valor: 'ESTANDAR', rotulo: ROTULO_TIPO_MESA.ESTANDAR },
  { valor: 'VIP', rotulo: ROTULO_TIPO_MESA.VIP },
  { valor: 'MOVILIDAD_REDUCIDA', rotulo: ROTULO_TIPO_MESA.MOVILIDAD_REDUCIDA },
];

/**
 * US-4.3 · Alta de mesas con generación automática de código QR identificador.
 *
 * Restringido exclusivamente al Dueño y Supervisor.
 * - Fotografía obligatoria capturada con la cámara nativa en contenedor centrado individual.
 * - Validación estricta de unicidad de número de mesa.
 * - Generación de QR vectorial y persistencia en Cloud SQL PostgreSQL + Firebase Storage.
 * - Erradicación de window.alert() con feedback háptico (@capacitor/haptics) y spinner Sakura.
 */
@Component({
  selector: 'lm-alta-mesa',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Nueva mesa" conVolver (volver)="volver()" />

      <div class="lm-body lm-body--gap14">
        @if (resumenError()) {
          <lm-banner tono="error" titulo="Revisá los datos de la mesa">{{ resumenError() }}</lm-banner>
        }

        <div class="sakura-badge">
          <lm-icono nombre="table_restaurant" [tamano]="22" color="var(--action-primary)" />
          <span>Alta oficial de puesto físico en salón con código QR identificador.</span>
        </div>

        <section aria-labelledby="foto-mesa-title" class="foto-seccion">
          <span id="foto-mesa-title" class="lm-label">Fotografía del mobiliario · Obligatoria</span>
          <lm-foto
            [fuente]="foto()"
            forma="rectangulo"
            [tamano]="168"
            etiqueta="Tomar foto de la mesa con la cámara"
            [error]="errorFoto()"
            (capturar)="tomarFoto()"
          />
        </section>

        <lm-campo
          [control]="formulario.controls.numero"
          icono="numbers"
          etiqueta="Número de mesa (único)"
          marcador="1"
          modo="numeric"
          [largoMaximo]="3"
        />

        <lm-campo
          [control]="formulario.controls.comensales"
          icono="group"
          etiqueta="Cantidad de comensales (capacidad)"
          marcador="4"
          modo="numeric"
          [largoMaximo]="2"
        />

        <lm-segmentado
          etiqueta="Tipo de mesa"
          [opciones]="tipos"
          [valor]="tipo()"
          (cambiar)="tipo.set($any($event))"
        />

        <lm-interruptor
          etiqueta="Disponible inicialmente"
          [ayuda]="disponible() ? 'Queda registrada como VACÍA, lista para asignar' : 'Queda registrada como OCUPADA'"
          [activo]="disponible()"
          (cambiar)="disponible.set($event)"
        />

        <lm-separador rotulo="Generación de código QR" />
        <p class="lm-parrafo">
          Al dar el alta, el código QR vectorial de alto contraste se genera de inmediato, se almacena en la nube y queda listo para proyectar o imprimir.
        </p>
      </div>

      <div class="lm-actionbar">
        <lm-boton icono="add" (presionar)="guardar()">Agregar mesa</lm-boton>
        <lm-texto-boton (presionar)="volver()">Cancelar</lm-texto-boton>
      </div>
    </div>

    @if (mesaCreada(); as m) {
      <lm-modal
        titulo="Mesa agregada con éxito"
        [mensaje]="'La mesa ' + m.numero + ' ya está registrada en salón. Su código QR fue generado automáticamente.'"
        rotuloCancelar="Volver a mesas"
        rotuloConfirmar="Ver QR a gran tamaño"
        tono="exito"
        icono="verified"
        [detalle]="detalleAlta(m)"
        (cancelar)="volver()"
        (confirmar)="verQrCompleto(m.id)"
      />
    }
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .sakura-badge {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 12px 14px;
        background: var(--surface-card);
        border: 1px solid var(--border-card);
        border-radius: var(--radius-card);
        font: var(--type-body-small);
        color: var(--text-body);
      }
      .foto-seccion {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
    `,
  ],
})
export class AltaMesaPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly mesas = inject(MesasService);
  private readonly camara = inject(CamaraService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly avisos = inject(AvisosService);

  protected readonly tipos = TIPOS;
  protected readonly tipo = signal<TipoMesa>('ESTANDAR');
  protected readonly disponible = signal(true);
  protected readonly foto = signal<string | null>(null);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly resumenError = signal<string | null>(null);
  protected readonly mesaCreada = signal<Mesa | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    numero: ['', [requerido('Escribí el número de mesa'), enteroEntre(1, 999, 'El número tiene que estar entre 1 y 999')]],
    comensales: ['', [requerido('Escribí la cantidad de comensales'), enteroEntre(1, 30, 'La capacidad tiene que estar entre 1 y 30')]],
  });

  ngOnInit(): void {
    // Proponer el próximo número de mesa disponible
    this.formulario.patchValue({ numero: String(this.mesas.proximoNumero()) });
  }

  protected async tomarFoto(): Promise<void> {
    const imagen = await this.camara.tomarFoto();
    if (imagen) {
      this.foto.set(imagen);
      this.errorFoto.set(null);
    }
  }

  protected async guardar(): Promise<void> {
    this.resumenError.set(null);
    this.errorFoto.set(null);
    marcarEnviado(this.formulario);

    if (!this.foto()) {
      this.errorFoto.set('Capturá una foto de la mesa con la cámara nativa');
    }

    const numero = Number(this.formulario.controls.numero.value);
    if (numero && this.mesas.existeNumero(numero)) {
      this.formulario.controls.numero.setErrors({ lm: `La mesa número ${numero} ya existe en el restaurante` });
    }

    if (this.formulario.invalid || !this.foto()) {
      this.resumenError.set('Completá todos los campos requeridos y tomá la fotografía obligatoria.');
      this.avisos.vibrarError();
      void Haptics.notification({ type: NotificationType.Error }).catch(() => undefined);
      this.avisos.error('Datos incompletos o duplicados', 'Revisá los campos marcados en rojo.');
      return;
    }

    const estado: EstadoMesa = this.disponible() ? 'VACIA' : 'OCUPADA';
    const datos = {
      numero,
      cantidadComensales: Number(this.formulario.controls.comensales.value),
      tipo: this.tipo(),
      estado,
      fotoUrl: this.foto()!,
    };

    const seguro = await this.confirmacion.pedir({
      titulo: '¿Confirmás el alta de la mesa?',
      mensaje: 'Se generará su código QR automáticamente y se persistirá en Cloud SQL PostgreSQL.',
      confirmar: 'Agregar mesa',
      tono: 'exito',
      icono: 'table_restaurant',
      detalle: [
        { rotulo: 'Número', valor: String(numero) },
        { rotulo: 'Capacidad', valor: `${datos.cantidadComensales} comensales` },
        { rotulo: 'Tipo', valor: ROTULO_TIPO_MESA[this.tipo()] },
        { rotulo: 'Disponibilidad', valor: this.disponible() ? 'Vacía' : 'Ocupada' },
      ],
    });
    if (!seguro) return;

    try {
      const nueva = await this.cargando.conEsperaMinima('Registrando mesa y generando QR…', () =>
        this.mesas.crear(datos),
      );

      void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
      this.avisos.exito(`Mesa ${nueva.numero} agregada`, 'Código QR generado y disponible para el salón.');
      this.mesaCreada.set(nueva);
    } catch (err: any) {
      console.error('Error al agregar mesa:', err);
      this.avisos.vibrarError();
      this.avisos.error('No se pudo guardar la mesa', err?.message || 'Error de conexión.');
    }
  }

  protected detalleAlta(m: Mesa): { rotulo: string; valor: string }[] {
    return [
      { rotulo: 'Mesa', valor: `Número ${m.numero}` },
      { rotulo: 'Capacidad', valor: `${m.cantidadComensales} personas` },
      { rotulo: 'Tipo', valor: ROTULO_TIPO_MESA[m.tipo] },
      { rotulo: 'Estado', valor: m.estado === 'VACIA' ? 'Vacía' : 'Ocupada' },
    ];
  }

  protected verQrCompleto(id: string): void {
    void this.router.navigate(['/mesas', id, 'qr']);
  }

  protected volver(): void {
    void this.router.navigate(['/mesas']);
  }
}
