import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@core/services/auth.service';
import { BookingService } from '@features/bookings/booking.service';
import { Booking } from '@models/booking.model';
import { FullCalendarModule } from '@fullcalendar/angular';
// v7 final moved the dayGrid/interaction plugins from standalone @fullcalendar/daygrid and
// @fullcalendar/interaction packages to sub-path exports of @fullcalendar/angular itself.
import dayGridPlugin from '@fullcalendar/angular/daygrid';
// @fullcalendar/core@7.x ships a broken (empty) index.d.ts upstream - confirmed across
// every published 7.x release (7.0.0-7.1.0-alpha.0). Falling back to `any` for its types
// here until that's fixed upstream; the runtime behavior is unaffected.
type CalendarOptions = any;
type DatesSetArg = any;
type EventInput = any;
import interactionPlugin from '@fullcalendar/angular/interaction';
// v7 pulled theming out of the core into its own plugin - without this, the calendar renders
// with hashed-but-unstyled classes even though the theme's CSS is loaded via angular.json.
import themePlugin from '@fullcalendar/angular/themes/classic';
import { User } from '@models/user.model';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { BookingStatus } from '@models/booking-status.model';
import { getBookingStatusLabel } from '@shared/util/booking-status.util';
import { toIsoDate, formatBookingTimeRange as formatBookingTimeRangeUtil } from '@shared/util/booking-time.util';
import { extractErrorMessage } from '@shared/util/error-message.util';
import { buildBaseCalendarOptions } from '@shared/util/calendar-options.util';

