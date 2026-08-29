import { Injectable } from '@angular/core';
import { DatosDni } from '../modelos/modelos';

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
    const prefijo = sexo === 'F' ? '27' : '20';
    const base = `${prefijo}${documento.padStart(8, '0')}`;
    const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const suma = base.split('').reduce((acc, digito, i) => acc + Number(digito) * pesos[i], 0);
    const resto = 11 - (suma % 11);
    let verificador = resto;
    if (resto === 11) verificador = 0;
    else if (resto === 10) {
      const alterno = `23${documento.padStart(8, '0')}`;
      const sumaAlterna = alterno.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
      const restoAlterno = 11 - (sumaAlterna % 11);
      const digito = restoAlterno === 11 ? 0 : restoAlterno === 10 ? 9 : restoAlterno;
      return `23-${documento.padStart(8, '0')}-${digito}`;
    }
    return `${prefijo}-${documento.padStart(8, '0')}-${verificador}`;
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

