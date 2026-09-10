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

  it('calcula precio por cantidad y tiempo máximo', () => {
    servicio.agregar(roll);
    servicio.agregar(roll);
    servicio.agregar(ramen);

    expect(servicio.cantidadTotal()).toBe(3);
    expect(servicio.importeTotal()).toBe(44800);
    expect(servicio.tiempoEstimado()).toBe(25);
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