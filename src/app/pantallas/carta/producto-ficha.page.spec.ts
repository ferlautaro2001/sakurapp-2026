import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../app.routes';
import { Perfil, TipoProducto } from '../../nucleo/modelos/enums';
import { SesionService } from '../../nucleo/servicios/sesion.service';
import { ProductosService } from '../../nucleo/servicios/productos.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { MesasService } from '../../nucleo/servicios/mesas.service';
import { CarritoService } from '../../nucleo/servicios/carrito.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { AltaBebidaPage } from '../cantinero/alta-bebida.page';
import { AltaPlatoPage } from '../cocinero/alta-plato.page';
import { ProductoFichaPage } from './producto-ficha.page';

class FichaPrueba extends ProductoFichaPage {
  get gestionable() { return this.puedeGestionar(); }
  editarProducto() { this.editar(); }
  quitarProducto() { return this.quitar(); }
}

describe('Gestión de productos por sector', () => {
  const perfil = signal<Perfil>('CANTINERO');
  const tipo = signal<TipoProducto>('BEBIDA');
  const pedir = vi.fn();
  const quitarDeLaCarta = vi.fn();
  beforeEach(() => {
    vi.resetAllMocks();
    perfil.set('CANTINERO');
    tipo.set('BEBIDA');
    pedir.mockResolvedValue(true);
    TestBed.configureTestingModule({ providers: [
      provideRouter(routes),
      { provide: SesionService, useValue: {
        usuario: () => ({ id: 'personal', perfil: perfil() }),
        tienePerfil: (...roles: Perfil[]) => roles.includes(perfil()), rutaInicio: () => '/sector/pedidos',
      } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'producto' }, queryParamMap: { get: () => null } } } },
      { provide: ProductosService, useValue: { porId: () => ({
        id: 'producto', nombre: 'Producto de prueba', descripcion: 'Descripción de prueba',
        precio: 13200, tiempoElaboracion: 5, tipo: tipo(), fotos: ['foto1', 'foto2', 'foto3'], disponible: true,
      }), quitarDeLaCarta } },
      { provide: PedidosService, useValue: { iniciar: vi.fn() } },
      { provide: EsperaService, useValue: { iniciar: vi.fn() } },
      { provide: MesasService, useValue: {} },
      { provide: CarritoService, useValue: {} },
      { provide: AvisosService, useValue: { exito: vi.fn(), error: vi.fn() } },
      { provide: CargandoService, useValue: { conEsperaMinima: (_: string, accion: () => unknown) => accion() } },
      { provide: ConfirmacionService, useValue: { pedir } },
      { provide: CamaraService, useValue: {} },
    ] });
  });

  it.each<[Perfil, TipoProducto, boolean]>([
    ['CANTINERO', 'BEBIDA', true], ['CANTINERO', 'COMIDA', false], ['CANTINERO', 'POSTRE', false],
    ['COCINERO', 'BEBIDA', false], ['COCINERO', 'COMIDA', true], ['COCINERO', 'POSTRE', true],
    ['MOZO', 'BEBIDA', false], ['CLIENTE_REGISTRADO', 'BEBIDA', false], ['CLIENTE_ANONIMO', 'BEBIDA', false],
  ])('%s puede gestionar %s: %s', (rol, categoria, permitido) => {
    perfil.set(rol);
    tipo.set(categoria);
    const pagina = TestBed.runInInjectionContext(() => new FichaPrueba());
    expect(pagina.gestionable).toBe(permitido);
  });

  it('abre la edición y permite quitar una bebida con confirmación', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const pagina = TestBed.runInInjectionContext(() => new FichaPrueba());
    pagina.editarProducto();
    expect(navegar).toHaveBeenCalledWith(['/carta', 'producto', 'editar']);
    await pagina.quitarProducto();
    expect(pedir).toHaveBeenCalledOnce();
    expect(quitarDeLaCarta).toHaveBeenCalledWith('producto');
  });

  it('bloquea las acciones del cantinero sobre comidas', async () => {
    tipo.set('COMIDA');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate');
    const pagina = TestBed.runInInjectionContext(() => new FichaPrueba());
    pagina.editarProducto();
    await pagina.quitarProducto();
    expect(navegar).not.toHaveBeenCalled();
    expect(pedir).not.toHaveBeenCalled();
    expect(quitarDeLaCarta).not.toHaveBeenCalled();
  });

  it('la misma ruta carga el editor correspondiente incluso al cambiar de rol', async () => {
    TestBed.overrideComponent(AltaBebidaPage, { set: { template: '', imports: [] } });
    TestBed.overrideComponent(AltaPlatoPage, { set: { template: '', imports: [] } });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/carta/producto/editar', AltaBebidaPage);
    perfil.set('COCINERO');
    tipo.set('COMIDA');
    await harness.navigateByUrl('/carta/plato/editar', AltaPlatoPage);
    perfil.set('CANTINERO');
    tipo.set('BEBIDA');
    await harness.navigateByUrl('/carta/otra-bebida/editar', AltaBebidaPage);
  });
});
