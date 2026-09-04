import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SonidoService } from './nucleo/servicios/sonido.service';
import { AvisosService } from './nucleo/servicios/avisos.service';
import { CargandoService } from './nucleo/servicios/cargando.service';
import { BannerComponent, IconoComponent, ModalComponent, SpinnerComponent, TextoBotonComponent } from './ui/basicos';
import { ConfirmacionService } from './nucleo/servicios/confirmacion.service';
import { EscanerService } from './nucleo/servicios/escaner.service';

/**
 * Cáscara de la aplicación para v0 (MVP).
 * Contiene el enrutador, el indicador de espera con el logo,
 * los avisos tipo toast y el modal de confirmación.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BannerComponent, SpinnerComponent, ModalComponent, IconoComponent, TextoBotonComponent],
  template: `
    <div class="sk-app">
      <router-outlet />

      @if (escaner.visor(); as visor) {
        <div class="visor">
          <span class="lm-viewfinder__rotulo">{{ visor.rotulo }}</span>
          <div class="lm-viewfinder__marco">
            <span class="lm-viewfinder__esquina si"></span>
            <span class="lm-viewfinder__esquina sd"></span>
            <span class="lm-viewfinder__esquina ii"></span>
            <span class="lm-viewfinder__esquina id"></span>
            <span class="lm-viewfinder__linea"></span>
          </div>
          <span class="lm-viewfinder__ayuda">
            <lm-icono nombre="qr_code_scanner" [tamano]="18" color="var(--action-accent)" />
            {{ visor.ayuda }}
          </span>
          <lm-texto-boton enfasis="claro" (presionar)="escaner.cancelarLectura()">Cancelar</lm-texto-boton>
        </div>
      }

      @if (avisos.avisos().length) {
        <div class="lm-toasts">
          @for (aviso of avisos.avisos(); track aviso.id) {
            <lm-banner [tono]="aviso.tono" [titulo]="aviso.titulo" cerrable (cerrar)="avisos.cerrar(aviso.id)">
              {{ aviso.cuerpo }}
            </lm-banner>
          }
        </div>
      }

      @if (cargando.visible()) {
        <div class="lm-overlay">
          <lm-spinner [rotulo]="cargando.rotulo()" />
        </div>
      }

      @if (confirmacion.abierta(); as pedido) {
        <lm-modal
          [titulo]="pedido.titulo"
          [mensaje]="pedido.mensaje"
          [rotuloConfirmar]="pedido.confirmar"
          [rotuloCancelar]="pedido.cancelar ?? 'Cancelar'"
          [tono]="pedido.tono ?? 'primario'"
          [icono]="pedido.icono ?? 'help'"
          [detalle]="pedido.detalle ?? []"
          [foto]="pedido.foto ?? null"
          [conCancelar]="!pedido.soloCerrar"
          (confirmar)="confirmacion.responder(true)"
          (cancelar)="confirmacion.responder(false)"
        />
      }
    </div>
  `,
  styles: [
    `
      .sk-app {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--bg-app);
      }
      /*
       * El visor va sobre la cámara, que la dibuja la capa nativa por detrás
       * de la vista web. Por eso es transparente: acá sólo viven el marco, el
       * rótulo y el botón de cancelar.
       */
      .visor {
        position: fixed;
        inset: 0;
        z-index: 940;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        padding: 0 var(--gutter-screen) calc(24px + env(safe-area-inset-bottom));
        background: transparent;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  protected readonly avisos = inject(AvisosService);
  protected readonly cargando = inject(CargandoService);
  protected readonly confirmacion = inject(ConfirmacionService);
  protected readonly escaner = inject(EscanerService);
  private readonly sonido = inject(SonidoService);

  async ngOnInit(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
      await StatusBar.setBackgroundColor({ color: '#B92E58' }).catch(() => undefined);
      await SplashScreen.hide().catch(() => undefined);

      // Sonidos de inicio y cierre al pasar a segundo plano y primer plano
      await App.addListener('pause', () => this.sonido.reproducir('cierre'));
      await App.addListener('resume', () => this.sonido.reproducir('inicio'));
    }
  }
}

