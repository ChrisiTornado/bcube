import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { finalize } from "rxjs";
import { AuthService } from '../../../../../services/auth/auth.service';
import { StudioService } from '../../../../../services/studio.service';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { studio } from '../../../../../models/studio';
import { BookingService } from '../../../../../services/booking.service';
import { CreateBookingRequest } from '../../../../../models/requests/CreateBookingRequest';
import { ApiResponse } from '../../../../../models/responses/ApiResponse';
import { BookingResponse } from '../../../../../models/responses/BookingResponse';
import { MessageService, ConfirmationService } from 'primeng/api';
import { booking } from '../../../../../models/booking';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import { Location } from '@angular/common';

@Component({
  selector: 'app-studio-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    LoadingSpinnerComponent,
    FullCalendarModule,
  ],
  templateUrl: './studio-details.component.html',
  styleUrl: './studio-details.component.css'
})
export class StudioDetailsComponent implements OnInit {
  studio: studio | null = null;
  isUser = false;
  date: Date | null = null;
  loading!: boolean;

  overlayVisible = false;
  overlayImage: string | null = null;

  calendarPlugins = [dayGridPlugin, interactionPlugin];
  calendarEvents: EventInput[] = [];

  startHours: { label: string; value: string; disabled?: boolean }[] = [];
  startMinutes: { label: string; value: string; disabled?: boolean }[] = [];

  selectedStartHour = '';
  selectedStartMinute = '';

  selectedEndHour = '';
  selectedEndMinute = '';

  bookings: booking[] = [];
  disabledDates: Date[] = [];
  highlightedDates: { date: Date; styleClass: string }[] = [];

  calendarOptions: CalendarOptions = {
    plugins: this.calendarPlugins,
    initialView: 'dayGridMonth',
    events: this.calendarEvents,
    locale: 'de',
    weekends: true,
    dateClick: this.handleDateClick.bind(this)
  };

  loading$ = this.studioService.loading$;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private studioService: StudioService,
    private authService: AuthService,
    private bookingService: BookingService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.isUser = this.authService.getRole() === 'USER';
    this.generateTimeParts();

    const studioId = this.route.snapshot.paramMap.get('id');
    if (studioId) {
      this.studioService.getStudioById(+studioId).subscribe(data => (this.studio = data));
    }

    this.bookingService.getBookingsByStudioId(+studioId!).subscribe(bookings => {
      this.bookings = bookings.filter(b => b.status === 'CONFIRMED');
      this.markCalendarDates();

      const events = this.bookings.map(b => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);

        const formatTime = (d: Date) =>
          d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', hour12: false });

        return {
          title: `${formatTime(start)} – ${formatTime(end)}`,
          date: new Date(b.date).toISOString().split('T')[0]
        };
      });

      const today = new Date();
      today.setDate(today.getDate())

