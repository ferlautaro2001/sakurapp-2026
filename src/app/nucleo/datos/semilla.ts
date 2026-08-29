import { Usuario } from '../modelos/modelos';
import { Perfil } from '../modelos/enums';

/** Identificador único. */
export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface FilaUsuario {
  nombre: string;
  apellido: string | null;
  dni: string | null;
  cuil: string | null;
  email: string | null;
  clave: string | null;
  perfil: Perfil;
  estado: 'PENDIENTE' | 'APROBADO';
}

/**
 * Registros mínimos exigidos por la cátedra para el ingreso rápido:
 * un dueño, un supervisor, un metre, un mozo, un cocinero, un cantinero,
 * un cliente registrado y un cliente anónimo.
 */
const USUARIOS: FilaUsuario[] = [
  { nombre: 'Carlos', apellido: 'Ferreyra', dni: '28114905', cuil: '20-28114905-4', email: 'carlos@sakurapp.com.ar', clave: 'Duenio.2026', perfil: 'DUENO', estado: 'APROBADO' },
  { nombre: 'Laura', apellido: 'Sosa', dni: '30442118', cuil: '27-30442118-9', email: 'laura@sakurapp.com.ar', clave: 'Supervisor.2026', perfil: 'SUPERVISOR', estado: 'APROBADO' },
  { nombre: 'Roberto', apellido: 'Aguirre', dni: '33907442', cuil: '20-33907442-1', email: 'roberto@sakurapp.com.ar', clave: 'Metre.2026', perfil: 'METRE', estado: 'APROBADO' },
  { nombre: 'Marcos', apellido: 'Ledesma', dni: '38220167', cuil: '20-38220167-6', email: 'marcos@sakurapp.com.ar', clave: 'Mozo.2026', perfil: 'MOZO', estado: 'APROBADO' },
  { nombre: 'Ana', apellido: 'Beltrán', dni: '35771208', cuil: '27-35771208-3', email: 'ana@sakurapp.com.ar', clave: 'Cocina.2026', perfil: 'COCINERO', estado: 'APROBADO' },
  { nombre: 'Juan', apellido: 'Duarte', dni: '31554890', cuil: '20-31554890-7', email: 'juan@sakurapp.com.ar', clave: 'Barra.2026', perfil: 'CANTINERO', estado: 'APROBADO' },
  { nombre: 'Sofía', apellido: 'Gómez', dni: '44225858', cuil: '27-44225858-4', email: 'sofia@correo.com.ar', clave: 'Cliente.2026', perfil: 'CLIENTE_REGISTRADO', estado: 'APROBADO' },
  { nombre: 'Nicolás', apellido: null, dni: null, cuil: null, email: null, clave: null, perfil: 'CLIENTE_ANONIMO', estado: 'APROBADO' },
  { nombre: 'Martín', apellido: 'Quiroga', dni: '43118204', cuil: '20-43118204-8', email: 'martin@correo.com.ar', clave: 'Cliente.2026', perfil: 'CLIENTE_REGISTRADO', estado: 'PENDIENTE' },
  { nombre: 'Valentina', apellido: 'Ríos', dni: '45302771', cuil: '27-45302771-5', email: 'valentina@correo.com.ar', clave: 'Cliente.2026', perfil: 'CLIENTE_REGISTRADO', estado: 'PENDIENTE' },
];

export interface Semilla {
  usuarios: Usuario[];
}

export function construirSemilla(): Semilla {
  const ahora = new Date().toISOString();
  const usuarios: Usuario[] = USUARIOS.map((fila, indice) => ({
    id: `usr-${indice + 1}`,
    uid: `uid-${indice + 1}`,
    nombre: fila.nombre,
    apellido: fila.apellido,
    dni: fila.dni,
    cuil: fila.cuil,
    email: fila.email,
    perfil: fila.perfil,
    fotoUrl: `assets/icon/sushis/sushi-${(indice % 12) + 1}.png`,
    estado: fila.estado,
    activo: true,
    clave: fila.clave,
    createdAt: ahora,
  }));

  return { usuarios };
}

