import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryResponse } from '../../core/models/category.model';
import {
  LOW_STOCK_VARIANT,
  PRESET_COLORES,
  PRESET_TALLAS,
  PRESET_TALLAS_NUM,
  ProductResponse,
  ProductVariant,
  variantLabel,
} from '../../core/models/product.model';
import { InventoryMovementResponse, motivoLabel } from '../../core/models/inventory.model';
import { parseApiError } from '../../core/utils/api-error';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';
import {
  ProductQuickCreateComponent,
  QuickCreateResult,
} from '../../shared/components/product-quick-create/product-quick-create.component';

const SIN = '—';
const TALLA_ORDER = [...PRESET_TALLAS, ...PRESET_TALLAS_NUM];

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe, FechaCoPipe, ProductQuickCreateComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly inventoryService = inject(InventoryService);
  private readonly auth = inject(AuthService);

  readonly isAdmin = this.auth.isAdmin();
  readonly variantLabel = variantLabel;
  readonly motivoLabel = motivoLabel;
  readonly presetTallas = PRESET_TALLAS;
  readonly presetTallasNum = PRESET_TALLAS_NUM;
  readonly presetColores = PRESET_COLORES;
  readonly SIN = SIN;

  productId = 0;
  product = signal<ProductResponse | null>(null);
  loading = true;
  error = '';
  categories: CategoryResponse[] = [];

  /* ── Datos generales ─── */
  form = { nombre: '', categoriaId: null as number | null, marca: '', precioVenta: null as number | null, activo: true };
  savingInfo = false;
  infoError = '';
  infoFieldErrors: Record<string, string> = {};
  infoSaved = false;

  /* ── Matriz ─── */
  readonly activeVariants = computed(() => this.product()?.variantes.filter(v => v.activo) ?? []);

  readonly hasRealVariants = computed(() => this.activeVariants().some(v => v.talla || v.color));

  readonly tallas = computed(() => {
    const set = new Set(this.activeVariants().map(v => v.talla ?? SIN));
    return [...set].sort(compareTalla);
  });

  readonly colores = computed(() => {
    const seen: string[] = [];
    for (const v of this.activeVariants()) {
      const c = v.color ?? SIN;
      if (!seen.includes(c)) seen.push(c);
    }
    return seen;
  });

  private readonly cellMap = computed(() => {
    const map = new Map<string, ProductVariant>();
    for (const v of this.activeVariants()) map.set(key(v.color ?? SIN, v.talla ?? SIN), v);
    return map;
  });

  readonly outVariants = computed(() => this.activeVariants().filter(v => v.stockActual === 0).length);

  /* ── Generar variantes ─── */
  showMatrixModal = false;
  mxTallas = signal<string[]>([]);
  mxColores = signal<string[]>([]);
  mxCustomTalla = '';
  mxCustomColor = '';
  mxPrecio: number | null = null;
  mxSaving = false;
  mxError = '';

  readonly mxNewCombos = computed(() => {
    const tallas = this.mxTallas();
    const colores = this.mxColores();
    if (!tallas.length && !colores.length) return 0;
    const existing = new Set(this.product()?.variantes.map(v => key(v.color ?? SIN, v.talla ?? SIN)) ?? []);
    let count = 0;
    for (const c of colores.length ? colores : [SIN]) {
      for (const t of tallas.length ? tallas : [SIN]) {
        if (!existing.has(key(c, t))) count++;
      }
    }
    return count;
  });

  /* ── Agregar variante ─── */
  showAddVariant = false;

  /* ── Editar variante ─── */
  editing: ProductVariant | null = null;
  vForm = { talla: '', color: '', sku: '', precioVenta: null as number | null, activo: true };
  vSaving = false;
  vError = '';

  deactivating: ProductVariant | null = null;
  deactivatingBusy = false;
  deactivateError = '';

  /* ── Movimientos ─── */
  movements: InventoryMovementResponse[] = [];
  movementsLoading = false;
  movementsLimit = 15;

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({ next: (c) => (this.categories = c) });
    this.route.paramMap.subscribe(params => {
      this.productId = Number(params.get('id'));
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.productService.getById(this.productId).subscribe({
      next: (p) => {
        this.setProduct(p);
        this.loading = false;
        this.loadMovements();
      },
      error: (err) => {
        this.error = parseApiError(err, 'No se pudo cargar el producto.').message;
        this.loading = false;
      },
    });
  }

  private setProduct(p: ProductResponse): void {
    this.product.set(p);
    this.form = {
      nombre: p.nombre,
      categoriaId: p.categoriaId,
      marca: p.marca ?? '',
      precioVenta: p.precioVenta,
      activo: p.activo,
    };
  }

  private refresh(): void {
    this.productService.getById(this.productId).subscribe({
      next: (p) => this.setProduct(p),
    });
    this.loadMovements();
  }

  loadMovements(): void {
    this.movementsLoading = true;
    this.inventoryService.getByProduct(this.productId).subscribe({
      next: (data) => {
        this.movements = data;
        this.movementsLoading = false;
      },
      error: () => (this.movementsLoading = false),
    });
  }

  back(): void {
    this.router.navigate(['/products']);
  }

  /* ── Datos generales ─── */
  saveInfo(): void {
    if (!this.isAdmin || this.savingInfo) return;
    this.infoError = '';
    this.infoFieldErrors = {};
    this.infoSaved = false;
    if (!this.form.nombre.trim()) {
      this.infoFieldErrors = { nombre: 'El nombre es obligatorio.' };
      return;
    }
    this.savingInfo = true;
    this.productService.update(this.productId, {
      nombre: this.form.nombre.trim(),
      categoriaId: this.form.categoriaId,
      marca: this.form.marca.trim() || null,
      precioVenta: this.form.precioVenta,
      activo: this.form.activo,
    }).subscribe({
      next: (p) => {
        this.setProduct(p);
        this.savingInfo = false;
        this.infoSaved = true;
      },
      error: (err) => {
        const parsed = parseApiError(err, 'No se pudo guardar el producto.');
        this.infoFieldErrors = parsed.fieldErrors;
        this.infoError = parsed.message;
        this.savingInfo = false;
      },
    });
  }

  /* ── Matriz ─── */
  cell(color: string, talla: string): ProductVariant | undefined {
    return this.cellMap().get(key(color, talla));
  }

  cellClass(v: ProductVariant | undefined): string {
    if (!v) return 'cell-missing';
    if (v.stockActual === 0) return 'cell-out';
    if (v.stockActual <= LOW_STOCK_VARIANT) return 'cell-low';
    return 'cell-ok';
  }

  rowTotal(color: string): number {
    return this.tallas().reduce((sum, t) => sum + (this.cell(color, t)?.stockActual ?? 0), 0);
  }

  colTotal(talla: string): number {
    return this.colores().reduce((sum, c) => sum + (this.cell(c, talla)?.stockActual ?? 0), 0);
  }

  onCellClick(color: string, talla: string): void {
    if (!this.isAdmin) return;
    const v = this.cell(color, talla);
    if (v) this.openEdit(v);
    else this.createSingle(color, talla);
  }

  private createSingle(color: string, talla: string): void {
    this.mxError = '';
    this.productService.createVariant(this.productId, {
      talla: talla === SIN ? null : talla,
      color: color === SIN ? null : color,
    }).subscribe({
      next: () => this.refresh(),
      error: (err) => (this.error = parseApiError(err).message),
    });
  }

  variantStatus(v: ProductVariant): { cls: string; label: string } {
    if (!v.activo) return { cls: 'status-inactive', label: 'Inactiva' };
    if (v.stockActual === 0) return { cls: 'status-out', label: 'Agotada' };
    if (v.stockActual <= LOW_STOCK_VARIANT) return { cls: 'status-low', label: 'Stock bajo' };
    return { cls: 'status-active', label: 'Disponible' };
  }

  /* ── Generar variantes ─── */
  openMatrixModal(): void {
    const tallas = this.tallas().filter(t => t !== SIN);
    const colores = this.colores().filter(c => c !== SIN);
    this.mxTallas.set(tallas);
    this.mxColores.set(colores);
    this.mxPrecio = null;
    this.mxError = '';
    this.showMatrixModal = true;
  }

  toggleMxTalla(t: string): void { this.mxTallas.update(l => toggle(l, t)); }
  toggleMxColor(c: string): void { this.mxColores.update(l => toggle(l, c)); }

  addMxTalla(): void {
    const v = this.mxCustomTalla.trim().toUpperCase();
    if (v && !this.mxTallas().includes(v)) this.mxTallas.update(l => [...l, v]);
    this.mxCustomTalla = '';
  }

  addMxColor(): void {
    const raw = this.mxCustomColor.trim();
    const v = raw ? raw[0].toUpperCase() + raw.slice(1) : '';
    if (v && !this.mxColores().includes(v)) this.mxColores.update(l => [...l, v]);
    this.mxCustomColor = '';
  }

  get mxExtraTallas(): string[] {
    return this.mxTallas().filter(t => !TALLA_ORDER.includes(t));
  }

  get mxExtraColores(): string[] {
    return this.mxColores().filter(c => !PRESET_COLORES.includes(c));
  }

  saveMatrix(): void {
    if (this.mxSaving) return;
    if (!this.mxTallas().length && !this.mxColores().length) {
      this.mxError = 'Elige al menos una talla o un color.';
      return;
    }
    this.mxSaving = true;
    this.mxError = '';
    this.productService.createMatrix(this.productId, {
      tallas: this.mxTallas(),
      colores: this.mxColores(),
      precioVenta: this.mxPrecio,
    }).subscribe({
      next: () => {
        this.mxSaving = false;
        this.showMatrixModal = false;
        this.refresh();
      },
      error: (err) => {
        this.mxError = parseApiError(err, 'No se pudieron generar las variantes.').message;
        this.mxSaving = false;
      },
    });
  }

  /* ── Agregar variante ─── */
  onVariantCreated(_: QuickCreateResult): void {
    this.showAddVariant = false;
    this.refresh();
  }

  /* ── Editar variante ─── */
  openEdit(v: ProductVariant): void {
    if (!this.isAdmin) return;
    this.editing = v;
    this.vForm = {
      talla: v.talla ?? '',
      color: v.color ?? '',
      sku: v.sku ?? '',
      precioVenta: v.tienePrecioPropio ? v.precioVenta : null,
      activo: v.activo,
    };
    this.vError = '';
  }

  closeEdit(): void {
    if (!this.vSaving) this.editing = null;
  }

  saveVariant(): void {
    if (!this.editing || this.vSaving) return;
    this.vSaving = true;
    this.vError = '';
    this.productService.updateVariant(this.editing.id, {
      talla: this.vForm.talla.trim() || null,
      color: this.vForm.color.trim() || null,
      sku: this.vForm.sku.trim() || null,
      precioVenta: this.vForm.precioVenta,
      activo: this.vForm.activo,
    }).subscribe({
      next: () => {
        this.vSaving = false;
        this.editing = null;
        this.refresh();
      },
      error: (err) => {
        this.vError = parseApiError(err, 'No se pudo guardar la variante.').message;
        this.vSaving = false;
      },
    });
  }

  reactivate(v: ProductVariant): void {
    this.productService.updateVariant(v.id, {
      talla: v.talla, color: v.color, sku: v.sku,
      precioVenta: v.tienePrecioPropio ? v.precioVenta : null,
      activo: true,
    }).subscribe({
      next: () => this.refresh(),
      error: (err) => (this.error = parseApiError(err).message),
    });
  }

  openDeactivate(v: ProductVariant): void {
    this.deactivating = v;
    this.deactivateError = '';
  }

  confirmDeactivate(): void {
    if (!this.deactivating) return;
    this.deactivatingBusy = true;
    this.productService.deleteVariant(this.deactivating.id).subscribe({
      next: () => {
        this.deactivatingBusy = false;
        this.deactivating = null;
        this.editing = null;
        this.refresh();
      },
      error: (err) => {
        this.deactivateError = parseApiError(err, 'No se pudo desactivar la variante.').message;
        this.deactivatingBusy = false;
      },
    });
  }
}

function key(color: string, talla: string): string {
  return `${color.toLowerCase()}|${talla.toLowerCase()}`;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

function compareTalla(a: string, b: string): number {
  const ia = TALLA_ORDER.indexOf(a.toUpperCase());
  const ib = TALLA_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  const na = Number(a), nb = Number(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}
