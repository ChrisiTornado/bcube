import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../../services/auth/auth.service';
import { StudioService } from '../../../../../services/studio.service';
import { BookingService } from '../../../../../services/booking.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Location } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CardModule } from 'primeng/card';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import { Studio } from '../../../../../models/Studio';
import { Booking } from '../../../../../models/Booking';
import { CreateBookingRequest } from '../../../../../models/requests/booking/CreateBookingRequest';
import { ApiResponse } from '../../../../../models/responses/ApiResponse';
import { BookingResponse } from '../../../../../models/responses/booking/BookingResponse';

@Component({
  selector: 'app-studio-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    ButtonModule,
    LoadingSpinnerComponent,
    FullCalendarModule,
    CardModule
  ],
  templateUrl: './studio-details.component.html',
  styleUrl: './studio-details.component.css'
})
export class StudioDetailsComponent implements OnInit {

  // === Properties ===
  studio: Studio | null = null;
  isUser = false;
  loading!: boolean;
  date: Date | null = null;

  startTime: Date | null = null;
  endTime: Date | null = null;
  defaultTime: Date = new Date();

  bookings: Booking[] = [];
  disabledDates: Date[] = [];
  highlightedDates: { date: Date; styleClass: string }[] = [];

  overlayVisible = false;
  overlayImage: string | null = null;

  calendarPlugins = [dayGridPlugin, interactionPlugin];
  calendarEvents: EventInput[] = [];

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

  // === Lifecycle ===

  /** Initialisiert Studio-Details, Kalender und Buchungen */
  ngOnInit(): void {
    this.isUser = this.authService.getRole() === 'USER';

    // Standardzeit auf 12:00 setzen
    this.defaultTime.setHours(12, 0, 0, 0);

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
      this.bookings = bookings.filter(b => b.status === 'CONFIRMED');
      this.markCalendarDates();

      const events = this.bookings.map(b => ({
        title: `${this.formatTime(new Date(b.startTime))} – ${this.formatTime(new Date(b.endTime))}`,
        date: new Date(b.date).toISOString().split('T')[0],
        color: '#000000ff',
        textColor: '#ffffff',
        borderColor: '#000000ff'
      }));

      const today = new Date();
      this.calendarOptions = {
        plugins: this.calendarPlugins,
        initialView: 'dayGridMonth',
        events,
        locale: 'de',
        weekends: true,
        dateClick: this.handleDateClick.bind(this),
        ...(this.isUser && {
          validRange: { start: today.toISOString().split('T')[0] }
        })
      };
    });
  }

  // === Calendar interaction ===

  /** Wird ausgelöst, wenn ein Datum im Kalender angeklickt wird */
  handleDateClick(arg: any): void {
    const clickedDate = new Date(arg.dateStr);
    this.date = clickedDate;

    const isoDate = clickedDate.toISOString().split('T')[0];
    const currentEvents = Array.isArray(this.calendarOptions.events)
      ? this.calendarOptions.events as EventInput[]
      : [];

    // Entfernt vorherige Markierungen
    const otherEvents = currentEvents.filter(
      (e: any) => e.display !== 'background' || e.color !== '#cce5ff'
    );

    // Hebt das gewählte Datum hervor
    const highlightEvent: EventInput = {
      start: isoDate,
      end: isoDate,
      display: 'background',
      color: '#cce5ff'
    };

    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...otherEvents, highlightEvent]
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

      const isoDate = dateObj.toISOString().split('T')[0];

      for (const b of bookingsOnDate) {
        this.calendarEvents.push({
          title: `${b.startTime} – ${b.endTime}`,
          date: isoDate
        });
      }

      if (ratio >= 0.95) {
        this.disabledDates.push(dateObj);
        this.calendarEvents.push({
          start: isoDate,
          display: 'background',
          color: '#e0e0e0'
        });
      }
    });
  }

  // === Booking actions ===

  /** Öffnet Bestätigungsdialog vor dem Buchen */
  confirmBooking(): void {
    this.confirmationService.confirm({
      message: `Möchten Sie das Studio "${this.studio!.name}" wirklich buchen?`,
      header: 'Buchung bestätigen',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja',
      rejectLabel: 'Abbrechen',
      accept: () => this.book()
    });
  }

  /** Sendet Buchung an Backend */
  private book(): void {
    if (!this.date || !this.startTime || !this.endTime) return;
    this.loading = true;

    const payload: CreateBookingRequest = {
      userID: this.authService.getUser()!.id,
      studioID: this.studio!.id,
      date: this.formatDate(this.date),
      startTime: this.formatTime(this.startTime),
      endTime: this.formatTime(this.endTime)
    };

    this.bookingService.create(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.refreshCalendar();
          this.startTime = null;
          this.endTime = null;
          this.date = null;

          this.messageService.add({
            key: 'main',
            severity: 'success',
            summary: 'Erfolg',
            detail: res.message
          });
        },
        error: (err) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: err?.error?.message ?? 'Löschen fehlgeschlagen.'
          });
        }
      });
  }

  /** Lädt den Kalender nach erfolgreicher Buchung neu */
  private refreshCalendar(): void {
    const studioId = this.route.snapshot.paramMap.get('id');
    if (studioId) this.loadBookings(+studioId);
  }

  // === Validation ===

  /** Prüft, ob Buchung zeitlich möglich ist */
  canBook(): boolean {
    return (
      this.date !== null &&
      !this.isDisabledDate(this.date) &&
      this.startTime !== null &&
      this.endTime !== null &&
      this.startTime < this.endTime
    );
  }

  /** Prüft, ob Endzeit nach Startzeit liegt */
  isEndTimeValid(): boolean {
    if (!this.startTime || !this.endTime) return true;
    return this.endTime > this.startTime;
  }

  // === Navigation & UI ===

  /** Navigiert zurück zur vorherigen Seite */
  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      const basePath = this.isUser ? '/user-dashboard' : '/admin-dashboard';
      this.router.navigate([`${basePath}/studios`]);
    }
  }

  /** Öffnet das Overlay mit dem Studiobild */
  showOverlay(image: string): void {
    this.overlayImage = image;
    this.overlayVisible = true;
  }

  /** Schließt das Bild-Overlay */
  hideOverlay(): void {
    this.overlayVisible = false;
    this.overlayImage = null;
  }

  // === Helper ===

  /** Formatiert Datum zu DD.MM.YYYY */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
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
    const defaultDate = new Date();
    defaultDate.setHours(12, 0, 0, 0);

    if (type === 'start' && !this.startTime) {
      this.startTime = new Date(defaultDate);
    } else if (type === 'end' && !this.endTime) {
      this.endTime = new Date(defaultDate);
    }
  }

  /** Formatiert Uhrzeit zu HH:mm */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  /** Prüft, ob Datum gesperrt ist */
  private isDisabledDate(date: Date): boolean {
    return this.disabledDates.some(d => this.sameDate(d, date));
  }

  /** Vergleicht zwei Datumsobjekte auf Gleichheit (Tag, Monat, Jahr) */
  private sameDate(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }
}