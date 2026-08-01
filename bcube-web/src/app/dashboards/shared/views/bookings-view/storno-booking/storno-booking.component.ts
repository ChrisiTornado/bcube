import { Component, Input } from '@angular/core';
import { Booking } from '../../../../../models/Booking';
import { BookingService } from '../../../../../services/booking.service';
import { ButtonModule } from 'primeng/button';
import { BookingActionService } from '../../../../../services/booking-action.service';

@Component({
  selector: 'app-storno-booking',
  standalone: true,
  imports: [ButtonModule],
  template: `<p-button severity="danger" icon="pi pi-trash" [loading]="loading" (click)="triggerStorno()"></p-button>`,
})
export class StornoBookingComponent {
  @Input() booking!: Booking;
  loading!: boolean;

  constructor(private bookingActionService: BookingActionService, private bookingService: BookingService) { }

  triggerStorno(): void {
    this.bookingActionService.confirmStorno(
      this.booking,
      () => {
        this.bookingService.reloadBookings();
      },
      () => {
        this.bookingService.reloadBookings();
      },
      (isLoading) => this.loading = isLoading
    );
  }
}