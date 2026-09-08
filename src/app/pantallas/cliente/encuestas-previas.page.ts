import { Component, computed, effect, inject } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { EncuestasService } from '../../nucleo/servicios/encuestas.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';

/**
 * US-5.1 · TASK-5.1.1.2 · resultados de las encuestas anteriores.
 *
 * Es lo único a lo que la consigna le da acceso al comensal que ya se anunció
 * en la puerta y espera su mesa: sólo lectura, sin cargar nada. Quien no está
 * en la lista de espera vuelve a la pantalla del escaneo.
 *
 * Entra entera en la pantalla: los tres gráficos se pasan de a uno con el
 * carrusel y se quedan con todo el alto que les deja el encabezado, así que se
 * ven grandes y no hay que desplazarse.
 */
@Component({
  selector: 'lm-cliente-encuestas-previas',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--fijo lm-body--gap12">
        @if (encuestas.total()) {
          <lm-titulo [contador]="encuestas.total()" [bajada]="bajada()">Encuestas</lm-titulo>

          <lm-diapositivas alto [etiquetas]="etiquetas">
            <lm-grafico-torta
              titulo="Lo mejor de la visita"
              bajada="Una respuesta por comensal."
              [porciones]="encuestas.aspectosFavoritos()"
            />

            <lm-grafico-barras
              titulo="Atención del mozo"
              bajada="Cuánta gente eligió cada puntaje, del uno al cinco."
              [puntos]="encuestas.puntajesDelMozo()"
            />

            <lm-grafico-linea
              titulo="Limpieza, semana a semana"
              bajada="Promedio del puntaje en cada una de las semanas."
              [puntos]="encuestas.limpiezaPorSemana()"
            />
          </lm-diapositivas>
        } @else {
          <lm-titulo>Encuestas</lm-titulo>
          <lm-vacio icono="insights" titulo="Todavía no hay encuestas respondidas">
            Cuando los comensales empiecen a dejar su opinión, vas a ver acá los resultados de las encuestas
            anteriores.
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="encuestas" />
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
})
export class ClienteEncuestasPreviasPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  protected readonly encuestas = inject(EncuestasService);

  /** Un rótulo por diapositiva, para el nombre accesible de cada pétalo. */
  protected readonly etiquetas = [
    'lo mejor de la visita',
    'el puntaje de la atención',
    'la limpieza semana a semana',
  ];

  private readonly entrada = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.espera.activaDe(id) : undefined;
  });

  constructor() {
    super();
    void this.espera.iniciar();
    void this.encuestas.cargar();

    // Los resultados se abren al anunciarse en la puerta, no antes.
    effect(() => {
      if (!this.entrada()) void this.router.navigate(['/cliente/ingreso'], { replaceUrl: true });
    });
  }

  protected bajada(): string {
    const fecha = this.encuestas.desde();
    if (!fecha) return 'Resultados de las encuestas anteriores';
    const desde = new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    return `Respuestas anteriores, desde el ${desde}`;
  }
}
