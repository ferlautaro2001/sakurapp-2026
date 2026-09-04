import { Component, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { ROTULO_ESTADO_MESA, ROTULO_TIPO_MESA } from '../../nucleo/modelos/enums';

const ESTADOS = ['Todas', 'Vacía', 'Ocupada', 'Inactiva'];
const TIPOS = ['Todos los tipos', 'Estándar', 'VIP', 'Movilidad reducida'];

/**
 * Punto 4 · Grilla y gestión de mesas del salón SakurApp.
 *
 * Muestra el estado operativo de todas las mesas del restaurante en tiempo real.
 * Si el usuario es Dueño o Supervisor, permite dar de alta nuevas mesas.
 */
@Component({
  selector: 'lm-mesas',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()">
        @if (puedeAgregar()) {
          <lm-icono-boton
            accion
            icono="add"
            rotulo="Agregar una mesa"
            tono="primario"
            (presionar)="ir(['/admin/alta-mesa'])"
          />
        }
      </lm-encabezado>

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="visibles().length" [bajada]="bajada()">Mesas del salón</lm-titulo>

        <div class="lm-grid2 resumen">
          <div class="lm-card resumen__dato">
            <lm-icono nombre="table_restaurant" [tamano]="18" color="var(--state-success)" />
            <b>{{ mesas.vacias().length }}</b>
            <span>libres ahora</span>
          </div>
          <div class="lm-card resumen__dato">
            <lm-icono nombre="group" [tamano]="18" color="var(--action-accent)" />
            <b>{{ cubiertos() }}</b>
            <span>cubiertos totales</span>
          </div>
        </div>

        <lm-filtros [opciones]="estados" [valor]="estado()" (cambiar)="estado.set($event)" />
        <lm-filtros [opciones]="tipos" [valor]="tipo()" (cambiar)="tipo.set($event)" />

        @if (visibles().length) {
          <div class="lm-list lm-list--2">
            @for (mesa of visibles(); track mesa.id) {
              <lm-tarjeta-mesa
                [mesa]="mesa"
                (presionar)="ir(['/mesas', mesa.id])"
                (abrirQr)="ir(['/mesas', mesa.id, 'qr'])"
              />
            }
          </div>
        } @else {
          <lm-vacio icono="table_restaurant" [titulo]="tituloVacio()">
            {{ textoVacio() }}
            @if (puedeAgregar()) {
              <lm-boton accion variante="secondary" icono="add" [ancho]="false" (presionar)="ir(['/admin/alta-mesa'])">
                Agregar una mesa
              </lm-boton>
            }
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="mesas" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .resumen__dato { display: flex; align-items: center; gap: 8px; padding: 12px 14px; }
      .resumen__dato b { font: var(--type-section); color: var(--text-title); }
      .resumen__dato span { font: var(--type-caption); color: var(--text-muted); }
    `,
  ],
})
export class MesasPage extends PaginaConSesion {
  protected readonly mesas = inject(MesasService);

  protected readonly estados = ESTADOS;
  protected readonly tipos = TIPOS;
  protected readonly estado = signal('Todas');
  protected readonly tipo = signal('Todos los tipos');

  protected readonly puedeAgregar = computed(() => this.sesion.esAdministrador());

  protected readonly visibles = computed(() =>
    this.mesas
      .todas()
      .filter((m) => this.estado() === 'Todas' || ROTULO_ESTADO_MESA[m.estado] === this.estado())
      .filter((m) => this.tipo() === 'Todos los tipos' || ROTULO_TIPO_MESA[m.tipo] === this.tipo()),
  );

  protected cubiertos(): number {
    return this.mesas.todas().reduce((total, m) => total + m.cantidadComensales, 0);
  }

  protected bajada(): string {
    return this.puedeAgregar()
      ? 'Tocá una mesa para editarla o cambiar su disponibilidad'
      : 'Tocá una mesa para ver sus datos y cambiar su disponibilidad';
  }

  protected tituloVacio(): string {
    return this.mesas.todas().length ? 'Ninguna mesa entra en el filtro' : 'Todavía no hay mesas cargadas';
  }

  protected textoVacio(): string {
    return this.mesas.todas().length
      ? 'Probá con otro estado o con otro tipo de mesa.'
      : 'Cargá el número, la cantidad de comensales, el tipo y la foto: el código QR se genera solo.';
  }
}
