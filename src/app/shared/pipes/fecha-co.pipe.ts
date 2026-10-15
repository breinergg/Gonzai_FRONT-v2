import { Pipe, PipeTransform } from '@angular/core';
import { DateFormat, formatColombia } from '../../core/utils/format';

/** Muestra fechas UTC del API en hora de Colombia. Uso: {{ fecha | fechaCo:'datetime' }} */
@Pipe({ name: 'fechaCo', standalone: true })
export class FechaCoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: DateFormat = 'date'): string {
    return formatColombia(value, format);
  }
}
