import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/user-dashboard' } as any)
    );
  }

  function fakeJwt(expiresInSeconds: number): string {
    const base64url = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${base64url({ alg: 'HS256' })}.${base64url({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.fake-signature`;
  }

  it('allows navigation when a valid, unexpired token is stored', () => {
    localStorage.setItem('auth_token', fakeJwt(3600));

    expect(runGuard()).toBeTrue();
  });

  it('redirects to /login when no token is stored', () => {
    const result = runGuard();

    expect(result).not.toBe(true);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree)).toBe('/login');
  });

  it('redirects to /login when the stored token has expired', () => {
    localStorage.setItem('auth_token', fakeJwt(-10));

    const result = runGuard();

    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
