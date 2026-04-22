import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../core/services/client.service';
import { ClientCreateRequest, ClientUpdateRequest, ClientMovementCreateRequest, ClienteSaldoDto, ClientRequest, ClientResponse } from '../../core/models/client.model';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit {
  clients: ClientResponse[] = [];
  filteredClients: ClientResponse[] = [];
  saldos = new Map<number, ClienteSaldoDto>();
  searchTerm = '';
  statusFilter: string = '';
  loading = true;
  error = '';

  showModal = false;
  showDeleteModal = false;
  showMovementModal = false;
  editingClient: ClientResponse | null = null;
  deletingClient: ClientResponse | null = null;
  saving = false;

  movementForm: ClientMovementCreateRequest = {
    clienteId: 0,
    tipoMovimiento: 'deuda',
    valor: 0,
    descripcion: null,
  };

  form: ClientRequest = {
    nombre: '',
    apellido: '',
    email: null,
    telefono: null,
    direccion: null,
    activo: true,
  };

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
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
            next: (s) => this.saldos.set(c.id, s),
            error: () => {}
          });
        });
      },
      error: () => {
        this.error = 'Error al cargar los clientes';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.clients];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(term) ||
        (c.apellido ?? '').toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        (c.telefono ?? '').includes(term)
      );
    }

    if (this.statusFilter !== '') {
      const isActive = this.statusFilter === 'activo';
      result = result.filter(c => c.activo === isActive);
    }

    this.filteredClients = result;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  get totalClients(): number {
    return this.clients.length;
  }

  get activeClients(): number {
    return this.clients.filter(c => c.activo).length;
  }

  get inactiveClients(): number {
    return this.clients.filter(c => !c.activo).length;
  }

  openCreateModal(): void {
    this.editingClient = null;
    this.form = { nombre: '', apellido: '', email: null, telefono: null, direccion: null, activo: true };
    this.showModal = true;
  }

  openEditModal(client: ClientResponse): void {
    this.editingClient = client;
    this.form = {
      nombre: client.nombre,
      apellido: client.apellido,
      email: client.email,
      telefono: client.telefono,
      direccion: client.direccion,
      activo: client.activo,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingClient = null;
  }

  saveClient(): void {
    if (!this.form.nombre.trim()) return;

    this.saving = true;

    if (this.editingClient) {
      const updatePayload: ClientUpdateRequest = {
        nombre: this.form.nombre.trim(),
        telefono: this.form.telefono?.trim() || null,
        direccion: this.form.direccion?.trim() || null,
        activo: this.form.activo,
      };
      this.clientService.update(this.editingClient.id, updatePayload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadClients();
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al actualizar el cliente';
        }
      });
    } else {
      const createPayload: ClientCreateRequest = {
        nombre: this.form.nombre.trim(),
        telefono: this.form.telefono?.trim() || null,
        direccion: this.form.direccion?.trim() || null,
      };
      this.clientService.create(createPayload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadClients();
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al crear el cliente';
        }
      });
    }
  }

  openDeleteModal(client: ClientResponse): void {
    this.deletingClient = client;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingClient = null;
  }

  confirmDelete(): void {
    if (!this.deletingClient) return;
    this.clientService.delete(this.deletingClient.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadClients();
      },
      error: () => {
        this.error = 'Error al eliminar el cliente';
        this.closeDeleteModal();
      }
    });
  }

  getSaldoClass(clientId: number): string {
    const s = this.saldos.get(clientId);
    if (!s) return 'saldo-loading';
    if (s.enPazYSalvo) return 'saldo-ok';
    if (s.saldo > 0)   return 'saldo-deuda';
    return 'saldo-ok';
  }

  getSaldoLabel(clientId: number): string {
    const s = this.saldos.get(clientId);
    if (!s) return '...';
    return `$${s.saldo.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
  }

  getSaldoTooltip(clientId: number): string {
    const s = this.saldos.get(clientId);
    if (!s) return '';
    return `Deuda: $${s.totalDeuda} | Abonos: $${s.totalAbonos}`;
  }

  getStatusClass(client: ClientResponse): string {
    return client.activo ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(client: ClientResponse): string {
    return client.activo ? 'Activo' : 'Inactivo';
  }

  getInitials(client: ClientResponse): string {
    const a = client.nombre.charAt(0);
    const b = client.apellido?.charAt(0) ?? '';
    return (a + b).toUpperCase();
  }

  getFullName(client: ClientResponse): string {
    return client.apellido ? `${client.nombre} ${client.apellido}` : client.nombre;
  }

  openMovementModal(): void {
    this.movementForm = {
      clienteId: this.clients.find(c => c.activo)?.id ?? 0,
      tipoMovimiento: 'deuda',
      valor: 0,
      descripcion: null,
    };
    this.showMovementModal = true;
  }

  closeMovementModal(): void {
    this.showMovementModal = false;
  }

  saveMovement(): void {
    if (!this.movementForm.clienteId || this.movementForm.valor <= 0) return;
    this.saving = true;
    this.clientService.createMovement(this.movementForm).subscribe({
      next: () => {
        this.saving = false;
        this.closeMovementModal();
        this.loadClients();
      },
      error: () => {
        this.saving = false;
        this.error = 'Error al registrar el movimiento';
      }
    });
  }
}
