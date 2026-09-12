import { Component, inject, signal, computed  } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import {
  enteroEntre,
  largoMinimo,
  marcarEnviado,
  precio,
  requerido,
} from '../../nucleo/validacion/validadores';

import { TipoProducto } from '../../nucleo/modelos/enums';

/**
 * Punto 2 - Alta de platos.
 *
 * El cocinero registra platos en el sector COCINA.
 * Las tres fotos son independientes y pueden reemplazarse individualmente.
 */
@Component({
  selector: 'lm-alta-plato',
  imports: [ReactiveFormsModule, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado
        [titulo]="
          editando
            ? (esPostre() ? 'Editar postre' : 'Editar plato')
            : (esPostre() ? 'Nuevo postre' : 'Nuevo plato')
        "
        conVolver
        (volver)="ir(['/carta'])"
      />

      <div class="lm-body lm-body--gap14">
        @if (resumenError()) {
          <lm-banner
            tono="error"
            [titulo]="
              esPostre()
                ? 'Faltan datos del postre'
                : 'Faltan datos del plato'
            "
          >
            {{ resumenError() }}
          </lm-banner>
        }

        <lm-segmentado
          etiqueta="Categoría"
          [opciones]="tiposProducto"
          [valor]="tipoProducto()"
          [columnas]="2"
          (cambiar)="tipoProducto.set($any($event))"
        />

        <lm-campo
          [control]="formulario.controls.nombre"
          [icono]="esPostre() ? 'icecream' : 'restaurant'"
          [etiqueta]="
            esPostre()
              ? 'Nombre del postre'
              : 'Nombre del plato'
          "
          [marcador]="
            esPostre()
              ? 'Mochi helado'
              : 'Ramen tonkotsu'
          "
        />

        <lm-campo
          [control]="formulario.controls.descripcion"
          icono="notes"
          etiqueta="Descripción"
          [marcador]="
            esPostre()
              ? 'Sabores, ingredientes y forma de presentación'
              : 'Ingredientes y forma de presentación'
          "
        />

        <lm-campo
          [control]="formulario.controls.precio"
          icono="payments"
          etiqueta="Precio"
          [marcador]="esPostre() ? '8500' : '15000'"
          modo="decimal"
          [largoMaximo]="10"
        />

        <lm-campo
          [control]="formulario.controls.minutos"
          icono="schedule"
          etiqueta="Tiempo de elaboración en minutos"
          [marcador]="esPostre() ? '15' : '30'"
          modo="numeric"
          [largoMaximo]="3"
        />

        <section aria-labelledby="titulo-fotos">
          <span
            id="titulo-fotos"
            class="lm-label"
          >
            {{
              esPostre()
                ? 'Fotos del postre - tres obligatorias'
                : 'Fotos del plato - tres obligatorias'
            }}
          </span>

          <div class="fotos">
            @for (indice of [0, 1, 2]; track indice) {
              <lm-foto
                forma="rectangulo"
                [tamano]="104"
                [fuente]="fotos()[indice] ?? null"
                [etiqueta]="
                  (esPostre()
                    ? 'Foto del postre '
                    : 'Foto del plato ') +
                  (indice + 1)
                "
                (capturar)="cargarFoto(indice)"
              />
            }
          </div>

          @if (errorFotos()) {
            <span class="lm-field__error">
              <lm-icono
                nombre="error"
                [tamano]="16"
              />

              {{ errorFotos() }}
            </span>
          } @else {
            <span class="lm-field__hint">
              Podés tomar cada foto con la cámara o elegirla de la galería.
              Cada imagen puede reemplazarse por separado.
            </span>
          }
        </section>
      </div>

      <div class="lm-actionbar">
        <lm-boton
          icono="save"
          (presionar)="guardar()"
        >
          {{
            editando
              ? 'Guardar cambios'
              : (esPostre() ? 'Agregar postre' : 'Agregar plato')
          }}
        </lm-boton>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      .categoria {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px;
        font: var(--type-body-small);
        color: var(--text-body);
      }

      .fotos {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 8px 0;
      }

      .fotos lm-foto {
        min-width: 0;
      }
    `,
  ],
})
export class AltaPlatoPage extends PaginaConSesion {
  private readonly fb = inject(FormBuilder);
  private readonly productos = inject(ProductosService);
  private readonly camara = inject(CamaraService);
  private readonly route = inject(ActivatedRoute);

  private readonly idProducto =
    this.route.snapshot.paramMap.get('id');

  protected readonly editando =
    this.idProducto !== null;

  protected readonly tipoProducto = signal<TipoProducto>('COMIDA');
  
  protected readonly esPostre = computed(
    () => this.tipoProducto() === 'POSTRE',
      );

  protected readonly tiposProducto: {
    valor: TipoProducto;
    rotulo: string;
    }[] = [
      { valor: 'COMIDA', rotulo: 'Comida' },
      { valor: 'POSTRE', rotulo: 'Postre' },
  ];

  protected readonly fotos = signal<(string | null)[]>([
    null,
    null,
    null,
  ]);

  protected readonly errorFotos = signal<string | null>(null);
  protected readonly resumenError = signal<string | null>(null);


  protected readonly formulario = this.fb.nonNullable.group({
    nombre: [
      '',
      [
        requerido('Escribí el nombre del plato'),
        largoMinimo(
          3,
          'El nombre debe tener al menos tres caracteres',
        ),
      ],
    ],

    descripcion: [
      '',
      [
        requerido('Escribí una descripción'),
        largoMinimo(
          12,
          'La descripción debe tener al menos doce caracteres',
        ),
      ],
    ],

    precio: [
      '',
      [
        requerido('Escribí el precio'),
        precio(),
      ],
    ],

    minutos: [
      '',
      [
        requerido('Escribí el tiempo de elaboración'),
        enteroEntre(
          1,
          240,
          'El tiempo debe ser un número entero entre 1 y 240 minutos',
        ),
      ],
    ],
  });

  constructor() {
    super();

    if (!this.idProducto) {
      return;
    }

    const producto = this.productos.porId(
      this.idProducto,
    );

    if (
      !producto ||
      producto.tipo === 'BEBIDA'
    ) {
      this.avisos.error(
        'No se puede editar el producto',
        'El producto no existe o no pertenece al sector cocina.',
      );

      this.ir(['/carta']);
      return;
    }

    this.tipoProducto.set(producto.tipo);

    this.formulario.setValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: String(producto.precio),
      minutos: String(producto.tiempoElaboracion),
    });

    this.fotos.set([
      producto.fotos[0] ?? null,
      producto.fotos[1] ?? null,
      producto.fotos[2] ?? null,
    ]);
  }

  /**
   * Abre el selector de Capacitor para elegir entre cámara y galería.
   * Solamente reemplaza la posición seleccionada.
   */
protected async cargarFoto(indice: number): Promise<void> {


  const imagen = await this.camara.elegirFoto();



  if (!imagen) {
    return;
  }

  this.fotos.update((actuales) => {
    const nuevas = [...actuales];
    nuevas[indice] = imagen;
    return nuevas;
  });

  this.errorFotos.set('');
}

protected async guardar(): Promise<void> {
  this.resumenError.set(null);
  this.errorFotos.set(null);

  marcarEnviado(this.formulario);

  const fotosCargadas = this.fotos().filter(
    (foto): foto is string => Boolean(foto),
  );

  if (fotosCargadas.length !== 3) {
    const cantidadFaltante =
      3 - fotosCargadas.length;

    this.errorFotos.set(
      cantidadFaltante === 1
        ? 'Falta una foto obligatoria'
        : `Faltan ${cantidadFaltante} fotos obligatorias`,
    );
  }

  const nombre =
    this.formulario.controls.nombre.value;

  if (
    nombre &&
    this.productos.existeNombre(
      nombre,
      this.idProducto ?? undefined,
    )
  ) {
    this.formulario.controls.nombre.setErrors({
      lm: `${nombre.trim()} ya está registrado en la carta`,
    });
  }

  if (
    this.formulario.invalid ||
    fotosCargadas.length !== 3
  ) {
    this.resumenError.set(
      'Completá correctamente todos los campos y las tres fotos.',
    );

    this.avisos.error(
      this.editando
        ? 'No se pudieron guardar los cambios'
        : `No se pudo registrar el ${
            this.esPostre() ? 'postre' : 'plato'
          }`,
      'Revisá los campos marcados.',
    );

    return;
  }

  const datos = this.formulario.getRawValue();
  const nombreTipo = this.esPostre()
    ? 'postre'
    : 'plato';

  const seguro = await this.preguntar({
    titulo: this.editando
      ? `¿Guardás los cambios del ${nombreTipo}?`
      : `¿Agregás este ${nombreTipo}?`,
    mensaje: this.editando
      ? 'Los cambios se actualizarán en la carta.'
      : `El ${nombreTipo} estará disponible en la carta.`,
    confirmar: this.editando
      ? 'Guardar cambios'
      : `Agregar ${nombreTipo}`,
    tono: 'exito',
    icono: this.esPostre()
      ? 'icecream'
      : 'restaurant',
    detalle: [
      {
        rotulo: this.esPostre()
          ? 'Postre'
          : 'Plato',
        valor: datos.nombre.trim(),
      },
      {
        rotulo: 'Precio',
        valor: `$ ${this.convertirPrecio(
          datos.precio,
        ).toLocaleString('es-AR')}`,
      },
      {
        rotulo: 'Elaboración',
        valor: `${datos.minutos} minutos`,
      },
    ],
  });

  if (!seguro) {
    return;
  }

  const datosProducto = {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    precio: this.convertirPrecio(datos.precio),
    tiempoElaboracion: Number(datos.minutos),
    tipo: this.tipoProducto(),
    fotos: fotosCargadas,
  };

  try {
    const producto =
      await this.cargando.conEsperaMinima(
        this.editando
          ? 'Guardando los cambios...'
          : `Subiendo las fotos y guardando el ${nombreTipo}...`,
        () =>
          this.idProducto
            ? this.productos.editar(
                this.idProducto,
                datosProducto,
              )
            : this.productos.crear(
                datosProducto,
              ),
      );

    this.avisos.exito(
      this.editando
        ? 'Producto actualizado'
        : `${
            this.esPostre()
              ? 'Postre'
              : 'Plato'
          } agregado`,
      this.editando
        ? `${producto.nombre} se actualizó correctamente.`
        : `${producto.nombre} ya aparece en la carta.`,
    );

    this.formulario.reset();
    this.tipoProducto.set('COMIDA');
    this.fotos.set([null, null, null]);
    this.errorFotos.set(null);
    this.resumenError.set(null);

    this.ir(['/carta']);
  } catch (error) {
    console.error(
      'No se pudo guardar el producto:',
      error,
    );

    this.avisos.error(
      this.editando
        ? 'No pudimos actualizar el producto'
        : 'No pudimos guardar el producto',
      'Revisá la conexión e intentá nuevamente.',
    );
  }
}

  private convertirPrecio(valor: string): number {
    return Number(
      valor
        .replace(/\./g, '')
        .replace(',', '.'),
    );
  }
}