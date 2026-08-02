import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@core/services/auth.service';
import { StudioService } from '@features/studios/studio.service';
import { BookingService } from '@features/bookings/booking.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
// @fullcalendar/core@7.x ships a broken (empty) index.d.ts upstream - confirmed across
// every published 7.x release (7.0.0-7.1.0-alpha.0), which also breaks @fullcalendar/interaction's
// re-exported types. Falling back to `any` until that's fixed upstream; runtime is unaffected.
type DateClickArg = any;
type CalendarOptions = any;
type EventInput = any;
import { Studio } from '@models/studio.model';
import { Booking } from '@models/booking.model';
import { CreateBookingRequest } from '@models/requests/booking/create-booking-request';
import { UpdateStudioComponent } from '@features/studios/studios-view/update-studio/update-studio.component';
import { extractErrorMessage } from '@shared/util/error-message.util';
import { toIsoDate, formatBookingTime, formatBookingTimeRange as formatBookingTimeRangeUtil, formatTimeOfDay } from '@shared/util/booking-time.util';
import { MarkdownPipe } from '@shared/util/markdown.pipe';
import { StudioGalleryComponent } from '@features/studios/studios-view/studio-details/studio-gallery/studio-gallery.component';
import { BookingTimePickerComponent } from '@features/studios/studios-view/studio-details/booking-time-picker/booking-time-picker.component';

@Component({
    selector: 'app-studio-details',
    imports: [
        CommonModule,
        ButtonModule,
        LoadingSpinnerComponent,
        FullCalendarModule,
        UpdateStudioComponent,
        MarkdownPipe,
        StudioGalleryComponent,
        BookingTimePickerComponent
    ],
    templateUrl: './studio-details.component.html',
    styleUrl: './studio-details.component.css'
})
export class StudioDetailsComponent implements OnInit {
  private readonly blockingStatuses = new Set(['CONFIRMED', 'PENDING', 'DONE']);

  @ViewChild(BookingTimePickerComponent) picker?: BookingTimePickerComponent;

  // === Properties ===
  studio: Studio | null = null;
  isUser = false;
  isAdmin = false;
  private returnUrl?: string;
  loading!: boolean;
  date: Date | null = null;

  bookings: Booking[] = [];
  disabledDates: Date[] = [];

  calendarPlugins = [dayGridPlugin, interactionPlugin];
  calendarEvents: EventInput[] = [];

  calendarOptions: CalendarOptions = this.buildCalendarOptions(this.calendarEvents);

  loading$ = this.studioService.loading$;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studioService: StudioService,
    private authService: AuthService,
    private bookingService: BookingService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  // === Lifecycle ===

  /** Initialisiert Studio-Details, Kalender und Buchungen */
  ngOnInit(): void {
    this.isUser = this.authService.getRole() === 'USER';
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.returnUrl = history.state?.returnUrl;

    const studioId = this.route.snapshot.paramMap.get('id');
    if (studioId) {
      this.studioService.getStudioById(+studioId).subscribe(data => (this.studio = data));
      this.loadBookings(+studioId);
    }
  }

  // === Data loading ===

  /** Lädt Buchungen für das aktuelle Studio und baut den Kalender */
  private loadBookings(studioId: number): void {
    this.bookingService.getBookingsByStudioId(studioId).subscribe(bookings => {
      this.bookings = bookings.filter(b => this.blockingStatuses.has(b.status));
      this.markCalendarDates();

      const events = this.bookings.map(b => ({
        title: `${formatBookingTime(b.startTime)} – ${formatBookingTime(b.endTime)}`,
        date: toIsoDate(new Date(b.date)),
        color: '#ffa722',
        textColor: '#111111',
        borderColor: '#ffa722'
      }));

      const today = new Date();
      this.calendarOptions = this.buildCalendarOptions(
        events,
        this.isUser ? { start: toIsoDate(today) } : undefined
      );
    });
  }

  // === Calendar interaction ===

