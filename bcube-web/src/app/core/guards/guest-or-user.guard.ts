import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { isProfileComplete } from '@shared/util/profile-complete.util';

/**
 * Gate for the public user shell (the landing page): guests and regular users may browse it,
 * while a signed-in admin is sent to their own dashboard and a signed-in account with an
 * unfinished profile is held at the completion step - same rules profileCompleteGuard/roleGuard
 * enforce on the authenticated routes, just without requiring a session at all.
 */
export const guestOrUserGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  if (auth.isAdmin()) {
    return router.createUrlTree(['/admin-dashboard/studios']);
  }

  return isProfileComplete(auth.getUser())
    ? true
    : router.createUrlTree(['/auth/complete-profile']);
};
