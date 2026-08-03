import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '@environments/environment';
import { User } from '@models/user.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const testUser: User = { id: 1, email: 'user@example.com', role: 'USER' };

  function fakeJwt(expiresInSeconds: number): string {
    const base64url = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const header = base64url({ alg: 'HS256', typ: 'JWT' });
    const payload = base64url({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds });
    return `${header}.${payload}.fake-signature`;
  }

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('posts credentials to the auth login endpoint', () => {
      service.login({ email: 'user@example.com', password: 'secret' }).subscribe();

      const req = httpMock.expectOne(environment.authUrl + '/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@example.com', password: 'secret' });
      req.flush({ message: 'ok', data: {} });
    });
  });

  describe('register', () => {
    it('posts the registration payload to the auth register endpoint', () => {
      const payload = { email: 'new@example.com', password: 'secret', firstName: 'A', lastName: 'B', phone: '123' };
      service.register(payload).subscribe();

      const req = httpMock.expectOne(environment.authUrl + '/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ message: 'ok', data: {} });
    });
  });

  describe('storeAuth / logout', () => {
    it('persists token and user to localStorage', () => {
      service.storeAuth('jwt-token', testUser);

      expect(localStorage.getItem('auth_token')).toBe('jwt-token');
      expect(JSON.parse(localStorage.getItem('auth_user')!)).toEqual(testUser);
    });

    it('clears storage and navigates to /login on logout', () => {
      service.storeAuth('jwt-token', testUser);
      const navigateSpy = spyOn(router, 'navigate');

      service.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no token is stored', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('returns true once a valid, unexpired token is stored', () => {
      service.storeAuth(fakeJwt(3600), testUser);

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('returns false once the stored token has expired', () => {
      service.storeAuth(fakeJwt(-10), testUser);

      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('getUser / getRole / getToken', () => {
    it('returns null for all three when nothing is stored', () => {
      expect(service.getUser()).toBeNull();
      expect(service.getRole()).toBeNull();
      expect(service.getToken()).toBeNull();
    });

    it('returns the stored user, role and token after storeAuth', () => {
      service.storeAuth('jwt-token', testUser);

      expect(service.getUser()).toEqual(testUser);
      expect(service.getRole()).toBe('USER');
      expect(service.getToken()).toBe('jwt-token');
    });
  });

  describe('resetPassword / verifyCode / changePassword', () => {
    it('posts to the reset-password endpoint', () => {
      service.resetPassword({ email: 'user@example.com' }).subscribe();

      const req = httpMock.expectOne(environment.authUrl + '/reset-password');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'ok', data: { success: true } });
    });

    it('posts email and code to the verify-code endpoint', () => {
      service.verifyCode('user@example.com', '123456').subscribe();

      const req = httpMock.expectOne(environment.authUrl + '/verify-code');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@example.com', code: '123456' });
      req.flush({ message: 'ok', data: { success: true } });
    });

    it('posts to the change-password endpoint', () => {
      service.changePassword({ email: 'user@example.com', password: 'newpass' }).subscribe();

      const req = httpMock.expectOne(environment.authUrl + '/change-password');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'ok', data: { success: true } });
    });
  });
});
