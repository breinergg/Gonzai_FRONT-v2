import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private auth = inject(AuthService);

  currentUser = this.auth.currentUser;

  userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return u.nombre.split(' ').slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
  });

  fechaFormateada = computed(() => {
    const u = this.currentUser();
    if (!u?.fechaCreacion) return '—';
    return new Date(u.fechaCreacion).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  });

  /* ── Cambiar contraseña ── */
  showPasswordSection = false;
  savingPassword = false;
  passwordSuccess = false;
  passwordError = '';

  passwordForm = {
    passwordActual: '',
    nuevaPassword: '',
    confirmarPassword: '',
  };

  showCurrent = false;
  showNew = false;
  showConfirm = false;

  get passwordMismatch(): boolean {
    return (
      !!this.passwordForm.nuevaPassword &&
      !!this.passwordForm.confirmarPassword &&
      this.passwordForm.nuevaPassword !== this.passwordForm.confirmarPassword
    );
  }

  get passwordTooShort(): boolean {
    return (
      !!this.passwordForm.nuevaPassword &&
      this.passwordForm.nuevaPassword.length < 8
    );
  }

  get canSubmitPassword(): boolean {
    return (
      !!this.passwordForm.passwordActual &&
      !!this.passwordForm.nuevaPassword &&
      !!this.passwordForm.confirmarPassword &&
      !this.passwordMismatch &&
      !this.passwordTooShort
    );
  }

  togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) this.resetPasswordForm();
  }

  submitChangePassword(): void {
    if (!this.canSubmitPassword) return;
    const user = this.currentUser();
    if (!user) return;

    this.savingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = false;

    this.auth.changePassword(user.id, {
      passwordActual: this.passwordForm.passwordActual,
      nuevaPassword: this.passwordForm.nuevaPassword,
    }).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordSuccess = true;
        this.resetPasswordForm();
        setTimeout(() => { this.passwordSuccess = false; }, 4000);
      },
      error: (err: HttpErrorResponse) => {
        this.savingPassword = false;
        if (err.status === 409) {
          this.passwordError = err.error?.message ?? 'La contraseña actual es incorrecta.';
        } else {
          this.passwordError = 'Error al cambiar la contraseña. Inténtalo de nuevo.';
        }
      },
    });
  }

  private resetPasswordForm(): void {
    this.passwordForm = { passwordActual: '', nuevaPassword: '', confirmarPassword: '' };
    this.showCurrent = false;
    this.showNew = false;
    this.showConfirm = false;
    this.passwordError = '';
  }
}
