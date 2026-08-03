import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '@models/user.model';
import { LoginRequest } from '@models/requests/user/login-request';
import { RegisterRequest } from '@models/requests/user/register-request';
import { environment } from '@environments/environment';
import { ApiResponse } from '@models/responses/api-response';
import { JwtResponse } from '@models/responses/user/jwt-response';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ResetPasswordRequest } from '@models/requests/user/reset-password-request';
import { ResetPasswordResponse } from '@models/responses/user/reset-password-response';
import { VerifyCodeResponse } from '@models/responses/user/verify-code-response';
import { ChangePasswordResponse } from '@models/responses/user/change-password-response';
import { ChangePasswordRequest } from '@models/requests/user/change-password-request';
import { isJwtExpired } from '@shared/util/jwt.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  constructor(private http: HttpClient, private router: Router) { }

  login(payload: LoginRequest): Observable<ApiResponse<JwtResponse>> {
    return this.http.post<ApiResponse<JwtResponse>>(environment.authUrl + '/login', payload);
  }

  register(payload: RegisterRequest): Observable<ApiResponse<JwtResponse>> {
    return this.http.post<ApiResponse<JwtResponse>>(environment.authUrl + '/register', payload);
  }

  storeAuth(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }

  resetPassword(payload: ResetPasswordRequest) {
    return this.http.post<ApiResponse<ResetPasswordResponse>>(environment.authUrl + "/reset-password", payload);
  }

  verifyCode(email: string, code: string): Observable<ApiResponse<VerifyCodeResponse>> {
    return this.http.post<ApiResponse<VerifyCodeResponse>>(environment.authUrl + '/verify-code', { email, code });
  }

  changePassword(payload: ChangePasswordRequest): Observable<ApiResponse<ChangePasswordResponse>> {
      return this.http.post<ApiResponse<ChangePasswordResponse>>(environment.authUrl + '/change-password', payload);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token && !isJwtExpired(token);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  /** Single source of truth for "is this user an admin" - derives from `role`, not a separately-tracked flag. */
  isAdmin(user?: User | null): boolean {
    return (user !== undefined ? user : this.getUser())?.role === 'ADMIN';
  }

  isUser(user?: User | null): boolean {
    return (user !== undefined ? user : this.getUser())?.role === 'USER';
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Resolves the current user, tolerating older/alternate field-name casings that may still be
   * present in a stored `auth_user` entry (e.g. from before the User model was normalized).
   */
  resolveStoredUser(): User | null {
    const baseUser = this.getUser();

    try {
      const raw = localStorage.getItem(this.userKey);
      const parsed = raw ? JSON.parse(raw) : null;

      if (!parsed && !baseUser) {
        return null;
      }

      return {
        ...(baseUser || {}),
        id: parsed?.id ?? baseUser?.id ?? 0,
        email: parsed?.email ?? baseUser?.email ?? '',
        role: parsed?.role ?? baseUser?.role ?? 'USER',
        firstName: parsed?.firstName ?? parsed?.firstname ?? parsed?.first_name ?? baseUser?.firstName ?? '',
        lastName: parsed?.lastName ?? parsed?.lastname ?? parsed?.last_name ?? baseUser?.lastName ?? '',
        phone: parsed?.phone ?? parsed?.phoneNumber ?? parsed?.phone_number ?? parsed?.telephone ?? baseUser?.phone ?? '',
        isAdmin: parsed?.isAdmin ?? parsed?.admin ?? baseUser?.isAdmin ?? (parsed?.role ?? baseUser?.role) === 'ADMIN'
      };
    } catch {
      return baseUser ? { ...baseUser } : null;
    }
  }

  /** Merges a partial update into the currently stored user and persists it. */
  persistUserUpdate(patch: Partial<User>): User | null {
    const current = this.resolveStoredUser();
    if (!current) {
      return null;
    }

    const updated = { ...current, ...patch };
    localStorage.setItem(this.userKey, JSON.stringify(updated));
    return updated;
  }
}