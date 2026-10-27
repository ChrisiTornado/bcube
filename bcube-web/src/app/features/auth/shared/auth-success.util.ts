import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ApiResponse } from '@models/responses/api-response';
import { JwtResponse } from '@models/responses/user/jwt-response';
import { User } from '@models/user.model';
import { consumeReturnUrl } from '@shared/util/auth-return-url.util';

/**
 * Shared "login succeeded" handling used by both login and register: persists the
 * session, hands the success message to the next page via sessionStorage, and
 * routes back to the remembered page or the role-appropriate dashboard.
 */
export function handleAuthSuccess(res: ApiResponse<JwtResponse>, auth: AuthService, router: Router): void {
  const jwt = res.data;

  const user: User = {
    id: jwt.id,
    email: jwt.email,
    role: jwt.role,
    firstName: jwt.firstName,
    lastName: jwt.lastName,
    phone: jwt.phone,
    authProvider: jwt.authProvider
  };

  auth.storeAuth(jwt.token, user);
  sessionStorage.setItem('loginSuccessMessage', res.message);
  router.navigateByUrl(getPostLoginUrl(auth, user));
}

/**
 * Where to land once signed in: back on the page a guest was browsing when they chose to log in
 * (e.g. a studio they wanted to book), otherwise the role's dashboard. Admins always go to their
 * own dashboard - the remembered URL only ever points into the user area.
 */
export function getPostLoginUrl(auth: AuthService, user: User): string {
  const returnUrl = consumeReturnUrl();

  if (auth.isAdmin(user)) {
    return '/admin-dashboard/studios';
  }

  return returnUrl ?? '/studios';
}
