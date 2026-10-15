import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PurchaseService } from '../../core/services/purchase.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { SupplierResponse } from '../../core/models/supplier.model';
import { ProductVariant } from '../../core/models/product.model';
import { PurchaseResponse } from '../../core/models/purchase.model';
import { parseApiError } from '../../core/utils/api-error';
import { toApiDate, todayColombia } from '../../core/utils/format';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { VariantSelectorComponent } from '../../shared/components/variant-selector/variant-selector.component';
import {
  ProductQuickCreateComponent,
  QuickCreateResult,
} from '../../shared/components/product-quick-create/product-quick-create.component';

interface Line {
  uid: number;
  variant: ProductVariant | null;
  cantidad: number | null;
  costoUnitario: number | null;
  error?: string;
}

let uidSeq = 0;

@Component({
  selector: 'app-purchase-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe, VariantSelectorComponent, ProductQuickCreateComponent],
  templateUrl: './purchase-new.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './purchase-new.component.css'],
})
export class PurchaseNewComponent implements OnInit {
  private readonly purchaseService = inject(PurchaseService);
  private readonly supplierService = inject(SupplierService);
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAdmin = this.auth.isAdmin();
  readonly today = todayColombia();

  suppliers: SupplierResponse[] = [];

  proveedorId: number | null = null;
  nombre = '';
  numeroFactura = '';
  fecha = this.today;
  costoEnvio: number | null = null;
  descripcion = '';

  lines: Line[] = [newLine()];

  saving = false;
  error = '';
  fieldErrors: Record<string, string> = {};
  submitted = false;

  saved: PurchaseResponse | null = null;

  /* Crear producto / variante */
  showQuickCreate = false;
  quickCreateName = '';
  quickCreateLine: Line | null = null;

  /* Crear proveedor */
  showSupplierModal = false;
  supplierForm = { nombre: '', documento: '', telefono: '' };
  supplierSaving = false;
  supplierError = '';

  ngOnInit(): void {
    this.productService.loadCatalog(true);
    this.loadSuppliers();
  }

  loadSuppliers(selectId?: number): void {
    this.supplierService.getAll(true).subscribe({
      next: (s) => {
        this.suppliers = s;
        if (selectId) this.proveedorId = selectId;
      },
    });
  }

  /* ── Líneas ─── */
  get filledLines(): Line[] {
    return this.lines.filter(l => l.variant);
  }

  usedIds(except: Line): number[] {
    return this.lines.filter(l => l !== except && l.variant).map(l => l.variant!.id);
  }

  onVariantSelected(line: Line, variant: ProductVariant): void {
    line.variant = variant;
    line.error = undefined;
    if (line.cantidad === null) line.cantidad = 1;
    if (line.costoUnitario === null && variant.precioCompra !== null) line.costoUnitario = variant.precioCompra;
    this.ensureTrailingBlank();
  }

  addLine(): void {
    this.lines.push(newLine());
  }

  removeLine(line: Line): void {
    this.lines = this.lines.filter(l => l !== line);
    if (!this.lines.length) this.lines.push(newLine());
  }

  step(line: Line, delta: number): void {
    line.cantidad = Math.max(1, (line.cantidad ?? 0) + delta);
  }

  lineSubtotal(line: Line): number {
    return (line.cantidad ?? 0) * (line.costoUnitario ?? 0);
  }

  private ensureTrailingBlank(): void {
    const last = this.lines[this.lines.length - 1];
    if (!last || last.variant) this.lines.push(newLine());
  }

  /* ── Totales ─── */
  get totalUnidades(): number {
    return this.filledLines.reduce((s, l) => s + (l.cantidad ?? 0), 0);
  }

  get subtotal(): number {
    return this.filledLines.reduce((s, l) => s + this.lineSubtotal(l), 0);
  }

  get total(): number {
    return this.subtotal + (this.costoEnvio ?? 0);
  }

  get envioPorPrenda(): number {
    return this.totalUnidades ? (this.costoEnvio ?? 0) / this.totalUnidades : 0;
  }

  /* ── Crear producto o variante ─── */
  openQuickCreate(line: Line | null = null, term = ''): void {
    this.quickCreateLine = line;
    this.quickCreateName = term;
    this.showQuickCreate = true;
  }

