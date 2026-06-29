import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const rol = auth.currentUser()?.rol?.toLowerCase() ?? '';
  if (rol === 'administrador' || rol === 'admin') {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
