import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UI } from '../../ui';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { enteroEntre, largoMinimo, marcarEnviado, precio, requerido } from '../../nucleo/validacion/validadores';

/** Alta exclusiva de cantinero: tres fotos y sector BAR automático. */
@Component({
  selector: 'lm-alta-bebida',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Nueva bebida" conVolver (volver)="volver()" />
      <div class="lm-body lm-body--gap12">
        @if (resumenError()) { <lm-banner tono="error" titulo="Revisá los datos">{{ resumenError() }}</lm-banner> }
        <lm-campo [control]="formulario.controls.nombre" icono="local_bar" etiqueta="Nombre de la bebida" marcador="Vermut tinto" />
        <lm-campo [control]="formulario.controls.descripcion" icono="notes" etiqueta="Descripción" marcador="Cómo se sirve y con qué viene" />
        <lm-campo [control]="formulario.controls.precio" icono="payments" etiqueta="Precio en pesos" marcador="32000" modo="decimal" [largoMaximo]="8" />
        <lm-campo [control]="formulario.controls.minutos" icono="schedule" etiqueta="Tiempo de barra (minutos)" marcador="5" modo="numeric" [largoMaximo]="3" />
        <section aria-labelledby="fotos-title"><span id="fotos-title" class="lm-label">Fotos de presentación</span><div class="fotos">@for (indice of [0,1,2]; track indice) { <lm-foto forma="rectangulo" [tamano]="104" [fuente]="fotos()[indice]" [etiqueta]="'Foto ' + (indice + 1)" (capturar)="cargarFoto(indice)" /> }</div>@if (errorFotos()) { <span class="lm-field__error">{{ errorFotos() }}</span> } @else { <span class="lm-field__hint">Podés usar cámara o galería; cada foto queda en su propio contenedor.</span> }</section>
      </div>
      <div class="lm-actionbar"><lm-boton icono="add" (presionar)="guardar()">Agregar bebida</lm-boton></div>
    </div>
  `,
  styles: [`:host{display:flex;flex:1;min-height:0}.sector{display:flex;gap:10px;align-items:center;padding:14px;background:var(--surface-card);border:1px solid var(--border-card);border-radius:var(--radius-card);font:var(--type-body-small);color:var(--text-body)}.fotos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}.fotos lm-foto{min-width:0}`],
})
export class AltaBebidaPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly productos = inject(ProductosService);
  private readonly camara = inject(CamaraService);
  private readonly avisos = inject(AvisosService);
  private readonly cargando = inject(CargandoService);
  private readonly confirmacion = inject(ConfirmacionService);
  protected readonly fotos = signal<(string | null)[]>([null, null, null]);
  protected readonly errorFotos = signal<string | null>(null);
  protected readonly resumenError = signal<string | null>(null);
  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [requerido('Escribí el nombre de la bebida'), largoMinimo(3, 'El nombre es demasiado corto')]],
    descripcion: ['', [requerido('Escribí una descripción'), largoMinimo(12, 'Contá un poco más: al menos doce caracteres')]],
    precio: ['', [requerido('Escribí el precio'), precio()]],
    minutos: ['', [requerido('Escribí el tiempo de barra'), enteroEntre(1, 240, 'El tiempo tiene que estar entre 1 y 240 minutos')]],
  });
  protected async cargarFoto(indice: number): Promise<void> { const foto = await this.camara.elegirFoto(); if (foto) { this.fotos.update((actuales) => actuales.map((actual, i) => i === indice ? foto : actual)); this.errorFotos.set(null); } }
  protected async guardar(): Promise<void> {
    this.resumenError.set(null); this.errorFotos.set(null); marcarEnviado(this.formulario);
    const cargadas = this.fotos().filter(Boolean) as string[];
    if (cargadas.length !== 3) this.errorFotos.set(`Faltan ${3 - cargadas.length} foto${3 - cargadas.length === 1 ? '' : 's'} de presentación`);
    const nombre = this.formulario.controls.nombre.value;
    if (nombre && this.productos.existeNombre(nombre)) this.formulario.controls.nombre.setErrors({ lm: `${nombre.trim()} ya está en la carta` });
    if (this.formulario.invalid || cargadas.length !== 3) { this.resumenError.set('Completá los datos válidos y las tres fotos obligatorias.'); this.avisos.error('No pudimos agregar la bebida', 'Revisá los campos marcados.'); return; }
    const datos = this.formulario.getRawValue();
    const seguro = await this.confirmacion.pedir({ titulo: '¿Agregás esta bebida?', mensaje: 'Quedará activa para las comandas del sector BAR / CANTINA.', confirmar: 'Agregar bebida', tono: 'exito', icono: 'local_bar', detalle: [{ rotulo: 'Bebida', valor: datos.nombre }, { rotulo: 'Tiempo', valor: `${datos.minutos} minutos` }] });
    if (!seguro) return;
    await this.cargando.conEsperaMinima('Agregando bebida…', () => this.productos.crear({ nombre: datos.nombre, descripcion: datos.descripcion, precio: Number(datos.precio.replace(/\./g, '').replace(',', '.')), tiempoElaboracion: Number(datos.minutos), tipo: 'BEBIDA', fotos: cargadas }));
    this.avisos.exito('Bebida agregada', `${datos.nombre} quedó activa en BAR / CANTINA.`);
    this.formulario.reset(); this.fotos.set([null, null, null]);
  }
  protected volver(): void { void this.router.navigate(['/home']); }
}
