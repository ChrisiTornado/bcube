import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let router: Router;
  let authServiceStub: { getRole: jasmine.Spy };

  beforeEach(() => {
    authServiceStub = { getRole: jasmine.createSpy('getRole') };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceStub }]
    });

    router = TestBed.inject(Router);
  });

  function runGuard(expectedRole: 'USER' | 'ADMIN') {
    const route = { data: { expectedRole } } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
  }

  it('allows navigation when the user role matches the expected role', () => {
    authServiceStub.getRole.and.returnValue('ADMIN');

    expect(runGuard('ADMIN')).toBeTrue();
  });

  it('redirects to /login when the user role does not match the expected role', () => {
    authServiceStub.getRole.and.returnValue('USER');

    const result = runGuard('ADMIN');

    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('redirects to /login when there is no role at all (not logged in)', () => {
    authServiceStub.getRole.and.returnValue(null);

    const result = runGuard('USER');

    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
