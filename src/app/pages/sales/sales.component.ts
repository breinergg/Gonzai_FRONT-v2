import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SaleService } from '../../core/services/sale.service';
import { AuthService } from '../../core/services/auth.service';
import { SaleResponse, VentaMensualResumen, estadoPagoClass } from '../../core/models/sale.model';
import { isAnulado } from '../../core/models/common.model';
import { parseApiError } from '../../core/utils/api-error';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';
import { SaleDetailModalComponent } from '../../shared/components/sale-detail-modal/sale-detail-modal.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe, FechaCoPipe, SaleDetailModalComponent],
  templateUrl: './sales.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './sales.component.css'],
})
export class SalesComponent implements OnInit {
  private readonly saleService = inject(SaleService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isAdmin = this.auth.isAdmin();
  readonly isAnulado = isAnulado;
  readonly estadoPagoClass = estadoPagoClass;
  sales: SaleResponse[] = [];
  filtered: SaleResponse[] = [];

  searchTerm = '';
  desde = '';
  hasta = '';
  soloPendientes = false;
  showAnnulled = true;

  loading = true;
  error = '';

  resumen: VentaMensualResumen | null = null;

  detailId: number | null = null;
  detailPay = false;

  ngOnInit(): void {
    this.loadResumen();
    const q = this.route.snapshot.queryParamMap;
    if (q.get('pendientes') === '1') this.soloPendientes = true;
    this.load();
    this.route.queryParamMap.subscribe(params => {
      const ver = params.get('ver');
      if (ver) this.openDetail(Number(ver));
    });
  }

  loadResumen(): void {
    this.saleService.getResumenMensual().subscribe({ next: (r) => (this.resumen = r), error: () => {} });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.saleService.getAll({ desde: this.desde, hasta: this.hasta, soloPendientes: this.soloPendientes }).subscribe({
      next: (data) => {
        this.sales = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = parseApiError(err, 'Error al cargar las ventas').message;
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.sales.filter(s => {
      if (!this.showAnnulled && isAnulado(s.estado)) return false;
      if (!term) return true;
      const text = [
        `#${s.id}`, s.clienteNombre, s.usuarioNombre, s.descripcion,
        ...s.detalles.map(d => `${d.productoNombre} ${d.varianteNombre}`),
      ].join(' ').toLowerCase();
      return text.includes(term);
    });
  }

  togglePendientes(): void {
    this.soloPendientes = !this.soloPendientes;
    this.load();
  }

  clearDates(): void {
    this.desde = '';
    this.hasta = '';
    this.load();
  }

  /* ── Totales (sin anuladas) ─── */
  get active(): SaleResponse[] {
    return this.filtered.filter(s => !isAnulado(s.estado));
  }

  get totalVendido(): number {
    return this.active.reduce((sum, s) => sum + s.total, 0);
  }

  get totalCobrado(): number {
    return this.active.reduce((sum, s) => sum + s.montoPagado, 0);
  }

  get totalPorCobrar(): number {
    return this.active.reduce((sum, s) => sum + s.saldoPendiente, 0);
  }

  get totalGanancia(): number {
    return this.active.reduce((sum, s) => sum + s.ganancia, 0);
  }

  get annulledCount(): number {
    return this.sales.filter(s => isAnulado(s.estado)).length;
  }

  unidades(s: SaleResponse): number {
    return s.detalles.reduce((sum, d) => sum + d.cantidad, 0);
  }

  /** Nombre corto para la tabla (máx. 20 caracteres). */
  truncateName(name: string, max = 20): string {
    const t = (name ?? '').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  }

  /* ── Detalle ─── */
  openDetail(id: number, pay = false, event?: Event): void {
    event?.stopPropagation();
    this.detailId = id;
    this.detailPay = pay;
  }

  closeDetail(): void {
    this.detailId = null;
    if (this.route.snapshot.queryParamMap.get('ver')) {
      this.router.navigate([], { queryParams: { ver: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  onSaleChanged(updated: SaleResponse): void {
    this.sales = this.sales.map(s => (s.id === updated.id ? updated : s));
    this.applyFilters();
    this.loadResumen();
  }
}
