import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { CalendarViewComponent } from '@features/bookings/calendar-view/calendar-view.component';

function fakeJwt(expiresInSeconds: number): string {
  const base64url = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS256' })}.${base64url({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.fake-signature`;
}

describe('CalendarViewComponent', () => {
  let component: CalendarViewComponent;
  let fixture: ComponentFixture<CalendarViewComponent>;

  beforeEach(async () => {
    // ngOnInit reads the logged-in user via AuthService (localStorage), so seed a valid session.
    localStorage.setItem('auth_token', fakeJwt(3600));
    localStorage.setItem('auth_user', JSON.stringify({ id: 1, email: 'test@bcube.at', role: 'USER' }));

    await TestBed.configureTestingModule({
      imports: [CalendarViewComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.isGuest).toBeFalse();
  });

  it('shows a sign-in prompt instead of loading bookings for guests', () => {
    localStorage.removeItem('auth_token');

    const guestFixture = TestBed.createComponent(CalendarViewComponent);
    guestFixture.detectChanges();

    expect(guestFixture.componentInstance.isGuest).toBeTrue();
    expect(guestFixture.nativeElement.querySelector('.guest-calendar-hint')).not.toBeNull();
  });
});
