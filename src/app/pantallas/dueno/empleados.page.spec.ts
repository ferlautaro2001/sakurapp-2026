import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { DuenoEmpleadosPage } from './empleados.page';
import { Usuario } from '../../nucleo/modelos/modelos';
import { SesionService } from '../../nucleo/servicios/sesion.service';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';
import { FirestoreService } from '../../nucleo/servicios/firestore.service';
import { PedidosService } from '../../nucleo/servicios/pedidos.service';
import { EsperaService } from '../../nucleo/servicios/espera.service';
import { AvisosService } from '../../nucleo/servicios/avisos.service';
import { CargandoService } from '../../nucleo/servicios/cargando.service';
import { ConfirmacionService } from '../../nucleo/servicios/confirmacion.service';

describe('Empleados en tiempo real', () => {
  it('actualiza el total y la búsqueda al recibir altas, cambios y bajas y cancela la escucha al salir', () => {
    let actualizar!: (lista: Usuario[]) => void;
    const cancelar = vi.fn();
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: {} },
      { provide: SesionService, useValue: { usuario: signal({ id: 'dueno', perfil: 'DUENO' }), mesaActivaId: signal(null) } },
      { provide: UsuariosService, useValue: { nombreCompleto: (u: Usuario) => `${u.nombre} ${u.apellido}`, avatarSushi: () => 'foto' } },
      { provide: FirestoreService, useValue: { escucharUsuarios: (fn: typeof actualizar) => { actualizar = fn; return cancelar; } } },
      { provide: PedidosService, useValue: { iniciar: vi.fn(), activoDe: () => null, juegosHabilitados: () => false } },
      { provide: EsperaService, useValue: { iniciar: vi.fn(), activaDe: () => null } },
      { provide: AvisosService, useValue: {} }, { provide: CargandoService, useValue: {} }, { provide: ConfirmacionService, useValue: {} },
    ] });
    const fixture = TestBed.createComponent(DuenoEmpleadosPage);
    const empleado: Usuario = { id: '1', uid: '1', nombre: 'Ana', apellido: 'Perez', dni: null, cuil: null, email: null, clave: null, perfil: 'MOZO', activo: true, estado: 'APROBADO', fotoUrl: '', createdAt: '' };
    actualizar([empleado, { ...empleado, id: '2', uid: '2', perfil: 'CLIENTE_REGISTRADO' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana Perez');
    expect(fixture.nativeElement.querySelector('.lm-title__contador').textContent).toContain('1');
    const buscador = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    buscador.value = 'cocinero';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No encontramos empleados');
    expect(fixture.nativeElement.querySelector('.lm-title__contador').textContent).toContain('1');
    buscador.value = 'mozo';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana Perez');
    buscador.value = '';
    buscador.dispatchEvent(new Event('input'));
    actualizar([{ ...empleado, nombre: 'Carla', activo: false }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Carla Perez');
    expect(fixture.nativeElement.textContent).toContain('Inactivo');
    expect(fixture.nativeElement.textContent).not.toContain('Ana Perez');
    actualizar([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay empleados');
    expect(fixture.nativeElement.querySelector('.lm-title__contador').textContent).toContain('0');
    fixture.destroy();
    expect(cancelar).toHaveBeenCalledOnce();
  });
});
