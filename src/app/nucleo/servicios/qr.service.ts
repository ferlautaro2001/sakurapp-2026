import { Injectable } from '@angular/core';
import QRCode from 'qrcode';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ContenidoQr, DatosDni } from '../modelos/modelos';
import { restoCuil, verificadorCuil } from '../validacion/validadores';

/** Prefijo con el que se firman todos los códigos propios de la aplicación. */
const MARCA = 'SAKURAPP';

export const PROPINAS: { porcentaje: number; rotulo: string }[] = [
  { porcentaje: 20, rotulo: 'Excelente' },
  { porcentaje: 15, rotulo: 'Muy bueno' },
  { porcentaje: 10, rotulo: 'Bueno' },
  { porcentaje: 5, rotulo: 'Regular' },
  { porcentaje: 0, rotulo: 'Malo' },
];

/**
 * Generación y lectura de códigos QR vectoriales y códigos de documento para SakurApp.
 * Estilizado institucional Sakura: ciruela sobre fondo nieve rosada (#6E1234 sobre #FDECEF).
 */
@Injectable({ providedIn: 'root' })
export class QrService {
  private readonly opciones = {
    errorCorrectionLevel: 'M' as const,
    margin: 2,
    width: 512,
    color: { dark: '#6E1234FF', light: '#FDECEFFF' },
  };

  /** Devuelve el PNG del código como Data URL nítido de alto contraste. */
  async generar(texto: string): Promise<string> {
    return QRCode.toDataURL(texto, this.opciones);
  }

  textoDeMesa(mesaId: string, numero?: number): string {
    return `${MARCA}:MESA:${numero ?? ''}:${mesaId}`;
  }

  textoDeIngreso(): string {
    return `${MARCA}:INGRESO`;
  }

  textoDePropina(porcentaje: number): string {
    return `${MARCA}:PROPINA:${porcentaje}`;
  }

  generarDeMesa(mesaId: string, numero?: number): Promise<string> {
    return this.generar(this.textoDeMesa(mesaId, numero));
  }

  generarDeIngreso(): Promise<string> {
    return this.generar(this.textoDeIngreso());
  }

  generarDePropina(porcentaje: number): Promise<string> {
    return this.generar(this.textoDePropina(porcentaje));
  }

  /**
   * Guarda el código generado en archivo y abre el diálogo nativo de compartir/imprimir.
   */
  async compartir(imagen: string, nombreArchivo: string, titulo: string): Promise<boolean> {
    const base64 = imagen.split(',')[1] ?? '';
    if (!base64) return false;

    if (!Capacitor.isNativePlatform()) {
      const ventana = window.open();
      if (!ventana) return false;
      ventana.document.write(
        `<title>${titulo}</title><body style="margin:0;display:grid;place-items:center;height:100vh;background:linear-gradient(180deg,#FF7665,#FD527C)">
         <img src="${imagen}" alt="${titulo}" style="width:min(80vw,420px);box-shadow:0 8px 30px rgba(0,0,0,0.3);border-radius:16px"></body>`,
      );
      return true;
    }

    try {
      const archivo = await Filesystem.writeFile({
        path: `${nombreArchivo}.png`,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({ title: titulo, text: titulo, files: [archivo.uri], dialogTitle: 'Compartir o imprimir código QR' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Interpreta lo devuelto por el escáner de la aplicación.
   */
  interpretar(texto: string): ContenidoQr {
    const limpio = (texto ?? '').trim();

    if (limpio.startsWith(`${MARCA}:`)) {
      const partes = limpio.split(':');
      if (partes[1] === 'MESA') {
        const id = partes[3] || partes[2] || '';
        return { tipo: 'MESA', mesaId: id };
      }
      if (partes[1] === 'INGRESO') return { tipo: 'INGRESO' };
      if (partes[1] === 'PROPINA') {
        const porcentaje = Number(partes[2]);
        const propina = PROPINAS.find((p) => p.porcentaje === porcentaje);
        if (propina) return { tipo: 'PROPINA', porcentaje, rotulo: propina.rotulo };
      }
      return { tipo: 'DESCONOCIDO', texto: limpio };
    }

    const dni = this.interpretarDni(limpio);
    if (dni) return { tipo: 'DNI', datos: dni };

    return { tipo: 'DESCONOCIDO', texto: limpio };
  }

  /**
   * Lee el código de barras del documento nacional de identidad argentino (PDF417).
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
