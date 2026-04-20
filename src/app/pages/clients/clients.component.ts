import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../core/services/client.service';
import { ClientRequest, ClientResponse } from '../../core/models/client.model';

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
  searchTerm = '';
  statusFilter: string = '';
  loading = true;
  error = '';

  showModal = false;
  showDeleteModal = false;
  editingClient: ClientResponse | null = null;
  deletingClient: ClientResponse | null = null;
  saving = false;

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
        c.apellido.toLowerCase().includes(term) ||
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
    if (!this.form.nombre.trim() || !this.form.apellido.trim()) return;

    this.saving = true;

    if (this.editingClient) {
      this.clientService.update(this.editingClient.id, this.form).subscribe({
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
      this.clientService.create(this.form).subscribe({
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

  getStatusClass(client: ClientResponse): string {
    return client.activo ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(client: ClientResponse): string {
    return client.activo ? 'Activo' : 'Inactivo';
  }

  getInitials(client: ClientResponse): string {
    return (client.nombre.charAt(0) + client.apellido.charAt(0)).toUpperCase();
  }

  getFullName(client: ClientResponse): string {
    return `${client.nombre} ${client.apellido}`;
  }
}
