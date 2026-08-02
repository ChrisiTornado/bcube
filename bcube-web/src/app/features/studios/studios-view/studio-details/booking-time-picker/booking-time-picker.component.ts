import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { Booking } from '@models/booking.model';
import { toIsoDate } from '@shared/util/booking-time.util';

@Component({
    selector: 'app-booking-time-picker',
    imports: [FormsModule, DatePickerModule, ButtonModule],
    templateUrl: './booking-time-picker.component.html',
    styleUrl: './booking-time-picker.component.css'
})
export class BookingTimePickerComponent implements OnChanges {
  @Input() date: Date | null = null;
  @Input() bookings: Booking[] = [];
  @Input() disabledDates: Date[] = [];

  @Output() bookRequested = new EventEmitter<{ startTime: Date; endTime: Date }>();

  startTime: Date | null = null;
  endTime: Date | null = null;
  hasTimeConflict = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['date'] || changes['bookings']) {
      this.checkTimeConflict();
    }
  }

  canBook(): boolean {
    return (
      this.date !== null &&
      !this.isDisabledDate(this.date) &&
      this.startTime !== null &&
      this.endTime !== null &&
      this.startTime < this.endTime &&
      !this.isBookingInPast() &&
      !this.hasTimeConflict
    );
  }

  requestBooking(): void {
    if (!this.startTime || !this.endTime) {
      return;
    }

    this.bookRequested.emit({ startTime: this.startTime, endTime: this.endTime });
  }

  public checkTimeConflict(): void {
    if (!this.date || !this.startTime || !this.endTime) {
      this.hasTimeConflict = false;
      return;
    }

    const selectedStart = this.combineDateAndTime(
      this.date,
      this.startTime
    );

    const selectedEnd = this.combineDateAndTime(
      this.date,
      this.endTime
    );

    if (selectedEnd <= selectedStart) {
      this.hasTimeConflict = false;
      return;
    }

    const selectedDateIso = toIsoDate(this.date);

    this.hasTimeConflict = this.bookings
      .filter(b => {
        const bookingIso = toIsoDate(new Date(b.date));
        const sameDate = bookingIso === selectedDateIso;
        return sameDate;
      })
      .some(b => {
        const existingStart = new Date(b.startTime);
        const existingEnd = new Date(b.endTime);
        const overlap =
          selectedStart < existingEnd &&
          selectedEnd > existingStart;
        return overlap;
      });
  }

  isBookingInPast(): boolean {
    if (!this.date || !this.startTime) return true;

    const bookingStart = this.combineDateAndTime(
      this.date,
      this.startTime
    );

    return bookingStart.getTime() <= Date.now();
  }

  private combineDateAndTime(date: Date, time: Date): Date {
    const result = new Date(date);
    result.setHours(
      time.getHours(),
      time.getMinutes(),
      0,
      0
    );
    return result;
  }

  /** Prüft, ob Endzeit nach Startzeit liegt */
  isEndTimeValid(): boolean {
    if (!this.startTime || !this.endTime) return true;
    return this.endTime > this.startTime;
  }

  normalizeToQuarterHour(date: Date | null): Date | null {
    if (!date) return null;
    const minutes = date.getMinutes();
    const remainder = minutes % 15;
    const roundedMinutes = remainder < 8 ? minutes - remainder : minutes + (15 - remainder);
    const normalized = new Date(date);
    normalized.setMinutes(roundedMinutes);
    normalized.setSeconds(0);
    normalized.setMilliseconds(0);
    return normalized;
  }

  setDefaultTime(type: 'start' | 'end'): void {
    const defaultDateStart = new Date();
    const defaultDateEnd = new Date();
    defaultDateStart.setHours(12, 0, 0, 0);
    defaultDateEnd.setHours(15, 0, 0, 0);

    let changed = false;

    if (type === 'start' && !this.startTime) {
      this.startTime = new Date(defaultDateStart);
      changed = true;
    }

    if (type === 'end' && !this.endTime) {
      this.endTime = new Date(defaultDateEnd);
      changed = true;
    }

    if (changed) {
      this.checkTimeConflict();
    }
  }

  /** Prüft, ob Datum gesperrt ist */
  private isDisabledDate(date: Date): boolean {
    return this.disabledDates.some(d => this.sameDate(d, date));
  }

  /** Vergleicht zwei Datumsobjekte auf Gleichheit (Tag, Monat, Jahr) */
  private sameDate(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }

  /** Setzt die Zeitauswahl nach erfolgreicher Buchung zurück */
  reset(): void {
    this.startTime = null;
    this.endTime = null;
    this.hasTimeConflict = false;
  }
}
