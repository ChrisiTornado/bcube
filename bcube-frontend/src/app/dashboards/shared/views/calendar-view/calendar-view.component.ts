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
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import { User } from '../../../../models/User';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    FullCalendarModule
  ],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent implements OnInit {
  date = null;

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
    buttonText: {
      today: 'Heute'
    },
    weekends: true
  };

  ngOnInit(): void {
    this.user = this.authService.getUser();

    this.bookingService.getBookingsByUserId(+this.user!.id).subscribe(bookings => {
      this.bookings = bookings.content.filter(b => b.status === 'CONFIRMED');
      this.markCalendarDates();

      const events = this.bookings.map(b => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);

        const formatTime = (d: Date) =>
          d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', hour12: false });

        return {
          title: `${formatTime(start)} – ${formatTime(end)}`,
          date: new Date(b.date).toISOString().split('T')[0],
          color: '#ffa722',
          textColor: '#111111',
          borderColor: '#ffa722'
        };
      });

      this.calendarOptions = {
        plugins: this.calendarPlugins,
        initialView: 'dayGridMonth',
        events: events,
        locale: 'de',
        buttonText: {
          today: 'Heute'
        },
        weekends: true,
      };
    });
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
          title: `${b.startTime} – ${b.endTime}`,
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
