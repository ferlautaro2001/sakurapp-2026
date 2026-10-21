import { describe, expect, it } from 'vitest';
import { Pedido } from './modelos';
import { visitaCobrada } from './visita';

/**
 * US-10.3 · el mozo confirma el pago y la visita del comensal termina.
 *
 * El caso que se escapaba: Facundo vuelve a la mesa 9, donde ya había comido
 * el 19/10. Ese pedido está cerrado y, sin mirar la hora, la aplicación lo
 * tomaba como el cobro de la visita nueva y lo sacaba de la mesa apenas se
 * sentaba.
 */

const MESA_9 = '548920e39c014878947a83ef04518674';
const MESA_1 = '5789beaababa4871915f0a6daaab091f';

function pedido(cambios: Partial<Pedido>): Pedido {
  return {
    id: 'ped-1',
    mesaId: MESA_9,
    mesaNumero: 9,
    clienteId: 'cli-facundo',
    clienteUid: 'uid-facundo',
    clienteNombre: 'Facundo Arana',
    estadoGlobal: 'CERRADO',
    estadoCocina: 'LISTO',
    estadoBar: 'LISTO',
    motivoRechazo: null,
    rechazadoPorNombre: null,
    alcanceRechazo: null,
    observaciones: [],
    tiempoEstimado: 20,
    totalBruto: 30000,
    descuentoJuego: 0,
    montoDescuentoJuego: 0,
    totalFinal: 30000,
    confirmadoPorId: 'mozo-1',
    juegoIntentado: false,
    timestampCreacion: '2026-10-21T21:10:00.000Z',
    items: [],
    ...cambios,
  };
}

const SE_SENTO = '2026-10-21T21:00:00.000Z';

describe('visitaCobrada · cuándo termina la visita del comensal', () => {
  it('el pedido cerrado de una visita anterior en la misma mesa no lo saca de la mesa', () => {
    const delDiecinueve = pedido({ timestampCreacion: '2026-10-19T23:05:33.740Z' });
    expect(visitaCobrada(delDiecinueve, MESA_9, SE_SENTO)).toBe(false);
  });

  it('cuando el mozo cobra el pedido de esta visita, la visita termina', () => {
    expect(visitaCobrada(pedido({}), MESA_9, SE_SENTO)).toBe(true);
  });

  it('mientras el pedido de esta visita sigue abierto, no termina', () => {
    expect(visitaCobrada(pedido({ estadoGlobal: 'PAGO_PENDIENTE' }), MESA_9, SE_SENTO)).toBe(false);
  });

  it('un pedido cerrado de otra mesa no cuenta', () => {
    expect(visitaCobrada(pedido({ mesaId: MESA_1 }), MESA_9, SE_SENTO)).toBe(false);
  });

  it('sin mesa activa no hay visita que terminar', () => {
    expect(visitaCobrada(pedido({}), null, SE_SENTO)).toBe(false);
    expect(visitaCobrada(undefined, MESA_9, SE_SENTO)).toBe(false);
  });

  it('una sesión guardada antes de tener la hora sigue como antes: vale el pedido cerrado de la mesa', () => {
    expect(visitaCobrada(pedido({}), MESA_9, '')).toBe(true);
  });
});