  /** Shared FullCalendar config for both the initial field value and every rebuild after a data/date change. */
  private buildCalendarOptions(events: EventInput[], validRangeStart?: { start: string }): CalendarOptions {
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
      dayCellClassNames: (arg: any) => this.date && toIsoDate(this.date) === toIsoDate(arg.date) ? ['fc-day-selected'] : [],
      moreLinkContent: (arg: any) => ({ html: `+${arg.num} Mehr` }),
      moreLinkClick: 'popover',
      dateClick: this.handleDateClick.bind(this),
      ...(validRangeStart && { validRange: validRangeStart })
    };
  }

  /** Wird ausgelöst, wenn ein Datum im Kalender angeklickt wird */
  handleDateClick(arg: DateClickArg): void {
    const clickedDate = new Date(arg.dateStr);
    this.date = clickedDate;

    this.calendarOptions = {
      ...this.calendarOptions,
      dayMaxEvents: 2,
      moreLinkContent: (arg: any) => ({ html: `+${arg.num} Mehr` }),
      moreLinkClick: 'popover',
      dayCellClassNames: (cellArg: any) => this.date && toIsoDate(this.date) === toIsoDate(cellArg.date) ? ['fc-day-selected'] : []
    };
  }

  /** Markiert Tage im Kalender, die bereits voll oder teilweise gebucht sind */
  private markCalendarDates(): void {
    const bookingsByDate = new Map<string, Booking[]>();

    for (const booking of this.bookings) {
      const dateStr = booking.date;
      if (!bookingsByDate.has(dateStr)) bookingsByDate.set(dateStr, []);
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
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return;

      const isoDate = toIsoDate(dateObj);

      for (const b of bookingsOnDate) {
        this.calendarEvents.push({
          title: `${b.startTime} – ${b.endTime}`,
          date: isoDate,
          color: '#ffa722',
          textColor: '#111111',
          borderColor: '#ffa722'
        });
      }

      if (ratio >= 0.95) {
        this.disabledDates.push(dateObj);
        this.calendarEvents.push({
          start: isoDate,
          display: 'background',
          color: 'rgba(167, 176, 194, 0.16)'
        });
      }
    });
  }

  // === Booking actions ===

  /** Öffnet Bestätigungsdialog vor dem Buchen */
  confirmBooking(times: { startTime: Date; endTime: Date }): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Cube "${this.studio!.name}" wirklich buchen?`,
      header: 'Buchung bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Abbrechen',
      accept: () => this.book(times)
    });
  }

  /** Sendet Buchung an Backend */
  private book(times: { startTime: Date; endTime: Date }): void {
    if (!this.date) return;
    this.loading = true;

    const payload: CreateBookingRequest = {
      userID: this.authService.getUser()!.id,
      studioID: this.studio!.id,
      smartlockID: this.studio!.smartlockId,
      date: this.formatDateVienna(this.date),
      startTime: this.formatTimeVienna(times.startTime),
      endTime: this.formatTimeVienna(times.endTime)
    };

    this.bookingService.create(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.refreshCalendar();
          this.picker?.reset();
          this.date = null;

          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: res.message
          });
          this.router.navigate(
            [`/user-dashboard/booking-details/${res.data.id}`],
            { state: { returnUrl: this.router.url } }
          );
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Löschen fehlgeschlagen.')
          });
        }
      });
  }

  /** Lädt den Kalender nach erfolgreicher Buchung neu */
  private refreshCalendar(): void {
    const studioId = this.route.snapshot.paramMap.get('id');
    if (studioId) this.loadBookings(+studioId);
  }

  // === Navigation & UI ===

  /** Navigiert zurück zur vorherigen Seite */
  goBack(): void {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    const basePath = this.isUser ? '/user-dashboard' : '/admin-dashboard';
    this.router.navigate([`${basePath}/studios`]);
  }

  // === Helper ===

  private formatTimeVienna(date: Date): string {
    return formatTimeOfDay(date, 'Europe/Vienna');
  }

  private formatDateVienna(date: Date): string {
    const parts = new Intl.DateTimeFormat('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Vienna'
    }).formatToParts(date);
    const day = parts.find(p => p.type === 'day')!.value;
    const month = parts.find(p => p.type === 'month')!.value;
    const year = parts.find(p => p.type === 'year')!.value;
    return `${day}.${month}.${year}`;
  }

  formatSelectedDateLabel(): string {
    if (!this.date) {
      return '';
    }

    return new Intl.DateTimeFormat('de-AT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Vienna'
    }).format(this.date);
  }

  formatBookingRange(booking: Booking): string {
    return formatBookingTimeRangeUtil(booking.startTime, booking.endTime, 'Europe/Vienna');
  }
}
