import { describe, expect, it } from 'vitest';
import { navegacionDe } from './navegacion';

function rutas(...args: Parameters<typeof navegacionDe>): string[] {
  return navegacionDe(...args).map((item) => item.ruta);
}

describe('navegacionDe · secciones por perfil', () => {
  it('el mozo tiene mesas, pedidos, consultas y carta', () => {
    expect(rutas('MOZO')).toEqual(['/mesas', '/mozo/pedidos', '/mozo/consultas', '/carta']);
  });

  it('el cocinero y el cantinero tienen pedidos y carta', () => {
    expect(rutas('COCINERO')).toEqual(['/sector/pedidos', '/carta']);
    expect(rutas('CANTINERO')).toEqual(['/sector/pedidos', '/carta']);
  });

  it('supervisor y dueño tienen registros, mesas, códigos y correos', () => {
    expect(rutas('SUPERVISOR')).toEqual(['/dueno/registros', '/mesas', '/dueno/codigos', '/dueno/correos']);
    expect(rutas('DUENO')).toEqual(['/dueno/registros', '/mesas', '/dueno/codigos', '/dueno/correos']);
  });

  it('metre tiene espera, mesas y registrar cliente', () => {
    expect(rutas('METRE')).toEqual(['/metre/espera', '/mesas', '/metre/registrar']);
  });

  it('sin mesa (en fila), el comensal ve su lugar, juegos y encuestas', () => {
    expect(rutas('CLIENTE_REGISTRADO', { enMesa: false })).toEqual([
      '/cliente/espera',
      '/cliente/juegos',
      '/cliente/encuestas',
    ]);
    expect(rutas('CLIENTE_ANONIMO', { enMesa: false })).toEqual([
      '/cliente/espera',
      '/cliente/juegos',
      '/cliente/encuestas',
    ]);
  });

  it('en la mesa sin pedido o seleccionando ve mesa, carta y pedido', () => {
    expect(rutas('CLIENTE_REGISTRADO', { enMesa: true, estadoPedido: 'SELECCIONANDO' })).toEqual([
      '/cliente/espera',
      '/carta',
      '/cliente/pedido',
    ]);
    expect(rutas('CLIENTE_REGISTRADO', { enMesa: true, estadoPedido: null })).toEqual([
      '/cliente/espera',
      '/carta',
      '/cliente/pedido',
    ]);
  });

  it('con el pedido pendiente de confirmación sólo ve el pedido para esperar al mozo', () => {
    expect(rutas('CLIENTE_REGISTRADO', { enMesa: true, estadoPedido: 'PENDIENTE_CONFIRMACION' })).toEqual([
      '/cliente/pedido',
    ]);
  });

  it('con el pedido confirmado o posterior ve el pedido y los juegos', () => {
    expect(rutas('CLIENTE_REGISTRADO', { enMesa: true, estadoPedido: 'CONFIRMADO' })).toEqual([
      '/cliente/pedido',
      '/cliente/juegos',
    ]);
    expect(rutas('CLIENTE_REGISTRADO', { enMesa: true, estadoPedido: 'EN_PREPARACION' })).toEqual([
      '/cliente/pedido',
      '/cliente/juegos',
    ]);
    expect(rutas('CLIENTE_REGISTRADO', { enMesa: true, estadoPedido: 'LISTO' })).toEqual([
      '/cliente/pedido',
      '/cliente/juegos',
    ]);
  });

  it('con el pedido devuelto/rechazado vuelve a tener mesa, carta y pedido a mano', () => {
    expect(rutas('CLIENTE_REGISTRADO', { enMesa: true, estadoPedido: 'RECHAZADO' })).toEqual([
      '/cliente/espera',
      '/carta',
      '/cliente/pedido',
    ]);
  });

  it('soporta la sobrecarga booleana histórica para retrocompatibilidad', () => {
    expect(rutas('CLIENTE_REGISTRADO', true)).toEqual(['/cliente/pedido', '/cliente/juegos']);
    expect(rutas('CLIENTE_REGISTRADO', false, true)).toEqual([
      '/cliente/espera',
      '/carta',
      '/cliente/pedido',
    ]);
  });
});
