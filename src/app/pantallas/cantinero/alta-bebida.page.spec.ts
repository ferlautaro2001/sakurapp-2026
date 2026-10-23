import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AltaBebidaPage } from './alta-bebida.page';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { Producto } from '../../nucleo/modelos/modelos';

class BebidaPrueba extends AltaBebidaPage {
  preparar() {
    this.formulario.setValue({ nombre: 'Limonada', descripcion: 'Limón con agua y hielo', precio: '2500', minutos: '5' });
    this.fotos.set(['foto1', 'foto2', 'foto3']);
  }
  guardarBebida() { return this.guardar(); }
  get datos() { return this.formulario.getRawValue(); }
  get error() { return this.resumenError(); }
  get fotosCargadas() { return this.fotos(); }
}

describe('Alta de bebida', () => {
  const crear = vi.fn();
  const editar = vi.fn();
  const existeNombre = vi.fn();
  const pedir = vi.fn();
  const navegar = vi.fn();
  const error = vi.fn();
  let pagina: BebidaPrueba;
  let idProducto: string | null;
  let productoExistente: Producto | undefined;
  beforeEach(() => {
    vi.resetAllMocks();
    idProducto = null;
    productoExistente = undefined;
    crear.mockResolvedValue({ id: 'bebida' });
    editar.mockResolvedValue({ id: 'bebida' });
    existeNombre.mockReturnValue(false);
    pedir.mockResolvedValue(true);
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: { navigate: navegar } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => idProducto } } } },
      { provide: ProductosService, useValue: { crear, editar, existeNombre, porId: () => productoExistente } },
      { provide: CamaraService, useValue: {} },
      { provide: AvisosService, useValue: { exito: vi.fn(), error } },
      { provide: CargandoService, useValue: { conEsperaMinima: (_: string, accion: () => unknown) => accion() } },
      { provide: ConfirmacionService, useValue: { pedir } },
    ] });
    pagina = TestBed.runInInjectionContext(() => new BebidaPrueba());
    pagina.preparar();
  });
  it('vuelve al inicio del cantinero al guardar sin resetear el formulario visible', async () => {
    await pagina.guardarBebida();
    expect(crear).toHaveBeenCalledOnce();
    expect(navegar).toHaveBeenCalledWith(['/sector/pedidos'], { replaceUrl: true });
    expect(pagina.datos.nombre).toBe('Limonada');
    expect(pagina.error).toBeNull();
  });
  it('conserva los datos y permite reintentar si el alta falla', async () => {
    crear.mockRejectedValueOnce(new Error('Sin conexión'));
    await pagina.guardarBebida();
    expect(navegar).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnce();
    expect(pagina.datos.nombre).toBe('Limonada');
    await pagina.guardarBebida();
    expect(navegar).toHaveBeenCalledOnce();
  });

  function abrirEdicion(tipo: Producto['tipo'] = 'BEBIDA') {
    productoExistente = {
      id: 'bebida', nombre: 'Sake Junmai', descripcion: 'Sake servido frío en jarra tradicional',
      precio: 13200, tiempoElaboracion: 5, tipo, sector: tipo === 'BEBIDA' ? 'BAR' : 'COCINA',
      fotos: ['foto1', 'foto2', 'foto3'], activo: true, disponible: true,
    };
    idProducto = 'bebida';
    return TestBed.runInInjectionContext(() => new BebidaPrueba());
  }

  it('carga los datos y las tres fotos de la bebida para editar', () => {
    pagina = abrirEdicion();
    expect(pagina.datos).toEqual({ nombre: 'Sake Junmai', descripcion: 'Sake servido frío en jarra tradicional', precio: '13200', minutos: '5' });
    expect(pagina.fotosCargadas).toEqual(['foto1', 'foto2', 'foto3']);
  });

  it('actualiza la bebida sin crear otra y permite conservar su nombre', async () => {
    pagina = abrirEdicion();
    await pagina.guardarBebida();
    expect(existeNombre).toHaveBeenCalledWith('Sake Junmai', 'bebida');
    expect(pedir).toHaveBeenCalledWith(expect.objectContaining({ confirmar: 'Guardar cambios' }));
    expect(editar).toHaveBeenCalledWith('bebida', expect.objectContaining({ nombre: 'Sake Junmai', precio: 13200, tipo: 'BEBIDA', fotos: ['foto1', 'foto2', 'foto3'] }));
    expect(crear).not.toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/carta', 'bebida'], { replaceUrl: true });
  });

  it('conserva los datos y permite reintentar si la edición falla', async () => {
    pagina = abrirEdicion();
    editar.mockRejectedValueOnce(new Error('Sin conexión'));
    await pagina.guardarBebida();
    expect(navegar).not.toHaveBeenCalled();
    expect(pagina.datos.nombre).toBe('Sake Junmai');
    await pagina.guardarBebida();
    expect(editar).toHaveBeenCalledTimes(2);
    expect(navegar).toHaveBeenCalledOnce();
  });

  it('rechaza la edición de un producto que no sea bebida', async () => {
    pagina = abrirEdicion('COMIDA');
    expect(error).toHaveBeenCalledWith('No se puede editar el producto', expect.any(String));
    expect(navegar).toHaveBeenCalledWith(['/carta']);
    pagina.preparar();
    await pagina.guardarBebida();
    expect(editar).not.toHaveBeenCalled();
    expect(crear).not.toHaveBeenCalled();
  });
});
