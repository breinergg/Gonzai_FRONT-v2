import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PurchaseService } from '../../core/services/purchase.service';
import { SupplierService } from '../../core/services/supplier.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchaseResponse } from '../../core/models/purchase.model';
import { SupplierResponse } from '../../core/models/supplier.model';
import { isAnulado } from '../../core/models/common.model';
import { parseApiError } from '../../core/utils/api-error';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';
import { AnnulModalComponent } from '../../shared/components/annul-modal/annul-modal.component';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe, FechaCoPipe, AnnulModalComponent],
  templateUrl: './purchases.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './purchases.component.css'],
})
export class PurchasesComponent implements OnInit {
  private readonly purchaseService = inject(PurchaseService);
  private readonly supplierService = inject(SupplierService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isAdmin = this.auth.isAdmin();
  readonly isAnulado = isAnulado;

  purchases: PurchaseResponse[] = [];
  filtered: PurchaseResponse[] = [];
  suppliers: SupplierResponse[] = [];

  proveedorId: number | null = null;
  desde = '';
  hasta = '';
  searchTerm = '';
  showAnnulled = true;

  loading = true;
  error = '';

  detail: PurchaseResponse | null = null;
  detailLoading = false;
  detailError = '';

  annulTarget: PurchaseResponse | null = null;
  annulling = false;
  annulError = '';

  ngOnInit(): void {
    this.supplierService.getAll().subscribe({ next: (s) => (this.suppliers = s) });

    const params = this.route.snapshot.queryParamMap;
    const proveedor = params.get('proveedor');
    if (proveedor) this.proveedorId = Number(proveedor);
    this.load();

    this.route.queryParamMap.subscribe(q => {
      const ver = q.get('ver');
      if (ver) this.openDetail(Number(ver));
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.purchaseService.getAll({ proveedorId: this.proveedorId, desde: this.desde, hasta: this.hasta }).subscribe({
      next: (data) => {
        this.purchases = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = parseApiError(err, 'Error al cargar las compras').message;
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.purchases.filter(p => {
      if (!this.showAnnulled && isAnulado(p.estado)) return false;
      if (!term) return true;
      return [p.codigo, p.nombre, p.numeroFactura, p.proveedorNombre, p.descripcion].join(' ').toLowerCase().includes(term);
    });
  }

  clearDates(): void {
    this.desde = '';
    this.hasta = '';
    this.load();
  }

  get active(): PurchaseResponse[] {
    return this.filtered.filter(p => !isAnulado(p.estado));
  }

  get totalInvertido(): number {
    return this.active.reduce((s, p) => s + p.total, 0);
  }

  get totalUnidades(): number {
    return this.active.reduce((s, p) => s + p.totalUnidades, 0);
  }

  get totalEnvio(): number {
    return this.active.reduce((s, p) => s + p.costoEnvio, 0);
  }

  get annulledCount(): number {
    return this.purchases.filter(p => isAnulado(p.estado)).length;
  }

  /* ── Detalle ─── */
  openDetail(id: number): void {
    this.detail = this.purchases.find(p => p.id === id) ?? null;
    this.detailError = '';
    this.detailLoading = true;
    this.purchaseService.getById(id).subscribe({
      next: (p) => {
        this.detail = p;
        this.detailLoading = false;
      },
      error: (err) => {
        this.detailError = parseApiError(err, 'No se pudo cargar la compra.').message;
        this.detailLoading = false;
      },
    });
    if (!this.detail) this.detail = { id } as PurchaseResponse;
  }

  closeDetail(): void {
    this.detail = null;
    if (this.route.snapshot.queryParamMap.get('ver')) {
      this.router.navigate([], { queryParams: { ver: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  /* ── Anular ─── */
  openAnnul(p: PurchaseResponse, event?: Event): void {
    event?.stopPropagation();
    this.annulTarget = p;
    this.annulError = '';
  }

  confirmAnnul(motivo: string): void {
    if (!this.annulTarget) return;
    this.annulling = true;
    this.annulError = '';
    this.purchaseService.annul(this.annulTarget.id, { motivo }).subscribe({
      next: (updated) => {
        this.annulling = false;
        this.annulTarget = null;
        if (this.detail?.id === updated.id) this.detail = updated;
        this.purchases = this.purchases.map(p => (p.id === updated.id ? updated : p));
        this.applyFilters();
      },
      error: (err) => {
        this.annulError = parseApiError(err, 'No se pudo anular la compra.').message;
        this.annulling = false;
      },
    });
  }

  purchaseTitle(p: PurchaseResponse): string {
    return p.codigo ? `el lote ${p.codigo}` : `la compra #${p.id}`;
  }
}
