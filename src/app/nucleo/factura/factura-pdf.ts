import { jsPDF } from 'jspdf';
import { fechaFactura as fecha, numeroDeFactura, numeroDePedido, pesos, rotuloPropina } from './datos-factura';

export { numeroDeFactura, numeroDePedido };

/**
 * Punto 22 · la factura en PDF.
 *
 * Es una función pura, sin Angular: recibe los datos ya armados y devuelve el
 * documento. Así la usa la aplicación al confirmar el pago y también se puede
 * dibujar una de muestra desde un script, para mirarla sin pasar por el cobro.
 */

export interface RenglonFactura {
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
  importe: number;
}

export interface DatosFactura {
  /** Número correlativo; se muestra como 0001-00000042. */
  numero: number;
  puntoDeVenta: number;
  emitidaEn: string;
  restaurante: { nombre: string; salon: string; direccion: string; telefono: string };
  cliente: { nombre: string; documento?: string | null; correo?: string | null; anonimo: boolean };
  pedido: { id: string; mesa: number | string };
  renglones: RenglonFactura[];
  subtotal: number;
  descuento: { porcentaje: number; monto: number } | null;
  /** El porcentaje del QR de propina y el grado de satisfacción que representa. */
  propina: { porcentaje: number; monto: number; satisfaccion?: string };
  total: number;
  pago?: { medio: string; operacion: string } | null;
}

/** Las imágenes van como data URL: el logo y el pétalo de la marca. */
export interface ImagenesFactura {
  logo: string;
  petalo?: string;
}

// Paleta de la marca, en RGB.
const CIRUELA: [number, number, number] = [110, 18, 52];
const FUCSIA: [number, number, number] = [199, 38, 87];
const ROSA: [number, number, number] = [185, 46, 88];
const NIEVE: [number, number, number] = [253, 236, 239];
const GRIS: [number, number, number] = [120, 84, 97];
const VERDE: [number, number, number] = [27, 122, 76];

const MARGEN = 16;
const ANCHO = 210;
const ALTO = 297;

