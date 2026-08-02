import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CalendarViewComponent } from '@features/bookings/calendar-view/calendar-view.component';

describe('CalendarViewComponent', () => {
  let component: CalendarViewComponent;
  let fixture: ComponentFixture<CalendarViewComponent>;

  beforeEach(async () => {
    // ngOnInit reads the logged-in user via AuthService (localStorage), so seed one for the test.
    localStorage.setItem('auth_user', JSON.stringify({ id: 1, email: 'test@bcube.at', role: 'USER' }));

    await TestBed.configureTestingModule({
      imports: [CalendarViewComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('auth_user');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
