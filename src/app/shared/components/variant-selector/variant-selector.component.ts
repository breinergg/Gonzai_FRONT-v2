import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ProductResponse, ProductVariant, LOW_STOCK_VARIANT, variantLabel } from '../../../core/models/product.model';
import { CopPipe } from '../../pipes/cop.pipe';

interface ResultGroup {
  product: ProductResponse;
  variants: ProductVariant[];
}

const MAX_GROUPS = 8;

@Component({
  selector: 'app-variant-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, CopPipe],
  templateUrl: './variant-selector.component.html',
  styleUrls: ['../../styles/gz-ui.css', './variant-selector.component.css'],
})
export class VariantSelectorComponent implements OnInit, OnChanges, OnDestroy {
  private readonly products = inject(ProductService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Variante actualmente elegida (para mostrar su nombre). */
  @Input() selectedId: number | null = null;
  /** Nombre a mostrar si la variante elegida aún no está en el catálogo cargado. */
  @Input() selectedLabel: string | null = null;
  @Input() placeholder = 'Buscar producto, talla o color…';
  /** En compras se permite elegir variantes sin stock; en ventas se advierte. */
  @Input() allowOutOfStock = true;
  /** Muestra la opción "Crear producto o variante" al final de los resultados. */
  @Input() allowCreate = false;
  @Input() compact = false;
  @Input() invalid = false;
  /** Variantes que ya no se pueden elegir (p. ej. ya están en el carrito). */
  @Input() excludeIds: number[] = [];

  @Output() selected = new EventEmitter<ProductVariant>();
  @Output() createRequested = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly lowStock = LOW_STOCK_VARIANT;
  readonly variantLabel = variantLabel;

  term = signal('');
  open = signal(false);
  dropdownStyle: Record<string, string> = {};

  readonly loading = this.products.catalogLoading;

  readonly selectedVariant = computed<ProductVariant | null>(() => {
    const id = this.selectedIdSignal();
    if (id === null) return null;
    return this.products.catalogVariants().find(v => v.id === id) ?? null;
  });

  readonly results = computed<ResultGroup[]>(() => {
    const tokens = normalize(this.term()).split(/\s+/).filter(Boolean);
    const excluded = new Set(this.excludeIdsSignal());
    const groups: ResultGroup[] = [];

    for (const product of this.products.catalog()) {
      const base = normalize([product.nombre, product.marca, product.categoriaNombre].join(' '));
      const variants = product.variantes.filter(v => {
        if (!v.activo || excluded.has(v.id)) return false;
        if (!tokens.length) return true;
        const text = `${base} ${normalize([v.talla, v.color, v.sku].join(' '))}`;
        return tokens.every(t => text.includes(t));
      });
      if (variants.length) groups.push({ product, variants });
      if (groups.length >= MAX_GROUPS) break;
    }
    return groups;
  });

  private selectedIdSignal = signal<number | null>(null);
  private excludeIdsSignal = signal<number[]>([]);

  ngOnInit(): void {
    this.products.loadCatalog();
    document.addEventListener('scroll', this.onAnyScroll, true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedId']) this.selectedIdSignal.set(this.selectedId);
    if (changes['excludeIds']) {
      const next = this.excludeIds ?? [];
      const prev = this.excludeIdsSignal();
      if (next.length !== prev.length || next.some((id, i) => id !== prev[i])) this.excludeIdsSignal.set(next);
    }
  }

  get displayValue(): string {
    if (this.open()) return this.term();
    const v = this.selectedVariant();
    return v?.nombreCompleto ?? this.selectedLabel ?? this.term();
  }

  onFocus(): void {
    if (!this.open()) this.term.set('');
    this.openDropdown();
  }

  onInput(value: string): void {
    this.term.set(value);
    this.openDropdown();
  }

  openDropdown(): void {
    this.updatePosition();
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  pick(variant: ProductVariant): void {
    this.selected.emit(variant);
    this.term.set('');
    this.close();
    this.searchInput?.nativeElement.blur();
  }

  pickProduct(group: ResultGroup): void {
    if (group.variants.length === 1) this.pick(group.variants[0]);
  }

  /** Enter: si solo hay una opción posible se elige directamente. */
  onEnter(event: Event): void {
    event.preventDefault();
    const all = this.results().flatMap(g => g.variants);
    if (all.length === 1) this.pick(all[0]);
  }

  requestCreate(): void {
    this.createRequested.emit(this.term().trim());
    this.close();
  }

  isUnique(group: ResultGroup): boolean {
    return group.variants.length === 1 && !group.variants[0].talla && !group.variants[0].color;
  }

  stockClass(v: ProductVariant): string {
    if (v.stockActual <= 0) return 'vs-out';
    if (v.stockActual <= this.lowStock) return 'vs-low';
    return 'vs-ok';
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) this.close();
  }

  @HostListener('window:resize')
  onViewportChange(): void {
    if (this.open()) this.updatePosition();
  }

  /** El evento scroll no burbujea: se escucha en captura para seguir al input dentro de contenedores con scroll. */
  private readonly onAnyScroll = (event: Event) => {
    if (!this.open()) return;
    const dropdown = this.host.nativeElement.querySelector('.vs-dropdown');
    if (dropdown && dropdown.contains(event.target as Node)) return;
    this.updatePosition();
  };

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onAnyScroll, true);
  }

  private updatePosition(): void {
    const input = this.searchInput?.nativeElement;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const width = Math.max(rect.width, 380);
    const left = Math.min(rect.left, window.innerWidth - width - 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 260 && rect.top > spaceBelow;

    this.dropdownStyle = {
      left: `${Math.max(12, left)}px`,
      width: `${width}px`,
      ...(openUp
        ? { bottom: `${window.innerHeight - rect.top + 6}px`, maxHeight: `${Math.min(360, rect.top - 18)}px` }
        : { top: `${rect.bottom + 6}px`, maxHeight: `${Math.min(360, spaceBelow - 18)}px` }),
    };
  }
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
