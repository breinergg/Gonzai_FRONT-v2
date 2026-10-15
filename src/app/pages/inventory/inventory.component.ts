import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { InventoryService } from '../../core/services/inventory.service';
import { LotService } from '../../core/services/lot.service';
import { AuthService } from '../../core/services/auth.service';
import { InventoryAdjustmentRequest, InventoryMovementResponse, MOTIVOS_MOVIMIENTO, motivoLabel } from '../../core/models/inventory.model';
import { ProductVariant, variantLabel } from '../../core/models/product.model';
import { StockAvailability } from '../../core/models/lot.model';
import { parseApiError } from '../../core/utils/api-error';
import { dayColombia, initials } from '../../core/utils/format';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';
import { VariantSelectorComponent } from '../../shared/components/variant-selector/variant-selector.component';

type Tipo = 'entrada' | 'salida';
const PAGE_SIZE = 100;
const DESC_MAX = 150;

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe, FechaCoPipe, VariantSelectorComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './inventory.component.css'],
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly lotService = inject(LotService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly isAdmin = this.auth.isAdmin();
  readonly initials = initials;
  readonly motivoLabel = motivoLabel;
  readonly motivos = Object.entries(MOTIVOS_MOVIMIENTO).map(([value, label]) => ({ value, label }));
  readonly descMax = DESC_MAX;

  movements: InventoryMovementResponse[] = [];
  filtered: InventoryMovementResponse[] = [];
  limit = PAGE_SIZE;

  searchTerm = '';
  tipoFilter: '' | Tipo = '';
  motivoFilter = '';
  desde = '';
  hasta = '';
  loading = true;
  error = '';
  successMessage = '';

  /* ── Ajuste manual ─── */
  showModal = false;
  variant: ProductVariant | null = null;
  tipo: Tipo = 'entrada';
  cantidad = 1;
  costoUnitario: number | null = null;
  descripcion = '';
  /** '' = FIFO; 'c:ID' = lote (compra); 'e:ID' = existencia puntual (inventario inicial). */
  origen = '';
  available: StockAvailability[] = [];
  loadingAvailable = false;
  saving = false;
  formError = '';
  fieldErrors: Record<string, string> = {};

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('ajuste') === '1') this.openModal();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.inventoryService.getAll().subscribe({
      next: (data) => {
        this.movements = [...data].sort((a, b) => b.id - a.id);
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = parseApiError(err, 'Error al cargar los movimientos').message;
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.limit = PAGE_SIZE;
    this.filtered = this.movements.filter(m => {
      if (this.tipoFilter && m.tipoMovimiento.toLowerCase() !== this.tipoFilter) return false;
      if (this.motivoFilter && m.motivo !== this.motivoFilter) return false;
      if (this.desde || this.hasta) {
        const day = dayColombia(m.fecha);
        if (this.desde && day < this.desde) return false;
        if (this.hasta && day > this.hasta) return false;
      }
      if (!term) return true;
      return `${m.productoNombre} ${m.varianteNombre} ${m.loteCodigo ?? ''} ${m.descripcion ?? ''} ${m.usuarioNombre}`
        .toLowerCase().includes(term);
    });
  }

  clearDates(): void {
    this.desde = '';
    this.hasta = '';
    this.applyFilters();
  }

  get visible(): InventoryMovementResponse[] {
    return this.filtered.slice(0, this.limit);
  }

  get totalEntradas(): number {
    return this.filtered.filter(m => this.isEntrada(m)).reduce((acc, m) => acc + m.cantidad, 0);
  }

  get totalSalidas(): number {
    return this.filtered.filter(m => !this.isEntrada(m)).reduce((acc, m) => acc + m.cantidad, 0);
  }

  isEntrada(m: InventoryMovementResponse): boolean {
    return m.tipoMovimiento.toLowerCase() === 'entrada';
  }

  motivoClass(motivo: string): string {
    switch (motivo) {
      case 'CompraProveedor':
      case 'InventarioInicial': return 'motivo-compra';
      case 'VentaCliente':      return 'motivo-venta';
      case 'AjusteManual':      return 'motivo-ajuste';
      default:                  return 'motivo-anulacion';
    }
  }

  /* ── Modal ─── */
  openModal(): void {
    this.variant = null;
    this.tipo = 'entrada';
    this.cantidad = 1;
    this.costoUnitario = null;
    this.descripcion = '';
    this.origen = '';
    this.available = [];
    this.formError = '';
    this.fieldErrors = {};
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  variantName(v: ProductVariant): string {
    return `${v.productoNombre} · ${variantLabel(v)}`;
  }

  onVariantSelected(v: ProductVariant): void {
    this.variant = v;
    this.costoUnitario = v.precioCompra ?? null;
    this.origen = '';
    delete this.fieldErrors['productovarianteid'];
    this.loadAvailable();
  }

  setTipo(t: Tipo): void {
    this.tipo = t;
    this.origen = '';
    this.formError = '';
  }

  loadAvailable(): void {
    if (!this.variant) return;
    this.loadingAvailable = true;
    this.lotService.getAvailableByVariant(this.variant.id).subscribe({
      next: (rows) => {
        this.available = rows;
        this.loadingAvailable = false;
      },
      error: () => {
        this.available = [];
        this.loadingAvailable = false;
      },
    });
  }

  originKey(a: StockAvailability): string {
    return a.compraProveedorId ? `c:${a.compraProveedorId}` : `e:${a.existenciaId}`;
  }

  originLabel(a: StockAvailability): string {
    if (a.loteCodigo) return `${a.loteCodigo}${a.loteNombre ? ' · ' + a.loteNombre : ''}`;
    return a.origen === 'InventarioInicial' ? 'Inventario inicial' : motivoLabel(a.origen);
  }

  /** Disponible del origen elegido (o el total si es FIFO). */
  get maxSalida(): number {
    if (!this.origen) return this.variant?.stockActual ?? 0;
    const [kind, id] = this.origen.split(':');
    const rows = this.available.filter(a => kind === 'c' ? a.compraProveedorId === Number(id) : a.existenciaId === Number(id));
    return rows.reduce((acc, a) => acc + a.cantidadDisponible, 0);
  }

  get salidaExcede(): boolean {
    return this.tipo === 'salida' && !!this.variant && this.cantidad > this.maxSalida;
  }

  stepCantidad(delta: number): void {
    this.cantidad = Math.max(1, (Number(this.cantidad) || 1) + delta);
  }

  save(): void {
    if (this.saving) return;
    this.formError = '';
    const errors: Record<string, string> = {};
    if (!this.variant) errors['productovarianteid'] = 'Selecciona la prenda (producto, talla y color).';
    if (!this.cantidad || this.cantidad < 1 || !Number.isInteger(Number(this.cantidad))) errors['cantidad'] = 'La cantidad debe ser un entero mayor a 0.';
    if (this.tipo === 'entrada' && this.costoUnitario !== null && this.costoUnitario < 0) errors['costounitario'] = 'El costo no puede ser negativo.';
    const desc = this.descripcion.trim();
    if (!desc) errors['descripcion'] = 'Explica el motivo del ajuste.';
    else if (desc.length > DESC_MAX) errors['descripcion'] = `Máximo ${DESC_MAX} caracteres.`;
    this.fieldErrors = errors;
    if (Object.keys(errors).length || !this.variant) return;

    let compraProveedorId: number | null = null;
    let existenciaId: number | null = null;
    if (this.tipo === 'salida' && this.origen) {
      const [kind, id] = this.origen.split(':');
      if (kind === 'c') compraProveedorId = Number(id);
      else existenciaId = Number(id);
    }

    const dto: InventoryAdjustmentRequest = {
      productoVarianteId: this.variant.id,
      tipoMovimiento: this.tipo,
      cantidad: Number(this.cantidad),
      costoUnitario: this.tipo === 'entrada' && this.costoUnitario !== null ? Math.round(this.costoUnitario) : null,
      compraProveedorId,
      existenciaId,
      descripcion: desc,
    };

    this.saving = true;
    this.inventoryService.createAdjustment(dto).subscribe({
      next: (created) => {
        this.saving = false;
        this.showModal = false;
        const last = created[created.length - 1];
        const label = this.variant ? this.variantName(this.variant) : 'la prenda';
        this.successMessage = `Ajuste registrado: ${this.tipo === 'entrada' ? '+' : '−'}${dto.cantidad} de ${label}` +
          (last ? `. Stock actual: ${last.stockResultante}.` : '.');
        this.load();
      },
      error: (err) => {
        const parsed = parseApiError(err, 'No se pudo registrar el ajuste.');
        this.fieldErrors = parsed.fieldErrors;
        this.formError = parsed.message;
        this.saving = false;
      },
    });
  }
}
