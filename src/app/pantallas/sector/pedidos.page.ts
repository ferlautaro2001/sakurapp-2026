import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Pedido, PedidoItem } from '../../nucleo/modelos/modelos';
import { EstadoSector, ROTULO_SECTOR, Sector, sectorDelPerfil } from '../../nucleo/modelos/enums';
import { demoraDelSector } from '../../nucleo/modelos/demora';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { ProductosService } from '../../nucleo/servicios/productos.service';

interface TicketVM {
  id: string;
  pedido: Pedido;
  mesa: number | string;
  comensal: string;
  estado: EstadoSector;
  rotuloEstado: string;
  chip: string;
  minutos: number;
  fechaHora: string;
  abierto: boolean;
  items: { id: string; cantidad: number; nombre: string; tiempo: number }[];
  restantes: number;
}

/**
 * Pantalla operativa de comandas por sector (Cocina y Barra).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-sector-pedidos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12 lm-body--pantalla">
        <lm-titulo [contador]="comandas().length">{{ titulo() }}</lm-titulo>

        <lm-pestanas [opciones]="filtros" [valor]="filtro()" (cambiar)="filtro.set($event)" />

        @if (tickets().length) {
          <div class="sector__lista">
          @for (grupo of grupos(); track grupo.mesa; let primero = $first) {
            <div class="mesa" [class.mesa--primera]="primero">
              <span class="ticket__mesa">Mesa {{ grupo.mesa }}</span>
              <span class="mesa__cantidad">
                {{ grupo.pedidos.length }} {{ grupo.pedidos.length === 1 ? 'pedido' : 'pedidos' }}
              </span>
            </div>
            @for (t of grupo.pedidos; track t.id) {
              <div class="casilla" [class.casilla--abierta]="t.abierto" [id]="'ticket-' + t.id">
              <div class="ticket" [class.ticket--abierto]="t.abierto">
                <div class="ticket__cabecera">
                  <span class="ticket__mesa">Mesa {{ t.mesa }}</span>
                  <span class="ticket__cliente">{{ t.comensal }}</span>
                  @if (filtro() === 'TODOS') {
                    <lm-chip [estado]="t.chip">{{ t.rotuloEstado }}</lm-chip>
                  }
                </div>

                <div class="ticket__meta">
                  <span class="ticket__pedido">
                    <lm-icono nombre="event" [tamano]="14" />
                    {{ t.fechaHora | fechaHora }}
                  </span>
                  <span class="ticket__estimado">
                    <lm-icono nombre="timer" [tamano]="14" />
                    {{ t.minutos }}' de preparación
                  </span>
                </div>

                <div class="ticket__items">
                  @for (item of t.items; track item.id) {
                    <div class="item">
                      <span class="item__cantidad">×{{ item.cantidad }}</span>
                      <span class="item__nombre">{{ item.nombre }}</span>
                      <span class="item__tiempo">{{ item.tiempo }}'</span>
                    </div>
                  }
                </div>

                @if (t.restantes > 0) {
                  <button type="button" class="ticket__mas" [attr.aria-expanded]="t.abierto" (click)="alternar(t.id)">
                    <lm-icono [nombre]="t.abierto ? 'expand_less' : 'expand_more'" [tamano]="18" />
                    {{ t.abierto ? 'Ver menos' : 'Ver los ' + t.restantes + ' restantes' }}
                  </button>
                }

                <!-- Los listos no llevan pie: el chip ya dice el estado. -->
                @if (t.estado !== 'LISTO') {
                <div class="ticket__pie">
                  @if (t.estado === 'PENDIENTE') {
                    <lm-boton compacto icono="skillet" (presionar)="avanzar(t.pedido, 'EN_PREPARACION')">
                      Empezar a preparar
                    </lm-boton>
                  } @else if (t.estado === 'EN_PREPARACION') {
                    <lm-boton compacto variante="success" icono="room_service" (presionar)="avanzar(t.pedido, 'LISTO')">
                      Avisar que está listo
                    </lm-boton>
                  }
                </div>
                }
              </div>
              </div>
            }
          }
          </div>
        } @else {
          <lm-vacio icono="skillet" [titulo]="tituloVacio()">
            {{ textoVacio() }}
          </lm-vacio>
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="pedidos" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      .mesa { display: flex; align-items: center; gap: 10px; margin-top: var(--space-4); }
      .mesa--primera { margin-top: 0; }
      .mesa__cantidad { font: var(--type-caption); color: var(--text-sobre-fondo-suave); }
      /* Un ticket por parada: cada comanda ocupa la lista entera (más alto que
         la pantalla, su contenido se mira entero) y se ancla al tope, así nunca
         queda uno cortado abajo. El botón de acción va al pie de la tarjeta. */
      .sector__lista {
        flex: 1 1 0 !important; min-height: 0; display: flex; flex-direction: column; gap: var(--space-3);
        container: sector / size; overflow-y: auto; overscroll-behavior: contain;
        overflow-anchor: none; scroll-snap-type: y mandatory; scroll-padding: 0; scrollbar-width: none;
      }
      .sector__lista::-webkit-scrollbar { display: none; }
      .sector__lista > .casilla {
        --por: 1;
        flex: 0 0 calc((100cqh - (var(--por) - 1) * var(--space-3)) / var(--por));
        min-height: min-content; display: flex; flex-direction: column;
        scroll-snap-align: start; scroll-snap-stop: always;
      }
      .casilla > .ticket { flex: 1 1 auto; }
      /* De a dos sólo si la lista alcanza: cada ticket mide hasta ~217px. */
      @container sector (min-height: 444px) { .sector__lista > .casilla { --por: 2; } }
      /* El ticket abierto se queda solo en la pantalla, como el correo abierto,
         pero mide sólo lo que necesita y queda centrado: la casilla ocupa toda la
         lista (así no asoma ningún otro ticket cortado) y el ticket va al medio. */
      .sector__lista > .casilla.casilla--abierta { flex: 0 0 100cqh !important; justify-content: center; }
      .casilla--abierta > .ticket { flex: 0 0 auto; }
      .casilla--abierta .ticket__pie { margin-top: 0; }
      .ticket__mas {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        width: 100%; min-height: 36px; padding: 6px var(--space-4);
        border: none; border-top: 1px solid var(--surface-sunken);
        background: rgba(255, 215, 223, 0.24); cursor: pointer;
        font: var(--type-body-small); font-weight: 700; color: var(--action-primary);
      }
      .ticket__pie { margin-top: auto; }
      .ticket {
        display: flex; flex-direction: column;
        border-radius: var(--radius-card);
        background: var(--surface-card); box-shadow: var(--shadow-raised);
        overflow: hidden;
      }
      .ticket__cabecera { display: flex; align-items: center; gap: 8px; padding: 8px var(--space-4) 4px; }
      .ticket__mesa {
        flex: 0 0 auto; padding: 5px 11px; border-radius: var(--radius-pill);
        background: var(--action-primary); color: #FFFFFF;
        font: var(--type-label); letter-spacing: var(--tracking-label); text-transform: uppercase;
      }
      .ticket__cliente {
        flex: 1 1 auto; min-width: 0;
        font: var(--type-body-small); color: var(--text-muted);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .ticket__meta {
        display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; padding: 0 var(--space-4) 10px;
        font: var(--type-caption); color: var(--text-muted);
      }
      .ticket__pedido, .ticket__estimado { display: inline-flex; align-items: center; gap: 5px; }
      .ticket__pedido { color: var(--text-title); font-weight: 700; }
      .ticket__items {
        display: flex; flex-direction: column; gap: 6px;
        padding: 8px var(--space-4);
        border-top: 1px solid var(--surface-sunken);
        border-bottom: 1px solid var(--surface-sunken);
        background: rgba(255, 215, 223, 0.24);
      }
      .item { display: flex; align-items: center; gap: var(--space-3); }
      .item__cantidad {
        flex: 0 0 auto; min-width: var(--size-icono-caja); min-height: 30px; padding: 0 8px;
        border-radius: 11px; display: grid; place-items: center;
        background: var(--action-primary); color: #FFFFFF;
        font: 900 clamp(13px, 4vw, 17px)/1 var(--font-numeric);
      }
      .item__nombre { flex: 1 1 auto; min-width: 0; font: var(--type-section); color: var(--text-title); text-wrap: pretty; }
      .item__tiempo { flex: 0 0 auto; font: var(--type-caption); color: var(--text-muted); }
      .ticket__pie { padding: 8px var(--space-4); }
    `,
  ],
})
export class SectorPedidosPage extends PaginaConSesion {
  private readonly pedidos = inject(PedidosService);
  private readonly mesas = inject(MesasService);
  private readonly productos = inject(ProductosService);

  protected readonly sector = computed<Sector>(() => sectorDelPerfil(this.usuario()?.perfil) ?? 'COCINA');

  protected readonly filtros = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'PENDIENTE', rotulo: 'Pendientes' },
    { valor: 'EN_PREPARACION', rotulo: 'Preparando' },
    { valor: 'LISTO', rotulo: 'Listos' },
  ];
  protected readonly filtro = signal('TODOS');

  private readonly todos = computed(() => {
    const sec = this.sector();
    return this.pedidos.todos().filter((p) => {
      const estadoSec = sec === 'COCINA' ? p.estadoCocina : p.estadoBar;
      return estadoSec !== 'NO_APLICA' && p.estadoGlobal !== 'RECHAZADO' && p.estadoGlobal !== 'CERRADO';
    });
  });

  protected readonly comandas = computed(() => {
    const filtro = this.filtro();
    const lista = this.todos();
    return filtro === 'TODOS' ? lista : lista.filter((p) => this.estadoDe(p) === filtro);
  });

  /**
   * View-model precomputado: el template sólo lee propiedades, sin llamar
   * métodos en cada ciclo de detección (clave para sostener 120 FPS).
   */
  protected readonly tickets = computed<TicketVM[]>(() => {
    const abierto = this.abierto();
    return this.comandas().map((pedido) => ({
      id: pedido.id,
      pedido,
      mesa: this.numeroMesa(pedido),
      comensal: this.comensal(pedido),
      estado: this.estadoDe(pedido),
      rotuloEstado: this.rotuloEstado(pedido),
      chip: this.chip(pedido),
      minutos: this.minutosDe(pedido),
      fechaHora: pedido.timestampCreacion,
      abierto: abierto === pedido.id,
      items: this.visiblesDe(pedido).map((i) => ({
        id: i.id,
        cantidad: i.cantidad,
        nombre: i.productoNombre,
        tiempo: this.tiempoItem(i),
      })),
      restantes: this.restantesDe(pedido),
    }));
  });

  /** Comandas agrupadas por número de mesa manteniendo el TicketVM. */
  protected readonly grupos = computed(() => {
    const porMesa = new Map<number | string, TicketVM[]>();
    const ordenados = [...this.tickets()].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
    for (const ticket of ordenados) {
      porMesa.set(ticket.mesa, [...(porMesa.get(ticket.mesa) ?? []), ticket]);
    }
    return [...porMesa].map(([mesa, pedidos]) => ({ mesa, pedidos }));
  });

  private rotuloFiltro(): string {
    return this.filtros.find((f) => f.valor === this.filtro())?.rotulo.toLocaleLowerCase('es-AR') ?? '';
  }

  protected tituloVacio(): string {
    if (this.filtro() === 'TODOS') return 'No hay pedidos para preparar';
    return `No hay pedidos en «${this.rotuloFiltro()}»`;
  }

  protected textoVacio(): string {
    if (this.filtro() === 'TODOS') {
      return `Cuando el mozo confirme un pedido, la parte que le toca a ${this.rotuloSector()} aparece acá, agrupada por mesa.`;
    }
    return 'Probá con otro filtro: los demás pedidos siguen estando.';
  }

  protected titulo(): string {
    return this.sector() === 'BAR' ? 'Pedidos de la barra' : 'Pedidos de la cocina';
  }


  protected rotuloSector(): string {
    return ROTULO_SECTOR[this.sector()].toLocaleLowerCase('es-AR');
  }

  protected itemsDe(pedido: Pedido): PedidoItem[] {
    return pedido.items.filter((i) => i.sector === this.sector());
  }

  /**
   * Con el ticket cerrado se ve sólo el primer producto cuando hay más de uno,
   * y el resto se abre con "Ver los N restantes". Así el ticket cabe entero en
   * su mitad de la lista, aunque algún nombre ocupe dos renglones.
   */
  /** Sólo un ticket abierto a la vez, como el correo: ocupa toda la lista. */
  protected readonly abierto = signal<string | null>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected visiblesDe(pedido: Pedido): PedidoItem[] {
    const items = this.itemsDe(pedido);
    if (this.abierto() === pedido.id || items.length <= 1) return items;
    return items.slice(0, 1);
  }

  protected restantesDe(pedido: Pedido): number {
    const total = this.itemsDe(pedido).length;
    return total > 1 ? total - 1 : 0;
  }

  protected alternar(id: string): void {
    const abrir = this.abierto() !== id;
    this.abierto.set(abrir ? id : null);
    if (abrir) {
      // Como en los correos: el ticket abierto se lleva al tope de la lista.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          this.host.nativeElement.querySelector(`#ticket-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        ),
      );
    }
  }

  protected tiempoItem(item: PedidoItem): number {
    const prod = this.productos.porId(item.productoId);
    return prod?.tiempoElaboracion ?? 15;
  }

  protected minutosDe(pedido: Pedido): number {
    return demoraDelSector(
      this.itemsDe(pedido).map((i) => ({ tipo: i.tipo, tiempoElaboracion: this.tiempoItem(i), cantidad: i.cantidad })),
      this.sector(),
    );
  }

  protected estadoDe(pedido: Pedido): EstadoSector {
    return this.sector() === 'COCINA' ? pedido.estadoCocina : pedido.estadoBar;
  }

  protected rotuloEstado(pedido: Pedido): string {
    const estado = this.estadoDe(pedido);
    return estado === 'LISTO' ? 'Listo' : estado === 'EN_PREPARACION' ? 'En preparación' : 'Pendiente';
  }

  protected chip(pedido: Pedido): string {
    const estado = this.estadoDe(pedido);
    return estado === 'LISTO' ? 'aprobado' : estado === 'EN_PREPARACION' ? 'reservada' : 'pendiente';
  }

  protected numeroMesa(pedido: Pedido): number | string {
    return pedido.mesaNumero || this.mesas.porId(pedido.mesaId)?.numero || '—';
  }

  protected comensal(pedido: Pedido): string {
    return pedido.clienteNombre || 'Comensal';
  }

  protected async avanzar(pedido: Pedido, estado: EstadoSector): Promise<void> {
    const listo = estado === 'LISTO';

    const seguro = await this.preguntar({
      titulo: listo ? '¿Está listo?' : '¿Empezás a prepararlo?',
      mensaje: '',
      confirmar: listo ? 'Marcar listo' : 'Empezar',
      tono: listo ? 'exito' : 'primario',
      icono: listo ? 'room_service' : 'skillet',
      detalle: [
        { rotulo: 'Mesa', valor: `${this.numeroMesa(pedido)}` },
        { rotulo: 'Productos', valor: `${this.itemsDe(pedido).length}` },
      ],
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima(
      listo ? 'Avisando que está listo…' : 'Marcando en preparación…',
      () => this.pedidos.avanzarSector(pedido.id, this.sector(), estado),
      350,
    );

    this.avisos.exito(
      listo ? `Mesa ${this.numeroMesa(pedido)} lista` : `Mesa ${this.numeroMesa(pedido)} en preparación`,
      listo ? 'El salón ya lo sabe.' : 'La mesa ya lo ve en su pantalla.',
    );
  }
}
