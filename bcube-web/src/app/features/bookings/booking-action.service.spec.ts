import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MessageService, Confirmation } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { BookingActionService } from './booking-action.service';
import { BookingService } from '@features/bookings/booking.service';
import { BookingResponse } from '@models/responses/booking/booking-response';

describe('BookingActionService', () => {
  let service: BookingActionService;
  let confirmationService: jasmine.SpyObj<ConfirmationService>;
  let messageService: jasmine.SpyObj<MessageService>;
  let bookingService: jasmine.SpyObj<BookingService>;

  const booking = { id: 5, studio: { name: 'Test Cube' } } as BookingResponse;

  beforeEach(() => {
    confirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    bookingService = jasmine.createSpyObj('BookingService', ['storno', 'reloadBookings']);

    TestBed.configureTestingModule({
      providers: [
        BookingActionService,
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: MessageService, useValue: messageService },
        { provide: BookingService, useValue: bookingService }
      ]
    });

    service = TestBed.inject(BookingActionService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('confirmStorno', () => {
    it('asks for confirmation with the booking id and studio name in the message', () => {
      service.confirmStorno(booking);

      expect(confirmationService.confirm).toHaveBeenCalled();
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      expect(config.message).toContain('5');
      expect(config.message).toContain('Test Cube');
    });

    it('does not call storno before the user confirms', () => {
      service.confirmStorno(booking);
      expect(bookingService.storno).not.toHaveBeenCalled();
    });

    it('cancels the booking, shows a success toast, reloads and calls onSuccess once confirmed', () => {
      bookingService.storno.and.returnValue(of({ message: 'Storniert.', data: 5 }));
      const setLoading = jasmine.createSpy('setLoading');
      const onSuccess = jasmine.createSpy('onSuccess');
      const onError = jasmine.createSpy('onError');

      service.confirmStorno(booking, onSuccess, onError, setLoading);
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      config.accept!();

      expect(bookingService.storno).toHaveBeenCalledWith(5);
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
      expect(bookingService.reloadBookings).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(setLoading).toHaveBeenCalledWith(true);
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it('shows an error toast and calls onError when the storno request fails', () => {
      bookingService.storno.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      const onSuccess = jasmine.createSpy('onSuccess');
      const onError = jasmine.createSpy('onError');

      service.confirmStorno(booking, onSuccess, onError);
      const config = confirmationService.confirm.calls.mostRecent().args[0] as Confirmation;
      config.accept!();

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
      expect(bookingService.reloadBookings).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });
});
