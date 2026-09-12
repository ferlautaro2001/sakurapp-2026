import { beforeEach, describe, expect, it } from 'vitest';
import { CarritoService } from '../servicios/carrito.service';
import { Pedido, Producto } from './modelos';
import { alcanceDe, itemsACambiar, itemsSinBajar, marcaDe, trabaParaReenviar } from './rechazo';

/**
 * US-7.2 · TC-029 y TC-030 · devolución de la comanda y re-edición del comensal.
 *
 * Lo que se verifica acá es la lógica que decide si la comanda corregida se
 * puede volver a mandar: vive en `modelos/rechazo`, que no depende de nada,
 * así que se prueba junto al carrito sin levantar Firestore ni Data Connect.
 */

const gyoza: Producto = {
  id: 'producto-gyoza',
  nombre: 'Gyozas de cerdo',
  descripcion: 'Seis unidades',
  tiempoElaboracion: 12,
  precio: 9800,
  tipo: 'COMIDA',
  sector: 'COCINA',
  fotos: [],
  activo: true,
  disponible: true,
};

const ramen: Producto = {
  id: 'producto-ramen',
  nombre: 'Ramen Tonkotsu',
  descripcion: 'Con panceta',
  tiempoElaboracion: 25,
  precio: 15800,
  tipo: 'COMIDA',
  sector: 'COCINA',
  fotos: [],
  activo: true,
  disponible: true,
};

const sake: Producto = {
  id: 'producto-sake',
  nombre: 'Sake caliente',
  descripcion: 'Ciento ochenta mililitros',
  tiempoElaboracion: 3,
  precio: 7200,
  tipo: 'BEBIDA',
  sector: 'BAR',
  fotos: [],
  activo: true,
  disponible: true,
};

const CARTA = [gyoza, ramen, sake];

/** Una comanda devuelta por el mozo, con las marcas que él puso. */
function devuelta(observaciones: Pedido['observaciones']): Pedido {
  return {
    id: 'pedido-1',
    mesaId: 'mesa-1',
    mesaNumero: 4,
    clienteId: 'cliente-1',
    clienteUid: 'cliente-1',
    clienteNombre: 'Sofía Gómez',
    estadoGlobal: 'RECHAZADO',
    estadoCocina: 'NO_APLICA',
    estadoBar: 'NO_APLICA',
    motivoRechazo: 'Sólo me quedan tres gyozas.',
    rechazadoPorNombre: 'Marcos Ledesma',
    alcanceRechazo: alcanceDe(observaciones, 2),
    observaciones,
    tiempoEstimado: 25,
    totalBruto: 63_000,
    descuentoJuego: 0,
    montoDescuentoJuego: 0,
    totalFinal: 63_000,
    confirmadoPorId: null,
    juegoIntentado: false,
    timestampCreacion: new Date().toISOString(),
    items: [
      {
        id: 'item-gyoza',
        productoId: gyoza.id,
        productoNombre: gyoza.nombre,
        tipo: 'COMIDA',
        sector: 'COCINA',
        cantidad: 6,
        precioUnitario: gyoza.precio,
        subtotal: gyoza.precio * 6,
      },
      {
        id: 'item-ramen',
        productoId: ramen.id,
        productoNombre: ramen.nombre,
        tipo: 'COMIDA',
        sector: 'COCINA',
        cantidad: 1,
        precioUnitario: ramen.precio,
        subtotal: ramen.precio,
      },
    ],
  };
}

