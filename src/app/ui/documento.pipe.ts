import { Pipe, PipeTransform } from '@angular/core';

/** Número de documento con puntos de miles, como se lee en el DNI. */
@Pipe({ name: 'documento' })
export class DocumentoPipe implements PipeTransform {
  transform(dni: string | null | undefined): string {
    if (!dni) return 'Sin documento';
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
