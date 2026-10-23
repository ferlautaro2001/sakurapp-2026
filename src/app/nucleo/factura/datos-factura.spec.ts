import { describe, it, expect } from 'vitest';
import { Pedido, PedidoItem, Usuario } from '../modelos/modelos';
import { correoFactura } from '../servicios/plantillas-correo';
import { datosDeFactura, rotuloPropina, satisfaccionDe } from './datos-factura';
import { armarFactura, numeroDeFactura, numeroDePedido } from './factura-pdf';

const item = (id: string, productoId: string, nombre: string, cantidad: number, precio: number): PedidoItem => ({
  id,
  productoId,
  productoNombre: nombre,
  tipo: 'COMIDA',
  sector: 'COCINA',
  cantidad,
  precioUnitario: precio,
  subtotal: cantidad * precio,
});

const registrado: Usuario = {
  id: 'cli-1',
  uid: 'uid-cli-1',
  nombre: 'Lucía',
  apellido: 'Fernández',
  dni: '38456123',
  cuil: '27-38456123-4',
  email: 'lucia@example.com',
  perfil: 'CLIENTE_REGISTRADO',
  fotoUrl: '',
  estado: 'APROBADO',
  activo: true,
  clave: null,
  createdAt: '2026-10-01T12:00:00.000Z',
};

/** Mesa 5: $ 68.100 de consumo, 15 % de descuento del juego y 10 % de propina. */
function pedido(cambios: Partial<Pedido> = {}): Pedido {
  return {
    id: 'k3Jx9Qp2-LmZ7',
    mesaId: 'mesa-5',
    mesaNumero: 5,
    clienteId: 'cli-1',
    clienteUid: 'uid-cli-1',
    clienteNombre: 'Lucía Fernández',
    estadoGlobal: 'PAGO_PENDIENTE',
    estadoCocina: 'LISTO',
    estadoBar: 'LISTO',
    motivoRechazo: null,
    rechazadoPorNombre: null,
    alcanceRechazo: null,
    observaciones: [],
    tiempoEstimado: 30,
    totalBruto: 68100,
    descuentoJuego: 15,
    montoDescuentoJuego: 10215,
    totalFinal: 57885,
    confirmadoPorId: 'mozo-1',
    juegoIntentado: true,
    timestampCreacion: '2026-10-21T20:30:00.000Z',
    items: [
      item('i1', 'p-combinado', 'Combinado Sakura', 2, 18500),
      item('i2', 'p-limonada', 'Limonada de jengibre', 1, 4200),
      item('i3', 'p-ramen', 'Ramen tonkotsu', 1, 12900),
      // El comensal reeditó la comanda y sumó dos limonadas más.
      item('i4', 'p-limonada', 'Limonada de jengibre', 2, 4200),
      item('i5', 'p-mochi', 'Mochi de té verde', 1, 5600),
    ],
    cuentaHabilitada: true,
    porcentajePropina: 10,
    montoPropina: 5789,
    pago: { medio: 'DINERO_EN_CUENTA', operacion: '8123456789', total: 63674, pagadoEn: '2026-10-21T21:30:00.000Z' },
    ...cambios,
  };
}

