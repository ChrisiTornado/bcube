import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';
import { AuthService } from '../../../../../services/auth/auth.service';
import { Booking } from '../../../../../models/Booking';
import { BookingService } from '../../../../../services/booking.service';
import { BookingActionService } from '../../../../../services/booking-action.service';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    DropdownModule,
    ButtonModule,
    LoadingSpinnerComponent,
    CardModule
  ],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.css'
})
export class BookingDetailsComponent implements OnInit {
  isUser = false;
  booking: Booking | null = null;
  loading!: boolean;
  loading$ = this.bookingService.loading$;

  overlayVisible = false;
  overlayImage: string | null = null;
  statusLabels: { [key: string]: string } = {
    CONFIRMED: 'Bestätigt',
    CANCELLED: 'Storniert',
    PENDING: 'Ausstehend'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private bookingActionService: BookingActionService,
    private authService: AuthService,
    private bookingService: BookingService
  ) { }

  ngOnInit(): void {
    this.isUser = this.authService.getRole() === 'USER';
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (bookingId) {
      this.bookingService.getBookingById(+bookingId).subscribe(data => (this.booking = data));
    }
  }

  triggerStorno(): void {
    this.bookingActionService.confirmStorno(
      this.booking!,
      () => {
        const basePath = this.isUser ? '/user-dashboard' : '/admin-dashboard';
        this.router.navigate([basePath + '/bookings']);
      },
      () => {
        // optional: onError
      },
      isLoading => (this.loading = isLoading)
    );
  }



  showOverlay(image: string) {
    this.overlayImage = image;
    this.overlayVisible = true;
  }

  hideOverlay() {
    this.overlayVisible = false;
    this.overlayImage = null;
  }

  goBack(): void {
    const basePath = this.isUser ? '/user-dashboard' : '/admin-dashboard';
    this.router.navigate([basePath + '/bookings']);
  }
}
