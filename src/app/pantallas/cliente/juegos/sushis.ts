/**
 * Las piezas de sushi de los juegos de la espera.
 *
 * Utiliza los iconos reales de sushis en assets/icon/sushis/.
 */
export interface Sushi {
  archivo: string;
  nombre: string;
}

export const SUSHIS: Sushi[] = [
  { archivo: 'sushi-1.png', nombre: 'gunkan de ikura' },
  { archivo: 'sushi-2.png', nombre: 'nigiri de salmón con galera' },
  { archivo: 'sushi-3.png', nombre: 'nigiri de atún' },
  { archivo: 'sushi-4.png', nombre: 'nigiri de salmón con moño' },
  { archivo: 'sushi-5.png', nombre: 'nigiri de salmón' },
  { archivo: 'sushi-6.png', nombre: 'nigiri de palta' },
  { archivo: 'sushi-7.png', nombre: 'maki de tamago' },
  { archivo: 'sushi-8.png', nombre: 'nigiri de langostino' },
  { archivo: 'sushi-9.png', nombre: 'maki de palta' },
  { archivo: 'sushi-10.png', nombre: 'maki de salmón' },
  { archivo: 'sushi-12.png', nombre: 'nigiri de atún con alga' },
];

/** La ruta de la imagen de una pieza, para el src de la etiqueta. */
export function imagenDe(sushi: Sushi): string {
  return `assets/icon/sushis/${sushi.archivo}`;
}

/** Mezcla una copia de la lista, con el barajado de Fisher y Yates. */
export function mezclar<T>(lista: readonly T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Un elemento al azar de la lista. */
export function alAzar<T>(lista: readonly T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}
