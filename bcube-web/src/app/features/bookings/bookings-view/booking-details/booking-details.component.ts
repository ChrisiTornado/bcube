import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { AuthService } from '@core/services/auth.service';
import { Booking } from '@models/booking.model';
import { BookingService } from '@features/bookings/booking.service';
import { BookingActionService } from '@features/bookings/booking-action.service';
import { CardModule } from 'primeng/card';
import { BookingDetailsResponse } from '@models/responses/booking/booking-details-response';

@Component({
    selector: 'app-booking-details',
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        LoadingSpinnerComponent,
        CardModule
    ],
    templateUrl: './booking-details.component.html',
    styleUrl: './booking-details.component.css'
})
export class BookingDetailsComponent implements OnInit {
  isUser = false;
  booking: BookingDetailsResponse | null = null;
  loading!: boolean;
  loading$ = this.bookingService.loading$;
  private returnUrl?: string;

  overlayVisible = false;
  overlayImage: string | null = null;
  statusLabels: { [key: string]: string } = {
    CONFIRMED: 'Bestätigt',
    CANCELLED: 'Storniert',
    DONE: 'Abgeschlossen'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private bookingActionService: BookingActionService,
    private authService: AuthService,
    private bookingService: BookingService
  ) { }

  ngOnInit(): void {
    this.returnUrl = history.state?.returnUrl;
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
        this.router.navigate([basePath + '/bookings'])
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
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      const basePath = this.isUser ? '/user-dashboard' : '/admin-dashboard';
      this.router.navigate([basePath + '/bookings']);
    }
  }
}