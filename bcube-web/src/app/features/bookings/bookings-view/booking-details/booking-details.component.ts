import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { AuthService } from '@core/services/auth.service';
import { BookingService } from '@features/bookings/booking.service';
import { BookingActionService } from '@features/bookings/booking-action.service';
import { CardModule } from 'primeng/card';
import { BookingDetailsResponse } from '@models/responses/booking/booking-details-response';
import { BookingStatus } from '@models/booking-status.model';
import { getBookingStatusLabel } from '@shared/util/booking-status.util';
import { extractErrorMessage } from '@shared/util/error-message.util';
import { getDashboardBasePath } from '@shared/util/dashboard-path.util';

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
  readonly bookingStatus = BookingStatus;
  isUser = false;
  booking: BookingDetailsResponse | null = null;
  loading!: boolean;
  loading$ = this.bookingService.loading$;
  loadError = false;
  private returnUrl?: string;
  private bookingId?: number;

  overlayVisible = false;
  overlayImage: string | null = null;

  getStatusLabel(status: string): string {
    return getBookingStatusLabel(status);
  }

  /** Base price at the studio's current rate - the historical, possibly voucher-discounted
   * amount actually charged lives in the dedicated payment history view, not here. */
  formatPrice(): string {
    if (!this.booking || !this.booking.studio) return '–';

    const durationHours = (new Date(this.booking.endTime).getTime() - new Date(this.booking.startTime).getTime()) / 3_600_000;
    const priceCents = Math.round((this.booking.studio.hourlyRateCents ?? 0) * durationHours);
    return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(priceCents / 100);
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private bookingActionService: BookingActionService,
    private authService: AuthService,
    private bookingService: BookingService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.returnUrl = history.state?.returnUrl;
    this.isUser = this.authService.isUser();
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (bookingId) {
      this.bookingId = +bookingId;
      this.loadBooking();
    }
  }

  /** Lädt die Auftragsdetails; setzt bei Fehlschlag einen Fehlerzustand statt einer leeren Seite */
  loadBooking(): void {
    if (!this.bookingId) {
      return;
    }

    this.loadError = false;
    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (data) => (this.booking = data),
      error: (err: HttpErrorResponse) => {
        this.loadError = true;
        this.messageService.add({
          key: 'main',
          severity: 'error',
          summary: 'Fehler',
          detail: extractErrorMessage(err, 'Auftrag konnte nicht geladen werden.')
        });
      }
    });
  }

  /** Erneuter Ladeversuch nach einem Fehler */
  retryLoadBooking(): void {
    this.loadBooking();
  }

  triggerStorno(): void {
    this.bookingActionService.confirmStorno(
      this.booking!,
      () => {
        const basePath = getDashboardBasePath(!this.isUser);
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
      const basePath = getDashboardBasePath(!this.isUser);
      this.router.navigate([basePath + '/bookings']);
    }
  }
}