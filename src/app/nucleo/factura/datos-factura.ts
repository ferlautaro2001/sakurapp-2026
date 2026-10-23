import { environment } from '../../../environments/environment';
import { MedioPago, Pedido, Usuario } from '../modelos/modelos';
import { PROPINAS } from '../servicios/qr.service';
import type { DatosFactura, RenglonFactura } from './factura-pdf';

/** El punto de venta de la caja del salón. */
export const PUNTO_DE_VENTA = 1;

const MEDIOS: Record<MedioPago, string> = {
  DINERO_EN_CUENTA: 'Dinero en cuenta',
  DEBITO: 'Tarjeta de débito',
  CREDITO: 'Tarjeta de crédito',
};

export function rotuloMedio(medio: MedioPago): string {
  return MEDIOS[medio] ?? 'Mercado Pago';
}

/**
 * Punto 21 · el grado de satisfacción que eligió el comensal con el QR de
 * propina, con los mismos rótulos que los códigos (Excelente, Muy bueno…).
 */
export function satisfaccionDe(porcentaje: number): string {
  return PROPINAS.find((p) => p.porcentaje === porcentaje)?.rotulo ?? '';
}

// Lo que se imprime igual en el PDF y en el correo.

export function numeroDeFactura(puntoDeVenta: number, numero: number): string {
  return `${String(puntoDeVenta).padStart(4, '0')}-${String(numero).padStart(8, '0')}`;
}

/** El número de pedido, corto y legible: las primeras ocho letras del identificador. */
export function numeroDePedido(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
}

export function pesos(monto: number): string {
  return `$ ${Math.round(monto).toLocaleString('es-AR')}`;
}

export function fechaFactura(iso: string): string {
  const d = new Date(iso);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** El renglón de la propina: el grado de satisfacción y el porcentaje. */
export function rotuloPropina(propina: DatosFactura['propina']): string {
  return propina.satisfaccion
    ? `Propina · ${propina.satisfaccion} (${propina.porcentaje} %)`
    : `Propina (${propina.porcentaje} %)`;
}

/**
 * Punto 22 · arma los datos de la factura a partir del pedido cerrado. Es el
 * mismo detalle que el comensal vio en la cuenta (punto 21): lo pedido con su
 * precio unitario, el descuento del juego, la propina con el grado de
 * satisfacción y el total.
 *
 * Si el comensal reeditó la comanda, un mismo producto puede venir en dos
 * renglones: acá se juntan, para que la factura diga "3 × Limonada" una vez.
 */
export function datosDeFactura(
  pedido: Pedido,
  cliente: Usuario | undefined,
  numero: number,
  emitidaEn: string,
): DatosFactura {
  const porProducto = new Map<string, RenglonFactura>();
  for (const item of pedido.items) {
    const clave = `${item.productoId}|${item.precioUnitario}`;
    const previo = porProducto.get(clave);
    if (previo) {
      previo.cantidad += item.cantidad;
      previo.importe += item.subtotal;
    } else {
      porProducto.set(clave, {
        cantidad: item.cantidad,
        descripcion: item.productoNombre,
        precioUnitario: item.precioUnitario,
        importe: item.subtotal,
      });
    }
  }
  const renglones = [...porProducto.values()];

  const anonimo = !cliente || cliente.perfil === 'CLIENTE_ANONIMO';
  const nombre = cliente
    ? [cliente.nombre, cliente.apellido ?? ''].join(' ').trim()
    : pedido.clienteNombre || 'Consumidor final';
  const documento = cliente?.dni ? formatearDni(cliente.dni) : cliente?.cuil ?? null;

  const subtotal = pedido.totalBruto || renglones.reduce((suma, r) => suma + r.importe, 0);
  const porcentajePropina = pedido.porcentajePropina ?? 0;
  const propina = pedido.montoPropina ?? 0;
  const { restaurante } = environment;

  return {
    numero,
    puntoDeVenta: PUNTO_DE_VENTA,
    emitidaEn,
    restaurante: {
      nombre: restaurante.nombre,
      salon: restaurante.salon,
      direccion: restaurante.direccion,
      telefono: restaurante.telefono,
    },
    cliente: anonimo
      ? { nombre, anonimo: true }
      : { nombre, documento, correo: cliente?.email ?? null, anonimo: false },
    pedido: { id: pedido.id, mesa: pedido.mesaNumero },
    renglones,
    subtotal,
    descuento:
      pedido.descuentoJuego > 0
        ? { porcentaje: pedido.descuentoJuego, monto: pedido.montoDescuentoJuego }
        : null,
    propina: { porcentaje: porcentajePropina, monto: propina, satisfaccion: satisfaccionDe(porcentajePropina) },
    total: pedido.pago?.total ?? pedido.totalFinal + propina,
    pago: pedido.pago ? { medio: rotuloMedio(pedido.pago.medio), operacion: pedido.pago.operacion } : null,
  };
}

function formatearDni(dni: string): string {
  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
