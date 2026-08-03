import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StornoBookingComponent } from './storno-booking.component';
import { BookingActionService } from '@features/bookings/booking-action.service';
import { BookingService } from '@features/bookings/booking.service';
import { Booking } from '@models/booking.model';

describe('StornoBookingComponent', () => {
  let component: StornoBookingComponent;
  let fixture: ComponentFixture<StornoBookingComponent>;
  let bookingActionService: jasmine.SpyObj<BookingActionService>;
  let bookingService: jasmine.SpyObj<BookingService>;

  const booking = { id: 1 } as Booking;

  beforeEach(async () => {
    bookingActionService = jasmine.createSpyObj('BookingActionService', ['confirmStorno']);
    bookingService = jasmine.createSpyObj('BookingService', ['reloadBookings']);

    await TestBed.configureTestingModule({
      imports: [StornoBookingComponent],
      providers: [
        { provide: BookingActionService, useValue: bookingActionService },
        { provide: BookingService, useValue: bookingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StornoBookingComponent);
    component = fixture.componentInstance;
    component.booking = booking;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('delegates to BookingActionService.confirmStorno with the current booking', () => {
    component.triggerStorno();

    expect(bookingActionService.confirmStorno).toHaveBeenCalledWith(
      booking,
      jasmine.any(Function),
      jasmine.any(Function),
      jasmine.any(Function)
    );
  });

  it('reloads bookings on both success and error callbacks', () => {
    component.triggerStorno();
    const args = bookingActionService.confirmStorno.calls.mostRecent().args;
    const onSuccess = args[1]!;
    const onError = args[2]!;

    onSuccess();
    expect(bookingService.reloadBookings).toHaveBeenCalledTimes(1);

    onError();
    expect(bookingService.reloadBookings).toHaveBeenCalledTimes(2);
  });

  it('tracks the loading state via the setLoading callback', () => {
    component.triggerStorno();
    const setLoading = bookingActionService.confirmStorno.calls.mostRecent().args[3]!;

    setLoading(true);
    expect(component.loading).toBeTrue();

    setLoading(false);
    expect(component.loading).toBeFalse();
  });
});
