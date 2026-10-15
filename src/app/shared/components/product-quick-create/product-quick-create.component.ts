import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryResponse } from '../../../core/models/category.model';
import {
  PRESET_COLORES,
  PRESET_TALLAS,
  PRESET_TALLAS_NUM,
  ProductCreateRequest,
  ProductResponse,
  ProductVariant,
  VariantCreateRequest,
} from '../../../core/models/product.model';
import { parseApiError } from '../../../core/utils/api-error';

export interface QuickCreateResult {
  product: ProductResponse | null;
  variants: ProductVariant[];
}

type Tab = 'product' | 'variant';

@Component({
  selector: 'app-product-quick-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-quick-create.component.html',
  styleUrls: ['../../styles/gz-ui.css', './product-quick-create.component.css'],
})
export class ProductQuickCreateComponent implements OnInit {
  private readonly products = inject(ProductService);
  private readonly categoriesService = inject(CategoryService);

  @Input() initialName = '';
  @Input() initialTab: Tab = 'product';
  /** Productos: permite registrar stock inicial. En compras el stock entra por el lote. */
  @Input() withInitialStock = false;
  @Input() allowVariantTab = true;
  /** Para la pestaña "Nueva variante" con el producto ya elegido. */
  @Input() presetProductId: number | null = null;

  @Output() created = new EventEmitter<QuickCreateResult>();
  @Output() closed = new EventEmitter<void>();

  readonly presetTallas = PRESET_TALLAS;
  readonly presetTallasNum = PRESET_TALLAS_NUM;
  readonly presetColores = PRESET_COLORES;

  tab: Tab = 'product';
  saving = false;
  error = '';
  fieldErrors: Record<string, string> = {};

  categories: CategoryResponse[] = [];
  showNewCategory = false;
  newCategoryName = '';
  savingCategory = false;
  categoryError = '';

  /* ── Producto ─── */
  nombre = '';
  categoriaId: number | null = null;
  marca = '';
  precioVenta: number | null = null;
  hasVariants = false;
  tallas = signal<string[]>([]);
  colores = signal<string[]>([]);
  customTalla = '';
  customColor = '';
  stockInicial: number | null = null;
  costoInicial: number | null = null;
  stockPorCombo: Record<string, number | null> = {};

  readonly combos = computed(() => {
    const tallas = this.tallas();
    const colores = this.colores();
    if (!tallas.length && !colores.length) return [];
    const result: { talla: string | null; color: string | null; key: string }[] = [];
    for (const color of colores.length ? colores : [null]) {
      for (const talla of tallas.length ? tallas : [null]) {
        result.push({ talla, color, key: `${color ?? ''}|${talla ?? ''}` });
      }
    }
    return result;
  });

  /* ── Variante ─── */
  readonly catalog = this.products.catalog;
  variantProductId: number | null = null;
  vTalla = '';
  vColor = '';
  vSku = '';
  vPrecio: number | null = null;
  vStock: number | null = null;
  vCosto: number | null = null;

  ngOnInit(): void {
    this.tab = this.allowVariantTab ? this.initialTab : 'product';
    this.nombre = this.initialName;
    this.variantProductId = this.presetProductId;
    if (this.presetProductId) this.tab = 'variant';
    this.products.loadCatalog();
    this.categoriesService.getAll().subscribe({ next: (c) => (this.categories = c) });
  }

  setTab(tab: Tab): void {
    this.tab = tab;
    this.error = '';
    this.fieldErrors = {};
  }

  /* ── Chips ─── */
  toggleTalla(t: string): void { this.tallas.update(list => toggle(list, t)); }
  toggleColor(c: string): void { this.colores.update(list => toggle(list, c)); }

  addCustomTalla(): void {
    const value = this.customTalla.trim().toUpperCase();
    if (value && !this.tallas().includes(value)) this.tallas.update(l => [...l, value]);
    this.customTalla = '';
  }

