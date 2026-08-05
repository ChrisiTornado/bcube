import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { EMPTY, expand, map, Observable, reduce } from 'rxjs';
import { ApiResponse } from '@models/responses/api-response';
import { finalize } from 'rxjs/operators';
import { Booking } from '@models/booking.model';
import { CreateBookingRequest } from '@models/requests/booking/create-booking-request';
import { PageResponse } from '@models/responses/page-response';
import { BookingDetailsResponse } from '@models/responses/booking/booking-details-response';
import { CollectionStore } from '@core/services/collection-store';
import { MessageService } from 'primeng/api';
import { extractErrorMessage } from '@shared/util/error-message.util';

@Injectable({
  providedIn: 'root'
})
export class BookingService extends CollectionStore<Booking> {
  public readonly bookings$ = this.items$;
  public readonly size = 10;

  private viewModeValue: 'ADMIN' | 'USER' = 'ADMIN';
  private pageValue = 0;
  private userIdValue?: number;
  private activeUserFilterIdValue?: number;
  private activeStudioFilterIdValue?: number;
  private sortByValue = 'id';
  private sortDirectionValue: 'asc' | 'desc' = 'desc';

  get viewMode(): 'ADMIN' | 'USER' { return this.viewModeValue; }
  get page(): number { return this.pageValue; }
  get userId(): number | undefined { return this.userIdValue; }
  get activeUserFilterId(): number | undefined { return this.activeUserFilterIdValue; }
  get activeStudioFilterId(): number | undefined { return this.activeStudioFilterIdValue; }
  get sortBy(): string { return this.sortByValue; }
  get sortDirection(): 'asc' | 'desc' { return this.sortDirectionValue; }

  constructor(private http: HttpClient, private messageService: MessageService) {
    super();
  }

  setPage(page: number): void {
    this.pageValue = page;
  }

  setSort(sortBy: string, sortDirection: 'asc' | 'desc'): void {
    this.sortByValue = sortBy;
    this.sortDirectionValue = sortDirection;
  }

  setAdminView(page: number, userFilterId?: number, studioFilterId?: number): void {
    this.viewModeValue = 'ADMIN';
    this.pageValue = page;
    this.activeUserFilterIdValue = userFilterId;
    this.activeStudioFilterIdValue = studioFilterId;
  }

  setUserView(userId: number, page: number, studioFilterId?: number): void {
    this.viewModeValue = 'USER';
    this.userIdValue = userId;
    this.pageValue = page;
    this.activeUserFilterIdValue = userId;
    this.activeStudioFilterIdValue = studioFilterId;
  }

  getBookings(
    page: number = 0,
    size: number = 10,
    userId?: number,
    studioId?: number,
    sortBy: string = 'id',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<PageResponse<Booking>> {

    this.setLoading(true);

    const params: Record<string, string | number> = {
      page,
      size,
      sortBy,
      sortDirection
    };

    if (userId != null) {
      params['userId'] = userId;
    }

    if (studioId != null) {
      params['studioId'] = studioId;
    }

    return this.http
      .get<ApiResponse<PageResponse<Booking>>>(
        `${environment.bookingApiUrl}`,
        { params }
      )
      .pipe(
        map(res => res.data),
        finalize(() => this.setLoading(false))
      );
  }

  getBookingsByUserId(
    userId: number,
    page: number = 0,
    size: number = 10,
    studioId?: number,
    sortBy: string = 'id',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<PageResponse<Booking>> {
    this.setLoading(true);

    const params: Record<string, string | number> = {
      userId,
      page,
      size,
      sortBy,
      sortDirection
    };

    if (studioId != null) {
      params['studioId'] = studioId;
    }

    return this.http
      .get<ApiResponse<PageResponse<Booking>>>(
        `${environment.bookingApiUrl}/user/${userId}`,
        { params }
      )
      .pipe(
        map(res => res.data),
        finalize(() => this.setLoading(false))
      );
  }

  getAllBookingsByUserId(
    userId: number,
    size: number = 50,
    studioId?: number
  ): Observable<Booking[]> {
    return this.getBookingsByUserId(userId, 0, size, studioId).pipe(
      expand(response => {
        if (response.last || response.number >= response.totalPages - 1) {
          return EMPTY;
        }

        return this.getBookingsByUserId(userId, response.number + 1, size, studioId);
      }),
      reduce((allBookings, response) => [...allBookings, ...response.content], [] as Booking[])
    );
  }

  getBookingsByStudioId(studioId: number): Observable<Booking[]> {
    this.setLoading(true);
    return this.http
      .get<{ message: string; data: Booking[] }>(`${environment.bookingApiUrl}/studio/${studioId}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.setLoading(false))
      );
  }

  getBookingById(bookingId: number): Observable<BookingDetailsResponse> {
    this.setLoading(true);
    return this.http
      .get<{ message: string; data: BookingDetailsResponse }>(`${environment.bookingApiUrl}/${bookingId}`)
      .pipe(
        map(res => res.data),
        finalize(() => this.setLoading(false))
      )
  }

  setBookings(bookings: Booking[]): void {
    this.setItems(bookings);
  }

  reloadBookings(userId?: number,
    studioId?: number): void {
    const resolvedUserId = userId ?? this.activeUserFilterId;
    const resolvedStudioId = studioId ?? this.activeStudioFilterId;
    const onError = (err: HttpErrorResponse) => {
      this.messageService.add({
        key: 'main',
        severity: 'error',
        summary: 'Fehler',
        detail: extractErrorMessage(err, 'Buchungen konnten nicht aktualisiert werden.')
      });
    };

    if (this.viewMode === 'ADMIN') {
      this.getBookings(this.page, this.size, resolvedUserId, resolvedStudioId, this.sortBy, this.sortDirection)
        .subscribe({ next: res => this.setItems(res.content), error: onError });
      return;
    }

    if (this.viewMode === 'USER' && this.userId != null) {
      this.getBookingsByUserId(this.userId, this.page, this.size, resolvedStudioId, this.sortBy, this.sortDirection)
        .subscribe({ next: res => this.setItems(res.content), error: onError });
    }
  }

  create(payload: CreateBookingRequest): Observable<ApiResponse<BookingDetailsResponse>> {
    return this.http.post<ApiResponse<BookingDetailsResponse>>(
      environment.bookingApiUrl, payload);
  }

  storno(id: number): Observable<ApiResponse<number>> {
    return this.http.delete<ApiResponse<number>>(
      environment.bookingApiUrl + "/" + id
    )
  }
}
