import { EstadoUsuario, Perfil } from './enums';

/**
 * Entidad Usuario para el MVP (v0).
 * Maneja los datos de los perfiles para la autenticación y la página principal.
 */
export interface Usuario {
  id: string;
  uid: string;
  nombre: string;
  apellido: string | null;
  dni: string | null;
  cuil: string | null;
  email: string | null;
  perfil: Perfil;
  fotoUrl: string;
  estado: EstadoUsuario;
  activo: boolean;
  clave: string | null;
  createdAt: string;
}

export interface AltaCliente {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  email: string;
  clave: string;
  fotoUrl: string;
}

export interface DatosDni {
  apellidos: string;
  nombres: string;
  dni: string;
  cuil: string;
  sexo: string;
  fechaNacimiento: string;
}

