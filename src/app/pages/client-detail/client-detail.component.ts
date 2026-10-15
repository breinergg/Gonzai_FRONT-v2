import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClientService } from '../../core/services/client.service';
import { SaleService } from '../../core/services/sale.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { ClienteSaldo, ClientResponse, VentaPendiente } from '../../core/models/client.model';
import { SaleResponse, estadoPagoClass } from '../../core/models/sale.model';
import { PaymentResponse } from '../../core/models/payment.model';
import { isAnulado, metodoPagoLabel } from '../../core/models/common.model';
import { parseApiError } from '../../core/utils/api-error';
import { initials } from '../../core/utils/format';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';
import { PaymentModalComponent } from '../../shared/components/payment-modal/payment-modal.component';
import { SaleDetailModalComponent } from '../../shared/components/sale-detail-modal/sale-detail-modal.component';
import { AnnulModalComponent } from '../../shared/components/annul-modal/annul-modal.component';

type HistoryTab = 'ventas' | 'pagos';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CopPipe, FechaCoPipe, PaymentModalComponent, SaleDetailModalComponent, AnnulModalComponent],
  templateUrl: './client-detail.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './client-detail.component.css'],
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientService = inject(ClientService);
  private readonly saleService = inject(SaleService);
  private readonly paymentService = inject(PaymentService);
  private readonly auth = inject(AuthService);

  readonly isAdmin = this.auth.isAdmin();
  readonly initials = initials;
  readonly isAnulado = isAnulado;
  readonly estadoPagoClass = estadoPagoClass;
  readonly metodoPagoLabel = metodoPagoLabel;

  clientId = 0;
  client: ClientResponse | null = null;
  saldo: ClienteSaldo | null = null;
  sales: SaleResponse[] = [];
  payments: PaymentResponse[] = [];

  loading = true;
  error = '';
  historyError = '';
  tab: HistoryTab = 'ventas';
  showAnnulled = false;

  payingSale: VentaPendiente | null = null;
  detailId: number | null = null;

  annulPayment: PaymentResponse | null = null;
  annulling = false;
  annulError = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.clientId = Number(params.get('id'));
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      client: this.clientService.getById(this.clientId),
      saldo: this.clientService.getSaldo(this.clientId),
    }).subscribe({
      next: ({ client, saldo }) => {
        this.client = client;
        this.saldo = saldo;
        this.loading = false;
        this.loadHistory();
      },
      error: (err) => {
        this.error = parseApiError(err, 'No se pudo cargar el cliente.').message;
        this.loading = false;
      },
    });
  }

  /** Recarga saldo + historiales sin bloquear la pantalla. */
  refresh(): void {
    this.clientService.getSaldo(this.clientId).subscribe({ next: (s) => (this.saldo = s), error: () => {} });
    this.loadHistory();
  }

  loadHistory(): void {
    this.historyError = '';
    forkJoin({
      sales: this.saleService.getAll({ clienteId: this.clientId }),
      payments: this.paymentService.getByClient(this.clientId),
    }).subscribe({
      next: ({ sales, payments }) => {
        this.sales = sales;
        this.payments = payments;
      },
      error: (err) => (this.historyError = parseApiError(err, 'No se pudo cargar el historial.').message),
    });
  }

  back(): void {
    this.router.navigate(['/clients']);
  }

  get visibleSales(): SaleResponse[] {
    return this.showAnnulled ? this.sales : this.sales.filter(s => !isAnulado(s.estado));
  }

  get visiblePayments(): PaymentResponse[] {
    return this.showAnnulled ? this.payments : this.payments.filter(p => !isAnulado(p.estado));
  }

  get annulledSales(): number {
    return this.sales.filter(s => isAnulado(s.estado)).length;
  }

  get annulledPayments(): number {
    return this.payments.filter(p => isAnulado(p.estado)).length;
  }

  get lastPurchase(): string | null {
    return this.sales.find(s => !isAnulado(s.estado))?.fecha ?? null;
  }

  visiblePaymentsCount(): number {
    return this.payments.length - this.annulledPayments;
  }

  get pendingCount(): number {
    return this.saldo?.ventasPendientes.length ?? 0;
  }

  /* ── Abonos ─── */
  openPayment(v: VentaPendiente): void {
    this.payingSale = v;
  }

  onPaid(): void {
    this.refresh();
  }

  /* ── Detalle de venta ─── */
  openSale(id: number): void {
    this.detailId = id;
  }

  onSaleChanged(): void {
    this.refresh();
  }

  /* ── Anular pago (solo admin) ─── */
  startAnnul(p: PaymentResponse): void {
    this.annulPayment = p;
    this.annulError = '';
  }

  confirmAnnul(motivo: string): void {
    if (!this.annulPayment) return;
    this.annulling = true;
    this.annulError = '';
    this.paymentService.annul(this.annulPayment.id, { motivo }).subscribe({
      next: () => {
        this.annulling = false;
        this.annulPayment = null;
        this.refresh();
      },
      error: (err) => {
        this.annulError = parseApiError(err, 'No se pudo anular el pago.').message;
        this.annulling = false;
      },
    });
  }
}
