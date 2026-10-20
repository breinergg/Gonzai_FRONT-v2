import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { SaleService } from '../../../core/services/sale.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { SalePaymentSummary, SaleResponse, estadoPagoClass } from '../../../core/models/sale.model';
import { isAnulado, metodoPagoLabel } from '../../../core/models/common.model';
import { parseApiError } from '../../../core/utils/api-error';
import { CopPipe } from '../../pipes/cop.pipe';
import { FechaCoPipe } from '../../pipes/fecha-co.pipe';
import { AnnulModalComponent } from '../annul-modal/annul-modal.component';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';
import { ReceiptActionsComponent } from '../receipt-actions/receipt-actions.component';

@Component({
  selector: 'app-sale-detail-modal',
  standalone: true,
  imports: [CommonModule, RouterModule, CopPipe, FechaCoPipe, AnnulModalComponent, PaymentModalComponent, ReceiptActionsComponent],
  templateUrl: './sale-detail-modal.component.html',
  styleUrls: ['../../styles/gz-ui.css', './sale-detail-modal.component.css'],
})
export class SaleDetailModalComponent implements OnInit {
  private readonly saleService = inject(SaleService);
  private readonly paymentService = inject(PaymentService);
  private readonly auth = inject(AuthService);

  @Input({ required: true }) saleId!: number;
  /** Abre directamente el modal de abono. */
  @Input() startWithPayment = false;

  @Output() changed = new EventEmitter<SaleResponse>();
  @Output() closed = new EventEmitter<void>();

  readonly isAdmin = this.auth.isAdmin();
  readonly isAnulado = isAnulado;
  readonly metodoPagoLabel = metodoPagoLabel;
  readonly estadoPagoClass = estadoPagoClass;

  sale: SaleResponse | null = null;
  loading = true;
  error = '';

  showPayment = false;

  annulSale = false;
  annulPayment: SalePaymentSummary | null = null;
  annulling = false;
  annulError = '';

  ngOnInit(): void {
    this.load(true);
  }

  load(first = false): void {
    this.loading = true;
    this.saleService.getById(this.saleId).subscribe({
      next: (s) => {
        this.sale = s;
        this.loading = false;
        if (first && this.startWithPayment && this.canPay) this.showPayment = true;
        if (!first) this.changed.emit(s);
      },
      error: (err) => {
        this.error = parseApiError(err, 'No se pudo cargar la venta.').message;
        this.loading = false;
      },
    });
  }

  get canPay(): boolean {
    return !!this.sale && !isAnulado(this.sale.estado) && this.sale.saldoPendiente > 0;
  }

  get unidades(): number {
    return this.sale?.detalles.reduce((s, d) => s + d.cantidad, 0) ?? 0;
  }

  onPaid(): void {
    this.load();
  }

  confirmAnnul(motivo: string): void {
    if (!this.sale) return;
    this.annulling = true;
    this.annulError = '';
    const request$: Observable<unknown> = this.annulPayment
      ? this.paymentService.annul(this.annulPayment.id, { motivo })
      : this.saleService.annul(this.sale.id, { motivo });

    request$.subscribe({
      next: () => {
        this.annulling = false;
        this.annulSale = false;
        this.annulPayment = null;
        this.load();
      },
      error: (err) => {
        this.annulError = parseApiError(err, 'No se pudo anular.').message;
        this.annulling = false;
      },
    });
  }

  cancelAnnul(): void {
    this.annulSale = false;
    this.annulPayment = null;
  }

  close(): void {
    this.closed.emit();
  }
}
