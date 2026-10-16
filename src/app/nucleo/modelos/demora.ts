import { Sector, TipoProducto, sectorDe } from './enums';

/** Un renglón para calcular la demora: el tipo define el sector, el tiempo es el del producto. */
export interface RenglonDemora {
  tipo: TipoProducto;
  tiempoElaboracion: number;
  cantidad: number;
}

/**
 * Minutos que tarda un sector: se prepara de a uno, así que cada unidad suma
 * su tiempo de elaboración (tres productos de dos minutos son seis).
 */
export function demoraDelSector(renglones: RenglonDemora[], sector: Sector): number {
  return renglones
    .filter((r) => sectorDe(r.tipo) === sector)
    .reduce((suma, r) => suma + r.tiempoElaboracion * r.cantidad, 0);
}

/**
 * Minutos que tarda el pedido: cocina y barra trabajan a la vez, así que
 * manda el sector más cargado.
 */
export function demoraDelPedido(renglones: RenglonDemora[]): number {
  const sectores = new Set(renglones.map((r) => sectorDe(r.tipo)));
  return sectores.size ? Math.max(...[...sectores].map((s) => demoraDelSector(renglones, s))) : 0;
}
