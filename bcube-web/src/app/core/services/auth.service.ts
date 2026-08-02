import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '@models/user.model';
import { LoginRequest } from '@models/requests/user/login-request';
import { RegisterRequest } from '@models/requests/user/register-request';
import { environment } from '@environments/environment.local';
import { ApiResponse } from '@models/responses/api-response';
import { JwtResponse } from '@models/responses/user/jwt-response';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ResetPasswordRequest } from '@models/requests/user/reset-password-request';
import { ResetPasswordResponse } from '@models/responses/user/reset-password-response';
import { VerifyCodeResponse } from '@models/responses/user/verify-code-response';
import { ChangePasswordResponse } from '@models/responses/user/change-password-response';
import { ChangePasswordRequest } from '@models/requests/user/change-password-request';

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
    return !!localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}