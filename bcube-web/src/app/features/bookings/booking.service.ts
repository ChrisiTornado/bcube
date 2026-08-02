import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.local';
import { EMPTY, expand, map, Observable, reduce } from 'rxjs';
import { ApiResponse } from '@models/responses/api-response';
import { finalize } from 'rxjs/operators';
import { Booking } from '@models/booking.model';
import { CreateBookingRequest } from '@models/requests/booking/create-booking-request';
import { PageResponse } from '@models/responses/page-response';
import { BookingDetailsResponse } from '@models/responses/booking/booking-details-response';
import { CollectionStore } from '@core/services/collection-store';

@Injectable({
  providedIn: 'root'
})
export class BookingService extends CollectionStore<Booking> {
  public readonly bookings$ = this.items$;
  viewMode: 'ADMIN' | 'USER' = 'ADMIN';
  page = 0;
  size = 10;
  userId?: number;
  activeUserFilterId?: number;
  activeStudioFilterId?: number;

  constructor(private http: HttpClient) {
    super();
  }

  getBookings(
    page: number = 0,
    size: number = 10,
    userId?: number,
    studioId?: number
  ): Observable<PageResponse<Booking>> {

    this.setLoading(true);

    const params: Record<string, number> = {
      page,
      size
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
    studioId?: number
  ): Observable<PageResponse<Booking>> {
    this.setLoading(true);

    const params: Record<string, number> = {
      userId,
      page,
      size
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

    if (this.viewMode === 'ADMIN') {
      this.getBookings(this.page, this.size, resolvedUserId, resolvedStudioId)
        .subscribe(res => this.setItems(res.content));
      return;
    }

    if (this.viewMode === 'USER' && this.userId != null) {
      this.getBookingsByUserId(this.userId, this.page, this.size, resolvedStudioId)
        .subscribe(res => this.setItems(res.content));
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