describe('US-7.2 · TC-029 · devolución del mozo con motivo y marcas', () => {
  it('el alcance sale de lo marcado: total si marcó todos los renglones', () => {
    expect(alcanceDe([], 2)).toBeNull();
    expect(
      alcanceDe([{ productoId: gyoza.id, marca: 'CANTIDAD', cantidadAlMarcar: 6 }], 2),
    ).toBe('PARCIAL');
    expect(
      alcanceDe(
        [
          { productoId: gyoza.id, marca: 'CANTIDAD', cantidadAlMarcar: 6 },
          { productoId: ramen.id, marca: 'CAMBIAR', cantidadAlMarcar: 1 },
        ],
        2,
      ),
    ).toBe('TOTAL');
  });

  it('deja la marca de cada producto donde el comensal la pueda leer', () => {
    const pedido = devuelta([
      { productoId: gyoza.id, marca: 'CANTIDAD', cantidadAlMarcar: 6 },
      { productoId: ramen.id, marca: 'CAMBIAR', cantidadAlMarcar: 1 },
    ]);

    expect(marcaDe(pedido, gyoza.id)).toBe('CANTIDAD');
    expect(marcaDe(pedido, ramen.id)).toBe('CAMBIAR');
    expect(marcaDe(pedido, sake.id)).toBeNull();
  });

  it('sin marcas, el comensal corrige libremente y puede reenviar', () => {
    const pedido = devuelta([]);
    const carrito = new CarritoService();
    carrito.editarPedido(pedido, buscar);

    expect(trabaParaReenviar(pedido, carrito.items())).toBeNull();
  });
});

describe('US-7.2 · TC-030 · re-edición libre y re-envío de la comanda devuelta', () => {
  let carrito: CarritoService;
  let pedido: Pedido;

  beforeEach(() => {
    carrito = new CarritoService();
    pedido = devuelta([
      { productoId: gyoza.id, marca: 'CANTIDAD', cantidadAlMarcar: 6 },
      { productoId: ramen.id, marca: 'CAMBIAR', cantidadAlMarcar: 1 },
    ]);
    carrito.editarPedido(pedido, buscar);
  });

  it('precarga los productos y las cantidades que el comensal ya había pedido', () => {
    expect(carrito.pedidoEnEdicion()).toBe(pedido.id);
    expect(carrito.mesaId()).toBe(pedido.mesaId);
    expect(carrito.items().map((item) => [item.producto.id, item.cantidad])).toEqual([
      [gyoza.id, 6],
      [ramen.id, 1],
    ]);
  });

  it('no deja reenviar mientras siga en la comanda un producto marcado en rojo', () => {
    const traba = trabaParaReenviar(pedido, carrito.items());
    expect(traba).toContain(ramen.nombre);
  });

  it('pide bajar la cantidad de los amarillos aunque ya no queden rojos', () => {
    carrito.quitar(ramen.id);

    const traba = trabaParaReenviar(pedido, carrito.items());
    expect(traba).toContain(gyoza.nombre);
    expect(itemsSinBajar(pedido, carrito.items())).toHaveLength(1);
  });

  it('habilita el reenvío cuando se sacó el rojo y se bajó el amarillo', () => {
    carrito.quitar(ramen.id);
    carrito.restar(gyoza.id);

    expect(carrito.items()[0].cantidad).toBe(5);
    expect(itemsACambiar(pedido, carrito.items())).toHaveLength(0);
    expect(trabaParaReenviar(pedido, carrito.items())).toBeNull();
  });

  it('el comensal puede cambiar el rojo por otra cosa y reenviar', () => {
    carrito.quitar(ramen.id);
    carrito.restar(gyoza.id);
    carrito.agregar(sake);

    expect(carrito.items().map((item) => item.producto.id)).toEqual([gyoza.id, sake.id]);
    expect(trabaParaReenviar(pedido, carrito.items())).toBeNull();
  });

  it('avisa cuando la comanda corregida quedó vacía', () => {
    carrito.quitar(gyoza.id);
    carrito.quitar(ramen.id);

    expect(trabaParaReenviar(pedido, carrito.items())).toContain('vacío');
  });

  it('reenviar deja de corregir: lo próximo que arme es un pedido nuevo', () => {
    carrito.vaciar();
    expect(carrito.pedidoEnEdicion()).toBeNull();
  });
});

