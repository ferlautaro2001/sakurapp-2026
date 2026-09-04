/**
 * Enumeraciones del dominio para el MVP (v0).
 * Perfiles y estados requeridos por la cátedra para el ingreso rápido.
 */

export type Perfil =
  | 'DUENO'
  | 'SUPERVISOR'
  | 'METRE'
  | 'MOZO'
  | 'COCINERO'
  | 'CANTINERO'
  | 'CLIENTE_REGISTRADO'
  | 'CLIENTE_ANONIMO';

export type EstadoUsuario = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export type TipoProducto = 'COMIDA' | 'BEBIDA' | 'POSTRE';
export type Sector = 'COCINA' | 'BAR';

/** Una bebida se prepara siempre en la barra; el resto, en cocina. */
export function sectorDe(tipo: TipoProducto): Sector {
  return tipo === 'BEBIDA' ? 'BAR' : 'COCINA';
}

/** Rótulos en español rioplatense, sin abreviaturas. */
export const ROTULO_PERFIL: Record<Perfil, string> = {
  DUENO: 'Dueño',
  SUPERVISOR: 'Supervisor',
  METRE: 'Metre',
  MOZO: 'Mozo',
  COCINERO: 'Cocinero',
  CANTINERO: 'Cantinero',
  CLIENTE_REGISTRADO: 'Cliente registrado',
  CLIENTE_ANONIMO: 'Cliente anónimo',
};

export const ROTULO_ESTADO_USUARIO: Record<EstadoUsuario, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};

/** Perfiles con permisos de administración. */
export const PERFILES_ADMIN: Perfil[] = ['DUENO', 'SUPERVISOR'];

export type TipoMesa = 'ESTANDAR' | 'VIP' | 'MOVILIDAD_REDUCIDA';
export type EstadoMesa = 'VACIA' | 'OCUPADA' | 'INACTIVA';

export const ROTULO_TIPO_MESA: Record<TipoMesa, string> = {
  ESTANDAR: 'Estándar',
  VIP: 'VIP',
  MOVILIDAD_REDUCIDA: 'Movilidad reducida',
};

export const ICONO_TIPO_MESA: Record<TipoMesa, string> = {
  ESTANDAR: 'table_restaurant',
  VIP: 'workspace_premium',
  MOVILIDAD_REDUCIDA: 'accessible',
};

export const ROTULO_ESTADO_MESA: Record<EstadoMesa, string> = {
  VACIA: 'Vacía',
  OCUPADA: 'Ocupada',
  INACTIVA: 'Inactiva',
};

