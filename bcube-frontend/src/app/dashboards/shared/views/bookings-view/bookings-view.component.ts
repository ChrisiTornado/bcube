import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth/auth.service';
import { BookingService } from '../../../../services/booking.service';
import { booking } from '../../../../models/booking';
import { BookingsComponent } from '../../components/bookings/bookings.component';
import { StornoBookingComponent } from './storno-booking/storno-booking.component';
import { BookingStatus } from '../../../../models/BookingStatus';

@Component({
  selector: 'app-bookings-view',
  standalone: true,
  imports: [BookingsComponent, CommonModule, LoadingSpinnerComponent, TableModule, ButtonModule, StornoBookingComponent],
  templateUrl: './bookings-view.component.html',
  styleUrl: './bookings-view.component.css'
})
export class BookingsViewComponent implements OnInit {
  bookings$!: Observable<booking[]>;
  loading$ = this.bookingService.loading$;
  isAdmin = false;
  bookingStatus = BookingStatus;

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === "ADMIN";

    if (this.isAdmin) {
      this.bookingService.getAll().subscribe(bookings => {
        this.bookingService.setBookings(bookings);
      });
    } else {
      const userId = this.authService.getUser()?.id;
      if (userId) {
        this.bookingService.getBookingsByUserId(userId).subscribe(bookings => {
          this.bookingService.setBookings(bookings);
        });
      }
    }

    this.bookings$ = this.bookingService.bookings$;
  }

  constructor(private bookingService: BookingService, private router: Router, private route: ActivatedRoute, private authService: AuthService) { }

  navigateToDetails(booking: booking): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    const navigationUrl = [basePath, 'booking-details', booking.id];

    this.router.navigate(navigationUrl);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Bestätigt';
      case 'CANCELLED': return 'Storniert';
      case 'PENDING': return 'Ausstehend';
      default: return status;
    }
  }
}