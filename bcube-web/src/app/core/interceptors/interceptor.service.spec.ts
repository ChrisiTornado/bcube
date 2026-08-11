import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '@environments/environment';
import { InterceptorService } from './interceptor.service';

describe('InterceptorService', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;

  const ownApiUrl = `${environment.authUrl.replace(/\/auth$/, '')}/whatever`;
  const externalUrl = 'https://api.mapbox.com/whatever';

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('attaches the bearer token to our own API requests when a token is stored', () => {
    localStorage.setItem('auth_token', 'jwt-token');

    http.get(ownApiUrl).subscribe();

    const req = httpMock.expectOne(ownApiUrl);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it('does not attach an Authorization header when no token is stored', () => {
    http.get(ownApiUrl).subscribe();

    const req = httpMock.expectOne(ownApiUrl);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('does not attach the bearer token to requests outside our own API, even with a token stored', () => {
    localStorage.setItem('auth_token', 'jwt-token');

    http.get(externalUrl).subscribe();

    const req = httpMock.expectOne(externalUrl);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('clears stored auth and redirects to /login on a 401 response', () => {
    localStorage.setItem('auth_token', 'jwt-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: 1 }));
    const navigateSpy = spyOn(router, 'navigate');

    http.get(ownApiUrl).subscribe({ error: () => {} });

    const req = httpMock.expectOne(ownApiUrl);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(sessionStorage.getItem('sessionExpiredMessage')).toBeTruthy();
  });

  it('leaves stored auth untouched and does not redirect on a non-401 error', () => {
    localStorage.setItem('auth_token', 'jwt-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: 1 }));
    const navigateSpy = spyOn(router, 'navigate');

    http.get(ownApiUrl).subscribe({ error: () => {} });

    const req = httpMock.expectOne(ownApiUrl);
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(localStorage.getItem('auth_token')).toBe('jwt-token');
    expect(localStorage.getItem('auth_user')).not.toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('propagates the error to the caller after handling a 401', () => {
    localStorage.setItem('auth_token', 'jwt-token');
    let caughtStatus: number | undefined;

    http.get(ownApiUrl).subscribe({
      error: (err) => (caughtStatus = err.status)
    });

    const req = httpMock.expectOne(ownApiUrl);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(caughtStatus).toBe(401);
  });
});
