import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryResponse } from '../../core/models/category.model';
import {
  LOW_STOCK_PRODUCT,
  LOW_STOCK_VARIANT,
  ProductResponse,
  ProductVariant,
  variantLabel,
} from '../../core/models/product.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';
import {
  ProductQuickCreateComponent,
  QuickCreateResult,
} from '../../shared/components/product-quick-create/product-quick-create.component';

type StatusFilter = 'activos' | 'inactivos' | 'todos';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe, FechaCoPipe, ProductQuickCreateComponent],
  templateUrl: './products.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './products.component.css'],
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  products: ProductResponse[] = [];
  filteredProducts: ProductResponse[] = [];
  categories: CategoryResponse[] = [];

  searchTerm = '';
  categoryFilter: number | '' = '';
  statusFilter: StatusFilter = 'activos';
  stockFilter: '' | 'bajo' | 'agotado' = '';

  loading = true;
  error = '';
  notice = '';

  expanded = new Set<number>();

  showCreateModal = false;

  deletingProduct: ProductResponse | null = null;
  deleting = false;
  deleteError = '';

  readonly variantLabel = variantLabel;
  readonly isAdmin = this.auth.isAdmin();

  ngOnInit(): void {
    this.loadProducts();
    this.categoryService.getAll().subscribe({ next: (data) => (this.categories = data) });
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
      error: (err) => {
        this.error = apiErrorMessage(err, 'Error al cargar los productos');
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const catId = this.categoryFilter === '' ? null : Number(this.categoryFilter);

    this.filteredProducts = this.products.filter(p => {
      if (this.statusFilter === 'activos' && !p.activo) return false;
      if (this.statusFilter === 'inactivos' && p.activo) return false;
      if (catId !== null && p.categoriaId !== catId) return false;
      if (this.stockFilter === 'agotado' && p.stockTotal > 0) return false;
      if (this.stockFilter === 'bajo' && !(p.stockTotal > 0 && p.stockTotal <= LOW_STOCK_PRODUCT)) return false;
      if (!term) return true;
      const text = [
        p.nombre, p.marca, p.categoriaNombre,
        ...p.variantes.flatMap(v => [v.talla, v.color, v.sku]),
      ].join(' ').toLowerCase();
      return text.includes(term);
    });
  }

  /* ── Filas ─── */
  toggleExpand(product: ProductResponse, event?: Event): void {
    event?.stopPropagation();
    if (this.expanded.has(product.id)) this.expanded.delete(product.id);
    else this.expanded.add(product.id);
  }

  openDetail(product: ProductResponse): void {
    this.router.navigate(['/products', product.id]);
  }

  activeVariants(product: ProductResponse): ProductVariant[] {
    return product.variantes.filter(v => v.activo);
  }

  hasRealVariants(product: ProductResponse): boolean {
    return product.variantes.some(v => v.talla || v.color);
  }

  priceRange(product: ProductResponse): { min: number | null; max: number | null } {
    const prices = this.activeVariants(product)
      .map(v => v.precioVenta)
      .filter((p): p is number => p !== null);
    if (!prices.length) return { min: product.precioVenta, max: product.precioVenta };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }

  variantsSummary(product: ProductResponse): string {
    const active = this.activeVariants(product);
    const tallas = new Set(active.map(v => v.talla).filter(Boolean));
    const colores = new Set(active.map(v => v.color).filter(Boolean));
    const parts: string[] = [];
    if (tallas.size) parts.push(`${tallas.size} talla${tallas.size > 1 ? 's' : ''}`);
    if (colores.size) parts.push(`${colores.size} color${colores.size > 1 ? 'es' : ''}`);
    return parts.join(' · ');
  }

  /** Texto unificado para la columna Variantes (con y sin talla/color). */
  variantCell(product: ProductResponse): { count: number; label: string } {
    const active = this.activeVariants(product);
    const count = active.length || 1;
    if (!this.hasRealVariants(product)) {
      return { count: 1, label: 'Prenda única' };
    }
    const summary = this.variantsSummary(product);
    return { count, label: summary || `${count} variantes` };
  }

  getStatusClass(product: ProductResponse): string {
    if (!product.activo) return 'status-inactive';
    if (product.stockTotal === 0) return 'status-out';
    if (product.stockTotal <= LOW_STOCK_PRODUCT) return 'status-low';
    return 'status-active';
  }

  getStatusLabel(product: ProductResponse): string {
    if (!product.activo) return 'Inactivo';
    if (product.stockTotal === 0) return 'Agotado';
    if (product.stockTotal <= LOW_STOCK_PRODUCT) return 'Stock bajo';
    return 'Disponible';
  }

  getStockPercent(product: ProductResponse): number {
    const max = Math.max(...this.products.map(p => p.stockTotal), 1);
    return Math.min((product.stockTotal / max) * 100, 100);
  }

  getStockBarClass(stock: number, low = LOW_STOCK_PRODUCT): string {
    if (stock === 0) return 'bar-out';
    if (stock <= low) return 'bar-low';
    return 'bar-ok';
  }

  variantStatus(v: ProductVariant): { cls: string; label: string } {
    if (!v.activo) return { cls: 'status-inactive', label: 'Inactiva' };
    if (v.stockActual === 0) return { cls: 'status-out', label: 'Agotada' };
    if (v.stockActual <= LOW_STOCK_VARIANT) return { cls: 'status-low', label: 'Stock bajo' };
    return { cls: 'status-active', label: 'Disponible' };
  }

  /* ── Crear ─── */
  onCreated(result: QuickCreateResult): void {
    this.showCreateModal = false;
    if (result.product) {
      this.notice = `Producto "${result.product.nombre}" creado con ${result.variants.length} variante${result.variants.length === 1 ? '' : 's'}.`;
      this.expanded.add(result.product.id);
    }
    this.loadProducts();
  }

  /* ── Desactivar ─── */
  openDeleteModal(product: ProductResponse, event: Event): void {
    event.stopPropagation();
    this.deletingProduct = product;
    this.deleteError = '';
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.deletingProduct = null;
  }

  confirmDelete(): void {
    if (!this.deletingProduct) return;
    this.deleting = true;
    this.productService.delete(this.deletingProduct.id).subscribe({
      next: () => {
        this.deleting = false;
        this.deletingProduct = null;
        this.loadProducts();
      },
      error: (err) => {
        this.deleting = false;
        this.deleteError = apiErrorMessage(err, 'Error al desactivar el producto');
      },
    });
  }
}
