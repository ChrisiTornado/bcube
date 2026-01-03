import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';

import { AuthService } from '../../../../services/auth/auth.service';
import { BookingService } from '../../../../services/booking.service';
import { Booking } from '../../../../models/Booking';
import { BookingStatus } from '../../../../models/BookingStatus';
import { Studio } from '../../../../models/Studio';
import { User } from '../../../../models/User';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { BookingsComponent } from '../../components/bookings/bookings.component';
import { StornoBookingComponent } from './storno-booking/storno-booking.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bookings-view',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    FloatLabelModule,
    LoadingSpinnerComponent,
    BookingsComponent,
    StornoBookingComponent,
    FormsModule
  ],
  templateUrl: './bookings-view.component.html',
  styleUrls: ['./bookings-view.component.css']
})
export class BookingsViewComponent implements OnInit {
  bookings$!: Observable<Booking[]>;
  filteredBookings$!: Observable<Booking[]>;
  users: User[] = [];
  studios: Studio[] = [];
  loading$ = this.bookingService.loading$;
  isAdmin = false;
  bookingStatus = BookingStatus;

  userFilter: User | null = null;
  studioFilter: Studio | null = null;
  page = 0;
  size = 10;
  totalPages = 0;

  constructor(
    private bookingService: BookingService,
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'ADMIN';

    if (this.isAdmin) {
      this.loadAdminPage(0);
    } else {
      const userId = this.authService.getUser()?.id;
      if (userId) {
        this.loadUserPage(userId, 0);
      }
    }

    this.bookings$ = this.bookingService.bookings$;

    this.bookings$.subscribe(bookings => {
      this.users = this.uniqueUsers(
        bookings.map(b => ({
          ...b.user,
          fullName: `${b.user.firstName} ${b.user.lastName}`
        }))
      );

      this.studios = this.uniqueStudios(bookings.map(b => b.studio));
    });
    this.filteredBookings$ = this.bookingService.filteredBookings$(null, null);
  }

  uniqueUsers(users: User[]): User[] {
    const map = new Map(users.map(u => [u.id, u]));
    return Array.from(map.values());
  }

  uniqueStudios(studios: Studio[]): Studio[] {
    const map = new Map(studios.map(s => [s.id, s]));
    return Array.from(map.values());
  }

  updateFilters(): void {
    this.filteredBookings$ = this.bookingService.filteredBookings$(
      this.userFilter,
      this.studioFilter
    );
  }

  navigateToDetails(booking: Booking): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    const navigationUrl = [basePath, 'booking-details', booking.id];
    this.router.navigate(navigationUrl);
  }

  navigateToBookingCreation(): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    this.router.navigate([basePath, 'studios']);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Bestätigt';
      case 'CANCELLED': return 'Storniert';
      case 'DONE': return 'Abgeschlossen';
      default: return status;
    }
  }

  loadUserPage(userId: number, page: number) {
    this.page = page;

    this.bookingService.viewMode = 'USER';
    this.bookingService.userId = userId;
    this.bookingService.page = page;

    this.bookingService.getBookingsByUserId(userId, page, this.size).subscribe(res => {
      this.totalPages = res.totalPages;
      this.bookingService.setBookings(res.content);
    });
  }


  loadAdminPage(page: number) {
    this.page = page;

    this.bookingService.viewMode = 'ADMIN';
    this.bookingService.page = page;

    this.bookingService.getAll(page, this.size).subscribe(res => {
      this.totalPages = res.totalPages;
      this.bookingService.setBookings(res.content);
    });
  }

  loadPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.page = page;

    if (this.isAdmin) {
      this.loadAdminPage(page);
    } else {
      const userId = this.authService.getUser()?.id;
      if (userId) this.loadUserPage(userId, page);
    }
  }
}