import { Component, computed, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { Pedido, PedidoItem } from '../../nucleo/modelos/modelos';
import { EstadoSector, ROTULO_SECTOR, Sector, sectorDelPerfil } from '../../nucleo/modelos/enums';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { ProductosService } from '../../nucleo/servicios/productos.service';

/**
 * Pantalla operativa de comandas por sector (Cocina y Barra).
 */
@Component({
  selector: 'lm-sector-pedidos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body lm-body--gap12">
        <lm-titulo [contador]="comandas().length" [bajada]="bajada()">{{ titulo() }}</lm-titulo>

        <lm-pestanas [opciones]="filtros" [valor]="filtro()" (cambiar)="filtro.set($event)" />

        @if (comandas().length) {
          @for (pedido of comandas(); track pedido.id) {
            <div class="ticket">
              <div class="ticket__cabecera">
                <span class="ticket__mesa">Mesa {{ numeroMesa(pedido) }}</span>
                <span class="ticket__cliente">{{ comensal(pedido) }}</span>
                <lm-chip [estado]="chip(pedido)">{{ rotuloEstado(pedido) }}</lm-chip>
              </div>

              <div class="ticket__meta">
                <lm-icono nombre="schedule" [tamano]="14" />
                {{ minutosDe(pedido) }} min de preparación
              </div>

              <div class="ticket__items">
                @for (item of itemsDe(pedido); track item.id) {
                  <div class="item">
                    <span class="item__cantidad">×{{ item.cantidad }}</span>
                    <span class="item__nombre">{{ item.productoNombre }}</span>
                    <span class="item__tiempo">{{ tiempoItem(item) }} min</span>
                  </div>
                }
              </div>

              <div class="ticket__pie">
                @if (estadoDe(pedido) === 'PENDIENTE') {
                  <lm-boton compacto icono="skillet" (presionar)="avanzar(pedido, 'EN_PREPARACION')">
                    Empezar a preparar
                  </lm-boton>
                } @else if (estadoDe(pedido) === 'EN_PREPARACION') {
                  <lm-boton compacto variante="success" icono="room_service" (presionar)="avanzar(pedido, 'LISTO')">
                    Avisar que está listo
                  </lm-boton>
                } @else {
                  <p class="ticket__listo">
                    <lm-icono nombre="check_circle" [tamano]="18" color="var(--state-success)" />
                    Listo para que el mozo lo lleve
                  </p>
                }
              </div>
            </div>
          }
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
      .ticket {
        display: flex; flex-direction: column;
        border-radius: var(--radius-card);
        background: var(--surface-card); box-shadow: var(--shadow-raised);
        overflow: hidden;
      }
      .ticket__cabecera { display: flex; align-items: center; gap: 10px; padding: 12px 14px 6px; }
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
        display: flex; align-items: center; gap: 5px; padding: 0 14px 10px;
        font: var(--type-caption); color: var(--text-muted);
      }
      .ticket__items {
        display: flex; flex-direction: column; gap: 8px;
        padding: 12px 14px;
        border-top: 1px solid var(--surface-sunken);
        border-bottom: 1px solid var(--surface-sunken);
        background: rgba(255, 215, 223, 0.24);
      }
      .item { display: flex; align-items: center; gap: 12px; }
      .item__cantidad {
        flex: 0 0 auto; min-width: 46px; height: 34px; padding: 0 8px;
        border-radius: 11px; display: grid; place-items: center;
        background: var(--action-primary); color: #FFFFFF;
        font: 900 17px/1 var(--font-numeric);
      }
      .item__nombre { flex: 1 1 auto; min-width: 0; font: var(--type-section); color: var(--text-title); text-wrap: pretty; }
      .item__tiempo { flex: 0 0 auto; font: var(--type-caption); color: var(--text-muted); }
      .ticket__pie { padding: 12px 14px; }
      .ticket__listo {
        margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px;
        font: var(--type-body-small); color: var(--state-success);
      }
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

  protected bajada(): string {
    return `Lo que hay que preparar en ${this.rotuloSector()}, agrupado por mesa`;
  }

  protected rotuloSector(): string {
    return ROTULO_SECTOR[this.sector()].toLocaleLowerCase('es-AR');
  }

  protected itemsDe(pedido: Pedido): PedidoItem[] {
    return pedido.items.filter((i) => i.sector === this.sector());
  }

  protected tiempoItem(item: PedidoItem): number {
    const prod = this.productos.porId(item.productoId);
    return prod?.tiempoElaboracion ?? 15;
  }

  protected minutosDe(pedido: Pedido): number {
    return this.itemsDe(pedido).reduce((suma, i) => suma + this.tiempoItem(i), 0);
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
      mensaje: listo
        ? 'El cliente ve el cambio en el momento, y cuando terminan todos los sectores el mozo recibe el aviso para llevarlo.'
        : 'La mesa va a ver que su pedido ya está en preparación.',
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
