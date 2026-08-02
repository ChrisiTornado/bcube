import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../../services/auth/auth.service';
import { BookingService } from '../../../../services/booking.service';
import { Booking } from '../../../../models/Booking';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CalendarOptions, DatesSetArg, EventInput } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import { User } from '../../../../models/User';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { BookingStatus } from '../../../../models/BookingStatus';

@Component({
    selector: 'app-calendar-view',
    imports: [CommonModule,
        FormsModule,
        CalendarModule,
        DropdownModule,
        ButtonModule,
        FullCalendarModule,
        LoadingSpinnerComponent
    ],
    templateUrl: './calendar-view.component.html',
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
    private bookingService: BookingService
  ) { }

  calendarPlugins = [dayGridPlugin, interactionPlugin];
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
      this.applyMonthSelection(this.displayedMonth, 0);
      this.refreshCalendarOptions();

      this.isLoading = false;
    }, () => {
      this.isLoading = false;
    });
  }

  navigateToAllBookings(): void {
    this.router.navigate(['/user-dashboard', 'all-bookings'], {
      state: { returnUrl: this.router.url }
    });
  }

  selectDate(dateStr: string): void {
    this.selectedDate = dateStr;
    this.displayedMonth = this.startOfMonth(new Date(dateStr));
    this.selectedDayBookings = this.bookings
      .filter(booking => this.toIsoDate(booking.date) === dateStr)
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
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'Bestätigt';
      case BookingStatus.DONE:
        return 'Abgeschlossen';
      case BookingStatus.CANCELLED:
        return 'Storniert';
      case BookingStatus.PENDING:
        return 'Ausstehend';
      case BookingStatus.FAILED:
        return 'Fehlgeschlagen';
      default:
        return status;
    }
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
      plugins: this.calendarPlugins,
      initialView: 'dayGridMonth',
      events,
      locale: 'de',
      dayMaxEvents: 2,
      fixedWeekCount: false,
      showNonCurrentDates: true,
      headerToolbar: {
        left: 'title',
        center: '',
        right: 'prev,next'
      },
      weekends: true,
      dayCellClassNames: (arg) => this.selectedDate === this.toIsoDate(arg.date) ? ['fc-day-selected'] : [],
      datesSet: (info) => this.handleMonthChange(info),
      moreLinkContent: (arg) => ({ html: `+${arg.num} Mehr` }),
      moreLinkClick: (info) => {
        this.selectDate(this.toIsoDate(info.date));
        return 'popover';
      },
      dateClick: (info) => this.selectDate(info.dateStr)
    };
  }

  private handleMonthChange(info: DatesSetArg): void {
    const nextMonth = this.startOfMonth(info.view.currentStart ?? info.start);
    const currentMonth = this.startOfMonth(this.displayedMonth);

    if (this.isSameMonth(nextMonth, currentMonth)) {
      return;
    }

    const direction = nextMonth > currentMonth ? 1 : -1;
    this.displayedMonth = nextMonth;
    this.applyMonthSelection(nextMonth, direction);
    this.refreshCalendarOptions();
  }

  private toIsoDate(dateValue: string | Date): string {
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    const normalizedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private applyMonthSelection(month: Date, direction: number): void {
    const monthBookings = this.bookings
      .filter(booking => this.isSameMonth(new Date(this.toIsoDate(booking.date)), month))
      .sort((a, b) => this.toIsoDate(a.date).localeCompare(this.toIsoDate(b.date)) || a.startTime.localeCompare(b.startTime));

    const today = this.startOfDay(new Date());
    const currentMonth = this.startOfMonth(today);
    const isCurrentMonth = this.isSameMonth(month, currentMonth);

    let targetBooking: Booking | undefined;
    if (isCurrentMonth) {
      targetBooking = monthBookings.find(booking => this.startOfDay(new Date(this.toIsoDate(booking.date))) >= today);
    } else if (direction < 0) {
      targetBooking = monthBookings[monthBookings.length - 1];
    } else {
      targetBooking = monthBookings[0];
    }

    if (targetBooking) {
      this.emptyStateMode = 'day';
      this.selectDate(this.toIsoDate(targetBooking.date));
      return;
    }

    this.selectedDate = this.toIsoDate(month);
    this.selectedDayBookings = [];
    this.emptyStateMode = 'month';
  }

  private toCalendarEvent(booking: Booking): EventInput {
    const isDone = booking.status === BookingStatus.DONE;

    return {
      title: this.formatBookingTimeRange(booking),
      date: this.toIsoDate(booking.date),
      color: isDone ? '#6f7785' : '#ffa722',
      textColor: isDone ? '#f5f7fb' : '#111111',
      borderColor: isDone ? '#6f7785' : '#ffa722',
      classNames: [isDone ? 'calendar-event-done' : 'calendar-event-confirmed']
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
    return `${this.formatBookingTime(booking.startTime)} - ${this.formatBookingTime(booking.endTime)}`;
  }

  private formatBookingTime(value: string): string {
    if (!value) {
      return '';
    }

    if (value.includes('T') || value.length > 5) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString('de-AT', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    }

    return value.slice(0, 5);
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
      const isoDate = this.toIsoDate(dateObj);

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
