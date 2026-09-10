import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Espera } from '../../nucleo/modelos/modelos';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

/** Lista de espera en tiempo real para el metre. */
@Component({
  selector: 'lm-metre-lista-espera',
  imports: [DatePipe, ...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="visibles().length" bajada="Ordenada por hora de llegada">
          Lista de espera
        </lm-titulo>

        <lm-buscador marcador="Buscar comensal" [valor]="busqueda()" (cambiar)="busqueda.set($event)" />

        @if (visibles().length) {
          <div class="lm-list">
            @for (entrada of visibles(); track entrada.id; let posicion = $index) {
              <div class="lm-wait">
                <span class="lm-wait__pos">{{ posicion + 1 }}</span>
                <span
                  class="lm-avatar lm-avatar--sm"
                  [style.background-image]="entrada.clienteFotoUrl ? 'url(' + entrada.clienteFotoUrl + ')' : null"
                >
                  @if (!entrada.clienteFotoUrl) {
                    {{ iniciales(entrada.clienteNombre) }}
                  }
                </span>
                <span class="lm-wait__datos">
                  <b>{{ entrada.clienteNombre }}</b>
                  <small>
                    <lm-icono nombre="schedule" [tamano]="15" />
                    Llegó el {{ entrada.timestamp | date: 'dd/MM/yyyy' }} a las
                    {{ entrada.timestamp | date: 'HH:mm' }}
                  </small>
                </span>
                <span class="lm-wait__acciones">
                  <lm-icono-boton
                    icono="person_remove"
                    [rotulo]="'Quitar a ' + entrada.clienteNombre + ' de la lista'"
                    tono="peligro"
                    (presionar)="quitar(entrada)"
                  />
                </span>
              </div>
            }
          </div>
        } @else {
          <lm-vacio icono="hourglass_empty" [titulo]="busqueda() ? 'No encontramos a nadie' : 'Nadie esperando'">
            {{
              busqueda()
                ? 'Probá con otro nombre.'
                : 'Los clientes aparecerán acá cuando escaneen el código de ingreso.'
            }}
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="espera" />
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
})
export class MetreListaEsperaPage extends PaginaConSesion implements OnInit {
  private readonly espera = inject(EsperaService);
  protected readonly busqueda = signal('');

  protected readonly visibles = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es-AR');
    return this.espera.esperando().filter((entrada) =>
      !texto || entrada.clienteNombre.toLocaleLowerCase('es-AR').includes(texto),
    );
  });

  ngOnInit(): void {
    void this.espera.iniciar();
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toLocaleUpperCase('es-AR');
  }

  protected async quitar(entrada: Espera): Promise<void> {
    const confirmado = await this.preguntar({
      titulo: '¿Quitar de la lista?',
      mensaje: 'El turno quedará cancelado y desaparecerá de la lista de espera.',
      confirmar: 'Quitar de la lista',
      tono: 'peligro',
      icono: 'person_remove',
      detalle: [{ rotulo: 'Comensal', valor: entrada.clienteNombre }],
    });
    if (!confirmado) return;

    await this.cargando.conEsperaMinima('Actualizando la lista…', () => this.espera.quitar(entrada.id), 350);
    this.avisos.info(`${entrada.clienteNombre} salió de la lista`, 'Su turno quedó cancelado.');
  }
}
