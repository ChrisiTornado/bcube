import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '@core/services/auth.service';
import { BookingService } from '@features/bookings/booking.service';
import { Booking } from '@models/booking.model';
import { BookingStatus } from '@models/booking-status.model';
import { LoadingSpinnerComponent } from '@shared/ui/loading-spinner/loading-spinner.component';
import { StornoBookingComponent } from '@features/bookings/bookings-view/storno-booking/storno-booking.component';
import { FormsModule } from '@angular/forms';
import { StudioNameResponse } from '@models/responses/studio/studio-name-response';
import { StudioService } from '@features/studios/studio.service';
import { UserNameResponse } from '@models/responses/user/user-name-response';
import { UserService } from '@features/users/user.service';
import { DARK_BUTTON_STYLE, LIGHT_BUTTON_STYLE } from '@shared/util/button-style';
import { getBookingStatusLabel } from '@shared/util/booking-status.util';
import { extractErrorMessage } from '@shared/util/error-message.util';
import { getDashboardBasePath } from '@shared/util/dashboard-path.util';

@Component({
    selector: 'app-bookings-view',
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        SelectModule,
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
  studioFilterTotal = 0;

  userFilterPage = 0;
  userFilterSize = 10;
  userFilterLoading = false;
  userFilterLastPage = false;
  userFilterTotal = 0;
  totalPages = 0;

  sortField = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  // "Weitere laden" only makes sense once there's actually more than a single page's worth to
  // load - with a handful of items it's just visual noise sitting under an already-complete list.
  readonly loadMoreThreshold = 10;

  constructor(
    public bookingService: BookingService,
    private studioService: StudioService,
    private userService: UserService,
    private router: Router,
    public authService: AuthService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
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
    return !this.isAdmin && this.router.url.includes('/user-dashboard/bookings');
  }

  updateFilters(): void {
    this.bookingService.setPage(0);

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
      .subscribe({
        next: (page) => {
          this.studioFilters = [...this.studioFilters, ...page.content];
          this.studioFilterLastPage = page.last;
          this.studioFilterTotal = page.totalElements;
          this.studioFilterPage++;
          this.studioFilterLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.studioFilterLoading = false;
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Cube-Filter konnten nicht geladen werden.')
          });
        }
      });
  }

  loadMoreUsers(): void {
    if (this.userFilterLoading || this.userFilterLastPage) {
      return;
    }

    this.userFilterLoading = true;

    this.userService
      .getUserFilter(this.userFilterPage, this.userFilterSize)
      .subscribe({
        next: (page) => {
          const mappedUsers = page.content.map(u => ({
            ...u,
            label: `${u.lastName}, ${u.firstName}`
          }));

          this.userFilters = [
            ...this.userFilters,
            ...mappedUsers
          ];

          this.userFilterLastPage = page.last;
          this.userFilterTotal = page.totalElements;
          this.userFilterPage++;
          this.userFilterLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.userFilterLoading = false;
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'User-Filter konnten nicht geladen werden.')
          });
        }
      });
  }

  navigateToDetails(booking: Booking): void {
    const basePath = getDashboardBasePath(this.isAdmin);
    const navigationUrl = [basePath, 'booking-details', booking.id];
    this.router.navigate(navigationUrl, {
      state: { returnUrl: this.router.url }
    });
  }

  navigateToBookingCreation(): void {
    const basePath = getDashboardBasePath(this.isAdmin);
    this.router.navigate([basePath, 'studios']);
  }

  navigateToCalendarView(): void {
    this.router.navigate(['/user-dashboard', 'calendar']);
  }

  getStatusLabel(status: string): string {
    return getBookingStatusLabel(status);
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }

    this.bookingService.setSort(this.sortField, this.sortDirection);

    if (this.isAdmin) {
      this.loadAdminPage(0);
    } else {
      const userId = this.authService.getUser()?.id;
      if (userId) {
        this.loadUserPage(userId, 0);
      }
    }
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'pi pi-sort';
    }
    return this.sortDirection === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down';
  }

  loadUserPage(userId: number, page: number) {
    this.bookingService.setUserView(userId, page, this.studioFilter?.id);

    this.bookingService
      .getBookingsByUserId(
        userId,
        page,
        this.bookingService.size,
        this.studioFilter?.id,
        this.sortField,
        this.sortDirection
      )
      .subscribe({
        next: (res) => {
          this.totalPages = res.totalPages;
          this.bookingService.setBookings(res.content);
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Buchungen konnten nicht geladen werden.')
          });
        }
      });
  }


  loadAdminPage(page: number) {
    this.bookingService.setAdminView(page, this.userFilter?.id, this.studioFilter?.id);

    this.bookingService.getBookings(page, this.bookingService.size, this.userFilter?.id,
      this.studioFilter?.id, this.sortField, this.sortDirection).subscribe({
        next: (res) => {
          this.totalPages = res.totalPages;
          this.bookingService.setBookings(res.content);
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({
            key: 'main',
            severity: 'error',
            summary: 'Fehler',
            detail: extractErrorMessage(err, 'Buchungen konnten nicht geladen werden.')
          });
        }
      });
  }
}
