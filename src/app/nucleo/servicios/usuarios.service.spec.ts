import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsuariosService } from './usuarios.service';
import { AlmacenService } from '../datos/almacen.service';
import { AlmacenamientoService } from './almacenamiento.service';
import { FirestoreService } from './firestore.service';
import { initializeAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteApp } from 'firebase/app';

const auth = vi.hoisted(() => ({ principal: { currentUser: { uid: 'metre' } }, auxiliar: { currentUser: null } }));
vi.mock('firebase/app', () => ({ getApps: () => [{ name: '[DEFAULT]' }], getApp: () => ({ name: '[DEFAULT]' }), initializeApp: (_: unknown, name: string) => ({ name }), deleteApp: vi.fn().mockResolvedValue(undefined) }));
vi.mock('firebase/auth', () => ({ getAuth: () => auth.principal, initializeAuth: vi.fn(() => auth.auxiliar), inMemoryPersistence: 'memory', createUserWithEmailAndPassword: vi.fn(), signInAnonymously: vi.fn(), signOut: vi.fn().mockResolvedValue(undefined) }));
vi.mock('firebase/data-connect', () => ({
  getDataConnect: () => ({ _useGeneratedSdk: vi.fn() }),
  validateArgs: (_: unknown, dc: unknown, vars: unknown) => ({ dc, vars }),
  mutationRef: vi.fn(), queryRef: vi.fn(), executeQuery: vi.fn(), validateArgsWithOptions: vi.fn(),
  executeMutation: vi.fn().mockResolvedValue({ data: { user_insert: { id: 'nuevo' } } }),
}));

describe('Alta de clientes sin reemplazar la sesión de Firebase', () => {
  const guardar = vi.fn();
  const datos = { nombre: 'Ana', apellido: 'Perez', dni: '12345678', cuil: '20123456786', email: 'ana@example.com', clave: 'Prueba123', fotoUrl: 'foto' };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user: { uid: 'cliente' } } as never);
    TestBed.configureTestingModule({ providers: [
      { provide: AlmacenService, useValue: { usuarios: signal([]), guardarUsuarios: guardar } },
      { provide: AlmacenamientoService, useValue: {} },
      { provide: FirestoreService, useValue: { guardarUsuario: vi.fn(), encolarNotificacion: vi.fn() } },
    ] });
  });
  it('usa una cuenta auxiliar temporal y mantiene autenticado al maître', async () => {
    const cliente = await TestBed.inject(UsuariosService).crearClienteRegistrado(datos, true);
    expect(cliente.uid).toBe('cliente');
    expect(initializeAuth).toHaveBeenCalledWith(expect.anything(), { persistence: 'memory' });
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth.auxiliar, datos.email, datos.clave);
    expect(auth.principal.currentUser.uid).toBe('metre');
    expect(signOut).toHaveBeenCalledWith(auth.auxiliar);
    expect(deleteApp).toHaveBeenCalledOnce();
  });
  it('limpia la cuenta auxiliar ante un error y no guarda un cliente ficticio', async () => {
    vi.mocked(createUserWithEmailAndPassword).mockRejectedValueOnce(new Error('auth/email-already-in-use'));
    await expect(TestBed.inject(UsuariosService).crearClienteRegistrado(datos, true)).rejects.toThrow('No pudimos crear la cuenta');
    expect(guardar).not.toHaveBeenCalled();
    expect(deleteApp).toHaveBeenCalledOnce();
    expect(auth.principal.currentUser.uid).toBe('metre');
  });
});
