import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UI } from '../../ui';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { enteroEntre, largoMinimo, marcarEnviado, precio, requerido } from '../../nucleo/validacion/validadores';

/** Alta y edición de bebidas del cantinero: tres fotos y sector BAR automático. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-alta-bebida',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado [titulo]="editando ? 'Editar bebida' : 'Nueva bebida'" conVolver (volver)="volver()" />
      <div class="lm-body lm-body--gap14">
        @if (resumenError()) { <lm-banner tono="error" titulo="Revisá los datos">{{ resumenError() }}</lm-banner> }
        <lm-campo [control]="formulario.controls.nombre" icono="local_bar" etiqueta="Nombre de la bebida" marcador="Vermut tinto" />
        <lm-area class="descripcion" [control]="formulario.controls.descripcion" icono="notes" etiqueta="Descripción" [filas]="2" marcador="Cómo se sirve y con qué viene" />
        <lm-campo [control]="formulario.controls.precio" icono="payments" etiqueta="Precio en pesos" marcador="32000" modo="decimal" [largoMaximo]="8" />
        <lm-campo [control]="formulario.controls.minutos" icono="schedule" etiqueta="Tiempo de barra (minutos)" marcador="5" modo="numeric" [largoMaximo]="3" />
        <section aria-labelledby="fotos-title"><span id="fotos-title" class="lm-label">Fotos de presentación</span><div class="fotos">@for (indice of [0,1,2]; track indice) { <lm-foto forma="rectangulo" [tamano]="104" [fuente]="fotos()[indice]" [etiqueta]="'Foto ' + (indice + 1)" (capturar)="cargarFoto(indice)" /> }</div>@if (errorFotos()) { <span class="lm-field__error">{{ errorFotos() }}</span> }</section>
      </div>
      <div class="lm-actionbar"><lm-boton [icono]="editando ? 'save' : 'add'" [deshabilitado]="guardando()" (presionar)="guardar()">{{ editando ? 'Guardar cambios' : 'Agregar bebida' }}</lm-boton></div>
    </div>
  `,
  styles: [
    `
      :host{display:flex;flex:1;min-height:0}
      /* minmax(0,1fr) y no 1fr: el mínimo automático de la columna es su
         contenido, y con tres fotos eso desbordaba la fila en un equipo
         angosto. */
      .fotos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0}
      .fotos lm-foto{min-width:0}
      /* Proporción cuadrada en vez del alto fijo de 104px que lm-foto escribe
         en el estilo del elemento: la casilla sigue el ancho de su columna en
         lugar de quedar más alta que ancha en un equipo de 320. */
      .fotos ::ng-deep .lm-photo__marco--rect{height:auto !important;aspect-ratio:1/1}
      /* Casilla vacía: sólo la cámara, sin el rótulo "Foto N". */
      .fotos ::ng-deep .lm-photo__pie:not(.lm-photo__pie--cargada){display:none}
      /* Descripción: se desplaza sin barra visible, como el resto del formulario. */
      .descripcion ::ng-deep textarea{scrollbar-width:none}
      .descripcion ::ng-deep textarea::-webkit-scrollbar{display:none}
      .lm-body{justify-content:space-between}

      /* Distribución: ocupar el alto disponible y no cortar tarjetas (pautas de la cátedra) */
      /* Con poco contenido las partes se reparten el alto; con mucho, hay scroll. */
      .lm-body { justify-content: space-between; }
      .fotos ::ng-deep .lm-photo__marco--rect { min-height: clamp(80px, 14dvh, 140px); }
    `,
  ],
})
export class AltaBebidaPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly productos = inject(ProductosService);
  private readonly camara = inject(CamaraService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly idProducto = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly editando = this.idProducto !== null;
  /* Al editar se vuelve al detalle del producto, no a la lista de la carta. */
  protected readonly rutaCarta = this.idProducto ? ['/carta', this.idProducto] : ['/carta'];
  protected readonly guardando = signal(false);
  protected readonly fotos = signal<(string | null)[]>([null, null, null]);
  protected readonly errorFotos = signal<string | null>(null);
  protected readonly resumenError = signal<string | null>(null);
  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [requerido('Escribí el nombre de la bebida'), largoMinimo(3, 'El nombre es demasiado corto')]],
    descripcion: ['', [requerido('Escribí una descripción'), largoMinimo(12, 'Contá un poco más: al menos doce caracteres')]],
    precio: ['', [requerido('Escribí el precio'), precio()]],
    minutos: ['', [requerido('Escribí el tiempo de barra'), enteroEntre(1, 240, 'El tiempo tiene que estar entre 1 y 240 minutos')]],
  });
  constructor() {
    if (!this.idProducto) return;
    const producto = this.productos.porId(this.idProducto);
    if (!producto || producto.tipo !== 'BEBIDA') {
      this.avisos.error('No se puede editar el producto', 'El producto no existe o no es una bebida.');
      void this.router.navigate(['/carta']);
      return;
    }
    this.formulario.setValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: String(producto.precio),
      minutos: String(producto.tiempoElaboracion),
    });
    this.fotos.set([producto.fotos[0] ?? null, producto.fotos[1] ?? null, producto.fotos[2] ?? null]);
  }
  protected async cargarFoto(indice: number): Promise<void> { const foto = await this.camara.elegirFoto(); if (foto) { this.fotos.update((actuales) => actuales.map((actual, i) => i === indice ? foto : actual)); this.errorFotos.set(null); } }
  protected async guardar(): Promise<void> {
    if (this.guardando()) return;
    if (this.idProducto && this.productos.porId(this.idProducto)?.tipo !== 'BEBIDA') return;
    this.resumenError.set(null); this.errorFotos.set(null); marcarEnviado(this.formulario);
    const cargadas = this.fotos().filter(Boolean) as string[];
    if (cargadas.length !== 3) this.errorFotos.set(`Faltan ${3 - cargadas.length} foto${3 - cargadas.length === 1 ? '' : 's'} de presentación`);
    const nombre = this.formulario.controls.nombre.value;
    if (nombre && this.productos.existeNombre(nombre, this.idProducto ?? undefined)) this.formulario.controls.nombre.setErrors({ lm: `${nombre.trim()} ya está en la carta` });
    if (this.formulario.invalid || cargadas.length !== 3) { this.resumenError.set('Completá los datos válidos y las tres fotos obligatorias.'); this.avisos.error(this.editando ? 'No pudimos actualizar la bebida' : 'No pudimos agregar la bebida', 'Revisá los campos marcados.'); return; }
    const datos = this.formulario.getRawValue();
    const seguro = await this.confirmacion.pedir({
      titulo: this.editando ? '¿Guardás los cambios de la bebida?' : '¿Agregás esta bebida?',
      mensaje: this.editando ? 'Los cambios se actualizarán en la carta.' : 'Estará disponible en la carta.',
      confirmar: this.editando ? 'Guardar cambios' : 'Agregar bebida',
      tono: 'exito', icono: 'local_bar',
      detalle: [{ rotulo: 'Bebida', valor: datos.nombre }, { rotulo: 'Tiempo', valor: `${datos.minutos} minutos` }],
    });
    if (!seguro || this.guardando()) return;
    this.guardando.set(true);
    try {
      const datosProducto = {
        nombre: datos.nombre, descripcion: datos.descripcion,
        precio: Number(datos.precio.replace(/\./g, '').replace(',', '.')),
        tiempoElaboracion: Number(datos.minutos), tipo: 'BEBIDA' as const, fotos: cargadas,
      };
      await this.cargando.conEsperaMinima(
        this.editando ? 'Guardando los cambios…' : 'Agregando bebida…',
        () => this.idProducto ? this.productos.editar(this.idProducto, datosProducto) : this.productos.crear(datosProducto),
      );
      this.avisos.exito(
        this.editando ? 'Bebida actualizada' : 'Bebida agregada',
        this.editando ? `${datos.nombre} se actualizó correctamente.` : `${datos.nombre} ya está en la carta.`,
      );
      await this.router.navigate(this.editando ? this.rutaCarta : ['/sector/pedidos'], { replaceUrl: true });
    } catch {
      this.avisos.error(this.editando ? 'No pudimos actualizar la bebida' : 'No pudimos agregar la bebida', 'Intentá de nuevo. Los datos siguen en el formulario.');
    } finally {
      this.guardando.set(false);
    }
  }
  protected volver(): void { void this.router.navigate(this.editando ? this.rutaCarta : ['/sector/pedidos']); }
}
