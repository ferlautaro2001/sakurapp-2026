import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
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
import { SesionService } from './nucleo/servicios/sesion.service';

/**
 * Cáscara de la aplicación para v0 (MVP).
 * Contiene el enrutador, el indicador de espera con el logo,
 * los avisos tipo toast, el modal de confirmación, el modal de éxito fluido
 * y el manejo del botón físico Atrás (LIFO con protección en formularios).
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

      @if (avisos.avisosToast().length) {
        <div class="lm-toasts">
          @for (aviso of avisos.avisosToast(); track aviso.id) {
            <lm-banner [tono]="aviso.tono" [titulo]="aviso.titulo" cerrable (cerrar)="avisos.cerrar(aviso.id)">
              {{ aviso.cuerpo }}
            </lm-banner>
          }
        </div>
      }

      @if (avisos.modalExito(); as exito) {
        <div class="modal-exito-overlay" (click)="avisos.cerrar(exito.id)">
          <div class="modal-exito" (click)="$event.stopPropagation()">
            <div class="modal-exito__icono">
              <lm-icono nombre="check_circle" [tamano]="44" color="var(--state-success)" />
            </div>
            <h3 class="modal-exito__titulo">{{ exito.titulo }}</h3>
            @if (exito.cuerpo) {
              <p class="modal-exito__cuerpo">{{ exito.cuerpo }}</p>
            }
            <button type="button" class="modal-exito__btn" (click)="avisos.cerrar(exito.id)">
              Aceptar
            </button>
          </div>
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
      /* Modal de éxito fluido */
      .modal-exito-overlay {
        position: fixed;
        inset: 0;
        z-index: 990;
        background: rgba(45, 10, 20, 0.45);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: fadeOverlay 200ms ease-out both;
      }
      .modal-exito {
        width: 100%;
        max-width: 320px;
        background: var(--surface-card);
        border-radius: var(--radius-modal, 24px);
        padding: 24px 20px 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-shadow: 0 16px 36px rgba(110, 18, 52, 0.22);
        border: 1.5px solid rgba(46, 125, 50, 0.2);
        animation: popModal 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      .modal-exito__icono {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(46, 125, 50, 0.12);
        display: grid;
        place-items: center;
        margin-bottom: 12px;
      }
      .modal-exito__titulo {
        margin: 0;
        font: 800 18px/1.2 var(--font-display);
        color: var(--text-title);
      }
      .modal-exito__cuerpo {
        margin: 8px 0 16px;
        font: 500 14px/1.4 var(--font-text);
        color: var(--text-muted);
      }
      .modal-exito__btn {
        width: 100%;
        height: 44px;
        background: var(--state-success, #2E7D32);
        color: #FFFFFF;
        border: none;
        border-radius: var(--radius-pill, 999px);
        font: 700 15px/1 var(--font-text);
        cursor: pointer;
        box-shadow: 0 3px 8px rgba(46, 125, 50, 0.3);
        transition: transform 120ms ease;
      }
      .modal-exito__btn:active {
        transform: scale(0.97);
      }
      @keyframes fadeOverlay {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes popModal {
        from { opacity: 0; transform: scale(0.85) translateY(14px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
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
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly sesion = inject(SesionService);

  async ngOnInit(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
      await StatusBar.setBackgroundColor({ color: '#B92E58' }).catch(() => undefined);
      await SplashScreen.hide().catch(() => undefined);

      await App.addListener('pause', () => this.sonido.porCicloDeVida('cierre'));
      await App.addListener('resume', () => this.sonido.porCicloDeVida('inicio'));

      // Botón físico Atrás: pila LIFO y confirmación de seguridad en formularios
      await App.addListener('backButton', async ({ canGoBack }) => {
        if (this.escaner.visor()) {
          this.escaner.cancelarLectura();
          return;
        }

        if (this.confirmacion.abierta()) {
          this.confirmacion.responder(false);
          return;
        }

        const modalExito = this.avisos.modalExito();
        if (modalExito) {
          this.avisos.cerrar(modalExito.id);
          return;
        }

        const urlActual = this.router.url;
        const rutasFormulario = [
          '/admin/alta-mesa',
          '/admin/alta-empleado',
          '/cocinero/alta-plato',
          '/cantinero/alta-bebida',
          '/registro-cliente',
          '/registro-invitado',
        ];
        const esFormulario = rutasFormulario.some((r) => urlActual.includes(r)) || urlActual.startsWith('/mesas/');

        if (esFormulario) {
          const seguro = await this.confirmacion.pedir({
            titulo: '¿Estás seguro de cancelar?',
            mensaje: 'Si salís ahora se cancelará la acción y los cambios no guardados se perderán.',
            confirmar: 'Salir',
            cancelar: 'Continuar editando',
            tono: 'peligro',
            icono: 'warning',
          });
          if (!seguro) return;
          this.location.back();
          return;
        }

        const rutaInicio = this.sesion.rutaInicio();
        if (urlActual === rutaInicio || urlActual === '/login' || urlActual === '/presentacion') {
          const salir = await this.confirmacion.pedir({
            titulo: '¿Salir de SakurApp?',
            mensaje: '¿Deseás cerrar la aplicación?',
            confirmar: 'Salir',
            cancelar: 'Quedarme',
            tono: 'primario',
            icono: 'logout',
          });
          if (salir) {
            await App.exitApp();
          }
          return;
        }

        if (canGoBack) {
          this.location.back();
        } else {
          void this.router.navigate([rutaInicio]);
        }
      });
    }
  }
}