export function armarFactura(datos: DatosFactura, imagenes: ImagenesFactura): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: `Factura ${numeroDeFactura(datos.puntoDeVenta, datos.numero)} · ${datos.restaurante.nombre}`,
    author: datos.restaurante.nombre,
  });

  const texto = (
    t: string,
    x: number,
    y: number,
    tam: number,
    color: [number, number, number],
    estilo: 'normal' | 'bold' = 'normal',
    alinear: 'left' | 'right' | 'center' = 'left',
  ) => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tam);
    doc.setTextColor(...color);
    doc.text(t, x, y, { align: alinear });
  };

  // --- Encabezado: banda rosa con el logo, el nombre y los datos del local.
  doc.setFillColor(...ROSA);
  doc.rect(0, 0, ANCHO, 46, 'F');
  if (imagenes.petalo) {
    doc.addImage(imagenes.petalo, 'PNG', ANCHO - 46, -8, 40, 40, undefined, 'FAST');
  }
  // El ícono nunca lleva marco: lo despega del fondo una sombra oscura y difusa,
  // hecha con capas cada vez más anchas y más transparentes.
  // Las esquinas, redondeadas como el ícono de la aplicación (26 % del lado).
  const lado = 25;
  const radio = lado * 0.26;
  doc.setFillColor(...CIRUELA);
  for (let capa = 4; capa >= 1; capa--) {
    doc.setGState(doc.GState({ opacity: 0.09 }));
    const r = radio + capa * 0.6;
    doc.roundedRect(MARGEN + 1.5 - capa * 0.6, 11.5 - capa * 0.6, lado + capa * 1.2, lado + capa * 1.2, r, r, 'F');
  }
  doc.setGState(doc.GState({ opacity: 1 }));
  doc.saveGraphicsState();
  doc.roundedRect(MARGEN + 1.5, 10.5, lado, lado, radio, radio, null);
  doc.clip();
  doc.discardPath();
  doc.addImage(imagenes.logo, 'PNG', MARGEN + 1.5, 10.5, lado, lado, undefined, 'FAST');
  doc.restoreGraphicsState();
  texto(datos.restaurante.nombre, MARGEN + 34, 20, 22, [255, 255, 255], 'bold');
  texto(`Restaurante ${datos.restaurante.salon}`, MARGEN + 34, 26.5, 11, [255, 230, 236]);
  texto(datos.restaurante.direccion, MARGEN + 34, 32.5, 9, [255, 230, 236]);
  texto(`Tel. ${datos.restaurante.telefono}`, MARGEN + 34, 37.5, 9, [255, 230, 236]);

  // --- Tipo y número de factura, en la tarjeta de la derecha.
  const tx = ANCHO - MARGEN - 58;
  doc.setFillColor(...NIEVE);
  doc.roundedRect(tx, 54, 58, 34, 4, 4, 'F');
  texto('FACTURA C', tx + 29, 63, 15, FUCSIA, 'bold', 'center');
  texto('Consumidor final', tx + 29, 69, 9, GRIS, 'normal', 'center');
  texto(`N° ${numeroDeFactura(datos.puntoDeVenta, datos.numero)}`, tx + 29, 76.5, 10.5, CIRUELA, 'bold', 'center');
  texto(fecha(datos.emitidaEn), tx + 29, 83, 9, GRIS, 'normal', 'center');

  // --- Cliente y pedido, a la izquierda.
  let y = 60;
  texto('CLIENTE', MARGEN, y, 8.5, FUCSIA, 'bold');
  y += 6;
  texto(datos.cliente.nombre, MARGEN, y, 12, CIRUELA, 'bold');
  y += 5.5;
  if (datos.cliente.anonimo) {
    texto('Cliente anónimo · consumidor final', MARGEN, y, 9.5, GRIS);
    y += 5;
  } else {
    if (datos.cliente.documento) {
      texto(`Documento: ${datos.cliente.documento}`, MARGEN, y, 9.5, GRIS);
      y += 5;
    }
    if (datos.cliente.correo) {
      texto(`Correo: ${datos.cliente.correo}`, MARGEN, y, 9.5, GRIS);
      y += 5;
    }
  }
  y += 3;
  texto('PEDIDO', MARGEN, y, 8.5, FUCSIA, 'bold');
  y += 6;
  texto(`N° ${numeroDePedido(datos.pedido.id)} · Mesa ${datos.pedido.mesa}`, MARGEN, y, 11, CIRUELA, 'bold');

  // --- Detalle: una fila por producto, con el encabezado repetido en cada hoja.
  const cols = { cant: MARGEN + 4, desc: MARGEN + 20, unit: ANCHO - MARGEN - 40, imp: ANCHO - MARGEN - 4 };
  const encabezado = (desde: number) => {
    doc.setFillColor(...CIRUELA);
    doc.roundedRect(MARGEN, desde, ANCHO - 2 * MARGEN, 9, 2, 2, 'F');
    texto('Cant.', cols.cant, desde + 6, 9, [255, 255, 255], 'bold');
    texto('Descripción', cols.desc, desde + 6, 9, [255, 255, 255], 'bold');
    texto('P. unitario', cols.unit, desde + 6, 9, [255, 255, 255], 'bold', 'right');
    texto('Importe', cols.imp, desde + 6, 9, [255, 255, 255], 'bold', 'right');
    return desde + 9;
  };

  y = encabezado(Math.max(y + 8, 96));
  const ALTO_FILA = 8.5;
  const ancho_desc = cols.unit - cols.desc - 30;
  datos.renglones.forEach((r, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lineas = doc.splitTextToSize(r.descripcion, ancho_desc) as string[];
    const alto = Math.max(ALTO_FILA, 4.6 * lineas.length + 3.9);
    if (y + alto > ALTO - 80) {
      doc.addPage();
      y = encabezado(MARGEN);
    }
    if (i % 2 === 0) {
      doc.setFillColor(...NIEVE);
      doc.rect(MARGEN, y, ANCHO - 2 * MARGEN, alto, 'F');
    }
    const base = y + 5.6;
    texto(String(r.cantidad), cols.cant + 3, base, 10, CIRUELA, 'bold', 'center');
    doc.setTextColor(...CIRUELA);
    doc.text(lineas, cols.desc, base);
    texto(pesos(r.precioUnitario), cols.unit, base, 10, GRIS, 'normal', 'right');
    texto(pesos(r.importe), cols.imp, base, 10, CIRUELA, 'bold', 'right');
    y += alto;
  });

  // --- Resumen: subtotal, descuento, propina y el total grande.
  y += 8;
  const rx = ANCHO - MARGEN - 80;
  const fila = (rotulo: string, valor: string, color: [number, number, number]) => {
    texto(rotulo, rx, y, 10.5, color);
    texto(valor, ANCHO - MARGEN - 4, y, 10.5, color, 'bold', 'right');
    y += 6.5;
  };
  fila('Subtotal', pesos(datos.subtotal), CIRUELA);
  if (datos.descuento && datos.descuento.monto > 0) {
    fila(`Descuento (${datos.descuento.porcentaje} %)`, `- ${pesos(datos.descuento.monto)}`, VERDE);
  }
  fila(rotuloPropina(datos.propina), `+ ${pesos(datos.propina.monto)}`, CIRUELA);
  y += 1;
  doc.setFillColor(...FUCSIA);
  doc.roundedRect(rx - 4, y - 2, ANCHO - MARGEN - rx + 4, 14, 3, 3, 'F');
  texto('TOTAL', rx, y + 7, 13, [255, 255, 255], 'bold');
  texto(pesos(datos.total), ANCHO - MARGEN - 4, y + 7.5, 16, [255, 255, 255], 'bold', 'right');
  y += 20;

  if (datos.pago) {
    texto(`Pagado con ${datos.pago.medio} · Operación #${datos.pago.operacion}`, ANCHO - MARGEN - 4, y, 9, GRIS, 'normal', 'right');
  }

  // --- Pie, en todas las hojas: el agradecimiento y la página.
  const hojas = doc.getNumberOfPages();
  for (let h = 1; h <= hojas; h++) {
    doc.setPage(h);
    doc.setDrawColor(...FUCSIA);
    doc.setLineWidth(0.6);
    doc.line(MARGEN, ALTO - 26, ANCHO - MARGEN, ALTO - 26);
    texto('¡Gracias por tu visita!', ANCHO / 2, ALTO - 18, 12, FUCSIA, 'bold', 'center');
    texto(
      `${datos.restaurante.nombre} · ${datos.restaurante.direccion}`,
      ANCHO / 2,
      ALTO - 12.5,
      8.5,
      GRIS,
      'normal',
      'center',
    );
    if (hojas > 1) texto(`Hoja ${h} de ${hojas}`, ANCHO - MARGEN, ALTO - 7, 8, GRIS, 'normal', 'right');
  }

  return doc;
}
