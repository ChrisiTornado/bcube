import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { finalize } from "rxjs";
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { AuthService } from '../../../../../services/auth/auth.service';
import { booking } from '../../../../../models/booking';
import { BookingService } from '../../../../../services/booking.service';


@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.css'
})
export class BookingDetailsComponent implements OnInit {
  isUser = false;
  booking: booking | null = null;
  loading!: boolean;
  loading$ = this.bookingService.loading$;

  ngOnInit(): void {
    this.isUser = this.authService.getRole() === 'USER';

    const studioId = this.route.snapshot.paramMap.get('id');
    if (studioId) {
      this.bookingService.getBookingById(+studioId).subscribe(data => (this.booking = data));
    }
  }

  constructor(private authService: AuthService, private route: ActivatedRoute, private bookingService: BookingService) {

  }
}
