import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioResponse, UserCreateRequest, UserUpdateRequest } from '../../core/models/auth.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  users: UsuarioResponse[] = [];
  filteredUsers: UsuarioResponse[] = [];

  searchTerm = '';
  statusFilter = '';
  rolFilter = '';
  loading = true;
  error = '';

  showModal = false;
  showDeleteModal = false;
  editingUser: UsuarioResponse | null = null;
  deletingUser: UsuarioResponse | null = null;
  saving = false;
  modalError = '';

  readonly roles = ['Administrador', 'Usuario'];
  readonly minPasswordLength = 8;

  form: {
    nombre: string;
    email: string;
    password: string;
    rol: string;
    activo: boolean;
  } = this.emptyForm();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar los usuarios';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let result = [...this.users];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.nombre.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.rol.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter !== '') {
      const isActive = this.statusFilter === 'activo';
      result = result.filter((u) => u.activo === isActive);
    }

    if (this.rolFilter !== '') {
      result = result.filter(
        (u) => u.rol.toLowerCase() === this.rolFilter.toLowerCase()
      );
    }

    this.filteredUsers = result;
  }

  onSearchChange(): void { this.applyFilters(); }
  onStatusChange(): void { this.applyFilters(); }
  onRolChange(): void    { this.applyFilters(); }

  get totalUsers(): number   { return this.users.length; }
  get activeUsers(): number  { return this.users.filter((u) => u.activo).length; }
  get inactiveUsers(): number { return this.users.filter((u) => !u.activo).length; }

  openCreateModal(): void {
    this.editingUser = null;
    this.form = this.emptyForm();
    this.modalError = '';
    this.showModal = true;
  }

  openEditModal(user: UsuarioResponse): void {
    this.editingUser = user;
    this.form = {
      nombre:   user.nombre,
      email:    user.email,
      password: '',
      rol:      user.rol,
      activo:   user.activo,
    };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = null;
    this.modalError = '';
  }

  saveUser(): void {
    this.modalError = '';

    if (!this.form.nombre.trim() || !this.form.email.trim()) return;

    if (!this.editingUser) {
      if (!this.form.password.trim()) {
        this.modalError = 'La contraseña es obligatoria.';
        return;
      }
      if (this.form.password.trim().length < this.minPasswordLength) {
        this.modalError = `La contraseña debe tener al menos ${this.minPasswordLength} caracteres.`;
        return;
      }
    }

    this.saving = true;

    if (this.editingUser) {
      const payload: UserUpdateRequest = {
        nombre: this.form.nombre.trim(),
        rol:    this.form.rol,
        activo: this.form.activo,
      };
      this.authService.updateUser(this.editingUser.id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.modalError = this.parseApiError(err, 'Error al actualizar el usuario');
        },
      });
    } else {
      const payload: UserCreateRequest = {
        nombre:   this.form.nombre.trim(),
        email:    this.form.email.trim(),
        password: this.form.password.trim(),
        rol:      this.form.rol,
      };
      this.authService.createUser(payload).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.modalError = this.parseApiError(err, 'Error al crear el usuario');
        },
      });
    }
  }

  openDeleteModal(user: UsuarioResponse): void {
    this.deletingUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deletingUser = null;
  }

  confirmDelete(): void {
    if (!this.deletingUser) return;
    this.authService.deleteUser(this.deletingUser.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: () => {
        this.error = 'Error al eliminar el usuario';
        this.closeDeleteModal();
      },
    });
  }

  getInitials(user: UsuarioResponse): string {
    return user.nombre
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  getStatusClass(user: UsuarioResponse): string {
    return user.activo ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(user: UsuarioResponse): string {
    return user.activo ? 'Activo' : 'Inactivo';
  }

  getRolClass(rol: string): string {
    return rol.toLowerCase() === 'administrador' || rol.toLowerCase() === 'admin'
      ? 'rol-admin'
      : 'rol-user';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  get isSaveDisabled(): boolean {
    if (!this.form.nombre.trim() || !this.form.email.trim()) return true;
    if (!this.editingUser && !this.form.password.trim()) return true;
    if (!this.editingUser && this.form.password.trim().length < this.minPasswordLength) return true;
    return this.saving;
  }

  private parseApiError(err: HttpErrorResponse, fallback: string): string {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string' && body.message.trim()) return body.message;
      if (typeof body.title === 'string' && body.title.trim()) return body.title;
      if (body.errors && typeof body.errors === 'object') {
        const messages = Object.values(body.errors)
          .flat()
          .filter((m): m is string => typeof m === 'string');
        if (messages.length) return messages.join(' ');
      }
    }
    if (err.status === 400) return 'Datos inválidos. Revisa email, contraseña (mín. 8 caracteres) y rol.';
    return fallback;
  }

  private emptyForm() {
    return { nombre: '', email: '', password: '', rol: 'Usuario', activo: true };
  }
}
