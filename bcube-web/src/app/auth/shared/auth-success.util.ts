import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { ApiResponse } from '../../models/responses/ApiResponse';
import { JwtResponse } from '../../models/responses/user/JwtResponse';
import { User } from '../../models/User';

/**
 * Shared "login succeeded" handling used by both login and register: persists the
 * session, hands the success message to the next page via sessionStorage, and
 * routes to the role-appropriate dashboard.
 */
export function handleAuthSuccess(res: ApiResponse<JwtResponse>, auth: AuthService, router: Router): void {
  const jwt = res.data;

  const user: User = {
    id: jwt.id,
    email: jwt.email,
    role: jwt.role
  };

  auth.storeAuth(jwt.token, user);
  sessionStorage.setItem('loginSuccessMessage', res.message);
  router.navigate([jwt.role === 'ADMIN' ? '/admin-dashboard/studios' : '/user-dashboard/studios']);
}
