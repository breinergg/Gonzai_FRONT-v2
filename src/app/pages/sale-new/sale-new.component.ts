import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { SaleService } from '../../core/services/sale.service';
import { LotService } from '../../core/services/lot.service';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { ClienteSaldo, ClientResponse } from '../../core/models/client.model';
import { ProductVariant } from '../../core/models/product.model';
import { SaleResponse, estadoPagoClass } from '../../core/models/sale.model';
import { StockAvailability } from '../../core/models/lot.model';
import { METODOS_PAGO, metodoPagoLabel } from '../../core/models/common.model';
import { parseApiError } from '../../core/utils/api-error';
import { initials, toApiDate, todayColombia } from '../../core/utils/format';
import { CopPipe } from '../../shared/pipes/cop.pipe';
import { FechaCoPipe } from '../../shared/pipes/fecha-co.pipe';
import { VariantSelectorComponent } from '../../shared/components/variant-selector/variant-selector.component';
import { ReceiptActionsComponent } from '../../shared/components/receipt-actions/receipt-actions.component';

interface CartItem {
  variant: ProductVariant;
  cantidad: number;
  precio: number | null;
  compraProveedorId: number | null;
  loteCodigo: string | null;
  loteDisponible: number | null;
  error?: string;
}

type PayMode = 'todo' | 'abono' | 'debe';

