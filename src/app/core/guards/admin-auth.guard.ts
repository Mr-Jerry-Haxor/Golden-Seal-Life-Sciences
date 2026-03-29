import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthGuard: CanActivateFn = async () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  // Wait for initial auth state check from Firebase before deciding
  await authService.waitForAuthCheck();

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};