  onQuickCreated(result: QuickCreateResult): void {
    this.showQuickCreate = false;
    const variants = result.variants.filter(v => v.activo);
    let target = this.quickCreateLine && !this.quickCreateLine.variant ? this.quickCreateLine : null;

    for (const v of variants) {
      const line = target ?? this.lines.find(l => !l.variant) ?? newLine();
      if (!this.lines.includes(line)) this.lines.push(line);
      line.variant = v;
      line.cantidad = line.cantidad ?? 1;
      target = null;
    }
    this.ensureTrailingBlank();
    this.quickCreateLine = null;
  }

  /* ── Proveedor rápido ─── */
  openSupplierModal(): void {
    this.supplierForm = { nombre: '', documento: '', telefono: '' };
    this.supplierError = '';
    this.showSupplierModal = true;
  }

  saveSupplier(): void {
    if (!this.supplierForm.nombre.trim()) {
      this.supplierError = 'El nombre es obligatorio.';
      return;
    }
    this.supplierSaving = true;
    this.supplierService.create({
      nombre: this.supplierForm.nombre.trim(),
      documento: this.supplierForm.documento.trim() || null,
      telefono: this.supplierForm.telefono.trim() || null,
      direccion: null,
    }).subscribe({
      next: (s) => {
        this.supplierSaving = false;
        this.showSupplierModal = false;
        this.loadSuppliers(s.id);
      },
      error: (err) => {
        this.supplierError = parseApiError(err, 'No se pudo crear el proveedor.').message;
        this.supplierSaving = false;
      },
    });
  }

  /* ── Guardar ─── */
  private validate(): boolean {
    this.fieldErrors = {};
    this.error = '';
    let ok = true;

    if (!this.proveedorId) {
      this.fieldErrors['proveedorid'] = 'Elige el proveedor.';
      ok = false;
    }
    if (!this.filledLines.length) {
      this.error = 'Agrega al menos una prenda al lote.';
      return false;
    }
    for (const line of this.filledLines) {
      line.error = undefined;
      if (!line.cantidad || line.cantidad < 1) { line.error = 'Cantidad mínima 1.'; ok = false; }
      else if (line.costoUnitario === null || line.costoUnitario < 0) { line.error = 'Indica el costo unitario.'; ok = false; }
    }
    if (!ok && !this.error) this.error = 'Revisa los campos marcados.';
    return ok;
  }

  save(): void {
    if (this.saving) return;
    this.submitted = true;
    if (!this.validate()) return;

    const sent = this.filledLines;
    this.saving = true;
    this.purchaseService.create({
      proveedorId: this.proveedorId!,
      nombre: this.nombre.trim() || null,
      fecha: toApiDate(this.fecha),
      numeroFactura: this.numeroFactura.trim() || null,
      descripcion: this.descripcion.trim() || null,
      costoEnvio: this.costoEnvio ?? 0,
      detalles: sent.map(l => ({
        productoVarianteId: l.variant!.id,
        cantidad: Number(l.cantidad),
        costoUnitario: Number(l.costoUnitario),
      })),
    }).subscribe({
      next: (purchase) => {
        this.saving = false;
        this.saved = purchase;
      },
      error: (err) => {
        const parsed = parseApiError(err, 'No se pudo registrar la compra.');
        this.fieldErrors = parsed.fieldErrors;
        for (const [key, msg] of Object.entries(parsed.fieldErrors)) {
          const match = /^detalles\[(\d+)\]/.exec(key);
          if (match && sent[Number(match[1])]) sent[Number(match[1])].error = msg;
        }
        this.error = parsed.message;
        this.saving = false;
      },
    });
  }

  resetForm(): void {
    this.saved = null;
    this.nombre = '';
    this.numeroFactura = '';
    this.fecha = this.today;
    this.costoEnvio = null;
    this.descripcion = '';
    this.lines = [newLine()];
    this.submitted = false;
    this.error = '';
    this.fieldErrors = {};
  }

  goToPurchase(): void {
    if (this.saved) this.router.navigate(['/purchases'], { queryParams: { ver: this.saved.id } });
  }

  goToLot(): void {
    if (this.saved) this.router.navigate(['/lots', this.saved.id]);
  }

  trackLine(_: number, line: Line): number {
    return line.uid;
  }
}

function newLine(): Line {
  return { uid: ++uidSeq, variant: null, cantidad: null, costoUnitario: null };
}
