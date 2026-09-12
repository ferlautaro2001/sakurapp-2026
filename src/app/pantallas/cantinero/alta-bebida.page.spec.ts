import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AltaBebidaPage } from './alta-bebida.page';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';

class BebidaPrueba extends AltaBebidaPage {
  preparar() {
    this.formulario.setValue({ nombre: 'Limonada', descripcion: 'Limón con agua y hielo', precio: '2500', minutos: '5' });
    this.fotos.set(['foto1', 'foto2', 'foto3']);
  }
  guardarBebida() { return this.guardar(); }
  get datos() { return this.formulario.getRawValue(); }
  get error() { return this.resumenError(); }
}

describe('Alta de bebida', () => {
  const crear = vi.fn();
  const navegar = vi.fn();
  const error = vi.fn();
  let pagina: BebidaPrueba;
  beforeEach(() => {
    vi.resetAllMocks();
    crear.mockResolvedValue({ id: 'bebida' });
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: { navigate: navegar } },
      { provide: ProductosService, useValue: { crear, existeNombre: () => false } },
      { provide: CamaraService, useValue: {} },
      { provide: AvisosService, useValue: { exito: vi.fn(), error } },
      { provide: CargandoService, useValue: { conEsperaMinima: (_: string, accion: () => unknown) => accion() } },
      { provide: ConfirmacionService, useValue: { pedir: () => Promise.resolve(true) } },
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
});