@Component({
    selector: 'app-calendar-view',
    imports: [CommonModule,
        FormsModule,
        ButtonModule,
        FullCalendarModule,
        LoadingSpinnerComponent
    ],
    templateUrl: './calendar-view.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent implements OnInit {
  readonly bookingStatus = BookingStatus;
  selectedDate: string | null = null;
  displayedMonth: Date = this.startOfMonth(new Date());
  selectedDayBookings: Booking[] = [];
  bookingEventEntries: EventInput[] = [];
  isLoading = true;
  emptyStateMode: 'day' | 'month' = 'day';

  constructor(
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private messageService: MessageService
  ) { }

  calendarPlugins = [dayGridPlugin, interactionPlugin, themePlugin];
  calendarEvents: EventInput[] = [];
  bookings: Booking[] = [];

  user: User | null = null;

  calendarOptions: CalendarOptions = this.buildCalendarOptions(this.calendarEvents);

  ngOnInit(): void {
    this.user = this.authService.getUser();

    this.bookingService.getAllBookingsByUserId(+this.user!.id, 50).subscribe(bookings => {
      this.bookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.DONE);
      this.markCalendarDates();

      this.bookingEventEntries = this.bookings.map(b => this.toCalendarEvent(b));
      this.applyMonthSelection(this.displayedMonth);
      this.refreshCalendarOptions();

      this.isLoading = false;
    }, (err: HttpErrorResponse) => {
      this.isLoading = false;
      this.messageService.add({
        key: 'main',
        severity: 'error',
        summary: 'Fehler',
        detail: extractErrorMessage(err, 'Buchungen konnten nicht geladen werden.')
      });
    });
  }

  navigateToAllBookings(): void {
    this.router.navigate(['/user-dashboard', 'bookings'], {
      state: { returnUrl: this.router.url }
    });
  }

  selectDate(dateStr: string): void {
    if (this.selectedDate === dateStr) {
      this.applyMonthSelection(this.displayedMonth);
      this.refreshCalendarOptions();
      return;
    }

    this.selectedDate = dateStr;
    this.selectedDayBookings = this.bookings
      .filter(booking => toIsoDate(booking.date) === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    this.emptyStateMode = 'day';
    this.refreshCalendarOptions();
  }

  getSelectedDateLabel(): string {
    if (this.emptyStateMode === 'month') {
      return this.formatMonthLabel(this.displayedMonth);
    }

    if (!this.selectedDate) {
      return 'Kein Tag ausgewählt';
    }

    return this.formatDisplayDate(new Date(this.selectedDate));
  }

  get emptyStateMessage(): string {
    if (this.emptyStateMode === 'month') {
      return 'In diesem Monat gibt es keine geplanten oder abgeschlossenen Cube-Sessions.';
    }

    return 'Für diesen Tag gibt es keine geplanten oder abgeschlossenen Cube-Sessions.';
  }

  getStatusLabel(status: BookingStatus): string {
    return getBookingStatusLabel(status);
  }

  isDoneBooking(booking: Booking): boolean {
    return booking.status === BookingStatus.DONE;
  }

  showBookingDetails(booking: Booking): void {
    this.router.navigate(['/user-dashboard', 'booking-details', booking.id], {
      state: { returnUrl: this.router.url }
    });
  }

  private refreshCalendarOptions(): void {
    this.calendarOptions = this.buildCalendarOptions([...this.bookingEventEntries]);
  }

  /** Shared FullCalendar config for both the initial field value and every re-render after a data/month change. */
  private buildCalendarOptions(events: EventInput[]): CalendarOptions {
    return {
      ...buildBaseCalendarOptions(this.calendarPlugins, events),
      dayCellClass: (arg: any) => this.selectedDate === toIsoDate(arg.date) ? 'fc-day-selected' : '',
      moreLinkClass: () => 'bcube-more-link',
      popoverClass: 'bcube-popover',
      buttonClass: () => 'bcube-nav-btn',
      buttonGroupClass: () => 'bcube-nav-group',
      datesSet: (info: any) => this.handleMonthChange(info),
      moreLinkClick: (info: any) => {
        this.selectDate(toIsoDate(info.date));
        return 'popover';
      },
      dateClick: (info: any) => this.selectDate(info.dateStr)
    };
  }

  private handleMonthChange(info: DatesSetArg): void {
    const nextMonth = this.startOfMonth(info.view.currentStart ?? info.start);
    const currentMonth = this.startOfMonth(this.displayedMonth);

    if (this.isSameMonth(nextMonth, currentMonth)) {
      return;
    }

    this.displayedMonth = nextMonth;
    this.applyMonthSelection(nextMonth);
    this.refreshCalendarOptions();
  }

  /** Shows every booking of the given month in the side list with no day cell highlighted. */
  private applyMonthSelection(month: Date): void {
    this.selectedDate = null;
    this.selectedDayBookings = this.bookings
      .filter(booking => this.isSameMonth(new Date(toIsoDate(booking.date)), month))
      .sort((a, b) => toIsoDate(a.date).localeCompare(toIsoDate(b.date)) || a.startTime.localeCompare(b.startTime));
    this.emptyStateMode = 'month';
  }

  private toCalendarEvent(booking: Booking): EventInput {
    const isDone = booking.status === BookingStatus.DONE;

    return {
      title: this.formatBookingTimeRange(booking),
      date: toIsoDate(booking.date),
      color: isDone ? '#6f7785' : '#ffa722',
      contrastColor: isDone ? '#f5f7fb' : '#111111',
      className: isDone ? 'calendar-event-done' : 'calendar-event-confirmed'
    };
  }

  private formatDisplayDate(value: Date): string {
    const parts = new Intl.DateTimeFormat('de-AT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).formatToParts(value);

    const day = parts.find(part => part.type === 'day')?.value ?? '';
    const month = parts.find(part => part.type === 'month')?.value ?? '';
    const year = parts.find(part => part.type === 'year')?.value ?? '';

    return `${day}. ${month}, ${year}`;
  }

  private formatMonthLabel(value: Date): string {
    const parts = new Intl.DateTimeFormat('de-AT', {
      month: 'long',
      year: 'numeric'
    }).formatToParts(value);

    const month = parts.find(part => part.type === 'month')?.value ?? '';
    const year = parts.find(part => part.type === 'year')?.value ?? '';

    return `${month}, ${year}`;
  }

  private startOfDay(value: Date): Date {
    const normalized = new Date(value);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private startOfMonth(value: Date): Date {
    const normalized = this.startOfDay(value);
    normalized.setDate(1);
    return normalized;
  }

  private isSameMonth(lhs: Date, rhs: Date): boolean {
    return lhs.getFullYear() === rhs.getFullYear() && lhs.getMonth() === rhs.getMonth();
  }

  formatBookingTimeRange(booking: Booking): string {
    return formatBookingTimeRangeUtil(booking.startTime, booking.endTime);
  }

  markCalendarDates(): void {
    const bookingsByDate = new Map<string, Booking[]>();

    for (const booking of this.bookings) {
      const dateStr = booking.date;
      if (!bookingsByDate.has(dateStr)) {
        bookingsByDate.set(dateStr, []);
      }
      bookingsByDate.get(dateStr)!.push(booking);
    }

    this.calendarEvents = [];

    bookingsByDate.forEach((bookingsOnDate, dateStr) => {
      const totalMinutes = 24 * 60;
      let bookedMinutes = 0;

      for (const b of bookingsOnDate) {
        const [startH, startM] = b.startTime.split(':').map(Number);
        const [endH, endM] = b.endTime.split(':').map(Number);
        bookedMinutes += (endH * 60 + endM) - (startH * 60 + startM);
      }

      const ratio = bookedMinutes / totalMinutes;
      const dateObj = new Date(dateStr); // funktioniert bei ISO-Date
      if (isNaN(dateObj.getTime())) {
        console.warn('Ungültiges Datum:', dateStr);
        return;
      }
      const isoDate = toIsoDate(dateObj);

      // Alle Einzelbuchungen (Events)
      for (const b of bookingsOnDate) {
        this.calendarEvents.push({
          title: this.formatBookingTimeRange(b),
          date: isoDate,
          color: '#ffa722',
          textColor: '#111111',
          borderColor: '#ffa722'
        });
      }

      // Hintergrund-Blockade für vollgebuchte Tage
      if (ratio >= 0.95) {
        this.calendarEvents.push({
          start: isoDate,
          display: 'background',
          color: 'rgba(167, 176, 194, 0.16)',
        });
      }
    });
  }


}
