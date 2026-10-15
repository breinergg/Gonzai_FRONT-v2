import { Pipe, PipeTransform } from '@angular/core';
import { formatCOP } from '../../core/utils/format';

@Pipe({ name: 'cop', standalone: true })
export class CopPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCOP(value);
  }
}
