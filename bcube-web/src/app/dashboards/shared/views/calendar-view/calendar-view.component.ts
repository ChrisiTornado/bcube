import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../../services/auth/auth.service';
import { StudioService } from '../../../../services/studio.service';
import { BookingService } from '../../../../services/booking.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Booking } from '../../../../models/Booking';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CalendarOptions, DatesSetArg, EventInput } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import { User } from '../../../../models/User';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    FullCalendarModule,
    RouterLink,
    LoadingSpinnerComponent
  ],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent implements OnInit {
  date = null;
  selectedDate: string | null = null;
  displayedMonth: Date = this.startOfMonth(new Date());
  selectedDayBookings: Booking[] = [];
  bookingEventEntries: EventInput[] = [];
  isLoading = true;
  emptyStateMode: 'day' | 'month' = 'day';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studioService: StudioService,
    private authService: AuthService,
    private bookingService: BookingService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  calendarPlugins = [dayGridPlugin, interactionPlugin];
  calendarEvents: EventInput[] = [];
  bookings: Booking[] = [];
  disabledDates: Date[] = [];
  highlightedDates: { date: Date; styleClass: string }[] = [];

  user: User | null = null;

  calendarOptions: CalendarOptions = {
    plugins: this.calendarPlugins,
    initialView: 'dayGridMonth',
    events: this.calendarEvents,
    locale: 'de',
    dayMaxEvents: 2,
    headerToolbar: {
      left: 'title',
      center: '',
      right: 'prev,next'
    },
    weekends: true,
    datesSet: (info) => this.handleMonthChange(info),
    moreLinkClick: (info) => {
      this.selectDate(info.date.toISOString().split('T')[0]);
      return 'popover';
    },
    dateClick: (info) => this.selectDate(info.dateStr)
  };

  ngOnInit(): void {
    this.user = this.authService.getUser();

    this.bookingService.getAllBookingsByUserId(+this.user!.id, 50).subscribe(bookings => {
      this.bookings = bookings.filter(b => b.status === 'CONFIRMED');
      this.markCalendarDates();

      this.bookingEventEntries = this.bookings.map(b => ({
        title: this.formatBookingTimeRange(b),
        date: this.toIsoDate(b.date),
        color: '#ffa722',
        textColor: '#111111',
        borderColor: '#ffa722'
      }));
      this.applyMonthSelection(this.displayedMonth, 0);
      this.refreshCalendarOptions();

      this.isLoading = false;
    }, () => {
      this.isLoading = false;
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
      return 'In diesem Monat gibt es keine Cube-Sessions.';
    }

    return 'Für diesen Tag gibt es keine Cube-Sessions.';
  }

  showBookingDetails(booking: Booking): void {
    this.router.navigate(['/user-dashboard', 'booking-details', booking.id], {
      state: { returnUrl: this.router.url }
    });
  }

  private refreshCalendarOptions(): void {
    const events = [...this.bookingEventEntries];

    if (this.selectedDate && this.emptyStateMode !== 'month') {
      events.push({
        start: this.selectedDate,
        display: 'background',
        color: 'rgba(255, 167, 34, 0.14)'
      });
    }

    this.calendarOptions = {
      plugins: this.calendarPlugins,
      initialView: 'dayGridMonth',
      events,
      locale: 'de',
      dayMaxEvents: 2,
      headerToolbar: {
        left: 'title',
        center: '',
        right: 'prev,next'
      },
      weekends: true,
      datesSet: (info) => this.handleMonthChange(info),
      moreLinkClick: (info) => {
        this.selectDate(info.date.toISOString().split('T')[0]);
        return 'popover';
      },
      dateClick: (info) => this.selectDate(info.dateStr)
    };
  }

  private handleMonthChange(info: DatesSetArg): void {
    const nextMonth = this.startOfMonth(info.start);
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
    const normalizedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return normalizedDate.toISOString().split('T')[0];
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

    this.disabledDates = [];
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
      const isoDate = dateObj.toISOString().split('T')[0];

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
        this.disabledDates.push(dateObj); // zum Vergleichen in canBook
        this.calendarEvents.push({
          start: isoDate,
          display: 'background',
          color: '#e0e0e0',
        });
      }
    });
  }


  isDisabledDate(date: Date): boolean {
    return this.disabledDates.some(d => this.sameDate(d, date));
  }

  isHighlightedDate(date: Date): boolean {
    return this.highlightedDates.some(h => this.sameDate(h.date, date));
  }

  sameDate(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();
  }

  highlightDaysInCalendar(): void {
    setTimeout(() => {
      const allTdElements = document.querySelectorAll('td[aria-label]');

      allTdElements.forEach((td: Element) => {
        const label = td.getAttribute('aria-label'); // e.g. "15 July 2025"
        if (!label) return;

        const parsedDate = new Date(label);
        if (this.isHighlightedDate(parsedDate)) {
          td.classList.add('partially-booked');
        }
      });
    }, 0);
  }
}
