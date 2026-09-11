import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SesionService } from '../nucleo/servicios/sesion.service';
import { AvisosService } from '../nucleo/servicios/avisos.service';
import { CargandoService } from '../nucleo/servicios/cargando.service';
import { ConfirmacionService, PedidoConfirmacion } from '../nucleo/servicios/confirmacion.service';
import { PedidosService } from '../nucleo/servicios/pedidos.service';
import { EsperaService } from '../nucleo/servicios/espera.service';
import { navegacionDe } from './navegacion';

/**
 * Base de las pantallas con sesión abierta.
 *
 * Resuelve la barra inferior del rol y el cierre de sesión, que es el mismo en
 * todas las pantallas y siempre vive en el encabezado.
 */
export abstract class PaginaConSesion {
  protected readonly sesion = inject(SesionService);
  protected readonly router = inject(Router);
  protected readonly avisos = inject(AvisosService);
  protected readonly cargando = inject(CargandoService);
  protected readonly confirmacion = inject(ConfirmacionService);
  protected readonly pedidosNavegacion = inject(PedidosService);
  protected readonly esperaNavegacion = inject(EsperaService);

  protected readonly usuario = this.sesion.usuario;
  protected readonly secciones = computed(() => {
    const usuario = this.sesion.usuario();
    const pedido = this.pedidosNavegacion.activoDe(usuario);
    const mesa = this.sesion.mesaActivaId();
    const esperaActiva = usuario ? this.esperaNavegacion.activaDe(usuario.id) : undefined;
    const enMesa = Boolean(mesa || esperaActiva?.estado === 'FINALIZADO' || pedido);
    return navegacionDe(usuario?.perfil, {
      enMesa,
      estadoPedido: pedido?.estadoGlobal,
      juegosHabilitados: this.pedidosNavegacion.juegosHabilitados(pedido),
    });
  });

  constructor() {
    this.pedidosNavegacion.iniciar();
    this.esperaNavegacion.iniciar();
  }

  /** Pregunta antes de hacer algo que acepta, rechaza, modifica o da de baja. */
  protected preguntar(pedido: PedidoConfirmacion): Promise<boolean> {
    return this.confirmacion.pedir(pedido);
  }

  /** Cierra la sesión y borra la credencial guardada en el dispositivo. */
  protected async cerrarSesion(): Promise<void> {
    const seguro = await this.preguntar({
      titulo: '¿Cerrás la sesión?',
      mensaje: 'Se borran las credenciales guardadas en este dispositivo y volvés a la pantalla de ingreso.',
      confirmar: 'Cerrar sesión',
      tono: 'peligro',
      icono: 'logout',
    });
    if (!seguro) return;

    await this.cargando.conEsperaMinima('Cerrando la sesión…', () => this.sesion.cerrar(), 400);
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  protected ir(ruta: unknown[]): void {
    void this.router.navigate(ruta);
  }
}
