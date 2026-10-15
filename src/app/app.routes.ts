import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'sales', loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent) },
      { path: 'sales/new', loadComponent: () => import('./pages/sale-new/sale-new.component').then(m => m.SaleNewComponent) },
      { path: 'clients', loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent) },
      { path: 'clients/:id', loadComponent: () => import('./pages/client-detail/client-detail.component').then(m => m.ClientDetailComponent) },
      { path: 'products', loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent) },
      { path: 'products/:id', loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
      { path: 'purchases', loadComponent: () => import('./pages/purchases/purchases.component').then(m => m.PurchasesComponent) },
      { path: 'purchases/new', loadComponent: () => import('./pages/purchase-new/purchase-new.component').then(m => m.PurchaseNewComponent) },
      { path: 'lots', loadComponent: () => import('./pages/lots/lots.component').then(m => m.LotsComponent) },
      { path: 'lots/:id', loadComponent: () => import('./pages/lot-detail/lot-detail.component').then(m => m.LotDetailComponent) },
      { path: 'inventory', loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'suppliers', loadComponent: () => import('./pages/suppliers/suppliers.component').then(m => m.SuppliersComponent) },
      { path: 'users', canActivate: [adminGuard], loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'login' }
];
