import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupplierService } from '../../core/services/supplier.service';
import { SupplierResponse } from '../../core/models/supplier.model';
import { parseApiError } from '../../core/utils/api-error';
import { initials } from '../../core/utils/format';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FechaCoPipe],
  templateUrl: './suppliers.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css'],
})
export class SuppliersComponent implements OnInit {
  private readonly supplierService = inject(SupplierService);

  suppliers: SupplierResponse[] = [];
  filtered: SupplierResponse[] = [];
  searchTerm = '';
  statusFilter: 'activos' | 'todos' = 'activos';
  loading = true;
  error = '';

  showModal = false;
  editing: SupplierResponse | null = null;
  form = { nombre: '', documento: '', telefono: '', direccion: '', activo: true };
  saving = false;
  formError = '';
  fieldErrors: Record<string, string> = {};

  deleting: SupplierResponse | null = null;
  deletingBusy = false;
  deleteError = '';

  readonly initials = initials;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.supplierService.getAll().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = parseApiError(err, 'Error al cargar los proveedores').message;
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.suppliers.filter(s => {
      if (this.statusFilter === 'activos' && !s.activo) return false;
      if (!term) return true;
      return [s.nombre, s.documento, s.telefono, s.direccion].join(' ').toLowerCase().includes(term);
    });
  }

  get activeCount(): number {
    return this.suppliers.filter(s => s.activo).length;
  }

  openCreate(): void {
    this.editing = null;
    this.form = { nombre: '', documento: '', telefono: '', direccion: '', activo: true };
    this.formError = '';
    this.fieldErrors = {};
    this.showModal = true;
  }

  openEdit(s: SupplierResponse): void {
    this.editing = s;
    this.form = {
      nombre: s.nombre,
      documento: s.documento ?? '',
      telefono: s.telefono ?? '',
      direccion: s.direccion ?? '',
      activo: s.activo,
    };
    this.formError = '';
    this.fieldErrors = {};
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  save(): void {
    if (this.saving) return;
    this.formError = '';
    this.fieldErrors = {};
    if (!this.form.nombre.trim()) {
      this.fieldErrors = { nombre: 'El nombre es obligatorio.' };
      return;
    }
    const base = {
      nombre: this.form.nombre.trim(),
      documento: this.form.documento.trim() || null,
      telefono: this.form.telefono.trim() || null,
      direccion: this.form.direccion.trim() || null,
    };
    this.saving = true;
    const request$ = this.editing
      ? this.supplierService.update(this.editing.id, { ...base, activo: this.form.activo })
      : this.supplierService.create(base);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.load();
      },
      error: (err) => {
        const parsed = parseApiError(err, 'No se pudo guardar el proveedor.');
        this.fieldErrors = parsed.fieldErrors;
        this.formError = parsed.message;
        this.saving = false;
      },
    });
  }

  openDelete(s: SupplierResponse): void {
    this.deleting = s;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    this.deletingBusy = true;
    this.supplierService.delete(this.deleting.id).subscribe({
      next: () => {
        this.deletingBusy = false;
        this.deleting = null;
        this.load();
      },
      error: (err) => {
        this.deleteError = parseApiError(err, 'No se pudo desactivar el proveedor.').message;
        this.deletingBusy = false;
      },
    });
  }
}
