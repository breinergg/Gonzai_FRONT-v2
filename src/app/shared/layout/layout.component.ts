import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  private auth = inject(AuthService);

  sidebarCollapsed = false;

  navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid', route: '/dashboard' },
    { id: 'products', label: 'Productos', icon: 'box', route: '/products' },
    { id: 'clients', label: 'Clientes', icon: 'users', route: '/clients' },
    { id: 'inventory', label: 'Inventario', icon: 'clipboard', route: '/inventory' },
    { id: 'client-movements', label: 'Mov. Clientes', icon: 'movements', route: '/client-movements' },
    { id: 'sales', label: 'Ventas', icon: 'dollar', route: '/sales' },
  ];

  currentUser = this.auth.currentUser;
  userInitials = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return u.nombre.split(' ').slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
  });

  logout(): void {
    this.auth.logout();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
