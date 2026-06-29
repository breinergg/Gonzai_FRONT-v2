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

  readonly allNavItems = [
    { id: 'dashboard',         label: 'Dashboard',      icon: 'grid',       route: '/dashboard',         adminOnly: false },
    { id: 'products',          label: 'Productos',       icon: 'box',        route: '/products',          adminOnly: false },
    { id: 'clients',           label: 'Clientes',        icon: 'users',      route: '/clients',           adminOnly: false },
    { id: 'inventory',         label: 'Inventario',      icon: 'clipboard',  route: '/inventory',         adminOnly: false },
    { id: 'client-movements',  label: 'Mov. Clientes',   icon: 'movements',  route: '/client-movements',  adminOnly: false },
    { id: 'sales',             label: 'Ventas',          icon: 'dollar',     route: '/sales',             adminOnly: false },
    { id: 'users',             label: 'Usuarios',        icon: 'user-admin', route: '/users',             adminOnly: true  },
  ];

  currentUser = this.auth.currentUser;

  isAdmin = computed(() => {
    const rol = this.auth.currentUser()?.rol?.toLowerCase() ?? '';
    return rol === 'administrador' || rol === 'admin';
  });

  navItems = computed(() =>
    this.allNavItems.filter(item => !item.adminOnly || this.isAdmin())
  );

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
