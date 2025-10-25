import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/User';
import { LoginRequest } from '../../models/requests/user/LoginRequest';
import { RegisterRequest } from '../../models/requests/user/RegisterRequest';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/responses/ApiResponse';
import { JwtResponse } from '../../models/responses/user/JwtResponse';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ResetPasswordRequest } from '../../models/requests/studio/ResetPasswordRequest';
import { ResetPasswordResponse } from '../../models/responses/user/ResetPasswordResponse';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  constructor(private http: HttpClient, private router: Router) {}

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