import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { ReportService } from '../../core/services/report.service';
import { reportErrorMessage, saveReport } from '../../core/utils/file-download';
import { ClienteSaldo, ClientResponse } from '../../core/models/client.model';
import { parseApiError } from '../../core/utils/api-error';
import { formatCOP, initials } from '../../core/utils/format';
import { CopPipe } from '../../shared/pipes/cop.pipe';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CopPipe],
  templateUrl: './clients.component.html',
  styleUrls: ['../../shared/styles/gz-ui.css', './clients.component.css'],
})
export class ClientsComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly reports = inject(ReportService);
  private readonly router = inject(Router);

  readonly initials = initials;

  clients: ClientResponse[] = [];
  filteredClients: ClientResponse[] = [];
  saldos = new Map<number, ClienteSaldo>();
  searchTerm = '';
  statusFilter: '' | 'activo' | 'inactivo' = 'activo';
  debtFilter = false;
  loading = true;
  error = '';
  exporting = false;
  exportError = '';

  showModal = false;
  editingClient: ClientResponse | null = null;
  form = { nombre: '', telefono: '', email: '', direccion: '', activo: true };
  saving = false;
  formError = '';
  fieldErrors: Record<string, string> = {};

  deletingClient: ClientResponse | null = null;
  deleting = false;
  deleteError = '';

  ngOnInit(): void {
    this.loadClients();
  }

  exportCartera(): void {
    if (this.exporting) return;
    this.exporting = true;
    this.exportError = '';
    this.reports.cartera().subscribe({
      next: (file) => {
        saveReport(file);
        this.exporting = false;
      },
      error: (err) => {
        void reportErrorMessage(err).then((message) => {
          this.exportError = message;
          this.exporting = false;
        });
      },
    });
  }

  loadClients(): void {
    this.loading = true;
    this.error = '';
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
        this.applyFilters();
        this.loading = false;
        data.forEach(c => {
          this.clientService.getSaldo(c.id).subscribe({
            next: (s) => {
              this.saldos.set(c.id, s);
              if (this.debtFilter) this.applyFilters();
            },
            error: () => {},
          });
        });
      },
      error: (err) => {
        this.error = parseApiError(err, 'Error al cargar los clientes').message;
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredClients = this.clients.filter(c => {
      if (this.statusFilter === 'activo' && !c.activo) return false;
      if (this.statusFilter === 'inactivo' && c.activo) return false;
      if (this.debtFilter && !((this.saldos.get(c.id)?.saldo ?? 0) > 0)) return false;
      if (!term) return true;
      return `${c.nombre} ${c.telefono ?? ''} ${c.email ?? ''} ${c.direccion ?? ''}`.toLowerCase().includes(term);
    });
  }

  toggleDebt(): void {
    this.debtFilter = !this.debtFilter;
    this.applyFilters();
  }

  openDetail(client: ClientResponse): void {
    this.router.navigate(['/clients', client.id]);
  }

  /* ── Crear / editar ─── */
  openCreateModal(): void {
    this.editingClient = null;
    this.form = { nombre: '', telefono: '', email: '', direccion: '', activo: true };
    this.formError = '';
    this.fieldErrors = {};
    this.showModal = true;
  }

  openEditModal(client: ClientResponse, event: Event): void {
    event.stopPropagation();
    this.editingClient = client;
    this.form = {
      nombre: client.nombre,
      telefono: client.telefono ?? '',
      email: client.email ?? '',
      direccion: client.direccion ?? '',
      activo: client.activo,
    };
    this.formError = '';
    this.fieldErrors = {};
    this.showModal = true;
  }

  closeModal(): void {
    if (!this.saving) this.showModal = false;
  }

  saveClient(): void {
    if (this.saving) return;
    this.formError = '';
    this.fieldErrors = {};
    if (!this.form.nombre.trim()) {
      this.fieldErrors = { nombre: 'El nombre es obligatorio.' };
      return;
    }
    const base = {
      nombre: this.form.nombre.trim(),
      telefono: this.form.telefono.trim() || null,
      email: this.form.email.trim() || null,
      direccion: this.form.direccion.trim() || null,
    };
    this.saving = true;
    const request$ = this.editingClient
      ? this.clientService.update(this.editingClient.id, { ...base, activo: this.form.activo })
      : this.clientService.create(base);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadClients();
      },
      error: (err) => {
        const parsed = parseApiError(err, 'No se pudo guardar el cliente.');
        this.fieldErrors = parsed.fieldErrors;
        this.formError = parsed.message;
        this.saving = false;
      },
    });
  }

  /* ── Desactivar ─── */
  openDeleteModal(client: ClientResponse, event: Event): void {
    event.stopPropagation();
    this.deletingClient = client;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.deletingClient) return;
    this.deleting = true;
    this.clientService.delete(this.deletingClient.id).subscribe({
      next: () => {
        this.deleting = false;
        this.deletingClient = null;
        this.loadClients();
      },
      error: (err) => {
        this.deleteError = parseApiError(err, 'No se pudo desactivar el cliente.').message;
        this.deleting = false;
      },
    });
  }

  /* ── Saldo ─── */
  getSaldoClass(clientId: number): string {
    const s = this.saldos.get(clientId);
    if (!s) return 'saldo-loading';
    return s.saldo > 0 ? 'saldo-deuda' : 'saldo-ok';
  }

  getSaldoLabel(clientId: number): string {
    const s = this.saldos.get(clientId);
    if (!s) return '...';
    return s.saldo > 0 ? formatCOP(s.saldo) : 'Paz y salvo';
  }

  getSaldoTooltip(clientId: number): string {
    const s = this.saldos.get(clientId);
    if (!s) return '';
    const pend = s.ventasPendientes.length;
    return `Comprado: ${formatCOP(s.totalComprado)} | Pagado: ${formatCOP(s.totalPagado)}` +
      (pend ? ` | ${pend} venta${pend > 1 ? 's' : ''} pendiente${pend > 1 ? 's' : ''}` : '');
  }
}
