import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistroClientePage } from './registro-cliente.page';
import { routes } from '../../app.routes';
import { Perfil } from '../../nucleo/modelos/enums';
import { SesionService } from '../../nucleo/servicios/sesion.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { CamaraService } from '../../nucleo/servicios/camara.service';
import { EscanerService } from '../../nucleo/servicios/escaner.service';
import { QrService } from '../../nucleo/servicios/qr.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';
import { CorreoService } from '../../nucleo/servicios/correo.service';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';

class RegistroPrueba extends RegistroClientePage {
  preparar() {
    this.formulario.setValue({ nombre: 'Ana', apellido: 'Perez', dni: '12345678', cuil: '20-12345678-6', email: 'ana@example.com', clave: 'Prueba123', repeticion: 'Prueba123' });
    this.foto.set('foto');
  }
  registrarCliente() { return this.registrar(); }
  regresar() { this.volver(); }
}

describe('Registro de clientes desde el salón', () => {
  const perfil = signal<Perfil | null>('METRE');
  const crear = vi.fn();
  const inicio = '/metre/espera';
  beforeEach(() => {
    vi.resetAllMocks();
    perfil.set('METRE');
    crear.mockResolvedValue({ nombre: 'Ana', apellido: 'Perez' });
    TestBed.configureTestingModule({ providers: [
      provideRouter(routes),
      { provide: SesionService, useValue: {
        usuario: () => perfil() ? { id: 'personal', perfil: perfil() } : null,
        tienePerfil: (...permitidos: Perfil[]) => permitidos.includes(perfil()!), rutaInicio: () => inicio,
      } },
      { provide: UsuariosService, useValue: { crearClienteRegistrado: crear, existeCorreo: () => false, existeDocumento: () => false, existeCuil: () => false, administradores: () => [], nombreCompleto: () => 'Ana Perez' } },
      { provide: CamaraService, useValue: {} }, { provide: EscanerService, useValue: {} }, { provide: QrService, useValue: {} },
      { provide: AvisosService, useValue: { exito: vi.fn(), error: vi.fn() } },
      { provide: CargandoService, useValue: { conEsperaMinima: (_: string, accion: () => unknown) => accion() } },
      { provide: ConfirmacionService, useValue: { pedir: () => Promise.resolve(true) } },
      { provide: CorreoService, useValue: { enviarConfirmacionRegistro: () => Promise.resolve() } },
      { provide: NotificacionesService, useValue: { notificarNuevoRegistro: () => Promise.resolve() } },
    ] });
    TestBed.overrideComponent(RegistroClientePage, { set: { template: '', imports: [] } });
  });
  it('el enlace del maître abre el registro con la sesión existente', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/metre/registrar', RegistroClientePage);
    expect(TestBed.inject(Router).url).toBe('/metre/registrar');
    expect(perfil()).toBe('METRE');
  });
  it.each<Perfil>(['METRE', 'DUENO', 'SUPERVISOR', 'MOZO', 'COCINERO', 'CANTINERO'])('conserva la sesión de %s y vuelve a su inicio', async (rol) => {
    perfil.set(rol);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const pagina = TestBed.runInInjectionContext(() => new RegistroPrueba());
    pagina.preparar();
    await pagina.registrarCliente();
    expect(crear).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Ana' }), true);
    expect(navegar).toHaveBeenCalledWith([inicio], { replaceUrl: true });
    expect(perfil()).toBe(rol);
    pagina.regresar();
    expect(navegar).toHaveBeenLastCalledWith([inicio]);
  });
  it('mantiene el registro público y su pantalla de confirmación', async () => {
    perfil.set(null);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const pagina = TestBed.runInInjectionContext(() => new RegistroPrueba());
    pagina.preparar();
    await pagina.registrarCliente();
    expect(crear).toHaveBeenCalledWith(expect.anything(), false);
    expect(navegar).toHaveBeenCalledWith(['/registro-enviado'], { replaceUrl: true });
  });
});
