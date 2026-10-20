import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentResponse } from '../../../core/models/payment.model';
import { METODOS_PAGO } from '../../../core/models/common.model';
import { parseApiError } from '../../../core/utils/api-error';
import { formatCOP, toApiDate, todayColombia } from '../../../core/utils/format';
import { CopPipe } from '../../pipes/cop.pipe';
import { FechaCoPipe } from '../../pipes/fecha-co.pipe';
import { ReceiptActionsComponent } from '../receipt-actions/receipt-actions.component';

/** Abono a una venta concreta. El monto llega prellenado con el saldo pendiente. */
@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CopPipe, FechaCoPipe, ReceiptActionsComponent],
  templateUrl: './payment-modal.component.html',
  styleUrls: ['../../styles/gz-ui.css', './payment-modal.component.css'],
})
export class PaymentModalComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);

  @Input({ required: true }) ventaId!: number;
  @Input({ required: true }) clienteId!: number;
  @Input({ required: true }) saldo!: number;
  @Input() clienteNombre = '';
  @Input() ventaFecha: string | null = null;
  @Input() ventaTotal: number | null = null;

  @Output() paid = new EventEmitter<PaymentResponse>();
  @Output() closed = new EventEmitter<void>();

  readonly metodos = METODOS_PAGO;
  readonly Math = Math;
  readonly today = todayColombia();

  monto: number | null = null;
  metodoPago = '';
  fecha = this.today;
  descripcion = '';

  saving = false;
  error = '';
  fieldErrors: Record<string, string> = {};
  result: PaymentResponse | null = null;

  ngOnInit(): void {
    this.monto = this.saldo;
  }

  setMonto(value: number): void {
    this.monto = Math.round(value);
  }

  get montoError(): string {
    if (this.monto === null || this.monto <= 0) return 'El monto debe ser mayor a 0.';
    if (this.monto > this.saldo) return `No puede superar el saldo pendiente (${formatCOP(this.saldo)}).`;
    return '';
  }

  get saldoDespues(): number {
    return Math.max(0, this.saldo - (this.monto ?? 0));
  }

  save(): void {
    if (this.saving) return;
    this.error = '';
    this.fieldErrors = {};
    if (this.montoError) { this.fieldErrors['monto'] = this.montoError; return; }
    if (!this.metodoPago) { this.fieldErrors['metodopago'] = 'Elige el método de pago.'; return; }

    this.saving = true;
    this.paymentService.create({
      ventaClienteId: this.ventaId,
      clienteId: this.clienteId,
      monto: Number(this.monto),
      metodoPago: this.metodoPago,
      fecha: toApiDate(this.fecha),
      descripcion: this.descripcion.trim() || null,
    }).subscribe({
      next: (payment) => {
        this.saving = false;
        this.result = payment;
        this.paid.emit(payment);
      },
      error: (err) => {
        const parsed = parseApiError(err, 'No se pudo registrar el abono.');
        this.fieldErrors = parsed.fieldErrors;
        this.error = parsed.message;
        this.saving = false;
      },
    });
  }

  close(): void {
    if (!this.saving) this.closed.emit();
  }
}