@Component({
  selector: 'app-sale-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe, FechaCoPipe, VariantSelectorComponent, ReceiptActionsComponent],
  templateUrl: './sale-new.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './sale-new.component.css'],
})
export class SaleNewComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly saleService = inject(SaleService);
  private readonly lotService = inject(LotService);
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('clientBox') clientBox?: ElementRef<HTMLElement>;

  readonly isAdmin = this.auth.isAdmin();
  readonly metodos = METODOS_PAGO;
  readonly metodoPagoLabel = metodoPagoLabel;
  readonly estadoPagoClass = estadoPagoClass;
  readonly initials = initials;
  readonly today = todayColombia();

  /* ── Cliente ─── */
  clients: ClientResponse[] = [];
  clientTerm = '';
  clientOpen = false;
  client: ClientResponse | null = null;
  clientSaldo: ClienteSaldo | null = null;

  showClientModal = false;
  clientForm = { nombre: '', telefono: '', email: '', direccion: '' };
  clientSaving = false;
  clientError = '';
  clientFieldErrors: Record<string, string> = {};

  /* ── Carrito ─── */
  cart: CartItem[] = [];

  /* ── Pago ─── */
  fecha = this.today;
  descripcion = '';
  payMode: PayMode = 'todo';
  abono: number | null = null;
  metodoPago = '';

  /* ── Lote ─── */
  lotItem: CartItem | null = null;
  lotOptions: StockAvailability[] = [];
  lotLoading = false;
  lotError = '';

  /* ── Guardar ─── */
  saving = false;
  error = '';
  receipt: SaleResponse | null = null;

  ngOnInit(): void {
    this.productService.loadCatalog(true);
    this.clientService.getAll(true).subscribe({
      next: (c) => {
        this.clients = c;
        const preset = Number(this.route.snapshot.queryParamMap.get('cliente'));
        const found = preset ? c.find(x => x.id === preset) : null;
        if (found) this.selectClient(found);
      },
    });
  }

  /* ── Cliente ─── */
  get clientResults(): ClientResponse[] {
    const term = this.clientTerm.trim().toLowerCase();
    const list = term
      ? this.clients.filter(c => `${c.nombre} ${c.telefono ?? ''}`.toLowerCase().includes(term))
      : this.clients;
    return list.slice(0, 8);
  }

  selectClient(c: ClientResponse): void {
    this.client = c;
    this.clientOpen = false;
    this.clientTerm = '';
    this.clientSaldo = null;
    this.clientService.getSaldo(c.id).subscribe({ next: (s) => (this.clientSaldo = s) });
  }

  clearClient(): void {
    this.client = null;
    this.clientSaldo = null;
    setTimeout(() => this.clientBox?.nativeElement.querySelector('input')?.focus());
  }

  @HostListener('document:mousedown', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.clientOpen && this.clientBox && !this.clientBox.nativeElement.contains(e.target as Node)) {
      this.clientOpen = false;
    }
  }

  openClientModal(): void {
    this.clientForm = { nombre: this.clientTerm.trim(), telefono: '', email: '', direccion: '' };
    this.clientError = '';
    this.clientFieldErrors = {};
    this.clientOpen = false;
    this.showClientModal = true;
  }

  saveClient(): void {
    if (this.clientSaving) return;
    if (!this.clientForm.nombre.trim()) {
      this.clientFieldErrors = { nombre: 'El nombre es obligatorio.' };
      return;
    }
    this.clientSaving = true;
    this.clientService.create({
      nombre: this.clientForm.nombre.trim(),
      telefono: this.clientForm.telefono.trim() || null,
      email: this.clientForm.email.trim() || null,
      direccion: this.clientForm.direccion.trim() || null,
    }).subscribe({
      next: (c) => {
        this.clients = [c, ...this.clients];
        this.clientSaving = false;
        this.showClientModal = false;
        this.selectClient(c);
      },
      error: (err) => {
        const parsed = parseApiError(err, 'No se pudo crear el cliente.');
        this.clientFieldErrors = parsed.fieldErrors;
        this.clientError = parsed.message;
        this.clientSaving = false;
      },
    });
  }

  /* ── Carrito ─── */
  addVariant(v: ProductVariant): void {
    const existing = this.cart.find(i => i.variant.id === v.id);
    if (existing) {
      existing.cantidad++;
      this.checkItem(existing);
      return;
    }
    const item: CartItem = {
      variant: v,
      cantidad: 1,
      precio: v.precioVenta,
      compraProveedorId: null,
      loteCodigo: null,
      loteDisponible: null,
    };
    this.checkItem(item);
    this.cart.push(item);
  }

  removeItem(item: CartItem): void {
    this.cart = this.cart.filter(i => i !== item);
  }

  step(item: CartItem, delta: number): void {
    item.cantidad = Math.max(1, (item.cantidad || 0) + delta);
    this.checkItem(item);
  }

  checkItem(item: CartItem): void {
    item.error = undefined;
    const limit = item.loteDisponible ?? item.variant.stockActual;
    if (item.cantidad > limit) {
      item.error = item.loteDisponible !== null
        ? `El lote ${item.loteCodigo} solo tiene ${limit} disponibles.`
        : `Solo hay ${limit} en stock.`;
    }
  }

  itemSubtotal(item: CartItem): number {
    return (item.cantidad || 0) * (item.precio ?? 0);
  }

  get unidades(): number {
    return this.cart.reduce((s, i) => s + (i.cantidad || 0), 0);
  }

  get total(): number {
    return this.cart.reduce((s, i) => s + this.itemSubtotal(i), 0);
  }

  /* ── Pago ─── */
  setPayMode(mode: PayMode): void {
    this.payMode = mode;
    if (mode === 'abono' && (this.abono === null || this.abono >= this.total)) this.abono = null;
  }

  get montoPagado(): number {
    if (this.payMode === 'todo') return this.total;
    if (this.payMode === 'debe') return 0;
    return Math.min(Math.max(this.abono ?? 0, 0), this.total);
  }

  get saldo(): number {
    return Math.max(0, this.total - this.montoPagado);
  }

  get needsMethod(): boolean {
    return this.montoPagado > 0;
  }

  /* ── Elegir lote ─── */
  openLot(item: CartItem): void {
    this.lotItem = item;
    this.lotOptions = [];
    this.lotError = '';
    this.lotLoading = true;
    this.lotService.getAvailableByVariant(item.variant.id).subscribe({
      next: (data) => {
        this.lotOptions = data;
        this.lotLoading = false;
      },
      error: (err) => {
        this.lotError = parseApiError(err, 'No se pudieron cargar los lotes.').message;
        this.lotLoading = false;
      },
    });
  }

  chooseLot(option: StockAvailability | null): void {
    if (!this.lotItem) return;
    this.lotItem.compraProveedorId = option?.compraProveedorId ?? null;
    this.lotItem.loteCodigo = option?.loteCodigo ?? null;
    this.lotItem.loteDisponible = option ? option.cantidadDisponible : null;
    this.checkItem(this.lotItem);
    this.lotItem = null;
  }

  /* ── Guardar ─── */
  get canSave(): boolean {
    return !!this.client && this.cart.length > 0 && !this.saving;
  }

  save(): void {
    if (this.saving) return;
    this.error = '';
    if (!this.client) { this.error = 'Elige el cliente de la venta.'; return; }
    if (!this.cart.length) { this.error = 'Agrega al menos una prenda.'; return; }
    for (const item of this.cart) {
      if (!item.cantidad || item.cantidad < 1) { this.error = 'Revisa las cantidades.'; return; }
      if (item.precio === null || item.precio < 0) { this.error = `Indica el precio de venta de ${item.variant.nombreCompleto}.`; return; }
    }
    if (this.payMode === 'abono' && (!this.abono || this.abono <= 0 || this.abono >= this.total)) {
      this.error = 'El abono debe ser mayor a 0 y menor al total. Usa "Pagó todo" si pagó completo.';
      return;
    }
    if (this.needsMethod && !this.metodoPago) { this.error = 'Elige el método de pago.'; return; }

    this.saving = true;
    this.saleService.create({
      clienteId: this.client.id,
      fecha: toApiDate(this.fecha),
      descripcion: this.descripcion.trim() || null,
      montoPagado: this.montoPagado,
      metodoPago: this.needsMethod ? this.metodoPago : null,
      detalles: this.cart.map(i => ({
        productoVarianteId: i.variant.id,
        cantidad: Number(i.cantidad),
        precioVentaUnitario: Number(i.precio),
        compraProveedorId: i.compraProveedorId,
      })),
    }).subscribe({
      next: (sale) => {
        this.saving = false;
        this.receipt = sale;
      },
      error: (err) => {
        this.error = parseApiError(err, 'No se pudo registrar la venta.').message;
        this.saving = false;
      },
    });
  }

  newSale(): void {
    this.receipt = null;
    this.cart = [];
    this.client = null;
    this.clientSaldo = null;
    this.payMode = 'todo';
    this.abono = null;
    this.metodoPago = '';
    this.descripcion = '';
    this.fecha = this.today;
    this.error = '';
  }

  viewSale(): void {
    if (this.receipt) this.router.navigate(['/sales'], { queryParams: { ver: this.receipt.id } });
  }

  goToClient(): void {
    if (this.receipt) this.router.navigate(['/clients', this.receipt.clienteId]);
  }
}
