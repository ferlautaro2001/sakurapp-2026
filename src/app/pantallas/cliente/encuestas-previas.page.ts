import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { EncuestasService } from '../../nucleo/servicios/encuestas.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { ENCUESTAS, RespuestasEncuesta, encuestaPorId, tieneValor } from '../../nucleo/datos/encuestas';

/** Con la cuenta pedida, la estadía está terminando: es el momento de la encuesta. */
const PIDE_ENCUESTA = ['CUENTA_SOLICITADA', 'PAGO_PENDIENTE'];

/**
 * Encuestas: los resultados de las anteriores y, al final de la estadía, la propia.
 *
 * - En la fila o comiendo: los resultados, un gráfico por pantalla. Arriba se
 *   elige cuál de las tres encuestas mirar; cada una tiene sus cinco gráficos.
 * - Con la cuenta pedida y sin responder: la encuesta de esta visita, paso a
 *   paso (punto 20). Al mandarla vuelven los gráficos, con su respuesta sumada.
 * - Ya respondida: los resultados arrancan en su encuesta y, arriba, "Mis
 *   respuestas" muestra el mismo recorrido con lo que contestó, bloqueado.
 *
 * Entra entera en la pantalla en los tres casos: nada se desplaza.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lm-cliente-encuestas-previas',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      @if (modo() === 'MIS_RESPUESTAS') {
        <!-- Desde cualquier pregunta se vuelve a los resultados con la flecha. -->
        <lm-encabezado titulo="Mis respuestas" conVolver (volver)="verMias.set(false)" />
      } @else {
        <lm-encabezado (cerrarSesion)="cerrarSesion()" />
      }

      <div class="lm-body lm-body--fijo lm-body--gap12">
        @if (modo() === 'RESPONDER' && definicion(); as def) {
          <lm-titulo>Tu encuesta</lm-titulo>
          <lm-encuesta [definicion]="def" (terminar)="enviar($event)" />
        } @else if (modo() === 'MIS_RESPUESTAS' && definicion(); as def) {
          <lm-encuesta soloLectura [definicion]="def" [respuestas]="visita()?.respuestas ?? null" (cerrar)="verMias.set(false)" />
        } @else {
          <!-- Mismo botón que "Cómo ganar descuentos" en Juegos. -->
          <lm-titulo>
            Encuestas
            @if (yaRespondio()) {
              <lm-boton
                accion
                variante="secondary"
                icono="fact_check"
                [ancho]="false"
                compacto
                sobreOscuro
                class="mias"
                (presionar)="verMias.set(true)"
              >
                Mis respuestas
              </lm-boton>
            }
          </lm-titulo>

          @if (encuestas.total()) {
            <lm-segmentado class="selector" vidrio [opciones]="selector" [valor]="vista()" (cambiar)="elegida.set($event)" />

            <!-- Un gráfico por pregunta de la encuesta elegida. Al cambiar de
                 encuesta el carrusel se arma de nuevo y vuelve al primero. -->
            @for (v of [vista()]; track v) {
            <lm-diapositivas alto [etiquetas]="etiquetas()">
              @for (g of graficos(); track g.id) {
                @switch (g.tipo) {
                  @case ('torta') {
                    <lm-grafico-torta [titulo]="g.titulo" [porciones]="$any(g).porciones" />
                  }
                  @case ('barras') {
                    <lm-grafico-barras sufijo=" %" [titulo]="g.titulo" [puntos]="$any(g).puntos" />
                  }
                  @case ('linea') {
                    <lm-grafico-linea [titulo]="g.titulo" [puntos]="$any(g).puntos" />
                  }
                  @case ('ranking') {
                    <lm-grafico-ranking [titulo]="g.titulo" [puntos]="$any(g).puntos" />
                  }
                }
              }
            </lm-diapositivas>
            }
          } @else {
            <lm-vacio icono="insights" titulo="Todavía no hay encuestas respondidas">
              Cuando los comensales empiecen a dejar su opinión, vas a ver acá los resultados de las encuestas
              anteriores.
            </lm-vacio>
          }
        }
      </div>

      <lm-barra-inferior [items]="secciones()" activo="encuestas" />
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex: 1; min-height: 0; }
      /* La pantalla no se desplaza y reparte el alto encogiendo a sus hijas: el
         título y el selector no se encogen, o el botón de "Mis respuestas" (más
         alto que el título) sobresale y queda pegado al selector. */
      lm-titulo, .selector { flex: 0 0 auto; }
      .selector { margin-top: 4px; }
      /* Como en Juegos: el título y el botón, centrados en la misma fila. */
      lm-titulo ::ng-deep .lm-title { align-items: center; }
      .mias ::ng-deep .lm-btn {
        min-height: 40px;
        padding: 0 clamp(10px, 3vw, 14px);
        gap: 6px;
        font-size: clamp(12.5px, 3.5vw, 14px);
        white-space: nowrap;
      }
    `,
  ],
})
export class ClienteEncuestasPreviasPage extends PaginaConSesion {
  private readonly espera = inject(EsperaService);
  private readonly pedidos = inject(PedidosService);
  protected readonly encuestas = inject(EncuestasService);

  /** Las tres encuestas, para elegir de cuál ver los resultados. */
  protected readonly selector = ENCUESTAS.map((e) => ({ valor: e.id, rotulo: e.corto }));

  /** La encuesta que eligió mirar; si no eligió, la suya o la primera. */
  protected readonly elegida = signal<string | null>(null);

  protected readonly verMias = signal(false);

  /** La fila ya se leyó: recién entonces "no está en la fila" es un dato. */
  private readonly filaLeida = signal(false);

  private readonly entrada = computed(() => {
    const id = this.usuario()?.id;
    return id ? this.espera.activaDe(id) : undefined;
  });

  private readonly pedido = computed(() => this.pedidos.activoDe(this.usuario()));

  protected readonly visita = computed(() => this.encuestas.deLaVisita(this.pedido()?.id));
  protected readonly definicion = computed(() => this.encuestas.definicionDe(this.visita()));
  protected readonly yaRespondio = computed(() => this.encuestas.respondida(this.pedido()?.id));

  protected readonly vista = computed(
    () => this.elegida() ?? (this.yaRespondio() ? this.definicion()?.id : null) ?? ENCUESTAS[0].id,
  );

  protected readonly graficos = computed(() => {
    const def = encuestaPorId(this.vista());
    return def ? this.encuestas.graficosDe(def) : [];
  });

  /** Un rótulo por diapositiva, para el nombre accesible de cada pétalo. */
  protected readonly etiquetas = computed(() => this.graficos().map((g) => g.titulo));

  protected readonly modo = computed<'RESPONDER' | 'MIS_RESPUESTAS' | 'RESULTADOS'>(() => {
    if (this.yaRespondio()) return this.verMias() ? 'MIS_RESPUESTAS' : 'RESULTADOS';
    const p = this.pedido();
    return p && PIDE_ENCUESTA.includes(p.estadoGlobal) && this.visita() ? 'RESPONDER' : 'RESULTADOS';
  });

  constructor() {
    super();
    void this.espera.iniciar().then(() => this.filaLeida.set(true));
    this.pedidos.iniciar();
    void this.encuestas.cargar();

    // Con la cuenta pedida, se abre la encuesta de esta visita (la primera vez
    // se sortea cuál de las tres le toca). Si ya la había mandado, sólo se lee.
    effect(() => {
      const p = this.pedido();
      if (!p) return;
      if (PIDE_ENCUESTA.includes(p.estadoGlobal)) void this.encuestas.abrir(p);
      else void this.encuestas.consultar(p.id);
    });

    // Los resultados se abren al anunciarse en la puerta, no antes. Quien ya
    // tiene un pedido pasó por la puerta, aunque la fila ya lo haya soltado.
    // Se decide con los datos ya leídos: al recargar la página, la fila y los
    // pedidos todavía vienen en camino y parecería que no hay ninguno.
    effect(() => {
      if (!this.filaLeida() || !this.pedidos.cargado()) return;
      if (!this.entrada() && !this.pedido()) void this.router.navigate(['/cliente/ingreso'], { replaceUrl: true });
    });
  }

  protected async enviar(respuestas: RespuestasEncuesta): Promise<void> {
    const p = this.pedido();
    const def = this.definicion();
    if (!p || !def) return;

    const seguro = await this.preguntar({
      titulo: '¿Enviás la encuesta?',
      mensaje: '',
      confirmar: 'Enviar encuesta',
      tono: 'exito',
      icono: 'send',
      detalle: [
        { rotulo: 'Encuesta', valor: def.nombre },
        {
          rotulo: 'Preguntas respondidas',
          valor: `${Object.values(respuestas).filter(tieneValor).length} de ${def.pasos.length}`,
        },
      ],
    });
    if (!seguro) return;

    try {
      await this.cargando.conEsperaMinima('Enviando tu encuesta…', () => this.encuestas.enviar(p, def, respuestas));
    } catch (err) {
      this.avisos.error('No se pudo enviar la encuesta', err instanceof Error ? err.message : 'Probá de nuevo.');
      return;
    }
    this.verMias.set(false);
    this.elegida.set(null);
    this.avisos.exito('¡Gracias por tu opinión!', 'Tu respuesta ya se sumó a los resultados.');
  }
}
