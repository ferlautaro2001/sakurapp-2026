import { Injectable } from '@angular/core';
import { DatosDni } from '../modelos/modelos';
import { restoCuil, verificadorCuil } from '../validacion/validadores';

@Injectable({ providedIn: 'root' })
export class QrService {
  /**
   * Lee el código de barras del documento nacional de identidad argentino.
   */
  interpretarDni(texto: string): DatosDni | null {
    if (!texto.includes('@')) return null;

    const campos = texto.split('@').map((c) => c.trim());
    if (campos.length < 6) return null;

    const indiceDocumento = campos.findIndex((c, i) => i > 0 && /^\d{7,8}$/.test(c));
    if (indiceDocumento < 3) return null;

    const apellidos = campos[indiceDocumento - 3];
    const nombres = campos[indiceDocumento - 2];
    const sexo = (campos[indiceDocumento - 1] || '').toUpperCase();
    const documento = campos[indiceDocumento];
    const fechaNacimiento = campos.slice(indiceDocumento).find((c) => /^\d{2}\/\d{2}\/\d{4}$/.test(c)) ?? '';

    if (!apellidos || !nombres) return null;

    return {
      apellidos: this.capitalizar(apellidos),
      nombres: this.capitalizar(nombres),
      dni: documento,
      cuil: this.calcularCuil(documento, sexo),
      sexo,
      fechaNacimiento,
    };
  }

  calcularCuil(documento: string, sexo: string): string {
    if (!/^\d{7,8}$/.test(documento)) return '';
    const dni = documento.padStart(8, '0');
    const prefijo = sexo === 'F' ? '27' : '20';

    const resto = restoCuil(`${prefijo}${dni}`);
    if (resto === 11) return `${prefijo}-${dni}-0`;
    // Cuando el resto da 10, el CUIL se arma con el prefijo alternativo 23.
    if (resto === 10) return `23-${dni}-${verificadorCuil(`23${dni}`)}`;
    return `${prefijo}-${dni}-${resto}`;
  }

  private capitalizar(texto: string): string {
    return texto
      .toLocaleLowerCase('es-AR')
      .split(/\s+/)
      .filter(Boolean)
      .map((palabra) => palabra.charAt(0).toLocaleUpperCase('es-AR') + palabra.slice(1))
      .join(' ');
  }
}

