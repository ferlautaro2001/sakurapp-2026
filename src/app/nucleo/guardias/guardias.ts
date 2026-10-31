import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../servicios/sesion.service';
import { PedidosService } from '../servicios/pedidos.service';
import { EsperaService } from '../servicios/espera.service';
import { Perfil } from '../modelos/enums';

/** Exige sesión abierta para acceder a la pantalla principal. Sin sesión, al login. */
export const guardiaSesion: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (sesion.autenticado()) return true;
  return router.createUrlTree(['/login']);
};

/**
 * Exige uno de los perfiles indicados.
 *
 * Cierra por defecto: quien no está en la lista vuelve a su pantalla de
 * inicio, nunca ve la pantalla protegida ni un mensaje de error que revele
 * que existe.
 */
export function guardiaPerfil(...perfiles: Perfil[]): CanActivateFn {
  return () => {
    const sesion = inject(SesionService);
    const router = inject(Router);
    const usuario = sesion.usuario();
    if (!usuario) return router.createUrlTree(['/login']);
    if (perfiles.includes(usuario.perfil)) return true;
    return router.createUrlTree([sesion.rutaInicio()]);
  };
}

/**
 * El cliente ve la carta sólo después de vincularse con la mesa escaneando su QR.
 * Mientras espera o tiene una mesa asignada, permanece en la pantalla de espera.
 */
export const guardiaCartaCliente: CanActivateFn = async () => {
  const sesion = inject(SesionService);
  const espera = inject(EsperaService);
  const router = inject(Router);
  const usuario = sesion.usuario();

  if (!usuario) return router.createUrlTree(['/login']);
  if (usuario.perfil !== 'CLIENTE_REGISTRADO' && usuario.perfil !== 'CLIENTE_ANONIMO') return true;

  await espera.iniciar();
  const estado = espera.activaDe(usuario.id)?.estado;
  if (estado === 'ESPERANDO' || estado === 'ASIGNADO') {
    return router.createUrlTree(['/cliente/espera']);
  }
  if (estado === 'FINALIZADO' || sesion.mesaActivaId()) return true;
  return router.createUrlTree(['/cliente/ingreso']);
};

/**
 * Los juegos se abren recién cuando el mozo confirmó el pedido (punto 14 de la
 * consigna). Antes de eso no existen para el cliente: ni en la barra, ni por
 * un enlace o una dirección escrita a mano. Sin pedido habilitado vuelve a
 * "Mi pedido", que le muestra en qué estado está.
 */
export const guardiaJuegos: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const pedidos = inject(PedidosService);
  const router = inject(Router);
  pedidos.iniciar();
  const pedido = pedidos.activoDe(sesion.usuario());
  if (pedidos.juegosHabilitados(pedido)) return true;
  return router.createUrlTree(['/cliente/pedido']);
};
