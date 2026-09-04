import { Component } from '@angular/core';
import { UI } from '../../ui';
import { PaginaConSesion } from '../pagina-base';
import { ROTULO_PERFIL } from '../../nucleo/modelos/enums';

/**
 * Destino provisorio de los perfiles cuya pantalla todavía no subió el resto
 * del grupo (metre, mozo, cocinero, cantinero y comensales).
 *
 * No es una pantalla del trabajo: existe para que el ingreso rápido de los
 * ocho perfiles siga funcionando mientras se integran las demás historias.
 * Cuando cada pantalla esté, se apunta `rutaInicio()` a la suya y este archivo
 * se borra.
 */
@Component({
  selector: 'lm-en-preparacion',
  imports: [...UI],
  template: `
    <div class="lm-screen">
      <lm-encabezado (cerrarSesion)="cerrarSesion()" />

      <div class="lm-body">
        <lm-vacio icono="construction" titulo="Pantalla en preparación">
          La sección de {{ rotuloPerfil() }} está en desarrollo por el equipo. Mientras tanto podés cerrar la
          sesión y entrar con otro perfil.
        </lm-vacio>
      </div>

      <div class="lm-actionbar">
        <lm-boton variante="danger" icono="logout" (presionar)="cerrarSesion()">Cerrar sesión</lm-boton>
      </div>
    </div>
  `,
  styles: [':host{display:flex;flex:1;min-height:0}'],
})
export class EnPreparacionPage extends PaginaConSesion {
  protected rotuloPerfil(): string {
    const perfil = this.usuario()?.perfil;
    return perfil ? ROTULO_PERFIL[perfil].toLocaleLowerCase('es-AR') : 'este perfil';
  }
}
