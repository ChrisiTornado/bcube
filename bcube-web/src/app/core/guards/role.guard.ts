import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

/** Gates a route to a single role via `data: { expectedRole: 'ADMIN' | 'USER' }` on the route config. */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['expectedRole'];

  return auth.getRole() === expectedRole ? true : router.createUrlTree(['/login']);
};