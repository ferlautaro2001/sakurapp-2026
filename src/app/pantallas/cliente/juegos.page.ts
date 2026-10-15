import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';

/** Juego de un solo intento por pedido, con premio no acumulativo. */
@Component({
  selector: 'lm-juegos',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />
      <div class="lm-body lm-body--gap12">
        <lm-titulo>Desafío Sakura</lm-titulo>

        @if (!pedido()) {
          <lm-vacio icono="lock" titulo="Juegos bloqueados">
            Se habilitan cuando el mozo confirma tu pedido.
          </lm-vacio>
        } @else if (pedido()!.juegoIntentado && resultado() === null) {
          <lm-vacio icono="sports_esports" titulo="Intento ya utilizado">
            El descuento de este pedido ya fue resuelto.
          </lm-vacio>
        } @else {
          <section class="lm-card juego">
            <span class="flor">🌸</span>
            @if (resultado() === null) {
              <h2>Encontrá el premio</h2>
              <p>Podés ganar 10%, 15% o 20% de descuento. También puede no tocar premio.</p>
              <div class="premios"><b>10%</b><b>15%</b><b>20%</b></div>
              <lm-boton icono="casino" (presionar)="jugar()">Probar suerte</lm-boton>
            } @else if (resultado()! > 0) {
              <h2>¡Ganaste {{ resultado() }}%!</h2>
              <p>El descuento ya quedó aplicado a este pedido.</p>
              <lm-boton icono="receipt_long" (presionar)="ir(['/cliente/estado-pedido'])">Ver mi pedido</lm-boton>
            } @else {
              <h2>Esta vez no hubo premio</h2>
              <p>Tu único intento quedó registrado. Gracias por participar.</p>
              <lm-boton icono="receipt_long" (presionar)="ir(['/cliente/estado-pedido'])">Ver mi pedido</lm-boton>
            }
          </section>
        }
      </div>
      <lm-barra-inferior [items]="secciones()" activo="juegos" />
    </div>
  `,
  styles: [`
    :host{display:flex;flex:1;min-height:0}.juego{flex:1 1 auto;padding:var(--space-6);display:grid;gap:var(--space-4);text-align:center;justify-items:center;align-content:space-evenly}
    .flor{font-size:clamp(64px,24vw,110px);line-height:1}.juego h2{margin:0;font:var(--type-title-xl);color:var(--text-title)}.juego lm-boton{width:100%}
    /* El ancho de lectura va en caracteres y no en pixeles: así no queda un
       maximo que en un celular angosto no significa nada. */
    .juego p{margin:0;max-width:38ch;color:var(--text-muted)}
    .premios{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--space-3)}
    .premios{width:100%;flex-wrap:nowrap}.premios b{flex:1 1 0;padding:var(--space-4) var(--space-3);border-radius:var(--radius-field);background:var(--surface-sunken);color:var(--action-primary);font:var(--type-numeral)}
  `],
})
export class JuegosPage extends PaginaConSesion implements OnInit {
  protected readonly pedidos = inject(PedidosService);
  protected readonly pedido = computed(() => {
    const actual = this.pedidos.activoDe(this.usuario());
    return this.pedidos.juegosHabilitados(actual) ? actual : undefined;
  });
  protected readonly resultado = signal<number | null>(null);

  ngOnInit(): void {
    this.pedidos.iniciar();
  }

  protected async jugar(): Promise<void> {
    const pedido = this.pedido();
    const usuario = this.usuario();
    if (!pedido || !usuario) return;
    try {
      const descuento = await this.cargando.conEsperaMinima(
        'Buscando tu premio…',
        () => this.pedidos.jugar(pedido, usuario),
        650,
      );
      this.resultado.set(descuento);
      if (descuento > 0) this.avisos.exito('¡Premio Sakura!', `Ganaste un ${descuento}% de descuento.`);
      else this.avisos.info('Intento completado', 'Esta vez no hubo descuento.');
    } catch (error) {
      this.avisos.error('No pudimos registrar el intento', error instanceof Error ? error.message : undefined);
    }
  }
}
