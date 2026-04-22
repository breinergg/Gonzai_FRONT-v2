import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductCreateRequest, ProductUpdateRequest, ProductResponse } from '../../core/models/product.model';

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

  form = {
    nombre: '',
    categoriaId: null as number | null,
    precioCompra: null as number | null,
    precioVenta: null as number | null,
    stockActual: 0,
    activo: true,
  };

  categories: { id: number; nombre: string }[] = [];

  // Mini-modal categoría
  showCategoryModal = false;
  newCategoryName = '';
  savingCategory = false;
  categoryError = '';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => { this.categories = data; },
      error: () => {}
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
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
      const updatePayload: ProductUpdateRequest = {
        nombre: this.form.nombre.trim(),
        categoriaId: this.form.categoriaId ? Number(this.form.categoriaId) : null,
        precioCompra: this.form.precioCompra !== null ? Number(this.form.precioCompra) : null,
        precioVenta: this.form.precioVenta !== null ? Number(this.form.precioVenta) : null,
        activo: this.form.activo,
      };
      this.productService.update(this.editingProduct.id, updatePayload).subscribe({
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
      const createPayload: ProductCreateRequest = {
        nombre: this.form.nombre.trim(),
        categoriaId: this.form.categoriaId ? Number(this.form.categoriaId) : null,
        precioCompra: this.form.precioCompra !== null ? Number(this.form.precioCompra) : null,
        precioVenta: this.form.precioVenta !== null ? Number(this.form.precioVenta) : null,
        stockActual: Number(this.form.stockActual) || 0,
      };
      this.productService.create(createPayload).subscribe({
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
      error: (err) => {
        console.error('[delete error]', err.status, err.error);
        this.error = 'Error al desactivar el producto';
        this.closeDeleteModal();
      }
    });
  }

  /* ── Mini-modal categoría ─── */
  openCategoryModal(): void {
    this.newCategoryName = '';
    this.categoryError = '';
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.newCategoryName = '';
    this.categoryError = '';
  }

  saveCategory(): void {
    const nombre = this.newCategoryName.trim();
    if (!nombre) { this.categoryError = 'El nombre es obligatorio'; return; }
    if (nombre.length > 100) { this.categoryError = 'Máximo 100 caracteres'; return; }

    this.savingCategory = true;
    this.categoryError = '';
    this.categoryService.create({ nombre }).subscribe({
      next: (cat) => {
        this.savingCategory = false;
        this.categories = [...this.categories, { id: cat.id, nombre: cat.nombre }];
        this.form.categoriaId = cat.id;
        this.closeCategoryModal();
      },
      error: () => {
        this.savingCategory = false;
        this.categoryError = 'Error al crear la categoría';
      }
    });
  }

  getCategoryName(product: ProductResponse): string | null {
    if (product.categoria) return product.categoria.nombre;
    const cat = this.categories.find(c => c.id === product.categoriaId);
    return cat?.nombre ?? null;
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
