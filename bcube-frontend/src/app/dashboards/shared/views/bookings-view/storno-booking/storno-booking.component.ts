import { Component } from '@angular/core';
import { booking } from '../../../../../models/booking';

@Component({
  selector: 'app-storno-booking',
  standalone: true,
  imports: [],
  templateUrl: './storno-booking.component.html',
  styleUrl: './storno-booking.component.css'
})
export class StornoBookingComponent {
  bookings: booking | null = null;
}
