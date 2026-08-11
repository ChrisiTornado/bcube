import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeDeAt from '@angular/common/locales/de-AT';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { PaymentHistoryViewComponent } from './payment-history-view.component';
import { AuthService } from '@core/services/auth.service';
import { PaymentService } from '@features/payments/payment.service';
import { PageResponse } from '@models/responses/page-response';
import { PaymentResponse } from '@models/responses/payment/payment-response';

// The template's date pipe uses the 'de-AT' locale, which app.config.ts only registers as
// generic 'de' - fine in the real build (Angular CLI handles locale data at build time), but
// Karma's isolated test bundle needs it registered explicitly wherever it's actually exercised.
registerLocaleData(localeDeAt);

describe('PaymentHistoryViewComponent', () => {
  let component: PaymentHistoryViewComponent;
  let fixture: ComponentFixture<PaymentHistoryViewComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let paymentService: jasmine.SpyObj<PaymentService>;

  const page: PageResponse<PaymentResponse> = {
    content: [{
      id: 1, bookingId: 1, userId: 1, studioId: 1, hourlyRateCentsSnapshot: 1500, durationHours: 1,
      baseAmountCents: 1500, discountAmountCents: 0, finalAmountCents: 1500, currency: 'eur',
      status: 'SUCCEEDED', clientSecret: null, refundedAmountCents: 0, studioName: 'Test Cube',
      bookingDate: '2026-09-01', createdAt: '2026-08-01T10:00:00Z', invoiceNumber: 'RE-2026-000001'
    }],
    totalPages: 1,
    totalElements: 1,
    number: 0,
    size: 10,
    last: true
  };

  function setup(): void {
    authService = jasmine.createSpyObj('AuthService', ['getUser']);
    authService.getUser.and.returnValue({ id: 1, firstName: 'Test', lastName: 'User', email: 't@e.com', phone: '', role: 'USER' });

    paymentService = jasmine.createSpyObj('PaymentService', ['getHistory']);
    paymentService.getHistory.and.returnValue(of(page));

    TestBed.configureTestingModule({
      imports: [PaymentHistoryViewComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: PaymentService, useValue: paymentService },
        MessageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistoryViewComponent);
    component = fixture.componentInstance;
  }

  it('creates and loads the first page on init', () => {
    setup();
    fixture.detectChanges();

    expect(component.payments.length).toBe(1);
    expect(component.totalPages).toBe(1);
    expect(paymentService.getHistory).toHaveBeenCalledWith(1, 0, 10);
  });

  it('formats cents as a EUR currency string', () => {
    setup();
    fixture.detectChanges();

    expect(component.formatAmount(1500)).toContain('15,00');
  });

  it('keeps the previous page on a load error', () => {
    setup();
    paymentService.getHistory.and.returnValue(throwError(() => new Error('network down')));
    fixture.detectChanges();

    expect(component.payments).toEqual([]);
    expect(component.loading).toBeFalse();
  });
});