function buscar(id: string): Producto | undefined {
  return CARTA.find((producto) => producto.id === id);
}

describe('US-7.2 · casos límite de la corrección', () => {
  let carrito: CarritoService;
  let pedido: Pedido;

  beforeEach(() => {
    carrito = new CarritoService();
    pedido = devuelta([
      { productoId: gyoza.id, marca: 'CANTIDAD', cantidadAlMarcar: 6 },
      { productoId: ramen.id, marca: 'CAMBIAR', cantidadAlMarcar: 1 },
    ]);
    carrito.editarPedido(pedido, buscar);
  });

  it('sacar el amarillo entero también corrige: sacar es más que bajar', () => {
    carrito.quitar(ramen.id);
    carrito.quitar(gyoza.id);
    carrito.agregar(sake);

    expect(trabaParaReenviar(pedido, carrito.items())).toBeNull();
  });

  it('bajar una sola unidad alcanza; dejarla igual no', () => {
    carrito.quitar(ramen.id);
    expect(trabaParaReenviar(pedido, carrito.items())).not.toBeNull();

    carrito.restar(gyoza.id);
    expect(carrito.items()[0].cantidad).toBe(5);
    expect(trabaParaReenviar(pedido, carrito.items())).toBeNull();
  });

  it('volver a subir el amarillo hasta la cantidad marcada vuelve a trabar', () => {
    carrito.quitar(ramen.id);
    carrito.restar(gyoza.id);
    expect(trabaParaReenviar(pedido, carrito.items())).toBeNull();

    carrito.sumar(gyoza.id);
    expect(carrito.items()[0].cantidad).toBe(6);
    expect(trabaParaReenviar(pedido, carrito.items())).toContain(gyoza.nombre);
  });

  it('volver a agregar el rojo desde la carta vuelve a trabar el reenvío', () => {
    carrito.quitar(ramen.id);
    carrito.restar(gyoza.id);
    expect(trabaParaReenviar(pedido, carrito.items())).toBeNull();

    carrito.agregar(ramen);
    expect(trabaParaReenviar(pedido, carrito.items())).toContain(ramen.nombre);
  });

  it('un producto que salió de la carta no vuelve al carrito', () => {
    const sinRamen = new CarritoService();
    sinRamen.editarPedido(pedido, (id) => (id === ramen.id ? undefined : buscar(id)));

    expect(sinRamen.items().map((item) => item.producto.id)).toEqual([gyoza.id]);
    // Y sin el rojo en la comanda, lo único que falta es bajar el amarillo.
    expect(trabaParaReenviar(pedido, sinRamen.items())).toContain(gyoza.nombre);
  });

  it('una segunda devolución reemplaza el carrito y las marcas anteriores', () => {
    carrito.quitar(ramen.id);
    carrito.restar(gyoza.id);

    const segunda = devuelta([{ productoId: sake.id, marca: 'CAMBIAR', cantidadAlMarcar: 2 }]);
    segunda.items = [
      {
        id: 'item-sake',
        productoId: sake.id,
        productoNombre: sake.nombre,
        tipo: 'BEBIDA',
        sector: 'BAR',
        cantidad: 2,
        precioUnitario: sake.precio,
        subtotal: sake.precio * 2,
      },
    ];
    carrito.editarPedido(segunda, buscar);

    expect(carrito.items().map((item) => item.producto.id)).toEqual([sake.id]);
    expect(marcaDe(segunda, gyoza.id)).toBeNull();
    expect(trabaParaReenviar(segunda, carrito.items())).toContain(sake.nombre);
  });

  it('el pedido que no fue devuelto no traba nada', () => {
    expect(trabaParaReenviar(undefined, carrito.items())).toBeNull();
    expect(itemsACambiar(undefined, carrito.items())).toEqual([]);
    expect(itemsSinBajar(undefined, carrito.items())).toEqual([]);
  });
});
