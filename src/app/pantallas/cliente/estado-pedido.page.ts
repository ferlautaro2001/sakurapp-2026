import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  PedidoCreado,
  PedidosService,
} from '../../nucleo/servicios/pedidos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

@Component({
  selector: 'lm-estado-pedido',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado titulo="Estado de tu pedido" />

      <div class="lm-body lm-body--gap14">
        @if (cargandoPedido()) {
          <section class="estado-card">
            <lm-icono
              nombre="hourglass_top"
              [tamano]="52"
              color="var(--action-primary)"
            />

            <h1>Consultando tu pedido…</h1>
          </section>
        } @else if (pedido(); as actual) {
          <lm-banner
            tono="info"
            titulo="Pedido enviado al mozo"
          >
            Tu pedido todavía no llegó a Cocina ni a Bar.
            Primero debe ser revisado y confirmado por el mozo.
          </lm-banner>

          <section class="estado-card">
            <span class="estado-card__icono">
              <lm-icono
                nombre="schedule"
                [tamano]="46"
                color="#FFFFFF"
              />
            </span>

            <span class="estado-card__etiqueta">
              Estado actual
            </span>

            <h1>Pendiente de confirmación</h1>

            <p>
              El mozo recibió el aviso del pedido de la
              mesa {{ actual.mesaNumero }}.
            </p>
          </section>

          <section
            class="seguimiento"
            aria-label="Seguimiento del pedido"
          >
            <span class="paso paso--activo">
              <lm-icono
                nombre="check_circle"
                [tamano]="24"
              />
              <strong>Pedido enviado</strong>
              <small>Completado</small>
            </span>

            <span class="linea"></span>

            <span class="paso paso--actual">
              <lm-icono
                nombre="person_search"
                [tamano]="24"
              />
              <strong>Confirmación del mozo</strong>
              <small>En espera</small>
            </span>

            <span class="linea linea--pendiente"></span>

            <span class="paso paso--pendiente">
              <lm-icono
                nombre="restaurant"
                [tamano]="24"
              />
              <strong>Preparación</strong>
              <small>Todavía no iniciado</small>
            </span>
          </section>

          <section class="resumen">
            <span>
              <small>MESA</small>
              <strong>
                Mesa {{ actual.mesaNumero }}
              </strong>
            </span>

            <span>
              <small>TOTAL</small>
              <strong>{{ precio(actual.total) }}</strong>
            </span>

            <span>
              <small>TIEMPO ESTIMADO</small>
              <strong>
                {{ actual.tiempoEstimado }} minutos
              </strong>
            </span>

            <span>
              <small>NÚMERO DE PEDIDO</small>
              <strong class="codigo">
                {{ actual.id }}
              </strong>
            </span>
          </section>
        } @else {
          <lm-vacio
            icono="receipt_long"
            titulo="Pedido no encontrado"
          >
            No pudimos recuperar los datos de este pedido.
          </lm-vacio>
        }
      </div>

      @if (pedido(); as actual) {
        <div class="lm-actionbar">
          <lm-boton
            icono="restaurant_menu"
            (presionar)="volverCarta(actual.mesaId)"
          >
            Volver a la carta
          </lm-boton>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        min-height: 0;
      }

      .estado-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 26px 20px;
        border-radius: var(--radius-card);
        background: var(--surface-card);
        box-shadow: var(--shadow-raised);
        color: var(--text-title);
        text-align: center;
      }

      .estado-card__icono {
        display: grid;
        width: 82px;
        height: 82px;
        place-items: center;
        border-radius: 50%;
        background: var(--action-primary);
      }

      .estado-card__etiqueta {
        color: var(--text-muted);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .estado-card h1,
      .estado-card p {
        margin: 0;
      }

      .estado-card p {
        max-width: 520px;
        color: var(--text-body);
      }

      .seguimiento {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr)
          40px
          minmax(0, 1fr)
          40px
          minmax(0, 1fr);
        align-items: center;
        padding: 18px;
        border-radius: var(--radius-card);
        background: var(--surface-card);
      }

      .paso {
        display: flex;
        min-width: 0;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        color: var(--text-muted);
        text-align: center;
      }

      .paso--activo,
      .paso--actual {
        color: var(--action-primary);
      }

      .paso--actual {
        padding: 12px 6px;
        border: 2px solid var(--action-primary);
        border-radius: 14px;
        background: var(--surface-soft);
      }

      .paso small {
        font-size: 11px;
      }

      .linea {
        height: 3px;
        border-radius: 999px;
        background: var(--action-primary);
      }

      .linea--pendiente {
        background: var(--border-subtle);
      }

      .resumen {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .resumen > span {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 5px;
        padding: 14px;
        border-radius: 14px;
        background: var(--surface-card);
        color: var(--text-title);
      }

      .resumen small {
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 800;
      }

      .codigo {
        overflow: hidden;
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @media (max-width: 600px) {
        .seguimiento {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .linea {
          width: 3px;
          height: 24px;
          justify-self: center;
        }

        .resumen {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class EstadoPedidoPage
  extends PaginaConSesion
  implements OnInit
{
  private readonly route = inject(ActivatedRoute);
  private readonly pedidos = inject(PedidosService);

  protected readonly pedido =
    signal<PedidoCreado | null>(null);

  protected readonly cargandoPedido = signal(true);

  async ngOnInit(): Promise<void> {
    const pedidoId =
      this.route.snapshot.paramMap.get('id');

    if (!pedidoId) {
      this.cargandoPedido.set(false);
      return;
    }

    try {
      const pedido =
        await this.pedidos.buscarPorId(pedidoId);

      this.pedido.set(pedido);
    } catch (error) {
      console.error(
        'No se pudo consultar el pedido:',
        error,
      );

      this.avisos.error(
        'No pudimos consultar el pedido',
        'Revisá la conexión e intentá nuevamente.',
      );
    } finally {
      this.cargandoPedido.set(false);
    }
  }

  protected precio(valor: number): string {
    return `$ ${valor.toLocaleString('es-AR')}`;
  }

  protected volverCarta(mesaId: string): void {
    void this.router.navigate(['/carta'], {
      queryParams: mesaId
        ? { mesaId }
        : undefined,
    });
  }
}