      this.calendarOptions = {
        plugins: this.calendarPlugins,
        initialView: 'dayGridMonth',
        events: events,
        locale: 'de',
        weekends: true,
        dateClick: this.handleDateClick.bind(this),
        ...(this.isUser && {
          validRange: {
            start: today.toISOString().split('T')[0]
          }
        })
      };
    });
  }

  handleDateClick(arg: any): void {
    const clickedDate = new Date(arg.dateStr);
    this.date = clickedDate;

    const isoDate = clickedDate.toISOString().split('T')[0];

    // Nur filtern, wenn es ein Array ist
    const currentEvents = Array.isArray(this.calendarOptions.events)
      ? this.calendarOptions.events as EventInput[]
      : [];

    // Filtere vorherige Highlights raus
    const otherEvents = currentEvents.filter(
      (e: any) => e.display !== 'background' || e.color !== '#cce5ff'
    );

    // Neuer "highlight"-Hintergrundevent
    const highlightEvent: EventInput = {
      start: isoDate,
      end: isoDate,
      display: 'background',
      color: '#cce5ff'
    };

    // Aktualisiere events
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...otherEvents, highlightEvent]
    };

    this.updateAvailableTimesForDate(isoDate);
  }

  updateAvailableTimesForDate(dateStr: string): void {
    const bookingsOnDay = this.bookings.filter(b => b.date === dateStr);

    const bookedSlots: Set<string> = new Set();

    bookingsOnDay.forEach(b => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);

      for (
        let t = new Date(start);
        t < end;
        t.setMinutes(t.getMinutes() + 15)
      ) {
        const hour = t.getHours().toString().padStart(2, '0');
        const minute = t.getMinutes().toString().padStart(2, '0');
        bookedSlots.add(`${hour}:${minute}`);
      }
    });

    // Stunden und Minuten neu generieren
    this.startHours = [];
    this.startMinutes = [];

    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      const isDisabled = [0, 15, 30, 45].every(m => bookedSlots.has(`${hour}:${m.toString().padStart(2, '0')}`));
      this.startHours.push({ label: hour, value: hour, disabled: isDisabled });
    }

    for (let m of [0, 15, 30, 45]) {
      const minute = m.toString().padStart(2, '0');
      const isDisabled = [...Array(24).keys()].every(h =>
        bookedSlots.has(`${h.toString().padStart(2, '0')}:${minute}`)
      );
      this.startMinutes.push({ label: minute, value: minute, disabled: isDisabled });
    }
  }

  convertToISODate(dateStr: string): string {
    return new Date(dateStr).toISOString().split('T')[0];
  }

  generateTimeParts(): void {
    this.startHours = [];
    this.startMinutes = [];

    for (let h = 0; h < 24; h++) {
      const label = h.toString().padStart(2, '0');
      this.startHours.push({ label, value: label });
    }

    for (let m of [0, 15, 30, 45]) {
      const label = m.toString().padStart(2, '0');
      this.startMinutes.push({ label, value: label });
    }
  }

  confirmBooking(): void {
    this.confirmationService.confirm({
      message: `Möchten Sie das Studio "${this.studio!.name}" wirklich buchen?`,
      header: 'Buchung bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Nein',
      accept: () => this.book()
    });
  }

  book() {
    this.loading = true;
    let formattedDate: string | null = null;

    if (this.date) {
      formattedDate = this.formatDate(this.date);
    }

    const payload: CreateBookingRequest = {
      userID: this.authService.getUser()!.id,
      studioID: this.studio!.id,
      date: formattedDate!,
      startTime: `${this.selectedStartHour}:${this.selectedStartMinute}`,
      endTime: `${this.selectedEndHour}:${this.selectedEndMinute}`
    };

    this.bookingService.create(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ApiResponse<BookingResponse>) => {
          const bookingResult = res.data;
          console.log('Neue Buchung:', bookingResult);

          // Nach erfolgreicher Buchung: Kalender neu laden
          this.refreshCalendar();

          this.selectedStartHour = '';
        this.selectedStartMinute = '';
        this.selectedEndHour = '';
        this.selectedEndMinute = '';
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fehler',
            detail: 'Die Buchung konnte nicht durchgeführt werden.'
          });
        }
      });
  }

  refreshCalendar(): void {
    const studioId = this.route.snapshot.paramMap.get('id');
    if (!studioId) return;

    this.bookingService.getBookingsByStudioId(+studioId).subscribe(bookings => {
      this.bookings = bookings.filter(b => b.status === 'CONFIRMED');
      this.markCalendarDates();

      const events = this.bookings.map(b => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);

        const formatTime = (d: Date) =>
          d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', hour12: false });

        return {
          title: `${formatTime(start)} – ${formatTime(end)}`,
          date: new Date(b.date).toISOString().split('T')[0]
        };
      });

      this.calendarOptions = {
        ...this.calendarOptions,
        events: events
      };
    });
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }

  canBook(): boolean {
    return (
      this.date !== null &&
      !this.isDisabledDate(this.date) &&
      this.selectedStartHour !== '' &&
      this.selectedStartMinute !== '' &&
      this.selectedEndHour !== '' &&
      this.selectedEndMinute !== '' &&
      this.isEndTimeValid()
    );
  }


isEndTimeValid(): boolean {
  if (!this.selectedStartHour || !this.selectedStartMinute || !this.selectedEndHour || !this.selectedEndMinute) {
    return true; // noch keine Auswahl getroffen
  }

  const start = Number(this.selectedStartHour) * 60 + Number(this.selectedStartMinute);
  const end = Number(this.selectedEndHour) * 60 + Number(this.selectedEndMinute);

  return end > start;
}

  navigateToDetails(studio: studio): void {
    const basePath = this.isUser ? '/user-dashboard' : '/admin-dashboard';
    const navigationUrl = [basePath, 'studio-details', studio.id];

    this.router.navigate(navigationUrl);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      const basePath = this.isUser ? '/user-dashboard' : '/admin-dashboard';
      this.router.navigate([basePath + '/studios']);
    }
  }

  markCalendarDates(): void {
    const bookingsByDate = new Map<string, booking[]>();

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
          title: `${b.startTime} – ${b.endTime}`,
          date: isoDate,
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

  showOverlay(image: string) {
    this.overlayImage = image;
    this.overlayVisible = true;
  }

  hideOverlay() {
    this.overlayVisible = false;
    this.overlayImage = null;
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