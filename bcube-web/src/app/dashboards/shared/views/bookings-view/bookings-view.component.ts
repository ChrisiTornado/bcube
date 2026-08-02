import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { StornoBookingComponent } from './storno-booking/storno-booking.component';
import { FormsModule } from '@angular/forms';
import { StudioNameResponse } from '../../../../models/responses/studio/StudioNameResponse';
import { StudioService } from '../../../../services/studio.service';
import { UserNameResponse } from '../../../../models/responses/user/UserNameResponse';
import { UserService } from '../../../../services/user.service';
import { DARK_BUTTON_STYLE, LIGHT_BUTTON_STYLE } from '../../../../shared/button-style';

@Component({
    selector: 'app-bookings-view',
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        DropdownModule,
        FloatLabelModule,
        LoadingSpinnerComponent,
        StornoBookingComponent,
        FormsModule
    ],
    templateUrl: './bookings-view.component.html',
    styleUrls: ['./bookings-view.component.css']
})
export class BookingsViewComponent implements OnInit {
  readonly darkButtonStyle = DARK_BUTTON_STYLE;
  readonly lightButtonStyle = LIGHT_BUTTON_STYLE;

  bookings$!: Observable<Booking[]>;
  loading$ = this.bookingService.loading$;
  isAdmin = false;
  bookingStatus = BookingStatus;

  studioFilters: StudioNameResponse[] = [];
  studioFilter: StudioNameResponse | null = null;
  userFilters: UserNameResponse[] = [];
  userFilter: UserNameResponse | null = null;

  studioFilterPage = 0;
  studioFilterSize = 10;
  studioFilterLoading = false;
  studioFilterLastPage = false;

  userFilterPage = 0;
  userFilterSize = 10;
  userFilterLoading = false;
  userFilterLastPage = false;
  totalPages = 0;

  constructor(
    public bookingService: BookingService,
    private studioService: StudioService,
    private userService: UserService,
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.bookings$ = this.bookingService.bookings$;
    this.loadMoreStudios();

    if (this.isAdmin) {
      this.loadAdminPage(0);
      this.loadMoreUsers();
    } else {
      const userId = this.authService.getUser()?.id;
      if (userId) {
        this.loadUserPage(userId, 0);
      }
    }
  }

  get showCalendarSwitch(): boolean {
    return !this.isAdmin && this.router.url.includes('/user-dashboard/all-bookings');
  }

  updateFilters(): void {
    this.bookingService.page = 0;

    if (this.isAdmin) {
      this.loadAdminPage(0);
    } else {
      const userId = this.authService.getUser()?.id;
      if (userId) {
        this.loadUserPage(userId, 0);
      }
    }
  }

  loadMoreStudios(): void {
    if (this.studioFilterLoading || this.studioFilterLastPage) {
      return;
    }

    this.studioFilterLoading = true;

    this.studioService
      .getStudioFilter(this.studioFilterPage, this.studioFilterSize)
      .subscribe(page => {
        this.studioFilters = [...this.studioFilters, ...page.content];
        this.studioFilterLastPage = page.last;
        this.studioFilterPage++;
        this.studioFilterLoading = false;
      });
  }

  loadMoreUsers(): void {
    if (this.userFilterLoading || this.userFilterLastPage) {
      return;
    }

    this.userFilterLoading = true;

    this.userService
      .getUserFilter(this.userFilterPage, this.userFilterSize)
      .subscribe(page => {

        const mappedUsers = page.content.map(u => ({
          ...u,
          label: `${u.lastName}, ${u.firstName}`
        }));

        this.userFilters = [
          ...this.userFilters,
          ...mappedUsers
        ];

        this.userFilterLastPage = page.last;
        this.userFilterPage++;
        this.userFilterLoading = false;
      });
  }

  navigateToDetails(booking: Booking): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    const navigationUrl = [basePath, 'booking-details', booking.id];
    this.router.navigate(navigationUrl, {
      state: { returnUrl: this.router.url }
    });
  }

  navigateToBookingCreation(): void {
    const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
    this.router.navigate([basePath, 'studios']);
  }

  navigateToCalendarView(): void {
    this.router.navigate(['/user-dashboard', 'bookings']);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'Bestätigt';
      case 'CANCELLED': return 'Storniert';
      case 'DONE': return 'Abgeschlossen';
      case 'PENDING': return 'Ausstehend';
      default: return status;
    }
  }

  loadUserPage(userId: number, page: number) {
    this.bookingService.viewMode = 'USER';
    this.bookingService.userId = userId;
    this.bookingService.page = page;
    this.bookingService.activeUserFilterId = userId;
    this.bookingService.activeStudioFilterId = this.studioFilter?.id;

    this.bookingService
      .getBookingsByUserId(
        userId,
        page,
        this.bookingService.size,
        this.studioFilter?.id
      )
      .subscribe(res => {
        this.totalPages = res.totalPages;
        this.bookingService.setBookings(res.content);
      });
  }


  loadAdminPage(page: number) {
    this.bookingService.viewMode = 'ADMIN';
    this.bookingService.page = page;
    this.bookingService.activeUserFilterId = this.userFilter?.id;
    this.bookingService.activeStudioFilterId = this.studioFilter?.id;

    this.bookingService.getBookings(page, this.bookingService.size, this.userFilter?.id,
      this.studioFilter?.id).subscribe(res => {
        this.totalPages = res.totalPages;
        this.bookingService.setBookings(res.content);
      });
  }
}
