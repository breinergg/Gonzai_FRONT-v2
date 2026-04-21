import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailySaleService } from '../../core/services/daily-sale.service';
import { AuthService } from '../../core/services/auth.service';
import { DailySaleRequest, DailySaleResponse, VentaMensualResumen } from '../../core/models/daily-sale.model';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css'
})
export class SalesComponent implements OnInit {
  sales: DailySaleResponse[] = [];
  filteredSales: DailySaleResponse[] = [];
  resumenMensual: VentaMensualResumen | null = null;
  loadingResumen = true;

  searchTerm = '';
  dateFrom = '';
  dateTo = '';
  loading = true;
  error = '';

  showModal = false;
  showDeleteModal = false;
  editingSale: DailySaleResponse | null = null;
  deletingSale: DailySaleResponse | null = null;
  saving = false;

  form: DailySaleRequest = {
    fecha: this.todayIso(),
    total: 0,
    descripcion: null,
    usuarioId: null,
  };

  constructor(
    private saleService: DailySaleService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadSales();
    this.loadResumenMensual();
  }

  loadSales(): void {
    this.loading = true;
    this.error = '';
    this.saleService.getAll().subscribe({
      next: (data) => {
        this.sales = data.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar las ventas';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.sales];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(s =>
        (s.descripcion ?? '').toLowerCase().includes(term) ||
        (s.usuarioNombre ?? '').toLowerCase().includes(term)
      );
    }

    if (this.dateFrom) {
      result = result.filter(s => s.fecha >= this.dateFrom);
    }

    if (this.dateTo) {
      result = result.filter(s => s.fecha <= this.dateTo);
    }

    this.filteredSales = result;
  }

  onSearchChange(): void { this.applyFilters(); }
  onDateChange(): void   { this.applyFilters(); }

  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  loadResumenMensual(): void {
    this.loadingResumen = true;
    this.saleService.getResumenMensual().subscribe({
      next: (data) => { this.resumenMensual = data; this.loadingResumen = false; },
      error: () => { this.loadingResumen = false; }
    });
  }

  /* ── Stats ─── */
  get totalSales(): number { return this.sales.length; }

  get totalRevenue(): number {
    return this.filteredSales.reduce((acc, s) => acc + s.total, 0);
  }

  get avgSale(): number {
    if (this.filteredSales.length === 0) return 0;
    return this.totalRevenue / this.filteredSales.length;
  }

  get bestSale(): number {
    if (this.filteredSales.length === 0) return 0;
    return Math.max(...this.filteredSales.map(s => s.total));
  }

  /* ── Modal ─── */
  openCreateModal(): void {
    this.editingSale = null;
    const user = this.auth.currentUser();
    this.form = {
      fecha: this.todayIso(),
      total: 0,
      descripcion: null,
      usuarioId: user?.id ?? null,
    };
    this.showModal = true;
  }

  openEditModal(sale: DailySaleResponse): void {
    this.editingSale = sale;
    this.form = {
      fecha: sale.fecha,
      total: sale.total,
      descripcion: sale.descripcion,
      usuarioId: sale.usuarioId,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingSale = null;
  }

  saveSale(): void {
    if (!this.form.fecha || this.form.total < 0) return;

    this.saving = true;

    if (this.editingSale) {
      this.saleService.update(this.editingSale.id, this.form).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadSales(); },
        error: () => { this.saving = false; this.error = 'Error al actualizar la venta'; }
      });
    } else {
      this.saleService.create(this.form).subscribe({
        next: () => { this.saving = false; this.closeModal(); this.loadSales(); },
        error: () => { this.saving = false; this.error = 'Error al registrar la venta'; }
      });
    }
  }

  openDeleteModal(sale: DailySaleResponse): void {
    this.deletingSale = sale;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingSale = null;
  }

  confirmDelete(): void {
    if (!this.deletingSale) return;
    this.saleService.delete(this.deletingSale.id).subscribe({
      next: () => { this.closeDeleteModal(); this.loadSales(); },
      error: () => { this.error = 'Error al eliminar la venta'; this.closeDeleteModal(); }
    });
  }

  /* ── Helpers ─── */
  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  getUserInitials(nombre: string | null): string {
    if (!nombre) return '?';
    return nombre.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  formatCurrency(value: number): string {
    return '$' + value.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  }

  getSaleBarPercent(sale: DailySaleResponse): number {
    const max = Math.max(...this.filteredSales.map(s => s.total), 1);
    return Math.min((sale.total / max) * 100, 100);
  }
}