  addCustomColor(): void {
    const raw = this.customColor.trim();
    const value = raw ? raw[0].toUpperCase() + raw.slice(1) : '';
    if (value && !this.colores().includes(value)) this.colores.update(l => [...l, value]);
    this.customColor = '';
  }

  get extraTallas(): string[] {
    return this.tallas().filter(t => !this.presetTallas.includes(t) && !this.presetTallasNum.includes(t));
  }

  get extraColores(): string[] {
    return this.colores().filter(c => !this.presetColores.includes(c));
  }

  /* ── Categoría ─── */
  saveCategory(): void {
    const nombre = this.newCategoryName.trim();
    if (!nombre) { this.categoryError = 'Escribe un nombre.'; return; }
    this.savingCategory = true;
    this.categoryError = '';
    this.categoriesService.create({ nombre }).subscribe({
      next: (cat) => {
        this.categories = [...this.categories, cat].sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.categoriaId = cat.id;
        this.showNewCategory = false;
        this.newCategoryName = '';
        this.savingCategory = false;
      },
      error: (err) => {
        this.categoryError = parseApiError(err, 'No se pudo crear la categoría.').message;
        this.savingCategory = false;
      },
    });
  }

  /* ── Guardar ─── */
  save(): void {
    if (this.saving) return;
    this.error = '';
    this.fieldErrors = {};
    if (this.tab === 'product') this.saveProduct();
    else this.saveVariant();
  }

  private saveProduct(): void {
    if (!this.nombre.trim()) {
      this.fieldErrors = { nombre: 'El nombre es obligatorio.' };
      return;
    }
    if (this.hasVariants && !this.combos().length) {
      this.error = 'Elige al menos una talla o un color, o desactiva "Maneja tallas y colores".';
      return;
    }

    const dto: ProductCreateRequest = {
      nombre: this.nombre.trim(),
      categoriaId: this.categoriaId,
      marca: this.marca.trim() || null,
      precioVenta: this.precioVenta,
    };

    if (this.hasVariants) {
      dto.variantes = this.combos().map<VariantCreateRequest>(c => ({
        talla: c.talla,
        color: c.color,
        stockInicial: this.withInitialStock ? (this.stockPorCombo[c.key] ?? 0) : 0,
        costoInicial: this.withInitialStock ? this.costoInicial : null,
      }));
    } else if (this.withInitialStock) {
      dto.stockInicial = this.stockInicial ?? 0;
      dto.costoInicial = this.costoInicial;
    }

    this.saving = true;
    this.products.create(dto).subscribe({
      next: (product) => {
        this.saving = false;
        this.created.emit({ product, variants: product.variantes });
      },
      error: (err) => this.handleError(err),
    });
  }

  private saveVariant(): void {
    if (!this.variantProductId) {
      this.fieldErrors = { producto: 'Elige el producto.' };
      return;
    }
    if (!this.vTalla.trim() && !this.vColor.trim()) {
      this.error = 'Indica al menos la talla o el color.';
      return;
    }

    this.saving = true;
    this.products.createVariant(this.variantProductId, {
      talla: this.vTalla.trim() || null,
      color: this.vColor.trim() || null,
      sku: this.vSku.trim() || null,
      precioVenta: this.vPrecio,
      stockInicial: this.withInitialStock ? (this.vStock ?? 0) : 0,
      costoInicial: this.withInitialStock ? this.vCosto : null,
    }).subscribe({
      next: (variant) => {
        this.saving = false;
        this.created.emit({ product: null, variants: [variant] });
      },
      error: (err) => this.handleError(err),
    });
  }

  private handleError(err: unknown): void {
    const parsed = parseApiError(err, 'No se pudo guardar.');
    this.fieldErrors = parsed.fieldErrors;
    this.error = parsed.message;
    this.saving = false;
  }

  close(): void {
    if (!this.saving) this.closed.emit();
  }
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}
