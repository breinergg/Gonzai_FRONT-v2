import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LotService } from '../../core/services/lot.service';
import { SupplierService } from '../../core/services/supplier.service';
import { LotSummary, INGRESOS_TOOLTIP } from '../../core/models/lot.model';
import { SupplierResponse } from '../../core/models/supplier.model';
import { isAnulado } from '../../core/models/common.model';
import { parseApiError } from '../../core/utils/api-error';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';

@Component({
  selector: 'app-lots',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe, FechaCoPipe],
  templateUrl: './lots.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './lots.component.css'],
})
export class LotsComponent implements OnInit {
  private readonly lotService = inject(LotService);
  private readonly supplierService = inject(SupplierService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ingresosTooltip = INGRESOS_TOOLTIP;
  readonly isAnulado = isAnulado;

  lots: LotSummary[] = [];
  filtered: LotSummary[] = [];
  suppliers: SupplierResponse[] = [];

  proveedorId: number | null = null;
  soloConStock = false;
  showAnnulled = false;
  searchTerm = '';
  loading = true;
  error = '';
  searchError = '';
  searchingCode = false;

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('proveedor')) this.proveedorId = Number(qp.get('proveedor'));
    if (qp.get('conStock') === '1') this.soloConStock = true;

    this.supplierService.getAll().subscribe({ next: (s) => (this.suppliers = s), error: () => {} });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.lotService.getAll(this.proveedorId, this.soloConStock).subscribe({
      next: (data) => {
        this.lots = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = parseApiError(err, 'Error al cargar los lotes').message;
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.searchError = '';
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.lots.filter(l => {
      if (!this.showAnnulled && isAnulado(l.estado)) return false;
      if (!term) return true;
      return `${l.codigo ?? ''} ${l.nombre ?? ''} ${l.proveedorNombre}`.toLowerCase().includes(term);
    });
  }

  /** Enter en el buscador: si no hay coincidencia local, busca el código exacto en el servidor. */
  searchByCode(): void {
    const code = this.searchTerm.trim();
    if (!code) return;
    if (this.filtered.length === 1) {
      this.open(this.filtered[0]);
      return;
    }
    if (this.filtered.length) return;
    this.searchingCode = true;
    this.lotService.getByCode(code).subscribe({
      next: (lot) => {
        this.searchingCode = false;
        this.router.navigate(['/lots', lot.compraProveedorId]);
      },
      error: (err) => {
        this.searchingCode = false;
        this.searchError = parseApiError(err, `Lote ${code} no encontrado.`).message;
      },
    });
  }

  toggleStock(): void {
    this.soloConStock = !this.soloConStock;
    this.load();
  }

  open(lot: LotSummary): void {
    this.router.navigate(['/lots', lot.compraProveedorId]);
  }

  get active(): LotSummary[] {
    return this.filtered.filter(l => !isAnulado(l.estado));
  }

  get totalInversion(): number {
    return this.active.reduce((acc, l) => acc + l.inversionTotal, 0);
  }

  get totalIngresos(): number {
    return this.active.reduce((acc, l) => acc + l.ingresos, 0);
  }

  get totalGananciaNeta(): number {
    return this.active.reduce((acc, l) => acc + l.gananciaNeta, 0);
  }

  get annulledCount(): number {
    return this.lots.filter(l => isAnulado(l.estado)).length;
  }

  pct(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  soldBarClass(lot: LotSummary): string {
    if (lot.porcentajeVendido >= 100) return 'bar-ok';
    if (lot.porcentajeVendido >= 50) return 'bar-gold';
    return 'bar-low';
  }
}
