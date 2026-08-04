import { BookingPaymentStepComponent } from './booking-payment-step.component';
import { BookingService } from '@features/bookings/booking.service';
import { PaymentService } from '@features/payments/payment.service';
import { Studio } from '@models/studio.model';

describe('BookingPaymentStepComponent', () => {
  let component: BookingPaymentStepComponent;

  beforeEach(() => {
    component = new BookingPaymentStepComponent({} as BookingService, {} as PaymentService);
    component.studio = { hourlyRateCents: 1500 } as Studio;
    component.times = {
      startTime: new Date('2026-09-01T10:00:00'),
      endTime: new Date('2026-09-01T11:30:00')
    };
    component.userId = 1;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('computes duration in hours from the selected times', () => {
    expect(component.durationHours).toBe(1.5);
  });

  it('computes the amount owed from the studio rate and duration', () => {
    expect(component.amountCents).toBe(2250);
  });

  it('formats cents as a EUR currency string', () => {
    expect(component.formatAmount(2250)).toContain('22,50');
  });

  it('switches to the card step once a booking with a clientSecret arrives', () => {
    expect(component.state).toBe('confirm');

    component.booking = {
      id: 1,
      clientSecret: 'pi_test_secret',
      amountDueCents: 2250
    } as any;
    component.ngOnChanges({ booking: {} as any });

    expect(component.state).toBe('card');
  });

  it('applies a voucher discount to the displayed amount', () => {
    component.voucherPreview = { code: 'TEST', discountAmountCents: 500, baseAmountCents: 2250, finalAmountCents: 1750 };
    expect(component.amountCents).toBe(1750);
  });

  it('emits the applied voucher code (not the raw input) on confirm', () => {
    let emitted: string | undefined = 'unset';
    component.confirmClicked.subscribe(code => emitted = code);

    component.voucherCode = 'TEST';
    component.confirmBooking();
    expect(emitted).toBeUndefined();

    component.voucherPreview = { code: 'TEST', discountAmountCents: 500, baseAmountCents: 2250, finalAmountCents: 1750 };
    component.confirmBooking();
    expect(emitted).toBe('TEST');
  });
});