describe('Factura del punto 22', () => {
  it('lleva el detalle de la cuenta: lo pedido, el descuento del juego, la propina y el total', () => {
    const datos = datosDeFactura(pedido(), registrado, 42, '2026-10-21T21:34:00.000Z');

    expect(datos.subtotal).toBe(68100);
    expect(datos.descuento).toEqual({ porcentaje: 15, monto: 10215 });
    expect(datos.propina).toEqual({ porcentaje: 10, monto: 5789, satisfaccion: 'Bueno' });
    expect(datos.total).toBe(63674);
    expect(datos.pedido).toEqual({ id: 'k3Jx9Qp2-LmZ7', mesa: 5 });
    expect(datos.pago).toEqual({ medio: 'Dinero en cuenta', operacion: '8123456789' });
  });

  it('junta en un renglón el mismo producto que vino en dos tandas', () => {
    const { renglones } = datosDeFactura(pedido(), registrado, 42, '2026-10-21T21:34:00.000Z');

    expect(renglones).toHaveLength(4);
    expect(renglones.find((r) => r.descripcion === 'Limonada de jengibre')).toEqual({
      cantidad: 3,
      descripcion: 'Limonada de jengibre',
      precioUnitario: 4200,
      importe: 12600,
    });
    expect(renglones.reduce((suma, r) => suma + r.importe, 0)).toBe(68100);
  });

  it('el registrado figura con su documento y su correo', () => {
    const { cliente } = datosDeFactura(pedido(), registrado, 42, '2026-10-21T21:34:00.000Z');
    expect(cliente).toEqual({
      nombre: 'Lucía Fernández',
      documento: '38.456.123',
      correo: 'lucia@example.com',
      anonimo: false,
    });
  });

  it('el anónimo figura sólo con su nombre, como consumidor final', () => {
    const anonimo: Usuario = { ...registrado, apellido: null, nombre: 'Martín', perfil: 'CLIENTE_ANONIMO', dni: null, email: null };
    const { cliente } = datosDeFactura(pedido(), anonimo, 43, '2026-10-21T21:34:00.000Z');
    expect(cliente).toEqual({ nombre: 'Martín', anonimo: true });
  });

  it('sin descuento del juego no hay renglón de descuento', () => {
    const datos = datosDeFactura(
      pedido({ descuentoJuego: 0, montoDescuentoJuego: 0, totalFinal: 68100, montoPropina: 6810, pago: null }),
      registrado,
      44,
      '2026-10-21T21:34:00.000Z',
    );
    expect(datos.descuento).toBeNull();
    expect(datos.total).toBe(74910);
    expect(datos.pago).toBeNull();
  });

  it('la propina dice el grado de satisfacción que eligió el comensal con el QR', () => {
    expect([20, 15, 10, 5, 0].map(satisfaccionDe)).toEqual(['Excelente', 'Muy bueno', 'Bueno', 'Regular', 'Malo']);
    expect(rotuloPropina({ porcentaje: 15, monto: 1, satisfaccion: 'Muy bueno' })).toBe('Propina · Muy bueno (15 %)');
    expect(rotuloPropina({ porcentaje: 12, monto: 1, satisfaccion: '' })).toBe('Propina (12 %)');
  });

  it('numera la factura y el pedido como se imprimen', () => {
    expect(numeroDeFactura(1, 42)).toBe('0001-00000042');
    expect(numeroDePedido('k3Jx9Qp2-LmZ7')).toBe('K3JX9QP2');
  });

  it('dibuja un PDF de una hoja con los datos', () => {
    // Un PNG de un píxel alcanza para el logo: lo que se prueba es el armado.
    const logo =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const doc = armarFactura(datosDeFactura(pedido(), registrado, 42, '2026-10-21T21:34:00.000Z'), { logo });
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.output('datauristring')).toMatch(/^data:application\/pdf/);
  });

  describe('el correo con la factura', () => {
    const html = () =>
      correoFactura({
        factura: datosDeFactura(pedido(), registrado, 42, '2026-10-21T21:34:00'),
        urlDescarga: 'https://firebasestorage.googleapis.com/factura.pdf',
        logoUrl: 'data:image/png;base64,AAAA',
      });

    it('lleva el nombre del restaurante, el logo y la dirección', () => {
      expect(html()).toContain('<img src="data:image/png;base64,AAAA"');
      expect(html()).toContain('Restaurante Sakura');
      expect(html()).toContain('Arribeños 2288, Belgrano');
    });

    it('lleva la fecha y el número de factura', () => {
      expect(html()).toContain('FACTURA C');
      expect(html()).toContain('N° 0001-00000042');
      expect(html()).toContain('21/10/2026 21:34');
    });

    it('lleva los datos del cliente y el número de pedido', () => {
      expect(html()).toContain('Lucía Fernández');
      expect(html()).toContain('Documento: 38.456.123');
      expect(html()).toContain('Correo: lucia@example.com');
      expect(html()).toContain('N° K3JX9QP2 · Mesa 5');
    });

    it('lleva el detalle del punto 21: precio unitario, importe, descuento, satisfacción y total', () => {
      const cuerpo = html();
      expect(cuerpo).toContain('P. unitario');
      expect(cuerpo).toMatch(/Combinado Sakura<\/td>\s*<td class="unit">\$ 18\.500<\/td>\s*<td class="imp">\$ 37\.000/);
      expect(cuerpo).toContain('Descuento (15 %)');
      expect(cuerpo).toContain('- $ 10.215');
      expect(cuerpo).toContain('Propina · Bueno (10 %)');
      expect(cuerpo).toContain('+ $ 5.789');
      expect(cuerpo).toMatch(/TOTAL<\/td><td class="monto">\$ 63\.674/);
      expect(cuerpo).toContain('Pagado con Dinero en cuenta');
    });

    it('lo que escribió una persona no se interpreta como HTML', () => {
      const conEtiqueta = { ...registrado, nombre: '<b>Lu</b>' };
      const cuerpo = correoFactura({
        factura: datosDeFactura(pedido(), conEtiqueta, 42, '2026-10-21T21:34:00'),
        urlDescarga: 'https://x',
        logoUrl: 'x',
      });
      expect(cuerpo).not.toContain('<b>Lu</b>');
      expect(cuerpo).toContain('&lt;b&gt;Lu&lt;/b&gt;');
    });
  });
});
