import { describe, expect, it } from 'vitest';
import { navegacionDe } from './navegacion';

/** Las rutas que dibuja la barra inferior, para poder afirmar sobre ellas. */
function rutas(...args: Parameters<typeof navegacionDe>): string[] {
  return navegacionDe(...args).map((item) => item.ruta);
}

describe('navegacionDe · secciones por perfil', () => {
  it('el mozo llega a la carta desde su barra', () => {
    expect(rutas('MOZO')).toEqual(['/mozo/pedidos', '/mesas', '/carta']);
  });

  it('el cocinero y el cantinero trabajan sobre una sola pantalla, sin barra', () => {
    expect(rutas('COCINERO')).toEqual([]);
    expect(rutas('CANTINERO')).toEqual([]);
  });

  it('sin pedido, el comensal sólo tiene su lugar en la fila y las encuestas', () => {
    expect(rutas('CLIENTE_REGISTRADO')).toEqual(['/cliente/espera', '/cliente/encuestas']);
  });

  it('con el pedido confirmado se le habilitan el pedido y los juegos', () => {
    expect(rutas('CLIENTE_REGISTRADO', true)).toEqual([
      '/cliente/espera',
      '/cliente/estado-pedido',
      '/juegos',
      '/cliente/encuestas',
    ]);
  });

  it('el cliente anónimo no juega: los descuentos son del registrado', () => {
    const anonimo = rutas('CLIENTE_ANONIMO', true);
    expect(anonimo).toContain('/cliente/estado-pedido');
    expect(anonimo).not.toContain('/juegos');
  });

  it('US-7.2 · con el pedido devuelto queda "Mi pedido" a mano, pero no los juegos', () => {
    const devuelto = rutas('CLIENTE_REGISTRADO', false, true);
    expect(devuelto).toContain('/cliente/estado-pedido');
    expect(devuelto).not.toContain('/juegos');
  });

  it('sólo se dibujan secciones cuya pantalla existe', () => {
    // El metre tiene tres secciones declaradas, pero registrar cliente todavía
    // no está hecho: la barra no ofrece un botón que no lleva a ningún lado.
    expect(rutas('METRE')).toEqual(['/metre/espera', '/mesas']);
  });
});
