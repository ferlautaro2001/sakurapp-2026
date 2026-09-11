import { Pipe, PipeTransform } from '@angular/core';

/** Precios en pesos argentinos, con separador de miles y el símbolo antepuesto. */
@Pipe({ name: 'pesos' })
export class PesosPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    const numero = Number(valor ?? 0);
    return `$ ${numero.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}

/** Hora y minutos en formato de veinticuatro horas. */
@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
}

/** Fecha completa con hora y minutos, en español rioplatense. */
@Pipe({ name: 'fechaHora' })
export class FechaHoraPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

/** Número de documento con puntos de miles, como se lee en el DNI. */
@Pipe({ name: 'documento' })
export class DocumentoPipe implements PipeTransform {
  transform(dni: string | null | undefined): string {
    if (!dni) return 'Sin documento';
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
