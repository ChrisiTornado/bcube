import { Booking } from '@models/booking.model';
import { BookingStatus } from '@models/booking-status.model';
import { BookingTimePickerComponent } from './booking-time-picker.component';

function makeBooking(date: string, startTime: string, endTime: string): Booking {
  return {
    id: 1,
    studio: {} as Booking['studio'],
    user: {} as Booking['user'],
    date,
    startTime,
    endTime,
    status: BookingStatus.CONFIRMED,
    createdAt: startTime
  };
}

describe('BookingTimePickerComponent', () => {
  let component: BookingTimePickerComponent;

  beforeEach(() => {
    component = new BookingTimePickerComponent();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('isEndTimeValid', () => {
    it('is valid when either time is unset', () => {
      expect(component.isEndTimeValid()).toBeTrue();
    });

    it('is valid when end time is after start time', () => {
      component.startTime = new Date(2026, 0, 1, 9, 0);
      component.endTime = new Date(2026, 0, 1, 11, 0);
      expect(component.isEndTimeValid()).toBeTrue();
    });

    it('is invalid when end time is before or equal to start time', () => {
      component.startTime = new Date(2026, 0, 1, 11, 0);
      component.endTime = new Date(2026, 0, 1, 9, 0);
      expect(component.isEndTimeValid()).toBeFalse();

      component.endTime = new Date(2026, 0, 1, 11, 0);
      expect(component.isEndTimeValid()).toBeFalse();
    });
  });

  describe('isBookingInPast', () => {
    it('treats a missing date or start time as in the past', () => {
      expect(component.isBookingInPast()).toBeTrue();
    });

    it('is true for a date/time far in the past', () => {
      component.date = new Date(2000, 0, 1);
      component.startTime = new Date(2000, 0, 1, 9, 0);
      expect(component.isBookingInPast()).toBeTrue();
    });

    it('is false for a date/time far in the future', () => {
      component.date = new Date(2099, 0, 1);
      component.startTime = new Date(2099, 0, 1, 9, 0);
      expect(component.isBookingInPast()).toBeFalse();
    });
  });

  describe('checkTimeConflict', () => {
    it('clears the conflict flag when date or times are missing', () => {
      component.hasTimeConflict = true;
      component.checkTimeConflict();
      expect(component.hasTimeConflict).toBeFalse();
    });

    it('clears the conflict flag when end time is not after start time', () => {
      component.date = new Date(2099, 0, 1);
      component.startTime = new Date(2099, 0, 1, 11, 0);
      component.endTime = new Date(2099, 0, 1, 9, 0);
      component.checkTimeConflict();
      expect(component.hasTimeConflict).toBeFalse();
    });

    it('detects an overlap with an existing booking on the same day', () => {
      component.date = new Date(2099, 0, 1);
      component.startTime = new Date(2099, 0, 1, 10, 0);
      component.endTime = new Date(2099, 0, 1, 12, 0);
      component.bookings = [makeBooking('2099-01-01', '2099-01-01T11:00:00', '2099-01-01T13:00:00')];

      component.checkTimeConflict();

      expect(component.hasTimeConflict).toBeTrue();
    });

    it('does not flag adjacent (non-overlapping) bookings', () => {
      component.date = new Date(2099, 0, 1);
      component.startTime = new Date(2099, 0, 1, 10, 0);
      component.endTime = new Date(2099, 0, 1, 12, 0);
      component.bookings = [makeBooking('2099-01-01', '2099-01-01T12:00:00', '2099-01-01T13:00:00')];

      component.checkTimeConflict();

      expect(component.hasTimeConflict).toBeFalse();
    });

    it('ignores bookings on a different day', () => {
      component.date = new Date(2099, 0, 1);
      component.startTime = new Date(2099, 0, 1, 10, 0);
      component.endTime = new Date(2099, 0, 1, 12, 0);
      component.bookings = [makeBooking('2099-01-02', '2099-01-02T10:00:00', '2099-01-02T12:00:00')];

      component.checkTimeConflict();

      expect(component.hasTimeConflict).toBeFalse();
    });
  });

  describe('canBook', () => {
    function makeBookable(): void {
      component.date = new Date(2099, 0, 1);
      component.startTime = new Date(2099, 0, 1, 10, 0);
      component.endTime = new Date(2099, 0, 1, 12, 0);
    }

    it('is false when any required field is missing', () => {
      expect(component.canBook()).toBeFalse();
    });

    it('is true for a fully valid, conflict-free, future booking', () => {
      makeBookable();
      expect(component.canBook()).toBeTrue();
    });

    it('is false when the selected date is disabled', () => {
      makeBookable();
      component.disabledDates = [new Date(2099, 0, 1)];
      expect(component.canBook()).toBeFalse();
    });

    it('is false when there is a time conflict', () => {
      makeBookable();
      component.bookings = [makeBooking('2099-01-01', '2099-01-01T11:00:00', '2099-01-01T13:00:00')];
      component.checkTimeConflict();
      expect(component.canBook()).toBeFalse();
    });

    it('is false when end time is not after start time', () => {
      makeBookable();
      component.endTime = new Date(2099, 0, 1, 9, 0);
      expect(component.canBook()).toBeFalse();
    });
  });

  describe('normalizeToQuarterHour', () => {
    it('returns null for a null input', () => {
      expect(component.normalizeToQuarterHour(null)).toBeNull();
    });

    it('rounds down within the lower half of a quarter-hour window', () => {
      const result = component.normalizeToQuarterHour(new Date(2026, 0, 1, 9, 22));
      expect(result?.getMinutes()).toBe(15);
    });

    it('rounds up within the upper half of a quarter-hour window', () => {
      const result = component.normalizeToQuarterHour(new Date(2026, 0, 1, 9, 23));
      expect(result?.getMinutes()).toBe(30);
    });

    it('zeroes out seconds and milliseconds', () => {
      const result = component.normalizeToQuarterHour(new Date(2026, 0, 1, 9, 0, 45, 500));
      expect(result?.getSeconds()).toBe(0);
      expect(result?.getMilliseconds()).toBe(0);
    });
  });

  describe('ngOnChanges', () => {
    it('re-checks the time conflict when the date input changes', () => {
      component.date = new Date(2099, 0, 1);
      component.startTime = new Date(2099, 0, 1, 10, 0);
      component.endTime = new Date(2099, 0, 1, 12, 0);
      component.bookings = [makeBooking('2099-01-01', '2099-01-01T11:00:00', '2099-01-01T13:00:00')];

      component.ngOnChanges({ date: {} as any });

      expect(component.hasTimeConflict).toBeTrue();
    });

    it('does nothing when an unrelated input changes', () => {
      component.hasTimeConflict = false;
      component.date = new Date(2099, 0, 1);
      component.startTime = new Date(2099, 0, 1, 10, 0);
      component.endTime = new Date(2099, 0, 1, 12, 0);
      component.bookings = [makeBooking('2099-01-01', '2099-01-01T11:00:00', '2099-01-01T13:00:00')];

      component.ngOnChanges({ disabledDates: {} as any });

      expect(component.hasTimeConflict).toBeFalse();
    });
  });

  describe('requestBooking', () => {
    it('emits the selected start/end time', () => {
      const start = new Date(2099, 0, 1, 10, 0);
      const end = new Date(2099, 0, 1, 12, 0);
      component.startTime = start;
      component.endTime = end;

      const emitted: { startTime: Date; endTime: Date }[] = [];
      component.bookRequested.subscribe(value => emitted.push(value));

      component.requestBooking();

      expect(emitted).toEqual([{ startTime: start, endTime: end }]);
    });

    it('does not emit when start or end time is missing', () => {
      const emitted: unknown[] = [];
      component.bookRequested.subscribe(value => emitted.push(value));

      component.requestBooking();

      expect(emitted.length).toBe(0);
    });
  });

  describe('reset', () => {
    it('clears the picked times and the conflict flag', () => {
      component.startTime = new Date();
      component.endTime = new Date();
      component.hasTimeConflict = true;

      component.reset();

      expect(component.startTime).toBeNull();
      expect(component.endTime).toBeNull();
      expect(component.hasTimeConflict).toBeFalse();
    });
  });
});
