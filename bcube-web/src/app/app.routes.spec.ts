import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { routes } from './app.routes';

describe('app routes', () => {
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter(routes), MessageService]
    });

    router = TestBed.inject(Router);
  });

  it('lands guests on the public studio overview', async () => {
    await router.navigateByUrl('/');

    expect(router.url).toBe('/studios');
  });

  it('redirects legacy /user-dashboard links to the root user area, keeping query params', async () => {
    await router.navigateByUrl('/user-dashboard/studio-details/4?from=mail');

    expect(router.url).toBe('/studio-details/4?from=mail');
  });

  it('sends guests to /login with a returnUrl for account-only pages', async () => {
    await router.navigateByUrl('/bookings');

    expect(router.url).toBe('/login?returnUrl=%2Fbookings');
  });
});
