import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductService } from '../../core/services/product.service';
import {
  InventoryMovementRequest,
  InventoryMovementResponse,
  MOVEMENT_TYPES,
} from '../../core/models/inventory.model';
import { ProductResponse } from '../../core/models/product.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent implements OnInit {
  movements: InventoryMovementResponse[] = [];
  filteredMovements: InventoryMovementResponse[] = [];
  products: ProductResponse[] = [];

  searchTerm = '';
  typeFilter = '';
  loading = true;
  error = '';

  showModal = false;
  saving = false;

  readonly movementTypes = MOVEMENT_TYPES;

  form: InventoryMovementRequest = {
    productoId: 0,
    tipoMovimiento: 'ENTRADA',
    cantidad: 1,
    descripcion: null,
  };

  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products.filter(p => p.activo);
        this.inventoryService.getAll().subscribe({
          next: (data) => {
            this.movements = data.sort(
              (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
            this.applyFilters();
            this.loading = false;
          },
          error: () => {
            this.error = 'Error al cargar los movimientos';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Error al cargar los productos';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.movements];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(m =>
        m.productoNombre.toLowerCase().includes(term) ||
        (m.descripcion ?? '').toLowerCase().includes(term)
      );
    }

    if (this.typeFilter) {
      result = result.filter(m => m.tipoMovimiento === this.typeFilter);
    }

    this.filteredMovements = result;
  }

  onSearchChange(): void { this.applyFilters(); }
  onTypeChange(): void   { this.applyFilters(); }

  get totalMovements(): number  { return this.movements.length; }
  get totalEntradas(): number   { return this.movements.filter(m => m.tipoMovimiento === 'ENTRADA').length; }
  get totalSalidas(): number    { return this.movements.filter(m => m.tipoMovimiento === 'SALIDA').length; }

  openCreateModal(): void {
    this.form = {
      productoId: this.products[0]?.id ?? 0,
      tipoMovimiento: 'ENTRADA',
      cantidad: 1,
      descripcion: null,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveMovement(): void {
    if (!this.form.productoId || this.form.cantidad < 1) return;

    this.saving = true;
    this.inventoryService.create(this.form).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadData();
      },
      error: () => {
        this.saving = false;
        this.error = 'Error al registrar el movimiento';
      }
    });
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'ENTRADA': return 'type-entrada';
      case 'SALIDA':  return 'type-salida';
      case 'AJUSTE':  return 'type-ajuste';
      default:        return '';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'ENTRADA': return 'up';
      case 'SALIDA':  return 'down';
      case 'AJUSTE':  return 'adjust';
      default:        return '';
    }
  }

  getProductInitial(nombre: string): string {
    return nombre.charAt(0).toUpperCase();
  }
}
