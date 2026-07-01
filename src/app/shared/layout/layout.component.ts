import { Component, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  adminOnly: boolean;
  keywords?: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = false;
  searchTerm = '';
  searchFocused = false;

  readonly allNavItems: NavItem[] = [
    { id: 'dashboard',        label: 'Dashboard',     icon: 'grid',       route: '/dashboard',        adminOnly: false, keywords: ['inicio', 'panel', 'principal'] },
    { id: 'products',         label: 'Productos',      icon: 'box',        route: '/products',         adminOnly: false, keywords: ['producto', 'catalogo', 'stock'] },
    { id: 'clients',          label: 'Clientes',       icon: 'users',      route: '/clients',          adminOnly: false, keywords: ['cliente', 'deuda'] },
    { id: 'inventory',        label: 'Inventario',     icon: 'clipboard',  route: '/inventory',        adminOnly: false, keywords: ['inventario', 'movimiento', 'entrada', 'salida'] },
    { id: 'client-movements', label: 'Mov. Clientes',  icon: 'movements',  route: '/client-movements', adminOnly: false, keywords: ['movimiento', 'cliente', 'pago', 'deuda'] },
    { id: 'sales',            label: 'Ventas',         icon: 'dollar',     route: '/sales',            adminOnly: false, keywords: ['venta', 'ventas', 'diaria'] },
    { id: 'users',            label: 'Usuarios',       icon: 'user-admin', route: '/users',            adminOnly: true,  keywords: ['usuario', 'admin', 'administrador'] },
    { id: 'profile',          label: 'Mi Perfil',      icon: 'user',       route: '/profile',          adminOnly: false, keywords: ['perfil', 'cuenta', 'contraseña', 'password'] },
  ];

  currentUser = this.auth.currentUser;

  isAdmin = computed(() => this.auth.isAdmin());

  navItems = computed(() =>
    this.allNavItems.filter(item => item.id !== 'profile' && (!item.adminOnly || this.isAdmin()))
  );

  searchableItems = computed(() =>
    this.allNavItems.filter(item => !item.adminOnly || this.isAdmin())
  );

  searchResults(): NavItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return [];

    return this.searchableItems().filter(item =>
      item.label.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term) ||
      (item.keywords?.some(k => k.includes(term)) ?? false)
    );
  }

  userInitials = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return u.nombre.split(' ').slice(0, 2).map((w: string) => w[0].toUpperCase()).join('');
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSearch();
  }

  logout(): void {
    this.auth.logout();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSearchFocus(): void {
    this.searchFocused = true;
  }

  closeSearch(): void {
    this.searchFocused = false;
    this.searchTerm = '';
  }

  navigateToModule(route: string): void {
    this.router.navigate([route]);
    this.closeSearch();
  }

  selectFirstResult(): void {
    const results = this.searchResults();
    if (results.length > 0) {
      this.navigateToModule(results[0].route);
    }
  }

  onSearchBlur(): void {
    setTimeout(() => { this.searchFocused = false; }, 150);
  }
}
