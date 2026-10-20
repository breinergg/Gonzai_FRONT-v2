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
  /** Solo aparece en la búsqueda (accesos directos), no en el menú lateral. */
  searchOnly?: boolean;
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
    { id: 'dashboard',    label: 'Dashboard',     icon: 'grid',       route: '/dashboard',     adminOnly: false, keywords: ['inicio', 'panel', 'principal', 'asistente', 'goncho', 'chat', 'ia'] },
    { id: 'sales',        label: 'Ventas',        icon: 'dollar',     route: '/sales',         adminOnly: false, keywords: ['venta', 'ventas', 'cobrar', 'abono', 'pago'] },
    { id: 'clients',      label: 'Clientes',      icon: 'users',      route: '/clients',       adminOnly: false, keywords: ['cliente', 'deuda', 'saldo', 'abono'] },
    { id: 'products',     label: 'Productos',     icon: 'box',        route: '/products',      adminOnly: false, keywords: ['producto', 'catalogo', 'stock', 'variante', 'talla', 'color', 'prenda'] },
    { id: 'purchases',    label: 'Compras',       icon: 'cart',       route: '/purchases',     adminOnly: false, keywords: ['compra', 'compras', 'factura', 'lote'] },
    { id: 'lots',         label: 'Lotes',         icon: 'trend',      route: '/lots',          adminOnly: false, keywords: ['lote', 'lotes', 'rentabilidad', 'ganancia', 'inversion'] },
    { id: 'inventory',    label: 'Inventario',    icon: 'clipboard',  route: '/inventory',     adminOnly: false, keywords: ['inventario', 'movimiento', 'entrada', 'salida', 'ajuste'] },
    { id: 'suppliers',    label: 'Proveedores',   icon: 'truck',      route: '/suppliers',     adminOnly: false, keywords: ['proveedor', 'proveedores'] },
    { id: 'users',        label: 'Usuarios',      icon: 'user-admin', route: '/users',         adminOnly: true,  keywords: ['usuario', 'admin', 'administrador'] },
    { id: 'settings',     label: 'Configuración', icon: 'settings',   route: '/settings',      adminOnly: true,  keywords: ['configuracion', 'negocio', 'logo', 'comprobante', 'tienda'] },
    { id: 'profile',      label: 'Mi Perfil',     icon: 'user',       route: '/profile',       adminOnly: false, keywords: ['perfil', 'cuenta', 'contraseña', 'password'], searchOnly: true },
    { id: 'sale-new',     label: 'Nueva venta',   icon: 'plus',       route: '/sales/new',     adminOnly: false, keywords: ['nueva venta', 'vender', 'pos', 'caja'], searchOnly: true },
    { id: 'purchase-new', label: 'Nuevo lote',    icon: 'plus',       route: '/purchases/new', adminOnly: false, keywords: ['nuevo lote', 'nueva compra', 'registrar compra'], searchOnly: true },
  ];

  currentUser = this.auth.currentUser;

  isAdmin = computed(() => this.auth.isAdmin());

  navItems = computed(() =>
    this.allNavItems.filter(item => !item.searchOnly && (!item.adminOnly || this.isAdmin()))
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
    this.router.navigateByUrl(route);
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
