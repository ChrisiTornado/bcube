import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { environment } from '@environments/environment';
import { Booking } from '@models/booking.model';
import { BookingStatus } from '@models/booking-status.model';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  const booking = (id: number): Booking => ({
    id,
    user: { id: 1, email: 'user@example.com', role: 'USER' },
    studio: { id: 1 } as any,
    date: '2026-01-01',
    startTime: '10:00',
    endTime: '11:00',
    status: BookingStatus.CONFIRMED
  } as unknown as Booking);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), MessageService]
    });

    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getBookings', () => {
    it('requests the admin listing with page/size params', () => {
      service.getBookings(2, 5).subscribe();

      const req = httpMock.expectOne(
        r => r.url === environment.bookingApiUrl && r.params.get('page') === '2' && r.params.get('size') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', data: { content: [booking(1)], totalPages: 1, number: 0, last: true } });
    });

    it('includes userId and studioId params only when provided', () => {
      service.getBookings(0, 10, 42, 7).subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('userId') === '42' && r.params.get('studioId') === '7'
      );
      expect(req.request.params.get('userId')).toBe('42');
      req.flush({ message: 'ok', data: { content: [], totalPages: 0, number: 0, last: true } });
    });

    it('toggles the loading signal around the request', () => {
      expect(service.loading()).toBeFalse();

      service.getBookings(0, 10).subscribe();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(r => r.url === environment.bookingApiUrl);
      req.flush({ message: 'ok', data: { content: [], totalPages: 0, number: 0, last: true } });

      expect(service.loading()).toBeFalse();
    });
  });

  describe('getBookingsByUserId', () => {
    it('requests the user-scoped endpoint with the userId in the path', () => {
      service.getBookingsByUserId(9, 0, 10).subscribe();

      const req = httpMock.expectOne(
        r => r.url === `${environment.bookingApiUrl}/user/9`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', data: { content: [booking(1)], totalPages: 1, number: 0, last: true } });
    });
  });

  describe('getBookingsByStudioId', () => {
    it('requests the studio-scoped endpoint', () => {
      service.getBookingsByStudioId(3).subscribe(result => {
        expect(result).toEqual([booking(1)]);
      });

      const req = httpMock.expectOne(`${environment.bookingApiUrl}/studio/3`);
      req.flush({ message: 'ok', data: [booking(1)] });
    });
  });

  describe('getBookingById', () => {
    it('requests the booking-details endpoint by id', () => {
      service.getBookingById(5).subscribe();

      const req = httpMock.expectOne(`${environment.bookingApiUrl}/5`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', data: booking(5) });
    });
  });

  describe('create', () => {
    it('posts the booking payload', () => {
      const payload = { userID: 1, studioID: 1, smartlockID: 1, date: '01.01.2026', startTime: '10:00', endTime: '11:00' };
      service.create(payload as any).subscribe();

      const req = httpMock.expectOne(environment.bookingApiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ message: 'ok', data: booking(1) });
    });
  });

  describe('storno', () => {
    it('sends a DELETE to the booking id', () => {
      service.storno(8).subscribe();

      const req = httpMock.expectOne(`${environment.bookingApiUrl}/8`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'ok', data: 8 });
    });
  });

  describe('setBookings / items', () => {
    it('exposes what was set via setBookings on the items signal', () => {
      service.setBookings([booking(1), booking(2)]);

      expect(service.items()).toEqual([booking(1), booking(2)]);
    });
  });
});
