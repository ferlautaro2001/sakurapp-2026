import { beforeEach, describe, expect, it } from 'vitest';
import { Producto } from '../modelos/modelos';
import { CarritoService } from './carrito.service';

describe('CarritoService', () => {
  let servicio: CarritoService;

  const roll: Producto = {
    id: 'producto-roll',
    nombre: 'Roll SakuraApp Especial',
    descripcion: 'Roll de prueba',
    tiempoElaboracion: 20,
    precio: 14500,
    tipo: 'COMIDA',
    sector: 'COCINA',
    fotos: [],
    activo: true,
    disponible: true,
  };

  const ramen: Producto = {
    id: 'producto-ramen',
    nombre: 'Ramen Tonkotsu',
    descripcion: 'Ramen de prueba',
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
    descripcion: 'Bebida de prueba',
    tiempoElaboracion: 3,
    precio: 7200,
    tipo: 'BEBIDA',
    sector: 'BAR',
    fotos: [],
    activo: true,
    disponible: true,
  };

  beforeEach(() => {
    servicio = new CarritoService();
    servicio.iniciarMesa('mesa-1');
  });

  it('comienza vacío', () => {
    expect(servicio.items()).toEqual([]);
    expect(servicio.cantidadTotal()).toBe(0);
    expect(servicio.importeTotal()).toBe(0);
    expect(servicio.tiempoEstimado()).toBe(0);
  });

  it('calcula el precio por cantidad y la demora del sector más cargado', () => {
    servicio.agregar(roll);
    servicio.agregar(roll);
    servicio.agregar(ramen);

    expect(servicio.cantidadTotal()).toBe(3);
    expect(servicio.importeTotal()).toBe(44800);
    // Los dos son de cocina, que los hace uno después del otro: 20 + 25. Las
    // dos unidades del roll no multiplican, salen juntas de la misma olla.
    expect(servicio.tiempoEstimado()).toBe(45);
  });

  it('la cocina y la barra trabajan a la vez: manda el sector más cargado', () => {
    servicio.agregar(roll); // cocina, 20 minutos
    servicio.agregar(ramen); // cocina, 25 minutos
    servicio.agregar(sake); // barra, 3 minutos

    expect(servicio.tiempoEstimado()).toBe(45);
  });

  it('actualiza los totales al modificar cantidades', () => {
    servicio.agregar(roll);
    servicio.sumar(roll.id);

    expect(servicio.cantidadTotal()).toBe(2);
    expect(servicio.importeTotal()).toBe(29000);

    servicio.restar(roll.id);

    expect(servicio.cantidadTotal()).toBe(1);
    expect(servicio.importeTotal()).toBe(14500);
  });

  it('elimina el producto cuando su cantidad llega a cero', () => {
    servicio.agregar(roll);
    servicio.restar(roll.id);

    expect(servicio.items()).toEqual([]);
    expect(servicio.importeTotal()).toBe(0);
    expect(servicio.tiempoEstimado()).toBe(0);
  });

  it('vacía el carrito cuando cambia la mesa', () => {
    servicio.agregar(roll);
    servicio.iniciarMesa('mesa-2');

    expect(servicio.mesaId()).toBe('mesa-2');
    expect(servicio.items()).toEqual([]);
  });
});