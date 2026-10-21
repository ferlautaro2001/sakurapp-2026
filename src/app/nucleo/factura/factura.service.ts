import { Injectable, inject } from '@angular/core';
import { FacturaEmitida, Pedido, Usuario } from '../modelos/modelos';
import { AlmacenamientoService } from '../servicios/almacenamiento.service';
import { CorreoService } from '../servicios/correo.service';
import { FirestoreService } from '../servicios/firestore.service';
import { UsuariosService } from '../servicios/usuarios.service';
import { datosDeFactura } from './datos-factura';
import type { ImagenesFactura } from './factura-pdf';

const LOGO = 'assets/img/logo-badge.png';
const PETALO = 'assets/img/flor-1.png';

let imagenes: ImagenesFactura | null = null;

async function comoDatos(ruta: string): Promise<string> {
  const binario = await (await fetch(ruta)).blob();
  return new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(binario);
  });
}

/** Lo que asoma el pétalo por encima de la banda, como en el PDF. */
const CORTE_PETALO = 0.22;

/**
 * El pétalo del correo, ya sin su parte de arriba: así se ve cortado por el
 * borde de la banda. Se recorta la imagen porque los clientes de correo no
 * respetan los márgenes negativos ni el recorte con overflow.
 */
async function petaloRecortado(petalo: string): Promise<string> {
  const imagen = new Image();
  await new Promise<void>((resolver, rechazar) => {
    imagen.onload = () => resolver();
    imagen.onerror = () => rechazar(new Error('No se pudo leer el pétalo.'));
    imagen.src = petalo;
  });
  const desde = Math.round(imagen.height * CORTE_PETALO);
  const lienzo = document.createElement('canvas');
  lienzo.width = imagen.width;
  lienzo.height = imagen.height - desde;
  lienzo.getContext('2d')!.drawImage(imagen, 0, -desde);
  return lienzo.toDataURL('image/png');
}

async function imagenesDeFactura(): Promise<ImagenesFactura> {
  if (!imagenes) {
    const [logo, petalo] = await Promise.all([comoDatos(LOGO), comoDatos(PETALO).catch(() => undefined)]);
    imagenes = { logo, petalo };
  }
  return imagenes;
}

/**
 * Punto 22 · emite la factura cuando el mozo confirma el pago: la dibuja, la
 * guarda en Storage y, si el comensal es registrado, se la manda por correo
 * con el PDF adjunto. Al anónimo le llega por push con el enlace de descarga
 * (eso lo avisa PedidosService al cerrar el pedido).
 */
@Injectable({ providedIn: 'root' })
export class FacturaService {
  private readonly almacenamiento = inject(AlmacenamientoService);
  private readonly correo = inject(CorreoService);
  private readonly firestore = inject(FirestoreService);
  private readonly usuarios = inject(UsuariosService);

  async emitir(pedido: Pedido): Promise<FacturaEmitida> {
    const cliente = this.clienteDe(pedido);
    const emitidaEn = new Date().toISOString();
    const datos = datosDeFactura(pedido, cliente, await this.firestore.siguienteNumeroFactura(), emitidaEn);
    // jsPDF pesa: se carga recién al emitir, no al abrir la aplicación.
    const pdf = await import('./factura-pdf');
    const numero = pdf.numeroDeFactura(datos.puntoDeVenta, datos.numero);
    const nombreArchivo = `factura-${numero}.pdf`;

    const imagenes = await imagenesDeFactura();
    const base64 = pdf.armarFactura(datos, imagenes).output('datauristring').split(',')[1];
    const url = await this.almacenamiento.subirPdf(`facturas/${pedido.id}.pdf`, base64, nombreArchivo);

    if (!datos.cliente.anonimo && cliente?.email) {
      const petaloUrl = imagenes.petalo ? await petaloRecortado(imagenes.petalo).catch(() => undefined) : undefined;
      await this.correo.enviarFactura(
        cliente.email,
        { factura: datos, urlDescarga: url, petaloUrl },
        { nombre: nombreArchivo, base64 },
      );
    }

    return { numero, url, emitidaEn };
  }

  /** Abre el enlace de la factura: en el teléfono la baja el navegador del sistema. */
  descargar(factura: FacturaEmitida): void {
    window.open(factura.url, '_system');
  }

  private clienteDe(pedido: Pedido): Usuario | undefined {
    return (
      this.usuarios.porId(pedido.clienteId) ??
      this.usuarios.todos().find((u) => !!pedido.clienteUid && u.uid === pedido.clienteUid)
    );
  }
}
