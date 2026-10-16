import { ChangeDetectionStrategy, Component, OnInit, booleanAttribute, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconoComponent, IconoBotonComponent } from './basicos';
import { SesionService } from '../nucleo/servicios/sesion.service';
import { TransicionService } from '../nucleo/servicios/transicion.service';
import { UsuariosService } from '../nucleo/servicios/usuarios.service';
import { ROTULO_PERFIL } from '../nucleo/modelos/enums';

export interface ItemNavegacion {
  id: string;
  rotulo: string;
  icono: string;
  ruta: string;
}

/**
 * Encabezado con avatar, nombre, rol visible y botón de cerrar sesión.
 */
@Component({
  selector: 'lm-encabezado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent, IconoBotonComponent],
  template: `
    <header class="lm-header">
      <div class="lm-header__fila">
        @if (conVolver()) {
          <lm-icono-boton icono="arrow_back" rotulo="Volver" pegadoIzquierda (presionar)="volver.emit()" />
        } @else if (usuario()) {
          <span class="lm-header__avatar">
            <img [src]="usuarios.avatarSushi(usuario())" [alt]="usuario()?.nombre ?? 'Avatar'" width="56" height="56" />
          </span>
        }
        <div class="lm-header__texto">
          <span class="lm-header__nombre">{{ titulo() ?? usuarios.nombreCompleto(usuario()) }}</span>
          @if (!titulo() && usuario()) {
            <span class="lm-header__rol">
              <lm-icono nombre="badge" [tamano]="16" />
              {{ rotulo() }}
            </span>
          }
        </div>
        <ng-content select="[accion]" />
        @if (!titulo()) {
          <lm-icono-boton icono="logout" rotulo="Cerrar sesión" (presionar)="cerrarSesion.emit()" />
        }
      </div>
    </header>
  `,
  styles: [':host{display:block;flex:0 0 auto}'],
})
export class EncabezadoComponent {
  protected readonly usuarios = inject(UsuariosService);
  private readonly sesion = inject(SesionService);

  readonly titulo = input<string | null>(null);
  readonly conVolver = input(false, { transform: booleanAttribute });
  readonly volver = output<void>();
  readonly cerrarSesion = output<void>();

  protected usuario() {
    return this.sesion.usuario();
  }
  protected rotulo(): string {
    const u = this.sesion.usuario();
    return u ? ROTULO_PERFIL[u.perfil] : '';
  }
}


/** Barra inferior de secciones. Sólo donde el rol tiene más de una sección. */
@Component({
  selector: 'lm-barra-inferior',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  template: `
    @if (items().length > 1) {
      <!-- Columnas con mínimo cero: si el mínimo es el contenido, con cinco
           secciones el rótulo más largo fija su columna y la barra se pasa de
           la pantalla. -->
      <nav class="lm-bottomnav" [style.grid-template-columns]="'repeat(' + items().length + ',minmax(0,1fr))'"
        [style.--n]="items().length" [style.--i]="indice()">
        <span class="lm-bottomnav__vidrio" aria-hidden="true"></span>
        @for (item of items(); track item.id; let i = $index) {
          <button type="button" [class.on]="i === indice()" (click)="ir(item, i)">
            <span class="lm-bottomnav__pastilla">
              <lm-icono [nombre]="item.icono" [tamano]="22" />
            </span>
            <span class="lm-bottomnav__rotulo">{{ item.rotulo }}</span>
          </button>
        }
      </nav>
    }
  `,
  styles: [':host{display:block;flex:0 0 auto}'],
})
export class BarraInferiorComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly transicion = inject(TransicionService);
  readonly items = input.required<ItemNavegacion[]>();
  readonly activo = input.required<string>();

  /** Pestaña tocada: el vidrio se desliza hasta ella sin frenar la navegación. */
  private readonly tocado = signal<number | null>(null);
  protected readonly indice = computed(
    () => this.tocado() ?? this.items().findIndex((item) => item.id === this.activo()),
  );

  ngOnInit(): void {
    // La barra se vuelve a montar en cada pantalla: arranca el vidrio en la
    // pestaña de origen para que deslice hasta la nueva en vez de saltar.
    const desde = this.transicion.consumirOrigen();
    const hasta = this.items().findIndex((item) => item.id === this.activo());
    if (desde !== null && hasta >= 0 && desde !== hasta && desde >= 0 && desde < this.items().length) {
      this.tocado.set(desde);
      const asentar = (): void => this.tocado.set(null);
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => requestAnimationFrame(asentar));
      } else {
        setTimeout(asentar, 0);
      }
    }
  }

  protected ir(item: ItemNavegacion, i: number): void {
    const origen = this.indice();
    if (i === origen) return;
    // El sentido del barrido sale de la posición del botón respecto del activo.
    this.transicion.segunIndices(origen, i);
    this.tocado.set(i);
    // Navegación inmediata: el vidrio anima en paralelo, no antes.
    void this.router.navigate([item.ruta]);
  }
}

/** Pestañas de categoría. */
@Component({
  selector: 'lm-pestanas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-tabs" [style.--n]="opciones().length" [style.--i]="indice()">
      <span class="lm-tabs__marca" aria-hidden="true"></span>
      @for (opcion of opciones(); track opcion.valor) {
        <button type="button" [class.on]="opcion.valor === valor()" (click)="cambiar.emit(opcion.valor)">
          {{ opcion.rotulo }}
        </button>
      }
    </div>
  `,
  styles: [':host{display:block;width:100%;max-width:100%;min-width:0}'],
})
export class PestanasComponent {
  readonly opciones = input.required<{ valor: string; rotulo: string }[]>();
  readonly valor = input.required<string>();
  readonly cambiar = output<string>();

  /** Posición de la opción activa: la pastilla se desliza hasta ahí. */
  protected indice(): number {
    return Math.max(0, this.opciones().findIndex((o) => o.valor === this.valor()));
  }
}

