import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../../services/auth/auth.service';
import { StudioService } from '../../../../../services/studio.service';
import { BookingService } from '../../../../../services/booking.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CardModule } from 'primeng/card';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
// @fullcalendar/core@7.x ships a broken (empty) index.d.ts upstream - confirmed across
// every published 7.x release (7.0.0-7.1.0-alpha.0), which also breaks @fullcalendar/interaction's
// re-exported types. Falling back to `any` until that's fixed upstream; runtime is unaffected.
type DateClickArg = any;
type CalendarOptions = any;
type EventInput = any;
import { Studio } from '../../../../../models/Studio';
import { Booking } from '../../../../../models/Booking';
import { CreateBookingRequest } from '../../../../../models/requests/booking/CreateBookingRequest';
import { UpdateStudioComponent } from '../update-studio/update-studio.component';
import { extractErrorMessage } from '../../../../../shared/error-message.util';

@Component({
    selector: 'app-studio-details',
    imports: [
        CommonModule,
        FormsModule,
        DatePickerModule,
        ButtonModule,
        LoadingSpinnerComponent,
        FullCalendarModule,
        CardModule,
        UpdateStudioComponent
    ],
    templateUrl: './studio-details.component.html',
    styleUrl: './studio-details.component.css'
})
export class StudioDetailsComponent implements OnInit {
  private readonly blockingStatuses = new Set(['CONFIRMED', 'PENDING', 'DONE']);
  private readonly previewImages = [
    'assets/images/inside 1.png',
    'assets/images/interior_2.jpg',
    'assets/images/new_render_3.jpg',
    'assets/images/new_render_6.jpg',
    'assets/images/new_render_7.jpg',
    'assets/images/nice.jpg'
  ];

  // === Properties ===
  studio: Studio | null = null;
  isUser = false;
  isAdmin = false;
  private returnUrl?: string;
  loading!: boolean;
  date: Date | null = null;

  startTime: Date | null = null;
  endTime: Date | null = null;
  defaultTime: Date = new Date();
  hasTimeConflict = false;

  bookings: Booking[] = [];
  disabledDates: Date[] = [];

  overlayVisible = false;
  overlayImage: string | null = null;

  calendarPlugins = [dayGridPlugin, interactionPlugin];
  calendarEvents: EventInput[] = [];

  calendarOptions: CalendarOptions = this.buildCalendarOptions(this.calendarEvents);

  loading$ = this.studioService.loading$;

  get galleryImages(): string[] {
    if (!this.studio) {
      return [];
    }

    const gallery = this.studio.imageGalleryBase64?.filter(Boolean) ?? [];
    if (gallery.length > 0) {
      return this.withDefaultGallery(this.studio.id, gallery.map(image => this.normalizeImage(image)));
    }

    if (this.studio.imageBase64) {
      return this.withDefaultGallery(this.studio.id, [this.normalizeImage(this.studio.imageBase64)]);
    }

    return this.withDefaultGallery(this.studio.id, []);
  }

  get featuredGalleryImage(): string | null {
    return this.galleryImages[0] ?? null;
  }

  get secondaryGalleryImages(): string[] {
    return this.galleryImages.slice(1, 5);
  }

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
      this.bookings = bookings.filter(b => this.blockingStatuses.has(b.status));
      this.markCalendarDates();
      this.checkTimeConflict();

      const events = this.bookings.map(b => ({
        title: `${this.formatTime(new Date(b.startTime))} – ${this.formatTime(new Date(b.endTime))}`,
        date: this.toIsoDate(new Date(b.date)),
        color: '#ffa722',
        textColor: '#111111',
        borderColor: '#ffa722'
      }));

      const today = new Date();
      this.calendarOptions = this.buildCalendarOptions(
        events,
        this.isUser ? { start: this.toIsoDate(today) } : undefined
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
      dayCellClassNames: (arg: any) => this.date && this.toIsoDate(this.date) === this.toIsoDate(arg.date) ? ['fc-day-selected'] : [],
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
    this.checkTimeConflict();

    this.calendarOptions = {
      ...this.calendarOptions,
      dayMaxEvents: 2,
      moreLinkContent: (arg: any) => ({ html: `+${arg.num} Mehr` }),
      moreLinkClick: 'popover',
      dayCellClassNames: (cellArg: any) => this.date && this.toIsoDate(this.date) === this.toIsoDate(cellArg.date) ? ['fc-day-selected'] : []
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

      const isoDate = this.toIsoDate(dateObj);

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
  confirmBooking(): void {
    this.confirmationService.confirm({
      message: `Möchten Sie den Cube "${this.studio!.name}" wirklich buchen?`,
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
      smartlockID: this.studio!.smartlockId,
      date: this.formatDateVienna(this.date),
      startTime: this.formatTimeVienna(this.startTime),
      endTime: this.formatTimeVienna(this.endTime)
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

  // === Validation ===

  /** Prüft, ob Buchung zeitlich möglich ist */
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

    const selectedDateIso = this.toIsoDate(this.date);

    this.hasTimeConflict = this.bookings
      .filter(b => {
        const bookingIso = this.toIsoDate(new Date(b.date));
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

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTimeVienna(date: Date): string {
    return new Intl.DateTimeFormat('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Vienna'
    }).format(date);
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
    return `${this.formatBookingTimeString(booking.startTime)} - ${this.formatBookingTimeString(booking.endTime)}`;
  }

  private formatBookingTimeString(value: string): string {
    if (!value) {
      return '';
    }

    if (value.includes('T') || value.length > 5) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return new Intl.DateTimeFormat('de-AT', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Europe/Vienna'
        }).format(parsed);
      }
    }

    return value.slice(0, 5);
  }

  renderMarkdown(markdown: string | null | undefined): string {
    if (!markdown) {
      return '';
    }

    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escaped.split(/\r?\n/);
    const blocks: string[] = [];
    let paragraph: string[] = [];
    let listItems: string[] = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      blocks.push(`<p>${this.inlineMarkdown(paragraph.join('<br>'))}</p>`);
      paragraph = [];
    };

    const flushList = () => {
      if (!listItems.length) return;
      blocks.push(`<ul>${listItems.map(item => `<li>${this.inlineMarkdown(item)}</li>`).join('')}</ul>`);
      listItems = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        flushList();
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        flushParagraph();
        listItems.push(line.replace(/^[-*]\s+/, ''));
        continue;
      }

      flushList();
      paragraph.push(line);
    }

    flushParagraph();
    flushList();

    return blocks.join('');
  }

  private inlineMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>');
  }

  private normalizeImage(value: string): string {
    return value.startsWith('data:image') ? value : `data:image/jpeg;base64,${value}`;
  }

  private withDefaultGallery(studioId: number, images: string[]): string[] {
    const gallery = [...images];

    for (let offset = 0; gallery.length < 5; offset++) {
      gallery.push(this.previewImages[(studioId + offset) % this.previewImages.length]);
    }

    return gallery.slice(0, 5);
  }
}
