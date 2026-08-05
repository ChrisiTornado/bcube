import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';
import { isProfileComplete } from '@shared/util/profile-complete.util';

/**
 * Blocks access to the rest of the app for accounts with a missing required field (in practice,
 * Google sign-ins that abandoned the "complete your profile" step). Runs after authGuard, so an
 * unauthenticated request is already redirected to /login by then.
 */
export const profileCompleteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return isProfileComplete(auth.getUser())
    ? true
    : router.createUrlTree(['/auth/complete-profile']);
};
