import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export const MOTIVO_MAX = 150;

/** Confirmación de anulación con motivo obligatorio. La llamada al API la hace el padre. */
@Component({
  selector: 'app-annul-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annul-modal.component.html',
  styleUrls: ['../../styles/gz-ui.css', './annul-modal.component.css'],
})
export class AnnulModalComponent {
  @Input() title = 'Anular';
  /** Nombre del documento, p. ej. "la venta #12". */
  @Input() subject = '';
  /** Consecuencias que verá el usuario antes de confirmar. */
  @Input() warning = '';
  @Input() loading = false;
  @Input() error = '';

  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  readonly max = MOTIVO_MAX;
  motivo = '';
  touched = false;

  get motivoError(): string {
    const value = this.motivo.trim();
    if (!value) return 'El motivo es obligatorio.';
    if (value.length > this.max) return `Máximo ${this.max} caracteres.`;
    return '';
  }

  confirm(): void {
    this.touched = true;
    if (this.motivoError || this.loading) return;
    this.confirmed.emit(this.motivo.trim());
  }

  cancel(): void {
    if (!this.loading) this.cancelled.emit();
  }
}
