import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthContainerComponent } from '@features/auth/auth-container/auth-container.component';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { AuthService } from '@core/services/auth.service';
import { ApiResponse } from '@models/responses/api-response';
import { JwtResponse } from '@models/responses/user/jwt-response';
import { handleAuthSuccess } from '@features/auth/shared/auth-success.util';

/**
 * Landing spot for the Google OAuth2 redirect chain (see OAuth2LoginSuccessHandler on the
 * backend). Everything comes back in the URL fragment, not a query string or a JSON body -
 * fragments never reach the server (no access-log/Referer leakage of the JWT) and this is a
 * full-page browser redirect, not an XHR the app could otherwise intercept.
 */
@Component({
  selector: 'app-oauth-callback',
  imports: [ToastModule, AuthContainerComponent, LoadingSpinnerComponent],
  templateUrl: './oauth-callback.component.html',
  styleUrl: './oauth-callback.component.css'
})
export class OauthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    history.replaceState(null, '', window.location.pathname);

    const error = params.get('error');
    if (error) {
      this.failAndRedirectToLogin();
      return;
    }

    const token = params.get('token');
    const id = params.get('id');
    const email = params.get('email');
    const role = params.get('role');

    if (!token || !id || !email || (role !== 'USER' && role !== 'ADMIN')) {
      this.failAndRedirectToLogin();
      return;
    }

    const jwt: JwtResponse = {
      token,
      type: 'Bearer',
      id: Number(id),
      email,
      role,
      firstName: params.get('firstName') || undefined,
      lastName: params.get('lastName') || undefined,
      phone: params.get('phone') || undefined,
      profileComplete: params.get('profileComplete') === 'true',
      authProvider: params.get('authProvider') === 'GOOGLE' ? 'GOOGLE' : 'LOCAL'
    };

    const res: ApiResponse<JwtResponse> = { message: 'Anmeldung mit Google erfolgreich', data: jwt };

    if (jwt.profileComplete) {
      handleAuthSuccess(res, this.authService, this.router);
      return;
    }

    // Persist now so the complete-profile page can update the same stored user afterwards, then
    // hand off to profileCompleteGuard's landing spot - it re-derives completeness itself, so
    // this is also where the user ends up again on any later visit if they never finish.
    this.authService.storeAuth(jwt.token, {
      id: jwt.id,
      email: jwt.email,
      role: jwt.role,
      firstName: jwt.firstName,
      lastName: jwt.lastName,
      phone: jwt.phone,
      authProvider: jwt.authProvider
    });
    sessionStorage.setItem('loginSuccessMessage', res.message);
    this.router.navigate(['/auth/complete-profile']);
  }

  private failAndRedirectToLogin(): void {
    this.messageService.add({
      key: 'main',
      severity: 'error',
      summary: 'Fehler',
      detail: 'Die Anmeldung mit Google ist fehlgeschlagen.'
    });
    this.router.navigate(['/login']);
  }
}
