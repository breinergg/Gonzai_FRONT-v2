import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { ProductRequest, ProductResponse } from '../../core/models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: ProductResponse[] = [];
  filteredProducts: ProductResponse[] = [];
  searchTerm = '';
  categoryFilter: number | string = '';
  loading = true;
  error = '';

  showModal = false;
  showDeleteModal = false;
  editingProduct: ProductResponse | null = null;
  deletingProduct: ProductResponse | null = null;
  saving = false;

  form: ProductRequest = {
    nombre: '',
    categoriaId: null,
    precioCompra: null,
    precioVenta: null,
    stockActual: 0,
    activo: true,
  };

  categories: { id: number; nombre: string }[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        const catMap = new Map<number, string>();
        data.forEach(p => {
          if (p.categoria && p.categoriaId) {
            catMap.set(p.categoriaId, p.categoria.nombre);
          }
        });
        this.categories = Array.from(catMap.entries()).map(([id, nombre]) => ({ id, nombre }));
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar los productos';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.products];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.categoria?.nombre?.toLowerCase().includes(term)
      );
    }

    if (this.categoryFilter !== '') {
      const catId = Number(this.categoryFilter);
      result = result.filter(p => p.categoriaId === catId);
    }

    this.filteredProducts = result;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  get totalProducts(): number {
    return this.products.length;
  }

  get outOfStock(): number {
    return this.products.filter(p => p.stockActual === 0).length;
  }

  openCreateModal(): void {
    this.editingProduct = null;
    this.form = { nombre: '', categoriaId: null, precioCompra: null, precioVenta: null, stockActual: 0, activo: true };
    this.showModal = true;
  }

  openEditModal(product: ProductResponse): void {
    this.editingProduct = product;
    this.form = {
      nombre: product.nombre,
      categoriaId: product.categoriaId,
      precioCompra: product.precioCompra,
      precioVenta: product.precioVenta,
      stockActual: product.stockActual,
      activo: product.activo,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingProduct = null;
  }

  saveProduct(): void {
    if (!this.form.nombre.trim()) return;

    this.saving = true;

    if (this.editingProduct) {
      this.productService.update(this.editingProduct.id, this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadProducts();
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al actualizar el producto';
        }
      });
    } else {
      this.productService.create(this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadProducts();
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al crear el producto';
        }
      });
    }
  }

  openDeleteModal(product: ProductResponse): void {
    this.deletingProduct = product;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingProduct = null;
  }

  confirmDelete(): void {
    if (!this.deletingProduct) return;
    this.productService.delete(this.deletingProduct.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadProducts();
      },
      error: () => {
        this.error = 'Error al eliminar el producto';
        this.closeDeleteModal();
      }
    });
  }

  getStatusClass(product: ProductResponse): string {
    if (!product.activo) return 'status-inactive';
    if (product.stockActual === 0) return 'status-out';
    if (product.stockActual <= 10) return 'status-low';
    return 'status-active';
  }

  getStatusLabel(product: ProductResponse): string {
    if (!product.activo) return 'Inactivo';
    if (product.stockActual === 0) return 'Agotado';
    if (product.stockActual <= 10) return 'Stock bajo';
    return 'Disponible';
  }

  getStockPercent(product: ProductResponse): number {
    const max = Math.max(...this.products.map(p => p.stockActual), 1);
    return Math.min((product.stockActual / max) * 100, 100);
  }

  getStockBarClass(product: ProductResponse): string {
    if (product.stockActual === 0) return 'bar-out';
    if (product.stockActual <= 10) return 'bar-low';
    return 'bar-ok';
  }
}
